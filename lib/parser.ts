import { load } from "cheerio";
import { createHash } from "node:crypto";
import { validDate } from "./date";
import { OFFICIAL_TEXT, VENUE, TIMEZONE, type Film, type Issue, type Schedule, type Session } from "./types";

const months = ["JANEIRO", "FEVEREIRO", "MARCO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
export function normalize(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase().replace(/N(?:O\.?|º|°)\s*(\d)/g, "N$1").replace(/[^A-Z0-9]+/g, " ").trim();
}
export function slug(s: string): string { return normalize(s).toLowerCase().replace(/ +/g, "-"); }
const digest = (s: string) => createHash("sha256").update(s).digest("hex");
function sessionTitle(raw: string) {
  return raw.replace(/\s*\(\+\s*DEBATE\)\s*/gi, "").replace(/^ESPAÇO DA CRIANÇA\s*[—–-]\s*/i, "").replace(/^BANG[ÜU]Ê ACESSÍVEL\s*\((.+)\)$/i, "$1").trim();
}
export function parseFunesc(html: string, fetchedAt = new Date().toISOString(), sourceUrl = OFFICIAL_TEXT): Schedule {
  const $ = load(html);
  const content = $("#parent-fieldname-text");
  if (!content.length) throw new Error("Conteúdo oficial não encontrado; programação anterior preservada.");
  content.find("br").replaceWith("\n");
  const nodes = content.find("h1,h2,h3,p").toArray().map(el => ({ tag: el.tagName, lines: $(el).text().split(/\n/).map(s => s.replace(/\s+/g, " ").trim()).filter(Boolean) }));
  const text = normalize(content.text());
  const heading = text.match(/CINE BANGUE\s+(\w+)\s+DE\s+(20\d{2})/);
  if (!heading || !months.includes(heading[1])) throw new Error("Cinema ou mês de referência não identificado.");
  const period = `${heading[2]}-${String(months.indexOf(heading[1]) + 1).padStart(2, "0")}`;
  const sessions: Session[] = [], films: Film[] = [], issues: Issue[] = [], noSessionDates: string[] = [];
  function issue(code: string, message: string, ids: string[] = []) {
    issues.push({ id: digest(`${code}:${message}`).slice(0, 16), code, message, sessionIds: ids, resolved: false });
    for (const s of sessions) if (ids.includes(s.id)) s.needsReview = true;
  }
  const prices = content.text().match(/R\$\s*([\d,.]+)\s*\(INTEIRA\)[\s\S]*?R\$\s*([\d,.]+)\s*\(MEIA\)/i);
  const money = (v: string) => Number(v.replace(/\./g, "").replace(",", "."));
  let date: string | null = null, inGrid = false;
  for (const node of nodes) {
    const joined = node.lines.join(" ");
    if (/^PÁGINA\s*1\s*[—–-]\s*PROGRAMAÇÃO/i.test(joined)) { inGrid = true; continue; }
    if (inGrid && /^PÁGINA\s*\d/i.test(joined)) break;
    if (!inGrid) continue;
    const day = joined.match(/^(\d{2})\/(\d{2})\s*[—–-]/);
    if (day) {
      date = `${heading[2]}-${day[2]}-${day[1]}`;
      if (!validDate(date) || !date.startsWith(period)) throw new Error(`Data inválida na grade: ${joined}`);
      continue;
    }
    if (!date) continue;
    for (const line of node.lines) {
      if (/^SEM SESSÃO$/i.test(line)) {
        const ids = sessions.filter(s => s.date === date).map(s => s.id);
        if (ids.length) issue("ambiguous_closed_day", `“Sem sessão” após horários de ${date}; horários mantidos para revisão.`, ids);
        else if (!noSessionDates.includes(date)) noSessionDates.push(date);
        continue;
      }
      const slot = line.match(/^(\d{1,2})[Hh:](\d{2})?\s*[—–-]\s*(.+)$/);
      if (!slot) {
        if (/^\d{1,2}[Hh:]/.test(line)) throw new Error(`Horário não reconhecido: ${line}`);
        continue;
      }
      const hour = Number(slot[1]), minute = Number(slot[2] || 0);
      if (hour > 23 || minute > 59) throw new Error(`Horário inválido: ${line}`);
      const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      const raw = slot[3], title = sessionTitle(raw), shorts = /CURTA BANG|SESSÃO CURTAS/i.test(title);
      const free = /CURTA BANG/i.test(title) && /SESSÃO GRATUITA/i.test(content.text());
      const session: Session = {
        id: `bangue-${date}-${time.replace(":", "")}`, venue: VENUE, date, time,
        startsAt: `${date}T${time}:00-03:00`, title, filmId: shorts ? null : slug(title), kind: shorts ? "shorts" : "film",
        debate: /DEBATE/i.test(raw), accessible: /ACESSÍVEL/i.test(raw), children: /ESPAÇO DA CRIANÇA/i.test(raw), free,
        price: { full: free ? 0 : prices ? money(prices[1]) : null, half: free ? 0 : prices ? money(prices[2]) : null },
        sourceUrl, sourceText: line, needsReview: false
      };
      if (sessions.some(s => s.id === session.id)) throw new Error(`Duas sessões no mesmo horário: ${date} ${time}`);
      sessions.push(session);
    }
  }
  if (!sessions.length || !inGrid) throw new Error("Grade vazia ou formato desconhecido; programação anterior preservada.");
  // Metadata may enrich only titles that already have a Cine Bangüê grid session.
  for (const filmId of [...new Set(sessions.map(s => s.filmId).filter((id): id is string => !!id))]) {
    const title = sessions.find(s => s.filmId === filmId)!.title;
    const blocks = nodes.flatMap((node, i) => {
      if (node.tag !== "h2" || normalize(node.lines.join(" ")) !== normalize(title)) return [];
      const lines: string[] = [];
      for (let j = i + 1; j < nodes.length && !["h1", "h2"].includes(nodes[j].tag); j++) lines.push(...nodes[j].lines);
      return [lines];
    });
    const lines = blocks[0] || [];
    const spec = lines.find(l => /,\s*\d{4},\s*\d+[’'′]/.test(l));
    const details = spec?.match(/^(.+),\s*(\d{4}),\s*(\d+)[’'′]/);
    films.push({ id: filmId, title, director: lines.find(l => /^DIREÇÃO:/i.test(l))?.replace(/^DIREÇÃO:\s*/i, "") || null,
      year: details ? Number(details[2]) : null, duration: details ? Number(details[3]) : null,
      country: details?.[1] || null, rating: lines.find(l => /^CLASSIFICAÇÃO INDICATIVA:/i.test(l))?.replace(/^CLASSIFICAÇÃO INDICATIVA:\s*/i, "") || null,
      synopsis: lines.find(l => l.length > 100 && !/^DIREÇÃO|^CLASSIFICAÇÃO/i.test(l)) || null,
      genre: blocks.flat().find(l => /^(DRAMA|AÇÃO|FICÇÃO|DOCUMENTÁRIO|ANIMAÇÃO|COMÉDIA|TERROR)$/i.test(l)) || null,
      poster: null, tmdbId: null, sourceUrl
    });
    for (const block of blocks) {
      const listed = block.flatMap(line => {
        const m = line.match(/^(\d{2})\s+[A-ZÇ]{3}\s*[—–-]\s*(\d{1,2})H(\d{2})?$/i);
        return m ? [`${period}-${m[1]} ${m[2].padStart(2, "0")}:${m[3] || "00"}`] : [];
      });
      const grid = sessions.filter(s => s.filmId === filmId);
      for (const value of listed) if (!grid.some(s => `${s.date} ${s.time}` === value)) {
        issue("film_list_disagreement", `${title}: ficha por filme cita ${value}, ausente na grade diária. Nenhuma sessão adicionada.`, grid.map(s => s.id));
      }
      if (listed.length) {
        const missing = grid.filter(s => !listed.includes(`${s.date} ${s.time}`));
        if (missing.length) issue("incomplete_film_list", `${title}: ${missing.length} sessão(ões) da grade ausente(s) na ficha por filme.`, missing.map(s => s.id));
      }
    }
  }
  return { schemaVersion: 1, venue: VENUE, timezone: TIMEZONE, period, sourceUrl, pdfUrl: null,
    fetchedAt, sourceHash: digest(html), films, sessions: sessions.sort((a,b) => a.startsAt.localeCompare(b.startsAt)), noSessionDates, issues };
}

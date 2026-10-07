import { load } from 'cheerio';
import { normalize } from './parser';
import type { Schedule } from './types';
export const SECONDARY_SOURCES = [{ name: 'Obrigado, Cinema!', url: 'https://renatofelix.wordpress.com/programacao-dos-cinemas-na-paraiba/' }];
export type Observation = { film: string; date: string; time: string; sourceUrl: string; sourceText: string };
export function parseSecondary(html: string, sourceUrl: string, year: string): Observation[] {
  const $ = load(html);
  const root = $('.entry-content, .post-content').first();
  if (!root.length) return [];
  let film = '';
  const observations: Observation[] = [];
  for (const p of root.find('p').toArray()) {
    const text = $(p).text().replace(/\s+/g, ' ').trim();
    if (text === '***') { film = ''; continue; }
    if (!/CINE BANG[UÜ]Ê/i.test(text)) {
      // A film heading must have a country/year film specification, not arbitrary prose.
      if (/\.\s+[^.]+,\s*(?:19|20)\d{2}\./.test(text)) film = $(p).find('strong').first().text().trim() || text.split('.')[0].replace(/\s*\([^)]*\)$/, '').trim();
      continue;
    }
    if (!film) continue;
    const local = text.match(/CINE BANG[UÜ]Ê\s*:\s*([\s\S]*?)(?=\s+(?:Campina Grande|Patos|Guarabira|Remígio|João Pessoa):|CINETEATRO|CINÉPOLIS|CENTERPLEX|CINESERCLA|$)/i)?.[1];
    if (!local) continue;
    for (const match of local.matchAll(/(\d{1,2})\/(\d{1,2})\s*:\s*([^;.]+)/gi)) {
      for (const clock of match[3].matchAll(/(\d{1,2})h(\d{2})?/gi)) observations.push({ film, date: `${year}-${match[2].padStart(2,'0')}-${match[1].padStart(2,'0')}`, time: `${clock[1].padStart(2,'0')}:${clock[2] || '00'}`, sourceUrl, sourceText: text });
    }
  }
  return observations;
}
export function compareSecondary(schedule: Schedule, observations: Observation[]) {
  // Never add films/sessions: only flag conflicting explicit Cine Bangüê observations.
  for (const o of observations) {
    if (!o.date.startsWith(schedule.period)) continue;
    const film = schedule.films.find(f => normalize(f.title) === normalize(o.film));
    if (!film || schedule.sessions.some(s => s.filmId === film.id && s.date === o.date && s.time === o.time)) continue;
    const related = schedule.sessions.filter(s => s.filmId === film.id && s.date === o.date);
    const id = `secondary-${film.id}-${o.date}-${o.time}`;
    if (schedule.issues.some(i => i.id === id)) continue;
    schedule.issues.push({ id, code: 'secondary_disagreement', message: `${o.film}: fonte secundária cita ${o.date} às ${o.time}, ausente na grade oficial. ${o.sourceUrl}. Nenhuma sessão adicionada.`, sessionIds: related.map(s => s.id), resolved: false });
    for (const s of related) s.needsReview = true;
  }
}

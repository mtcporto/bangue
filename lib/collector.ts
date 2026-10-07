import { load } from 'cheerio';
import { parseFunesc, normalize } from './parser';
import { OFFICIAL_INDEX, OFFICIAL_TEXT, type Schedule } from './types';
import { readSchedule, persistSchedule } from './store';
import { getDb } from './db';
import { randomUUID } from 'node:crypto';
import { SECONDARY_SOURCES, parseSecondary, compareSecondary } from './secondary';
import { enrichFilms } from './tmdb';
export async function fetchHtml(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(25000), cache: 'no-store', headers: { 'User-Agent': 'Bangue/2.0 (+https://bangue.vercel.app/api-docs)' } });
  if (!response.ok) throw new Error(`Fonte respondeu HTTP ${response.status}`);
  if (!response.headers.get('content-type')?.includes('text/html')) throw new Error('Fonte não retornou HTML.');
  const html = await response.text();
  if (html.length > 3_000_000) throw new Error('Resposta da fonte excede o limite.');
  return html;
}
export async function collectFunesc() {
  const index = await fetchHtml(OFFICIAL_INDEX);
  const $ = load(index);
  let textUrl = OFFICIAL_TEXT, pdfUrl: string | null = null;
  for (const link of $('a[href]').toArray()) {
    const label = normalize($(link).text());
    const candidate = new URL($(link).attr('href')!, OFFICIAL_INDEX);
    if (candidate.origin !== new URL(OFFICIAL_INDEX).origin || !candidate.pathname.startsWith(new URL(OFFICIAL_INDEX).pathname)) continue;
    if (/PROGRAMACAO.*TEXTO/.test(label)) textUrl = candidate.href;
    if (/PROGRAMACAO.*PDF/.test(label)) pdfUrl = candidate.href;
  }
  const html = await fetchHtml(textUrl);
  const schedule = parseFunesc(html, new Date().toISOString(), textUrl);
  schedule.pdfUrl = pdfUrl;
  const validations = await Promise.allSettled(SECONDARY_SOURCES.map(async source => {
    const raw = await fetchHtml(source.url);
    return parseSecondary(raw, source.url, schedule.period.slice(0,4));
  }));
  const secondary = validations.map((result, i) => {
    if (result.status === 'fulfilled') compareSecondary(schedule, result.value);
    return { ...SECONDARY_SOURCES[i], status: result.status, checkedAt: new Date().toISOString(),
      observations: result.status === 'fulfilled' ? result.value.filter(o => o.date.startsWith(schedule.period)).length : 0,
      matched: result.status === 'fulfilled' ? result.value.filter(o => o.date.startsWith(schedule.period) && schedule.sessions.some(s => normalize(s.title) === normalize(o.film) && s.date === o.date && s.time === o.time)).length : 0 };
  });
  schedule.validation = secondary;
  return { schedule, html, secondary };
}
export function validateReplacement(previous: Schedule, next: Schedule) {
  if (previous.period !== next.period) return;
  const days = new Set([...next.sessions.map(s => s.date), ...next.noSessionDates]);
  const previousDays = new Set([...previous.sessions.map(s => s.date), ...previous.noSessionDates]);
  if ([...previousDays].some(d => !days.has(d))) throw new Error('Coleta incompleta: dias desapareceram; programação anterior preservada.');
  if (next.sessions.length < previous.sessions.length * 0.7) throw new Error('Redução inesperada de sessões; programação anterior preservada.');
}
export async function importSchedule(actor: string) {
  let sourceHtml = '', period = 'unknown';
  try {
    const result = await collectFunesc(); sourceHtml = result.html; period = result.schedule.period;
    const previous = (await readSchedule()).schedule;
    validateReplacement(previous, result.schedule);
    for (const film of result.schedule.films) {
      const old = previous.films.find(f => f.id === film.id && f.director === film.director && f.year === film.year);
      if (old) { film.tmdbId = old.tmdbId; film.poster = old.poster; }
    }
    await enrichFilms(result.schedule);
    const id = await persistSchedule(result.schedule, result.html, actor);
    return { id, period, sessions: result.schedule.sessions.length, issues: result.schedule.issues.length, secondary: result.secondary };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro de importação';
    await getDb().execute({ sql: `INSERT INTO imports (id, period, fetched_at, source_hash, source_html, payload, status, error, created_by) VALUES (?, ?, ?, '', ?, '{}', 'failed', ?, ?)`, args: [randomUUID(), period, new Date().toISOString(), sourceHtml, message, actor] });
    throw error;
  }
}

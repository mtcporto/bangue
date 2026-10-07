import { normalize } from './parser';
import type { Schedule } from './types';
const base = 'https://api.themoviedb.org/3';
async function tmdb(path: string) {
  const response = await fetch(`${base}${path}`, { headers: { Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}` }, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`TMDb HTTP ${response.status}`);
  return response.json();
}
export async function enrichFilms(schedule: Schedule) {
  if (!process.env.TMDB_READ_TOKEN) return;
  // Enrichment is deliberately conservative. The venue schedule is never mutated.
  for (const film of schedule.films) {
    if (film.poster || !film.director || !film.year) continue;
    try {
      const search = await tmdb(`/search/movie?language=pt-BR&query=${encodeURIComponent(film.title)}`);
      const candidates = (search.results || []).filter((r: {title: string; original_title: string; release_date: string}) =>
        [r.title, r.original_title].some(t => normalize(t) === normalize(film.title)) && Math.abs(Number(r.release_date?.slice(0,4)) - film.year!) <= 1);
      const matches = [];
      for (const candidate of candidates.slice(0,3)) {
        const credits = await tmdb(`/movie/${candidate.id}/credits`);
        if (credits.crew?.some((p: {job: string; name: string}) => p.job === 'Director' && normalize(p.name) === normalize(film.director!))) matches.push(candidate);
      }
      if (matches.length === 1) {
        film.tmdbId = matches[0].id;
        film.poster = matches[0].poster_path ? `https://image.tmdb.org/t/p/w500${matches[0].poster_path}` : null;
      }
    } catch { /* Official metadata remains usable when enrichment is unavailable. */ }
  }
}

import { z } from 'zod';
import { validDate, today } from './date';
import { readSchedule, type StoredSchedule } from './store';
import { databaseConfigured, getDb } from './db';
import type { Schedule, Session } from './types';
const isoDate = z.string().refine(validDate, 'Use uma data válida em YYYY-MM-DD');
export const querySchema = z.object({ inicio: isoDate.optional(), fim: isoDate.optional(), filme: z.string().max(160).optional() }).refine(q => !q.inicio || !q.fim || q.inicio <= q.fim, 'inicio deve ser anterior ou igual a fim').refine(q => !q.inicio || !q.fim || q.inicio.slice(0,7) === q.fim.slice(0,7), 'Consulte um mês por requisição');
const buckets = new Map<string, { count: number; expires: number }>();
export async function allowed(request: Request): Promise<boolean> {
  const ip = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const now = Date.now(), window = Math.floor(now / 60000), key = `public:${ip}:${window}`;
  if (databaseConfigured()) {
    try {
      const result = await getDb().execute({ sql: `INSERT INTO rate_limits(bucket, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count`, args: [key, (window + 1) * 60000] });
      return Number(result.rows[0].count) <= 120;
    } catch { /* Snapshot-only startup uses a bounded per-instance fallback. */ }
  }
  if (buckets.size > 1000) for (const [k,v] of buckets) if (v.expires < now) buckets.delete(k);
  const bucket = buckets.get(key) || { count: 0, expires: (window + 1) * 60000 };
  bucket.count++; buckets.set(key, bucket);
  return bucket.count <= 120;
}
export function apiError(message: string, status = 400) {
  return Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', ...(status === 429 ? { 'Retry-After': '60' } : {}) } });
}
export function meta(stored: StoredSchedule) {
  const s = stored.schedule;
  return { cinema: s.venue, timezone: s.timezone, periodo: s.period, verificadoEm: s.fetchedAt,
    fonte: s.sourceUrl, armazenamento: stored.storage, contingencia: stored.degraded,
    desatualizada: Date.now() - Date.parse(s.fetchedAt) > 48 * 3600000 || today().slice(0,7) !== s.period,
    criterio: 'Grade diária da FUNESC; divergências sinalizadas, fontes secundárias não criam sessões.',
    divergenciasPendentes: s.issues.filter(i => !i.resolved).length, validacaoSecundaria: s.validation || [] };
}
export function apiResponse(data: unknown, metadata: unknown) {
  return Response.json({ meta: metadata, data }, { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600', 'Access-Control-Allow-Origin': '*' } });
}
export function sessionView(s: Session, schedule: Schedule) {
  return { ...s, film: schedule.films.find(f => f.id === s.filmId) || null,
    warnings: schedule.issues.filter(i => !i.resolved && i.sessionIds.includes(s.id)).map(i => ({ code: i.code, message: i.message })) };
}
export async function getProgram(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) return { error: apiError(parsed.error.issues.map(i => i.message).join('; ')) };
  const query = parsed.data;
  try {
    const stored = await readSchedule((query.inicio || query.fim)?.slice(0,7));
    const sessions = stored.schedule.sessions.filter(s => (!query.inicio || s.date >= query.inicio) && (!query.fim || s.date <= query.fim) && (!query.filme || s.filmId === query.filme));
    return { stored, sessions, query };
  } catch (error) { return { error: apiError(error instanceof Error && error.message === 'PERIOD_NOT_FOUND' ? 'Programação não publicada para este mês.' : 'Programação indisponível.', 404) }; }
}

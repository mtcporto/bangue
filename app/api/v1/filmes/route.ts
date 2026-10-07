import { allowed, apiError, apiResponse, getProgram, meta } from '@/lib/api';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  if (!await allowed(request)) return apiError('Limite de consultas atingido.', 429);
  const result = await getProgram(request);
  if (result.error) return result.error;
  const ids = new Set(result.sessions.map(s => s.filmId));
  return apiResponse(result.stored.schedule.films.filter(f => ids.has(f.id)), meta(result.stored));
}

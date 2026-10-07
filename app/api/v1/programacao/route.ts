import { allowed, apiError, apiResponse, getProgram, meta, sessionView } from '@/lib/api';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  if (!await allowed(request)) return apiError('Limite de consultas atingido.', 429);
  const result = await getProgram(request);
  if (result.error) return result.error;
  const { stored, sessions, query } = result;
  return apiResponse({ sessions: sessions.map(s => sessionView(s, stored.schedule)), noSessionDates: stored.schedule.noSessionDates.filter(d => (!query.inicio || d >= query.inicio) && (!query.fim || d <= query.fim)) }, meta(stored));
}
export function OPTIONS() { return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' } }); }

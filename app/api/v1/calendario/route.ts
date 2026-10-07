import { allowed, apiError, getProgram } from '@/lib/api';
import { calendar } from '@/lib/calendar';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  if (!await allowed(request)) return apiError('Limite de consultas atingido.',429);
  const result = await getProgram(request);
  if (result.error) return result.error;
  return new Response(calendar(result.stored.schedule,result.sessions), { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'inline; filename="cine-bangue.ics"', 'Cache-Control': 'public, max-age=60, s-maxage=300', 'Access-Control-Allow-Origin': '*' } });
}

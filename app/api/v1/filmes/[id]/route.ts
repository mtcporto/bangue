import { allowed, apiError, apiResponse, getProgram, meta, sessionView } from '@/lib/api';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await allowed(request)) return apiError('Limite de consultas atingido.', 429);
  const result = await getProgram(request);
  if (result.error) return result.error;
  const { id } = await params;
  const film = result.stored.schedule.films.find(f => f.id === id);
  if (!film) return apiError('Filme não encontrado na programação do Cine Bangüê.', 404);
  return apiResponse({ ...film, sessions: result.sessions.filter(s => s.filmId === id).map(s => sessionView(s, result.stored.schedule)) }, meta(result.stored));
}

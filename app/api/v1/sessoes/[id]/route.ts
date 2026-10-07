import { allowed, apiError, apiResponse, meta, sessionView } from '@/lib/api';
import { readSchedule } from '@/lib/store';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await allowed(request)) return apiError('Limite de consultas atingido.', 429);
  const { id } = await params;
  if (!/^bangue-\d{4}-\d{2}-\d{2}-\d{4}$/.test(id)) return apiError('Identificador de sessão inválido.');
  try {
    const stored = await readSchedule(id.slice(7,14));
    const session = stored.schedule.sessions.find(s => s.id === id);
    return session ? apiResponse(sessionView(session, stored.schedule), meta(stored)) : apiError('Sessão não encontrada.', 404);
  } catch { return apiError('Sessão não encontrada.', 404); }
}

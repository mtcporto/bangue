import { authorizeAdmin } from '@/lib/admin';
import { databaseConfigured } from '@/lib/db';
import { importSchedule } from '@/lib/collector';
export const maxDuration = 300;
export async function POST(request: Request) {
  const email = await authorizeAdmin(request);
  if (!email) return Response.json({ error: 'Acesso restrito.' }, { status: 403 });
  if (!databaseConfigured()) return Response.json({ error: 'Banco não configurado.' }, { status: 503 });
  try { return Response.json(await importSchedule(email)); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Falha na coleta; programação anterior preservada.' }, { status: 502 }); }
}

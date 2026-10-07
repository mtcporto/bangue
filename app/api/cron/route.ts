import { timingSafeEqual } from 'node:crypto';
import { importSchedule } from '@/lib/collector';
import { getDb, databaseConfigured } from '@/lib/db';
export const maxDuration = 300;
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : '';
  const actual = request.headers.get('authorization') || '';
  if (!expected || Buffer.byteLength(expected) !== Buffer.byteLength(actual) || !timingSafeEqual(Buffer.from(expected), Buffer.from(actual))) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
  if (!databaseConfigured()) return Response.json({ error: 'Banco não configurado.' }, { status: 503 });
  try {
    await getDb().execute({ sql: 'DELETE FROM rate_limits WHERE expires_at < ?', args: [Date.now()] });
    return Response.json(await importSchedule('cron'));
  } catch { return Response.json({ error: 'Coleta falhou. A programação anterior foi preservada.' }, { status: 502 }); }
}

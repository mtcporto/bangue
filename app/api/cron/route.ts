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
    const result = await importSchedule('cron');
    return Response.json(result);
  } catch (err) {
    console.error('cron execution failed:', err);
    return Response.json({
      error: 'Coleta falhou. A programação anterior foi preservada.',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 502 });
  }
}

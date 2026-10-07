import { authorizeAdmin } from '@/lib/admin';
import { getDb, databaseConfigured } from '@/lib/db';
import { readSchedule } from '@/lib/store';
import { z } from 'zod';
const schema = z.object({ period: z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/), sourceHash: z.string().length(64), issueId: z.string().min(1).max(250), resolution: z.string().trim().min(12).max(2000) });
export async function POST(request: Request) {
  const email = await authorizeAdmin(request);
  if (!email) return Response.json({ error: 'Acesso restrito.' }, { status: 403 });
  if (!databaseConfigured()) return Response.json({ error: 'Banco não configurado.' }, { status: 503 });
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: 'Informe a divergência e uma justificativa de pelo menos 12 caracteres.' }, { status: 400 });
  const stored = await readSchedule(body.data.period);
  const s = stored.schedule;
  if (stored.storage !== 'turso' || s.sourceHash !== body.data.sourceHash || !s.issues.some(i => i.id === body.data.issueId)) return Response.json({ error: 'Programação mudou. Atualize a página antes de revisar.' }, { status: 409 });
  await getDb().execute({ sql: `INSERT INTO reviews(issue_id, source_hash, resolution, reviewed_by, reviewed_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(issue_id, source_hash) DO UPDATE SET resolution=excluded.resolution, reviewed_by=excluded.reviewed_by, reviewed_at=excluded.reviewed_at`, args: [body.data.issueId, s.sourceHash, body.data.resolution, email, new Date().toISOString()] });
  return Response.json({ ok: true });
}

import { authorizeAdmin } from '@/lib/admin';
import { getDb, databaseConfigured } from '@/lib/db';
import { readSchedule } from '@/lib/store';
import { validDate } from '@/lib/date';
import { z } from 'zod';
const schema = z.object({ period:z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/),sourceHash:z.string().length(64),sessionId:z.string().max(100),date:z.string().refine(validDate),time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),reason:z.string().trim().min(20).max(2000) });
export async function POST(request:Request) {
  const email=await authorizeAdmin(request);
  if(!email)return Response.json({error:'Acesso restrito.'},{status:403});
  if(!databaseConfigured())return Response.json({error:'Banco não configurado.'},{status:503});
  const body=schema.safeParse(await request.json().catch(()=>null));
  if(!body.success)return Response.json({error:'Data, horário ou justificativa inválida.'},{status:400});
  const value=body.data;const stored=await readSchedule(value.period);const s=stored.schedule;
  const session=s.sessions.find(x=>x.id===value.sessionId);
  if(stored.storage!=='turso'||s.sourceHash!==value.sourceHash||!session)return Response.json({error:'Sessão inexistente ou programação alterada. Atualize a página.'},{status:409});
  if(!value.date.startsWith(s.period))return Response.json({error:'A correção deve permanecer no mês da programação.'},{status:400});
  if(s.noSessionDates.includes(value.date))return Response.json({error:'A fonte informa ausência de sessões nesta data. Revise a fonte antes de alterar.'},{status:409});
  if(s.sessions.some(x=>x.id!==session.id&&x.date===value.date&&x.time===value.time))return Response.json({error:'Já existe uma sessão nesse horário.'},{status:409});
  const payload=JSON.stringify({date:value.date,time:value.time,startsAt:`${value.date}T${value.time}:00-03:00`});
  await getDb().execute({sql:`INSERT INTO corrections(session_id,source_hash,payload,reason,corrected_by,corrected_at) VALUES (?,?,?,?,?,?) ON CONFLICT(session_id,source_hash) DO UPDATE SET payload=excluded.payload,reason=excluded.reason,corrected_by=excluded.corrected_by,corrected_at=excluded.corrected_at`,args:[session.id,s.sourceHash,payload,value.reason,email,new Date().toISOString()]});
  return Response.json({ok:true});
}

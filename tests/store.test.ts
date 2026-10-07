import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { migrate, getDb } from '../lib/db';
import { persistSchedule, readSchedule } from '../lib/store';
import { parseFunesc } from '../lib/parser';
test('database preserves the approved import and applies audited reviews/corrections',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'bangue-test-'));
  process.env.TURSO_DATABASE_URL=`file:${directory}/test.db`;
  try {
    await migrate();
    const s=parseFunesc(readFileSync('data/sources/funesc-2026-10.html','utf8'),'2026-10-07T12:00:00Z');
    await persistSchedule(s,'<source>','test@example.com');
    const stored=await readSchedule(s.period);assert.equal(stored.storage,'turso');assert.equal(stored.schedule.sessions.length,89);
    const issue=s.issues[0];
    await getDb().execute({sql:'INSERT INTO reviews VALUES (?,?,?,?,?)',args:[issue.id,s.sourceHash,'Horários conferidos com o Cine Bangüê.','test@example.com',s.fetchedAt]});
    const session=s.sessions.find(x=>x.date==='2026-10-07'&&x.time==='18:30')!;
    await getDb().execute({sql:'INSERT INTO corrections VALUES (?,?,?,?,?,?)',args:[session.id,s.sourceHash,JSON.stringify({time:'18:40',startsAt:'2026-10-07T18:40:00-03:00'}),'Confirmação explícita do Cine Bangüê.','test@example.com',s.fetchedAt]});
    const revised=(await readSchedule(s.period)).schedule;
    assert.equal(revised.issues.find(i=>i.id===issue.id)?.resolved,true);
    assert.equal(revised.sessions.find(x=>x.id===session.id)?.time,'18:40');
    // A failed import is an audit record, never a replacement of the current schedule.
    await getDb().execute({sql:`INSERT INTO imports(id,period,fetched_at,source_hash,source_html,payload,status,error,created_by) VALUES ('failed',?,?,'','','{}','failed','bad format','test')`,args:[s.period,'2026-10-08T12:00:00Z']});
    assert.equal((await readSchedule(s.period)).schedule.sessions.length,89);
    assert.equal((await readSchedule(s.period)).schedule.fetchedAt,s.fetchedAt);
  }finally{getDb().close();delete process.env.TURSO_DATABASE_URL;await rm(directory,{recursive:true,force:true});}
});

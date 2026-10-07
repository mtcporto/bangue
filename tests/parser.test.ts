import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseFunesc, normalize } from '../lib/parser';
import { parseSecondary, compareSecondary } from '../lib/secondary';
import { calendar } from '../lib/calendar';
import { validateReplacement } from '../lib/collector';
import { validDate } from '../lib/date';
import { querySchema } from '../lib/api';
const html = readFileSync('data/sources/funesc-2026-10.html','utf8');
const parse = () => parseFunesc(html, '2026-10-07T12:00:00Z');
test('extracts the complete official October grid and only scheduled films',()=>{
  const s=parse();assert.equal(s.period,'2026-10');assert.equal(s.sessions.length,89);assert.equal(s.films.length,12);
  assert.equal(new Set([...s.sessions.map(x=>x.date),...s.noSessionDates]).size,31);
  assert.ok(s.sessions.every(x=>x.venue==='Cine Bangüê'&&x.startsAt.endsWith('-03:00')));
  assert.ok(s.films.every(f=>s.sessions.some(x=>x.filmId===f.id)));
  assert.deepEqual(s.sessions.filter(x=>x.date==='2026-10-07').map(x=>[x.time,x.title]),[['15:30','RAN'],['18:30','CURTA BANGÜÊ III'],['19:50','AS CORES DO TEMPO']]);
});
test('film lists flag disagreement but never create phantom sessions',()=>{
  const s=parse();assert.ok(!s.sessions.some(x=>x.filmId==='ran'&&x.date==='2026-10-11'));
  assert.ok(s.sessions.some(x=>x.filmId==='ran'&&x.date==='2026-10-04'&&x.time==='18:50'));
  assert.ok(s.issues.some(x=>x.code==='film_list_disagreement'&&x.message.includes('RAN')));
});
test('standalone closed-day text does not erase sessions',()=>{
  const s=parse();assert.equal(s.sessions.filter(x=>x.date==='2026-10-31').length,4);
  assert.ok(!s.noSessionDates.includes('2026-10-31'));assert.ok(s.issues.some(x=>x.code==='ambiguous_closed_day'));
  assert.ok(s.noSessionDates.includes('2026-10-03'));
});
test('accessibility, debate and shorts are session attributes, not extra films',()=>{
  const s=parse();const accessible=s.sessions.find(x=>x.accessible)!;assert.equal(accessible.filmId,'cordelina');assert.equal(accessible.time,'16:00');
  assert.ok(s.sessions.some(x=>x.debate&&x.filmId==='ao-sabor-das-cinzas'));
  assert.ok(s.sessions.filter(x=>x.kind==='shorts').every(x=>x.filmId===null));
  assert.ok(s.sessions.some(x=>x.kind==='shorts'&&x.free&&x.price.full===0));
  assert.equal(normalize('MIRRORS Nº3'),normalize('MIRRORS NO. 3'));
  assert.equal(s.films.find(x=>x.id==='mirrors-n3')?.director,'CHRISTIAN PETZOLD');
});
test('malformed official HTML, missing venue, invalid dates and times fail closed',()=>{
  assert.throws(()=>parseFunesc('<h1>Sem conteúdo</h1>'));
  assert.throws(()=>parseFunesc(html.replace('CINE BANGÜÊ — OUTUBRO DE 2026','CINETEATRO SÃO JOSÉ — OUTUBRO DE 2026')));
  assert.throws(()=>parseFunesc(html.replace('01/10 — QUINTA','32/10 — QUINTA')));
  assert.throws(()=>parseFunesc(html.replace('16H — VIRTUOSAS','26H — VIRTUOSAS')));
});
test('secondary extraction isolates Cine Bangüê from other venues',()=>{
  const secondary='<div class="entry-content"><p>RAN. Japão, 1985. Dir.: Akira Kurosawa.</p><p>João Pessoa: CINE BANGÜÊ: qua., 7/10: 15h30. Campina Grande: CINETEATRO SÃO JOSÉ: qui., 8/10: 20h.</p><p>***</p><p>OUTRO FILME. Brasil, 2026. Dir.: Pessoa.</p><p>João Pessoa: CINÉPOLIS: qua., 7/10: 19h.</p></div>';
  const obs=parseSecondary(secondary,'https://example.com','2026');assert.equal(obs.length,1);assert.equal(obs[0].film,'RAN');assert.equal(obs[0].time,'15:30');
});
test('secondary observations never add films or sessions, including unknown films',()=>{
  const s=parse();const before=JSON.stringify({films:s.films,sessions:s.sessions.map(x=>x.id)});
  compareSecondary(s,[{film:'RAN',date:'2026-10-07',time:'20:00',sourceUrl:'https://example.com',sourceText:'Cine Bangüê'},{film:'OTHER VENUE FILM',date:'2026-10-07',time:'21:00',sourceUrl:'https://example.com',sourceText:'Cine Bangüê'}]);
  assert.equal(JSON.stringify({films:s.films,sessions:s.sessions.map(x=>x.id)}),before);assert.ok(s.issues.some(x=>x.code==='secondary_disagreement'));
});
test('incomplete replacement never overwrites a complete monthly schedule',()=>{
  const previous=parse(),next=parse();next.sessions=next.sessions.slice(0,10);assert.throws(()=>validateReplacement(previous,next));
});
test('query validation rejects impossible dates, backwards intervals and multiple months',()=>{
  assert.equal(validDate('2026-02-30'),false);assert.equal(validDate('2028-02-29'),true);
  assert.equal(querySchema.safeParse({inicio:'2026-10-15',fim:'2026-10-01'}).success,false);
  assert.equal(querySchema.safeParse({inicio:'2026-10-15',fim:'2026-11-01'}).success,false);
  assert.equal(querySchema.safeParse({inicio:'2026-10-07',fim:'2026-10-07'}).success,true);
});
test('calendar uses UTC timestamps, stable UIDs, and tentative disputed sessions',()=>{
  const s=parse();const session=s.sessions.find(x=>x.date==='2026-10-07'&&x.time==='15:30')!;
  const value=calendar(s,[session]);assert.ok(value.includes('DTSTART:20261007T183000Z'));assert.ok(value.includes(`UID:${session.id}@bangue.vercel.app`));assert.ok(value.includes('STATUS:TENTATIVE'));assert.ok(value.endsWith('END:VCALENDAR\r\n'));
  assert.ok(value.split('\r\n').every(line=>Buffer.byteLength(line)<=75));
});
test('film artwork matching tolerates known title subtitles and a one-letter director typo, not unrelated films',async()=>{
  const {sameDirector,compatibleTitle}=await import('../lib/tmdb');
  assert.equal(sameDirector('CÉDRICK KLAPISCH','Cédric Klapisch'),true);
  assert.equal(sameDirector('AKIRA KUROSAWA','Kiyoshi Kurosawa'),false);
  assert.equal(compatibleTitle('AMELIA TOLEDO — LEMBRAR DE NÃO ESQUECER','Amélia Toledo'),true);
  assert.equal(compatibleTitle('RAN','Akira'),false);
});
test('trailers require the matched film video, official YouTube trailer and a valid key',async()=>{
  const {selectTrailer}=await import('../lib/tmdb');
  const en={key:'abcdefghijk',site:'YouTube',type:'Trailer',official:true,name:'Trailer',iso_639_1:'en'};
  const pt={...en,key:'12345678901',iso_639_1:'pt'};
  assert.equal(selectTrailer([en,pt])?.key,pt.key);
  assert.equal(selectTrailer([{...en,official:false},{...en,type:'Teaser'},{...en,key:'../invalid'},{...en,site:'Vimeo'}]),undefined);
});

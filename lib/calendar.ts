import type { Schedule, Session } from './types';
const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\r/g, '');
const stamp = (s: string) => new Date(s).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
function fold(line: string) {
  const lines: string[] = []; let current = '';
  for (const c of line) {
    if (Buffer.byteLength(current + c) > 75) { lines.push(current); current = ' '; }
    current += c;
  }
  lines.push(current); return lines.join('\r\n');
}
export function calendar(schedule: Schedule, sessions: Session[]) {
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Bangue//Programacao//PT-BR','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Cine Bangüê'];
  for (const s of sessions) {
    const film = schedule.films.find(f => f.id === s.filmId);
    lines.push('BEGIN:VEVENT', `UID:${s.id}@bangue.vercel.app`, `DTSTAMP:${stamp(schedule.fetchedAt)}`, `DTSTART:${stamp(s.startsAt)}`);
    if (film?.duration) lines.push(`DTEND:${stamp(new Date(Date.parse(s.startsAt) + film.duration * 60000).toISOString())}`);
    lines.push(`SUMMARY:${escape(s.title + (s.debate ? ' · debate' : ''))}`, 'LOCATION:Cine Bangüê — Espaço Cultural José Lins do Rego',
      `DESCRIPTION:${escape(`${s.accessible ? 'Sessão acessível. ' : ''}${s.free ? 'Gratuita. ' : ''}${s.needsReview ? 'Há divergência na fonte; confirme o horário. ' : ''}Fonte: ${s.sourceUrl}`)}`,
      `URL:${s.sourceUrl}`, `STATUS:${s.needsReview ? 'TENTATIVE' : 'CONFIRMED'}`, 'END:VEVENT');
  }
  lines.push('END:VCALENDAR'); return lines.map(fold).join('\r\n') + '\r\n';
}

'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Clock3, Accessibility, MessageCircle, Ticket, CalendarDays, Share2, ArrowRight } from 'lucide-react';
import { displayDate, daysInPeriod } from '@/lib/date';
import type { Schedule, Session } from '@/lib/types';
import { FilmArt } from './film-art';
export function Agenda({ schedule, initialDate, currentDate }: { schedule: Schedule; initialDate: string; currentDate: string }) {
  const [date,setDate] = useState(initialDate), [view,setView] = useState<'sessions'|'films'>('sessions');
  const [accessible,setAccessible] = useState(false), [free,setFree] = useState(false);
  const [sessions,setSessions] = useState(schedule.sessions.filter(s => s.date === initialDate));
  const [loading,setLoading] = useState(false), [error,setError] = useState(''), [shareMessage,setShareMessage] = useState('');
  const dateStrip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const strip = dateStrip.current;
    const selected = strip?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
    if (strip && selected) strip.scrollLeft = selected.offsetLeft - strip.offsetLeft - (strip.clientWidth - selected.clientWidth) / 2;
  }, [date, view]);
  useEffect(() => {
    const controller = new AbortController();
    async function read() {
      setLoading(true); setError('');
      try {
        const r = await fetch(`/api/v1/programacao?inicio=${date}&fim=${date}`, { signal: controller.signal });
        const payload = await r.json();
        if (!r.ok) throw new Error(payload.error || 'Não foi possível consultar as sessões.');
        setSessions(payload.data.sessions);
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Falha de conexão.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void read(); return () => controller.abort();
  }, [date]);
  const selected = sessions.filter(s => (!accessible || s.accessible) && (!free || s.free));
  const days = daysInPeriod(schedule.period);
  async function share(s: Session) {
    const url = `${window.location.origin}/?data=${s.date}`;
    try {
      if (navigator.share) await navigator.share({ title: s.title, text: `${s.title} · ${displayDate(s.date)} às ${s.time} · Cine Bangüê`, url });
      else { await navigator.clipboard.writeText(`${s.title} · ${displayDate(s.date)} às ${s.time} · Cine Bangüê\n${url}`); setShareMessage('Sessão copiada.'); }
    } catch { setShareMessage('Compartilhamento cancelado ou indisponível.'); }
  }
  return <section className="agenda" aria-label="Programação do cinema">
    <div className="agenda-toolbar"><div className="tabs" role="group" aria-label="Visualização"><button aria-pressed={view==='sessions'} onClick={() => setView('sessions')}>Por dia</button><button aria-pressed={view==='films'} onClick={() => setView('films')}>Filmes do mês</button></div><span className="period-label">{displayDate(`${schedule.period}-01`, { month:'long', year:'numeric' })}</span></div>
    {view === 'sessions' ? <><div ref={dateStrip} className="date-strip" aria-label="Escolha um dia">{days.map(d => {
      const count = schedule.sessions.filter(s => s.date===d).length;
      return <button key={d} aria-pressed={date===d} className={`date-chip ${date===d?'selected':''} ${count ? 'has-sessions':''}`} onClick={() => setDate(d)} aria-label={`${displayDate(d, { weekday:'long', day:'numeric', month:'long' })}, ${count} sessões`}>
        <span>{d===currentDate ? 'HOJE' : displayDate(d, { weekday:'short' }).replace('.','')}</span><strong>{Number(d.slice(-2))}</strong><i aria-hidden="true"/></button>;
    })}</div>
    <div className="session-heading"><h2>{date===currentDate?'Hoje no Bangüê':displayDate(date, { weekday:'long' })}<span>{displayDate(date)}</span></h2><span className="session-count">{schedule.sessions.filter(s=>s.date===date).length} sessões</span></div>
    <div className="filters"><label><input type="checkbox" checked={accessible} onChange={e=>setAccessible(e.target.checked)}/><Accessibility size={16}/> Acessíveis</label><label><input type="checkbox" checked={free} onChange={e=>setFree(e.target.checked)}/><Ticket size={16}/> Gratuitas</label></div>
    <div aria-live="polite" aria-busy={loading}>{error ? <div className="empty"><h3>Não conseguimos consultar a programação.</h3><p>{error}</p><a href={schedule.sourceUrl} target="_blank" rel="noreferrer">Consultar a FUNESC ↗</a></div> : loading ? <div className="empty"><p>Consultando as sessões…</p></div> : !selected.length ? <div className="empty"><CalendarDays size={32}/><h3>{accessible||free ? 'Nenhuma sessão com estes filtros.' : schedule.noSessionDates.includes(date) ? 'Hoje a tela descansa.' : 'Programação não informada para este dia.'}</h3><p>{accessible||free ? 'Experimente desmarcar um filtro ou escolher outro dia.' : schedule.noSessionDates.includes(date) ? 'A FUNESC informa que não há sessões nesta data. Escolha outro dia.' : 'A ausência de horários não confirma que o cinema estará fechado.'}</p></div> : selected.map(s => {
      const film = schedule.films.find(f=>f.id===s.filmId);
      return <article className="session-card" key={s.id}><div className="session-time"><strong>{s.time.replace(':','h')}</strong><span>{s.free ? 'GRATUITA' : 'SESSÃO'}</span></div><FilmArt film={film} title={s.title} compact/><div className="session-details"><div className="tags">{s.accessible?<span><Accessibility size={13}/> Acessível</span>:null}{s.debate?<span><MessageCircle size={13}/> Debate</span>:null}{s.children?<span>Infantil</span>:null}{s.kind==='shorts'?<span>Programa de curtas</span>:null}</div><h3>{s.filmId?<Link href={`/filmes/${s.filmId}`}>{s.title}</Link>:s.title}</h3><p className="film-meta">{film?.year}{film?.duration ? <> <span>·</span> <Clock3 size={13}/> {film.duration} min</>:null}{film?.rating ? <> <span>·</span> {film.rating}</>:null}</p>{film?.director?<p className="director">Direção: {film.director}</p>:null}
      {s.needsReview?<p className="review-note">Há divergências na fonte. <a href={s.sourceUrl} target="_blank" rel="noreferrer">Confirme com o cinema ↗</a></p>:null}</div><button className="share-button" onClick={()=>void share(s)} aria-label={`Compartilhar ${s.title}`}><Share2 size={17}/></button></article>;
    })}</div><p role="status" className="share-status">{shareMessage}</p></> : <div className="film-grid">{schedule.films.map(f=><Link href={`/filmes/${f.id}`} className="film-tile" key={f.id}><FilmArt film={f} title={f.title}/><div><h3>{f.title}<ArrowUpRight size={18}/></h3><p>{f.year} {f.duration?`· ${f.duration} min`:''}</p><span>{schedule.sessions.filter(s=>s.filmId===f.id).length} sessões neste mês <ArrowRight size={14}/></span></div></Link>)}</div>}
  </section>;
}

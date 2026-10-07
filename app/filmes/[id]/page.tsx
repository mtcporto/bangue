import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readSchedule } from '@/lib/store';
import { displayDate, today } from '@/lib/date';
import { FilmArt } from '@/components/film-art';
export const dynamic = 'force-dynamic';
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata> {
  const {id}=await params; const {schedule}=await readSchedule(); const film=schedule.films.find(f=>f.id===id);
  return {title:film?.title||'Filme não encontrado',description:film?.synopsis||'Sessões no Cine Bangüê'};
}
export default async function FilmPage({ params }: {params:Promise<{id:string}>}) {
  const {id}=await params; const {schedule}=await readSchedule(); const film=schedule.films.find(f=>f.id===id);
  if (!film) notFound();
  const sessions=schedule.sessions.filter(s=>s.filmId===id); const current=today();
  return <main id="conteudo" className="detail-page"><Link href="/" className="back-link">← Voltar à programação</Link><div className="film-detail"><FilmArt film={film} title={film.title}/><div><span className="eyebrow">EM CARTAZ NO CINE BANGÜÊ</span><h1>{film.title}</h1><p className="film-meta">{film.country} · {film.year} {film.duration?`· ${film.duration} min`:''} {film.rating?`· ${film.rating}`:''}</p><p>Direção: {film.director||'Não informada'}</p><p className="synopsis">{film.synopsis||'Sinopse não informada na programação oficial.'}</p>{film.tmdbId?<a href={`https://www.themoviedb.org/movie/${film.tmdbId}`} target="_blank" rel="noreferrer">Mais informações no TMDb ↗</a>:null}<h2>Sessões de {displayDate(`${schedule.period}-01`,{month:'long'})}</h2><div className="film-sessions">{sessions.map(s=><Link className={`film-session ${s.date<current?'past':''}`} key={s.id} href={`/?data=${s.date}`}><span>{displayDate(s.date,{weekday:'short',day:'numeric',month:'short'})}</span><strong>{s.time.replace(':','h')}</strong><span>{s.accessible?'Acessível ':''}{s.debate?'Com debate ':''}{s.needsReview?'A conferir':s.date<current?'Encerrada':'Ver sessão →'}</span></Link>)}</div><a href={`/api/v1/calendario?filme=${id}`}>Adicionar sessões ao calendário ↗</a><p className="small-copy">Dados da <a href={film.sourceUrl} target="_blank" rel="noreferrer">programação oficial da FUNESC</a>. Informações podem ser alteradas pelo cinema.</p></div></div></main>;
}

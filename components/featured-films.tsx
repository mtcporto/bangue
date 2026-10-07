'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Film, Session } from '@/lib/types';
import { displayDate } from '@/lib/date';
export function FeaturedFilms({films,sessions,selectedDate}:{films:Film[];sessions:Session[];selectedDate:string}) {
  const [index,setIndex]=useState(0);
  const upcoming=sessions.filter(s=>s.date>=selectedDate&&s.filmId);
  const ids=[...new Set(upcoming.map(s=>s.filmId))];
  const featured=ids.flatMap(id=>{const film=films.find(f=>f.id===id&&f.backdrop);return film?[film]:[];}).slice(0,5);
  if(!featured.length)return <div className="cinema-banner no-backdrop"><h1>Uma sala.<br/>Muitos mundos.</h1><p>Encontre sua próxima sessão no Cine Bangüê.</p></div>;
  const film=featured[index%featured.length];
  const session=upcoming.find(s=>s.filmId===film.id)!;
  return <section className="cinema-banner" aria-label="Filmes em destaque"><Image src={film.backdrop!} alt={`Cena de ${film.title}`} fill priority={index===0} sizes="(max-width: 700px) 100vw, 1200px" className="banner-image"/><div className="banner-shade"/><div className="banner-copy"><span className="eyebrow">NA TELA DO CINE BANGÜÊ</span><h1>{film.title}</h1><p>{film.director}{film.year?` · ${film.year}`:''}</p><Link className="banner-action" href={`/filmes/${film.id}`}>Conheça o filme <ArrowUpRight size={17}/></Link><span className="banner-session">{displayDate(session.date,{day:'numeric',month:'short'})} · {session.time.replace(':','h')}</span></div><div className="banner-controls"><button onClick={()=>setIndex((index+featured.length-1)%featured.length)} aria-label="Destaque anterior"><ChevronLeft size={18}/></button><span>{index+1} / {featured.length}</span><button onClick={()=>setIndex((index+1)%featured.length)} aria-label="Próximo destaque"><ChevronRight size={18}/></button></div><div className="banner-dots" role="group" aria-label="Escolher filme em destaque">{featured.map((f,i)=><button key={f.id} aria-label={`Ver destaque de ${f.title}`} aria-pressed={i===index} onClick={()=>setIndex(i)}/>)}</div></section>;
}

'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Play, ArrowUpRight } from 'lucide-react';
import type { Film } from '@/lib/types';
export function Trailer({ film }: { film: Film }) {
  const [playing, setPlaying] = useState(false);
  if (!film.trailer) return null;
  const trailer = film.trailer;
  return <section id="trailer" className="film-trailer" aria-label={`Trailer de ${film.title}`}>
    <h2>Trailer</h2>
    <div className="trailer-player">{playing ? <iframe title={`Trailer de ${film.title}`} src={`https://www.youtube-nocookie.com/embed/${trailer.youtubeId}?autoplay=1&rel=0`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/> : <button className="trailer-preview" onClick={() => setPlaying(true)} aria-label={`Reproduzir trailer de ${film.title}`}>
      {film.backdrop || film.poster ? <Image src={(film.backdrop || film.poster)!} alt="" fill sizes="(max-width: 700px) 100vw, 700px"/> : null}<span><Play size={24} fill="currentColor"/> Assistir ao trailer</span>
    </button>}</div>
    <div className="trailer-caption"><span>{trailer.language === 'pt' ? 'Português' : trailer.language === 'en' ? 'Inglês' : trailer.language.toUpperCase()}</span><a href={trailer.url} target="_blank" rel="noreferrer">Abrir no YouTube <ArrowUpRight size={14}/></a></div>
  </section>;
}

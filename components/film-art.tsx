import Image from 'next/image';
import type { Film } from '@/lib/types';
export function FilmArt({ film, title, compact = false }: { film?: Film; title: string; compact?: boolean }) {
  if (film?.poster) return <div className={`film-art poster ${compact ? 'compact' : ''}`}><Image src={film.poster} alt={`Cartaz de ${title}`} fill sizes={compact ? '110px' : '(max-width: 700px) 85vw, 300px'} /></div>;
  const palettes = ['amber','rust','blue','olive'];
  const color = palettes[[...title].reduce((n,c) => n+c.charCodeAt(0),0) % palettes.length];
  return <div aria-hidden="true" className={`film-art ${color} ${compact ? 'compact' : ''}`}><span className="art-orbit"/><span className="art-label">CINE<br/>BANGÜÊ</span><strong>{title}</strong><span className="art-edition">CINEMA EM JOÃO PESSOA</span></div>;
}

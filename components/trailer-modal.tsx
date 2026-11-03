'use client';
import { useEffect } from 'react';
import { X, Play, ArrowUpRight } from 'lucide-react';
import type { Film } from '@/lib/types';

export function TrailerModal({ film, onClose }: { film: Film | null; onClose: () => void }) {
  useEffect(() => {
    if (!film) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [film, onClose]);

  if (!film || !film.trailer) return null;
  const trailer = film.trailer;

  const langLabel =
    trailer.language === 'pt' ? 'Trailer em Português' :
    trailer.language === 'fr' ? 'Trailer em Francês' :
    trailer.language === 'en' ? 'Trailer em Inglês' :
    `Trailer (${trailer.language.toUpperCase()})`;

  return (
    <div
      className="trailer-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Trailer de ${film.title}`}
    >
      <div className="trailer-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="trailer-modal-header">
          <div>
            <h3>{film.title}</h3>
            <p className="trailer-modal-meta">
              {film.director ? `Direção: ${film.director}` : ''}
              {film.year ? ` · ${film.year}` : ''}
              {film.duration ? ` · ${film.duration} min` : ''}
            </p>
          </div>
          <button
            type="button"
            className="trailer-modal-close"
            onClick={onClose}
            aria-label="Fechar trailer"
          >
            <X size={20} />
          </button>
        </div>
        <div className="trailer-modal-video">
          <iframe
            title={`Trailer de ${film.title}`}
            src={`https://www.youtube-nocookie.com/embed/${trailer.youtubeId}?autoplay=1&rel=0`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <div className="trailer-modal-footer">
          <span className="trailer-modal-lang">
            <Play size={13} fill="currentColor" /> {langLabel}
          </span>
          <a
            className="trailer-modal-external"
            href={trailer.url}
            target="_blank"
            rel="noreferrer"
          >
            Abrir no YouTube <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'Bangüê — cinema em João Pessoa', template: '%s · Bangüê' },
  description: 'Programação do Cine Bangüê: sessões, filmes, debates e cinema acessível no Espaço Cultural de João Pessoa.'
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body><a className="skip" href="#conteudo">Pular para o conteúdo</a>
    <header className="site-header"><Link href="/" className="brand" aria-label="Bangüê, página inicial">bangüê<span className="brand-dot">●</span></Link>
      <nav aria-label="Navegação principal"><Link href="/">Programação</Link><Link href="/api-docs">API aberta <span aria-hidden="true">↗</span></Link></nav>
    </header>{children}<footer className="site-footer"><div><Link className="brand small-brand" href="/">bangüê<span className="brand-dot">●</span></Link><p>Cinema público. Programação ao alcance de todos.</p></div>
      <div><p>Guia independente do Cine Bangüê.<br/>Programação oficial publicada pela FUNESC.</p><Link href="/api-docs">Dados abertos</Link><span> · </span><Link href="/admin">Administração</Link></div></footer>
    </body></html>;
}

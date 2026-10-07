'use client';
export default function ErrorPage({reset}:{reset:()=>void}) { return <main id="conteudo" className="document-page"><h1>A programação não carregou.</h1><p>Tente novamente em instantes.</p><button className="primary-button" onClick={reset}>Tentar novamente</button></main>; }

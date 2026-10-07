# Bangüê

Agenda independente, exclusivamente do **Cine Bangüê**, no Espaço Cultural José Lins do Rego, em João Pessoa. Next.js + TypeScript, API pública e armazenamento compatível com Turso/libSQL.

## O que está implementado

- Grade por dia, filmes do mês, páginas de filmes e layout responsivo.
- Filtros de sessões gratuitas e acessíveis; indicação de debate e programação infantil.
- Coleta da programação **HTML da FUNESC**, a partir do índice oficial.
- Comparação entre grade diária e fichas por filme; divergências visíveis no site e na API.
- Validação secundária com a agenda **Obrigado, Cinema!**, isolando os horários explicitamente atribuídos ao Cine Bangüê.
- API JSON versionada, CORS público, cache, validação de parâmetros e limite de consultas.
- Calendário iCalendar, compartilhamento de sessões e redirecionamento das URLs HTML antigas.
- Histórico de importações, preservação da última programação válida e arquivo de referência para contingência.
- Painel com Google OAuth, lista de administradores, revisão justificada e correção auditada de horários existentes.
- Cron diário da Vercel, protegido por segredo.
- Enriquecimento opcional e conservador com cartazes do TMDb.

O código de 2024 foi preservado em `archive/`. Ele não faz parte do site novo.

## Regra de escopo

**Somente a grade diária oficial do Cine Bangüê cria filmes e sessões.** As fichas por filme e fontes secundárias podem apontar inconsistências, mas nunca adicionar uma sessão. Um filme que aparece em outra sala, numa notícia ou no TMDb não entra no catálogo por isso.

O PDF oficial fica disponível como link quando encontrado no índice; não é extraído nem utilizado para validar os horários. Uma indisponibilidade do HTML preserva os dados anteriores. Ainda não há importação automática de programação completa a partir de jornais.

A ausência de dados para uma data não significa “sem sessão”. Apenas declarações explícitas da fonte entram em `noSessionDates`. Um “sem sessão” contraditório não apaga os horários.

## Rodar localmente

Requer Node.js 22.9+ (desenvolvimento verificado com Node 24) e npm.

```bash
npm ci
cp .env.example .env.local
```

Para gravar localmente, defina em `.env.local`:

```dotenv
TURSO_DATABASE_URL=file:./data/bangue.db
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Depois:

```bash
npm run db:migrate
npm run import:funesc
npm run dev
```

Abra `http://localhost:3000`. Sem banco configurado, o site e a API usam `data/schedule.json`, com a data real da última coleta. Esse arquivo é uma referência congelada, não uma coleta automática. O aviso de desatualização aparece após 48h ou quando o mês atual não é o publicado.

Os scripts carregam `.env.local` explicitamente. O banco local, credenciais e arquivos `.env` não são versionados.

## Turso e persistência

Na produção, configure `TURSO_DATABASE_URL=libsql://...` e `TURSO_AUTH_TOKEN`. Rode a migração uma vez contra o banco escolhido, antes de ativar as importações.

O schema guarda uma versão JSON completa da programação por mês, além de:

- `imports`: fonte HTML capturada, horário, responsável, resultado e erro da coleta.
- `schedules`: versão publicada de cada mês.
- `reviews`: conferências e justificativas ligadas à versão da fonte.
- `corrections`: alterações de data/horário de sessões já existentes, com autor e justificativa.
- `rate_limits`: contadores compartilhados de consultas.

A importação publica a captura e a programação numa transação. Coletas vazias, datas inválidas, horários duplicados, desaparecimento de dias ou redução inesperada de sessões falham sem substituir a programação anterior. Fontes secundárias indisponíveis não bloqueiam a fonte oficial.

Revisões e correções são vinculadas ao hash do HTML oficial: uma mudança na fonte exige nova conferência. Correções mantêm o ID original da sessão, não podem trocar de mês, criar sessões, alterar o cinema ou ocupar um horário já preenchido. O texto original permanece disponível para auditoria.

Uma falha de leitura do banco ativa o arquivo de referência e sinaliza `meta.contingencia`. Portanto, confira também `meta.periodo` e `meta.verificadoEm` ao consumir a API.

## API pública

Documentação humana em `/api-docs`.

| Endpoint | Conteúdo |
| --- | --- |
| `GET /api/v1/programacao` | Sessões e dias declarados sem sessão |
| `GET /api/v1/filmes` | Filmes com sessões na grade |
| `GET /api/v1/filmes/:id` | Ficha e sessões do filme |
| `GET /api/v1/sessoes/:id` | Sessão, ficha do filme e avisos |
| `GET /api/v1/calendario` | Calendário `.ics` |

Filtros: `inicio=YYYY-MM-DD`, `fim=YYYY-MM-DD` e `filme=<id>`. Consulte um mês por requisição; limites inclusivos. Sem filtros, retorna o mês atual se publicado, ou o mais recente. Para consultar um filme de um mês arquivado, inclua `inicio` e/ou `fim` desse mês.

```bash
curl 'http://localhost:3000/api/v1/programacao?inicio=2026-10-07&fim=2026-10-07'
curl 'http://localhost:3000/api/v1/filmes/ran'
curl 'http://localhost:3000/api/v1/calendario?filme=ran'
```

Respostas JSON: `{ "meta": {...}, "data": ... }`. `startsAt` inclui `-03:00`; `timezone` usa `America/Fortaleza`, zona IANA que inclui a Paraíba. Programas de curtas têm `filmId: null`. Preços ausentes são `null`, e não zero.

`needsReview` e `warnings` indicam divergências pendentes; não são confirmações de cancelamento. O calendário marca essas sessões como `TENTATIVE`. `meta.validacaoSecundaria` registra fonte, momento da consulta e quantidade de horários coincidentes; não afirma que sejam confirmações independentes.

Datas/intervalos inválidos retornam `400`; mês, filme ou sessão ausente retorna `404`; limite excedido retorna `429` e `Retry-After: 60`. O limite é de 120 consultas por minuto/IP na origem, compartilhado pelo banco. Sem banco ou durante falha dele, usa um contador por instância. Cache na CDN: até 300 segundos. CORS permite leitura em outros sites, sem login.

## Google OAuth e painel

O público não precisa de conta. `/admin` só permite contas Google verificadas e presentes em `ADMIN_EMAILS`.

Configure:

```dotenv
AUTH_SECRET=<segredo aleatório forte>
AUTH_GOOGLE_ID=<client ID Google>
AUTH_GOOGLE_SECRET=<client secret Google>
ADMIN_EMAILS=voce@example.com,outro@example.com
```

No Google Cloud, cadastre como redirect URI:

```text
http://localhost:3000/api/auth/callback/google
https://<seu-dominio>/api/auth/callback/google
```

A integração usa Auth.js v5 (`next-auth` beta, versão exata no lockfile), sessão JWT com duração de 8h e proteção de escritas por sessão + lista de administradores + origem da requisição. Sem credenciais, o painel exibe instruções e as escritas ficam bloqueadas. Login Google validado localmente e em produção com a conta autorizada em 7 de outubro de 2026.

O painel permite importar, confirmar a grade diária com justificativa e corrigir data/horário de uma sessão existente. Não permite cadastrar filmes ou sessões livres.

## TMDb

`TMDB_READ_TOKEN` ou `TMDB_API_KEY` são opcionais e ficam apenas no servidor. O coletor só associa um cartaz quando encontra um único candidato com título compatível, diretor correspondente e ano próximo ao informado pela FUNESC. Ele não troca a sinopse/classificação oficial e não cria filmes. Falha no TMDb não impede publicar a programação.

O snapshot inclui cartazes para os 12 filmes e imagens horizontais para 10 deles. Programas de curtas usam capa tipográfica quando não há imagem da própria mostra. A atribuição ao TMDb aparece no rodapé. Trailers oficiais são obtidos pelo ID do filme já confirmado no TMDb, com preferência por português. Lacunas são complementadas por vídeos conferidos nos canais das distribuidoras, vinculados ao mesmo título, diretor e ID. O player só é carregado ao clicar; a programação e as fichas incluem links diretos ao YouTube.

## Vercel e domínio

Framework: Next.js. Build: `npm run build`. Não é preciso configurar um diretório de saída personalizado.

1. Configure o Turso da produção e rode `npm run db:migrate` com as variáveis desse ambiente.
2. Configure as variáveis do banco, Google OAuth (se quiser ativar o painel), `AUTH_SECRET`, `ADMIN_EMAILS` e `CRON_SECRET` na Vercel.
3. Ajuste `NEXT_PUBLIC_SITE_URL` para o domínio da publicação.
4. Configure `AUTH_URL` se necessário em um domínio/proxy personalizado, conforme a documentação do Auth.js; não habilite confiança em hosts arbitrários.
5. Faça uma importação e verifique o conteúdo da API.

`vercel.json` agenda a coleta às **09:15 UTC / 06:15 em João Pessoa**, uma vez por dia. A Vercel chama `/api/cron` com `Authorization: Bearer <CRON_SECRET>`. Sem segredo, o endpoint recusa a requisição. Um erro de coleta fica no histórico e retorna HTTP 502; os dados anteriores continuam publicados.

Cloudflare é opcional para domínio/DNS. Inicialmente, use o registro do site em modo DNS-only e a CDN da Vercel para cache. A produção usa o projeto Vercel `bangue` e o banco Turso `bangue`. Google OAuth usa o cliente Web **Bangüê** no projeto existente `umbrella-mtcporto`, com callbacks para `http://localhost:3000/api/auth/callback/google` e `https://bangue.vercel.app/api/auth/callback/google`. As credenciais ficam nas variáveis de ambiente; arquivos OAuth baixados são ignorados pelo Git.

## Verificação

```bash
npm test
npm run typecheck
npm run build
```

Os testes verificam a fonte real capturada, escopo exclusivo do cinema, divergências, sessões especiais, validação de datas, persistência/revisões e calendário.

Com o servidor local e banco importado, rode os testes de navegador:

```bash
npm run test:browser
```

O Playwright usa `/usr/bin/google-chrome` quando disponível, ou Chromium instalado pelo Playwright. Em outro ambiente:

```bash
npx playwright install chromium
```

Cobertura: API → banco → resposta, filtros e navegação em desktop/celular, ausência de overflow horizontal, dias sem sessão, exportação de calendário e bloqueio de escritas não autorizadas. O login Google foi verificado de ponta a ponta em localhost e `bangue.vercel.app`, incluindo retorno OAuth, sessão administrativa e leitura das 89 sessões.

## Acesso por agentes

MCP público e somente leitura em `https://bangue.vercel.app/mcp` (Streamable HTTP). Ferramentas: `consultar_programacao`, `listar_filmes`, `detalhar_filme` e `informacoes_cinema`. Recurso: `bangue://programacao`. Compatível com clientes atuais e protocolo 2025-03-26.

Contrato OpenAPI em `/api/v1/openapi`, orientações em `/llms.txt` e exemplos em `/api-docs`. Cada resposta inclui origem, atualização e divergências; meses não publicados não são interpretados como ausência de sessões. Nenhuma ferramenta permite incluir filmes ou comprar ingressos.

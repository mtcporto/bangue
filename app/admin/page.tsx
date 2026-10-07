import { auth, authConfigured, adminEmail, signIn, signOut } from '@/lib/auth';
import { databaseConfigured, getDb } from '@/lib/db';
import { readSchedule } from '@/lib/store';
import { ReviewPanel } from '@/components/review-panel';
export const dynamic='force-dynamic';
export const metadata={title:'Administração',robots:{index:false,follow:false}};
export default async function Admin() {
  if(!authConfigured()) return <main id="conteudo" className="document-page"><span className="eyebrow">ADMINISTRAÇÃO</span><h1>Acesso administrativo</h1><p>O login Google ainda não foi configurado. A programação pública continua disponível.</p><p>Para ativar, configure as credenciais Google, o segredo de autenticação e a lista de administradores conforme o README do projeto.</p></main>;
  const session=await auth();
  if(!adminEmail(session?.user?.email)) return <main id="conteudo" className="document-page"><span className="eyebrow">ADMINISTRAÇÃO</span><h1>Revisar a programação</h1><p>Acesso somente para contas Google autorizadas.</p><form action={async()=>{'use server';await signIn('google',{redirectTo:'/admin'});}}><button className="primary-button">Entrar com Google</button></form></main>;
  const {schedule,storage}=await readSchedule();
  const imports=databaseConfigured()?await getDb().execute('SELECT fetched_at, status, error, period FROM imports ORDER BY fetched_at DESC LIMIT 5'):null;
  return <main id="conteudo" className="document-page"><div className="admin-header"><div><span className="eyebrow">ADMINISTRAÇÃO</span><h1>Programação sob cuidado.</h1></div><form action={async()=>{'use server';await signOut({redirectTo:'/'});}}><button className="primary-button">Sair</button></form></div><div className="admin-status">{session?.user?.email}<br/>{schedule.period} · {schedule.sessions.length} sessões · armazenamento: {storage}<br/>Última coleta: {schedule.fetchedAt}</div>{databaseConfigured()?<ReviewPanel schedule={schedule}/>:<p>Configure o Turso para importar e registrar revisões.</p>}{imports?.rows.length?<><h2>Últimas importações</h2><table><thead><tr><th>Coleta</th><th>Período</th><th>Resultado</th></tr></thead><tbody>{imports.rows.map((r,i)=><tr key={i}><td>{String(r.fetched_at)}</td><td>{String(r.period)}</td><td>{String(r.status)}{r.error?` · ${r.error}`:''}</td></tr>)}</tbody></table></>:null}</main>;
}

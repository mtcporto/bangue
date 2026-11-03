import { normalize } from './parser';
import type { Schedule } from './types';
const base='https://api.themoviedb.org/3';
async function tmdb(path:string) {
  const url=new URL(`${base}${path}`);
  const token=process.env.TMDB_READ_TOKEN;
  if(!token&&process.env.TMDB_API_KEY)url.searchParams.set('api_key',process.env.TMDB_API_KEY);
  const response=await fetch(url,{headers:token?{Authorization:`Bearer ${token}`}:{},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error(`TMDb HTTP ${response.status}`);
  return response.json();
}
export function sameDirector(left:string,right:string):boolean {
  const a=normalize(left),b=normalize(right);
  if(a===b)return true;
  const [firstA,...surnameA]=a.split(' '),[firstB,...surnameB]=b.split(' ');
  if(!surnameA.length||surnameA.join(' ')!==surnameB.join(' '))return false;
  // One-character typo in a first name; surnames must match exactly.
  const rows=Array.from({length:firstA.length+1},(_,i)=>[i]);
  for(let j=0;j<=firstB.length;j++)rows[0][j]=j;
  for(let i=1;i<=firstA.length;i++)for(let j=1;j<=firstB.length;j++)rows[i][j]=Math.min(rows[i-1][j]+1,rows[i][j-1]+1,rows[i-1][j-1]+(firstA[i-1]===firstB[j-1]?0:1));
  return rows[firstA.length][firstB.length]<=1;
}
export const TITLE_ALIASES: Record<string, string[]> = {
  'A ILUSTRE DESCONHECIDA': ['Ni vue, ni connue', "L'Illustre Inconnue"],
  'MINHA VIDA DE SEREIA': ['Miss Mermaid'],
  'O BEIJO ELÉTRICO': ['La Vénus électrique', 'The Electric Kiss'],
  'BEM-VINDOS A LA COMÉDIE FRANÇAISE': ['Bienvenue à la Comédie-Française'],
  'A BUSCA DE CHARLIE': ['En cavale avec Charlie', 'La route de Charlie'],
  'COMPOSTELA, O CAMINHO DA TERAPIA': ['Compostelle'],
  'O CANTO DA FLORESTA': ['Le Chant des forêts'],
  'DE GAULLE: A FRANÇA LIVRE – PARTE 1': ['De Gaulle: La France libre', 'De Gaulle'],
  'DE GAULLE: A FRANÇA LIVRE – PARTE 2': ['De Gaulle: La France libre', 'De Gaulle'],
  'DA GAULLE: A FRANÇA LIVRE – PARTE 2': ['De Gaulle: La France libre', 'De Gaulle'],
  'A CASA DAS MULHERES': ['La Maison des mulheres', 'La Maison des femmes'],
  'O FANTASMA DA ÓPERA': ["Le Fantôme de l'Opéra", 'The Phantom of the Opera'],
  'O REI E O PÁSSARO': ["Le Roi et l'Oiseau", 'The King and the Mockingbird'],
  'UMA MENINA DE OURO': ['Une fille en or'],
  'O SENTIDO DA VIDA': ['Our Apprenticeship', 'Le Sentiment de la vie'],
  'JÚPITER': ['Jupiter'],
  'MOLIÈRE, CYRANO E O PEQUENO REI': ['Molière, Cyrano et le petit roi', 'Le Nouveau Joujou'],
  'JIM QUEEN': ['Jim Queen'],
  'SEM PIEDADE': ['Sans pitié'],
  'VICTOR COMO HUGO': ['Victor como Hugo', 'Le Tableau volé'],
  'O QUE É O AMOR?': ["C'est quoi l'amour?"],
  'VICENTINA PEDE DESCULPAS': ['On Behalf of My Son'],
  'MEU VERÃO NA SICÍLIA': ['Gioia mia', 'Sweetheart']
};

export function compatibleTitle(official:string, candidate:string):boolean {
  if (normalize(official)===normalize(candidate) || normalize(official.split(/\s+[—–]\s+/)[0])===normalize(candidate)) return true;
  const normOfficial = normalize(official);
  for (const [key, aliases] of Object.entries(TITLE_ALIASES)) {
    if (normalize(key) === normOfficial || normalize(key.split(/\s+[—–]\s+/)[0]) === normOfficial) {
      if (aliases.some(a => normalize(a) === normalize(candidate) || normalize(a.split(/\s+[—–]\s+/)[0]) === normalize(candidate))) {
        return true;
      }
    }
  }
  return false;
}
type Video = { key: string; site: string; type: string; official: boolean; name: string; iso_639_1: string };
export function selectTrailer(videos: Video[]) {
  return videos.filter(v=>v.site==='YouTube'&&v.type==='Trailer'&&v.official===true&&/^[A-Za-z0-9_-]{11}$/.test(v.key))
    .sort((a,b)=>(a.iso_639_1==='pt'?0:1)-(b.iso_639_1==='pt'?0:1))[0];
}
// Confirmed on the distributors' channels; fills missing/inaccurate TMDb video listings.
const verifiedTrailers = [
  { tmdbId:11645,title:'RAN',director:'AKIRA KUROSAWA',key:'n3NHXTYY2HI',language:'en',name:'RAN — 40th Anniversary Official Trailer | STUDIOCANAL',source:'https://www.youtube.com/watch?v=n3NHXTYY2HI',poster:null,backdrop:null },
  { tmdbId:1419806,title:'VIRTUOSAS',director:'CÍNTIA DOMIT BITTAR',key:'TMA2GYoGqGE',language:'pt',name:'VIRTUOSAS | Trailer Oficial — Olhar Filmes',source:'https://www.youtube.com/watch?v=TMA2GYoGqGE',poster:null,backdrop:null },
  { tmdbId:1510325,title:'MEU VERÃO NA SICÍLIA',director:'MARGHERITA SPAMPINATO',key:'fs_1C84-M3o',language:'pt',name:'Meu Verão na Sicília — Pandora Filmes',source:'https://www.youtube.com/watch?v=fs_1C84-M3o',poster:'https://image.tmdb.org/t/p/w500/ccQ9abrYHA0aDmaZGqZ1zDaaUem.jpg',backdrop:'https://image.tmdb.org/t/p/w1280/7N4QlTDnw0NfF9B6kKfG1O9zU35.jpg' },
  { tmdbId:1534205,title:'PAPAYA',director:'PRISCILLA KELLEN',key:'bPNe_cyKMYo',language:'en',name:'Papaya — Official Trailer',source:'https://bestfriendforever.be/films/papaya/',poster:null,backdrop:null }
];
export async function enrichFilms(schedule:Schedule) {
  for(const film of schedule.films) {
    const verified = verifiedTrailers.find(v =>
      compatibleTitle(film.title, v.title) &&
      sameDirector(film.director || '', v.director)
    );
    if (verified) {
      if (!film.tmdbId && verified.tmdbId) film.tmdbId = verified.tmdbId;
      if (!film.poster && verified.poster) film.poster = verified.poster;
      if (!film.backdrop && verified.backdrop) film.backdrop = verified.backdrop;
      if (!film.trailer) film.trailer = { youtubeId: verified.key, url: `https://www.youtube.com/watch?v=${verified.key}`, title: verified.name, language: verified.language, sourceUrl: verified.source };
    }
  }
  if(!process.env.TMDB_READ_TOKEN&&!process.env.TMDB_API_KEY)return;
  for(const film of schedule.films) {
    if(!film.director||!film.year)continue;
    try {
      if(!film.tmdbId) {
        const queries = [film.title];
        for (const [key, aliases] of Object.entries(TITLE_ALIASES)) {
          if (compatibleTitle(film.title, key)) queries.push(...aliases);
        }
        let candidates: any[] = [];
        for (const q of queries) {
          let search = await tmdb(`/search/movie?language=pt-BR&query=${encodeURIComponent(q)}`);
          if (!search.results?.length) search = await tmdb(`/search/movie?query=${encodeURIComponent(q)}`);
          const found = (search.results || []).filter((r: { title: string; original_title: string; release_date: string }) =>
            [r.title, r.original_title].some(t => compatibleTitle(film.title, t)) && (!film.year || Math.abs(Number(r.release_date?.slice(0,4)) - film.year) <= 3)
          );
          if (found.length) { candidates = found; break; }
        }
        const matches=[];
        for(const candidate of candidates.slice(0,5)) {
          const credits=await tmdb(`/movie/${candidate.id}/credits`);
          if(credits.crew?.some((p:{job:string;name:string})=>p.job==='Director'&&sameDirector(p.name,film.director!)))matches.push(candidate);
        }
        if(matches.length===1) {
          film.tmdbId=matches[0].id;
          film.poster=matches[0].poster_path?`https://image.tmdb.org/t/p/w500${matches[0].poster_path}`:null;
          film.backdrop=matches[0].backdrop_path?`https://image.tmdb.org/t/p/w1280${matches[0].backdrop_path}`:null;
        }
      } else if (!film.poster || !film.backdrop) {
        try {
          const details = await tmdb(`/movie/${film.tmdbId}`);
          if (!film.poster && details.poster_path) film.poster = `https://image.tmdb.org/t/p/w500${details.poster_path}`;
          if (!film.backdrop && details.backdrop_path) film.backdrop = `https://image.tmdb.org/t/p/w1280${details.backdrop_path}`;
        } catch { /* ignore */ }
      }
      if(film.tmdbId&&!film.trailer) {
        let videos=await tmdb(`/movie/${film.tmdbId}/videos?language=pt-BR`);
        let trailer=selectTrailer(videos.results||[]);
        if(!trailer) { videos=await tmdb(`/movie/${film.tmdbId}/videos?language=en-US`);trailer=selectTrailer(videos.results||[]); }
        if(!trailer) { videos=await tmdb(`/movie/${film.tmdbId}/videos?language=fr-FR`);trailer=selectTrailer(videos.results||[]); }
        if(trailer)film.trailer={youtubeId:trailer.key,url:`https://www.youtube.com/watch?v=${trailer.key}`,title:trailer.name,language:trailer.iso_639_1,sourceUrl:`https://www.themoviedb.org/movie/${film.tmdbId}/videos`};
      }
    }catch{/* Enrichment failure preserves official information and schedule. */}
  }
}

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
  { tmdbId:22504,title:'O REI E O PÁSSARO',director:'PAUL GRIMAULT',key:'4IetbP0TqEE',language:'fr',name:"Le Roi et l'Oiseau — Bande-annonce officielle",source:'https://www.youtube.com/watch?v=4IetbP0TqEE',poster:'https://image.tmdb.org/t/p/w500/pSL75Sg1APD4OHpQs4VyFb8pIFv.jpg',backdrop:'https://image.tmdb.org/t/p/w1280/yDbfVUrb9b0Dkm1TptWtzkujXBk.jpg' },
  { tmdbId:null,title:'MINHA VIDA DE SEREIA',director:'PAULINE BRUNNER E MARION VERLÉ',key:'AqtNwQbWJ0c',language:'fr',name:'Miss Mermaid — Bande-annonce officielle',source:'https://www.youtube.com/watch?v=AqtNwQbWJ0c',poster:'https://i.ytimg.com/vi/AqtNwQbWJ0c/hqdefault.jpg',backdrop:'https://i.ytimg.com/vi/AqtNwQbWJ0c/maxresdefault.jpg' },
  { tmdbId:1307474,title:'VICENTINA PEDE DESCULPAS',director:'GABRIEL MARTINS',key:'6lYmMz0qvGA',language:'pt',name:'Vicentina Pede Desculpas — Trailer Oficial',source:'https://www.youtube.com/watch?v=6lYmMz0qvGA',poster:'https://i.ytimg.com/vi/6lYmMz0qvGA/hqdefault.jpg',backdrop:'https://i.ytimg.com/vi/6lYmMz0qvGA/maxresdefault.jpg' },
  { tmdbId:null,title:'A ILUSTRE DESCONHECIDA',director:'MARC FITOUSSI',key:'pnyMB0Sezog',language:'fr',name:'Ni vue, ni connue — Bande-annonce officielle',source:'https://www.youtube.com/watch?v=pnyMB0Sezog',poster:'https://i.ytimg.com/vi/pnyMB0Sezog/hqdefault.jpg',backdrop:'https://i.ytimg.com/vi/pnyMB0Sezog/maxresdefault.jpg' },
  { tmdbId:null,title:'A CASA DAS MULHERES',director:'MÉLISA GODET',key:'-FNcqt1tN9c',language:'fr',name:'La Maison des femmes — Bande-annonce officielle',source:'https://www.youtube.com/watch?v=-FNcqt1tN9c',poster:'https://i.ytimg.com/vi/-FNcqt1tN9c/hqdefault.jpg',backdrop:'https://i.ytimg.com/vi/-FNcqt1tN9c/maxresdefault.jpg' },
  { tmdbId:1442669,title:'O BEIJO ELÉTRICO',director:'PIERRE SALVADORI',key:'Vh7we1gyElY',language:'fr',name:'La Vénus électrique — Bande-annonce officielle',source:'https://www.youtube.com/watch?v=Vh7we1gyElY',poster:'https://i.ytimg.com/vi/Vh7we1gyElY/hqdefault.jpg',backdrop:'https://i.ytimg.com/vi/Vh7we1gyElY/maxresdefault.jpg' },
  { tmdbId:null,title:'DE GAULLE: A FRANÇA LIVRE – PARTE 1',director:'ANTONIN BAUDRY',key:'RUWLWTKY-fU',language:'fr',name:'La Bataille de Gaulle — Bande-annonce officielle | Pathé',source:'https://www.youtube.com/watch?v=RUWLWTKY-fU',poster:'https://i.ytimg.com/vi/RUWLWTKY-fU/hqdefault.jpg',backdrop:'https://i.ytimg.com/vi/RUWLWTKY-fU/maxresdefault.jpg' },
  { tmdbId:null,title:'O CANTO DA FLORESTA',director:'VINCENT MUNIER',key:'2W9KOuEOwBs',language:'fr',name:'Le Chant des forêts — Bande-annonce officielle',source:'https://www.youtube.com/watch?v=2W9KOuEOwBs',poster:'https://i.ytimg.com/vi/2W9KOuEOwBs/hqdefault.jpg',backdrop:'https://i.ytimg.com/vi/2W9KOuEOwBs/maxresdefault.jpg' },
  { tmdbId:null,title:'O SENTIDO DA VIDA',director:'RYŪSUKE HAMAGUCHI',key:'NuyQQeHdZZ0',language:'fr',name:'All of a Sudden / Soudain — Bande-annonce officielle',source:'https://www.youtube.com/watch?v=NuyQQeHdZZ0',poster:'https://i.ytimg.com/vi/NuyQQeHdZZ0/hqdefault.jpg',backdrop:'https://i.ytimg.com/vi/NuyQQeHdZZ0/maxresdefault.jpg' },
  { tmdbId:null,title:'JOSEPHINE – FRAGMENTOS DE UM CRIME',director:'BETH DE ARAÚJO',key:'Uc_OuA7hVv0',language:'en',name:'Josephine — Official Trailer',source:'https://www.youtube.com/watch?v=Uc_OuA7hVv0',poster:'https://i.ytimg.com/vi/Uc_OuA7hVv0/hqdefault.jpg',backdrop:'https://i.ytimg.com/vi/Uc_OuA7hVv0/maxresdefault.jpg' },
  { tmdbId:null,title:'YELLOW CAKE',director:'TIAGO MELO',key:'eLTqRWtAhKw',language:'pt',name:'Yellow Cake — Trailer Oficial | Olhar Filmes',source:'https://www.youtube.com/watch?v=eLTqRWtAhKw',poster:'https://i.ytimg.com/vi/eLTqRWtAhKw/hqdefault.jpg',backdrop:'https://i.ytimg.com/vi/eLTqRWtAhKw/maxresdefault.jpg' },
  { tmdbId:null,title:'MOLIÈRE, CYRANO E O PEQUENO REI',director:'MICHEL LECLERC',key:'o8v7OAehmZQ',language:'fr',name:"Les Caprices de l'enfant roi — Bande-annonce officielle",source:'https://www.youtube.com/watch?v=o8v7OAehmZQ',poster:'https://i.ytimg.com/vi/o8v7OAehmZQ/hqdefault.jpg',backdrop:'https://i.ytimg.com/vi/o8v7OAehmZQ/maxresdefault.jpg' },
  { tmdbId:null,title:'BEM-VINDOS A LA COMÉDIE FRANÇAISE',director:'MARTIN DARONDEAU E BERTRAND USCLAT',key:'jGNJ105YuxA',language:'fr',name:'Bienvenue à la Comédie-Française — Bande-annonce',source:'https://www.youtube.com/watch?v=jGNJ105YuxA',poster:'https://i.ytimg.com/vi/jGNJ105YuxA/hqdefault.jpg',backdrop:'https://i.ytimg.com/vi/jGNJ105YuxA/maxresdefault.jpg' },
  { tmdbId:1430841,title:'O FANTASMA DA ÓPERA',director:'ALEXANDRE CASTAGNETTI',key:'S1YuCC3kly0',language:'fr',name:"Le Fantôme de l'Opéra — Bande-annonce officielle",source:'https://www.youtube.com/watch?v=S1YuCC3kly0',poster:'https://i.ytimg.com/vi/S1YuCC3kly0/hqdefault.jpg',backdrop:'https://i.ytimg.com/vi/S1YuCC3kly0/maxresdefault.jpg' },
  { tmdbId:null,title:'O QUE É O AMOR?',director:'FABIEN GORGEART',key:'2J6p9PbuTDU',language:'fr',name:"C'est quoi l'amour ? — Bande-annonce officielle",source:'https://www.youtube.com/watch?v=2J6p9PbuTDU',poster:'https://i.ytimg.com/vi/2J6p9PbuTDU/hqdefault.jpg',backdrop:'https://i.ytimg.com/vi/2J6p9PbuTDU/maxresdefault.jpg' },
  { tmdbId:null,title:'UMA MENINA DE OURO',director:'JEAN-LUC GAGET',key:'fEFrjhCiO0A',language:'fr',name:'Une fille en or — Bande-annonce officielle',source:'https://www.youtube.com/watch?v=fEFrjhCiO0A',poster:'https://i.ytimg.com/vi/fEFrjhCiO0A/hqdefault.jpg',backdrop:'https://i.ytimg.com/vi/fEFrjhCiO0A/maxresdefault.jpg' },
  { tmdbId:null,title:'A BUSCA DE CHARLIE',director:'AVRIL BESSON',key:'ZtXJ4jyE1Tw',language:'fr',name:'Les Matins merveilleux — Bande-annonce officielle',source:'https://www.youtube.com/watch?v=ZtXJ4jyE1Tw',poster:'https://i.ytimg.com/vi/ZtXJ4jyE1Tw/hqdefault.jpg',backdrop:'https://i.ytimg.com/vi/ZtXJ4jyE1Tw/maxresdefault.jpg' },
  { tmdbId:null,title:'SEM PIEDADE',director:'JULIEN HOSMALIN',key:'AESEKny5gjs',language:'fr',name:'Sans pitié — Bande-annonce officielle',source:'https://www.youtube.com/watch?v=AESEKny5gjs',poster:'https://i.ytimg.com/vi/AESEKny5gjs/hqdefault.jpg',backdrop:'https://i.ytimg.com/vi/AESEKny5gjs/maxresdefault.jpg' },
  { tmdbId:null,title:'COMPOSTELA, O CAMINHO DA TERAPIA',director:'YANN SAMUELL',key:'9YE0hlydkao',language:'fr',name:'Compostelle — Bande-annonce officielle',source:'https://www.youtube.com/watch?v=9YE0hlydkao',poster:'https://i.ytimg.com/vi/9YE0hlydkao/hqdefault.jpg',backdrop:'https://i.ytimg.com/vi/9YE0hlydkao/maxresdefault.jpg' },
  { tmdbId:null,title:'MALÊS',director:'ANTÔNIO PITANGA',key:'Ih8axiEBvAs',language:'pt',name:'Malês | Trailer Oficial — Imovision',source:'https://www.youtube.com/watch?v=Ih8axiEBvAs',poster:'https://i.ytimg.com/vi/Ih8axiEBvAs/hqdefault.jpg',backdrop:'https://i.ytimg.com/vi/Ih8axiEBvAs/maxresdefault.jpg' },
  { tmdbId:1534205,title:'PAPAYA',director:'PRISCILLA KELLEN',key:'bPNe_cyKMYo',language:'en',name:'Papaya — Official Trailer',source:'https://bestfriendforever.be/films/papaya/',poster:null,backdrop:null }
];
export async function enrichFilms(schedule:Schedule) {
  for(const film of schedule.films) {
    const verified = verifiedTrailers.find(v =>
      compatibleTitle(film.title, v.title) &&
      (!v.director || !film.director || sameDirector(film.director, v.director) || film.director.toUpperCase().includes(v.director.toUpperCase()) || v.director.toUpperCase().includes(film.director.toUpperCase()))
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

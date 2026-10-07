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
export function compatibleTitle(official:string, candidate:string):boolean {
  return normalize(official)===normalize(candidate) || normalize(official.split(/\s+[—–]\s+/)[0])===normalize(candidate);
}
export async function enrichFilms(schedule:Schedule) {
  if(!process.env.TMDB_READ_TOKEN&&!process.env.TMDB_API_KEY)return;
  for(const film of schedule.films) {
    if((film.poster&&film.backdrop)||!film.director||!film.year)continue;
    try {
      let search=await tmdb(`/search/movie?language=pt-BR&query=${encodeURIComponent(film.title)}`);
      const shortTitle=film.title.split(/\s+[—–]\s+/)[0];
      if(!search.results?.length&&shortTitle!==film.title)search=await tmdb(`/search/movie?language=pt-BR&query=${encodeURIComponent(shortTitle)}`);
      const candidates=(search.results||[]).filter((r:{title:string;original_title:string;release_date:string})=>
        [r.title,r.original_title].some(t=>compatibleTitle(film.title,t))&&Math.abs(Number(r.release_date?.slice(0,4))-film.year!)<=3);
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
    }catch{/* Enrichment failure preserves official information and schedule. */}
  }
}

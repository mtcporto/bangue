const nullableString={type:['string','null']};
const nullableNumber={type:['number','null']};
const dateParameter={name:'inicio',in:'query',schema:{type:'string',format:'date'},description:'Data inicial inclusiva. Consulte um mês por requisição.'};
const parameters=[dateParameter,{...dateParameter,name:'fim',description:'Data final inclusiva.'},{name:'filme',in:'query',schema:{type:'string'},description:'ID retornado por /filmes.'}];
const pathId={name:'id',in:'path',required:true,schema:{type:'string'}};
const array=(ref:string)=>({type:'array',items:{$ref:`#/components/schemas/${ref}`}});
const envelope=(data:object)=>({type:'object',required:['meta','data'],properties:{meta:{$ref:'#/components/schemas/Meta'},data}});
const responses=(data:object)=>({
  '200':{description:'Dados do Cine Bangüê e metadados de atualização.',content:{'application/json':{schema:envelope(data)}}},
  '400':{description:'Parâmetros inválidos.'},'404':{description:'Programação, filme ou sessão não encontrado.'},
  '429':{description:'Limite de consultas; Retry-After: 60.'}
});
const spec={
  openapi:'3.1.0',
  info:{title:'Cine Bangüê — API pública',version:'1.0.0',description:'Somente Cine Bangüê. Consulte meta.verificadoEm, meta.desatualizada e warnings antes de informar horários. Fontes secundárias não criam sessões.'},
  servers:[{url:'/'}],security:[],
  paths:{
    '/api/v1/programacao':{get:{operationId:'consultarProgramacao',summary:'Sessões e dias explicitamente sem sessão',parameters,responses:responses({type:'object',required:['sessions','noSessionDates'],properties:{sessions:array('Session'),noSessionDates:{type:'array',items:{type:'string',format:'date'}}}})}},
    '/api/v1/filmes':{get:{operationId:'listarFilmes',summary:'Filmes com sessões na grade',parameters,responses:responses(array('Film'))}},
    '/api/v1/filmes/{id}':{get:{operationId:'detalharFilme',summary:'Ficha de filme e sessões',parameters:[pathId,...parameters],responses:responses({allOf:[{$ref:'#/components/schemas/Film'},{type:'object',required:['sessions'],properties:{sessions:array('Session')}}]})}},
    '/api/v1/sessoes/{id}':{get:{operationId:'detalharSessao',summary:'Uma sessão da programação',parameters:[pathId],responses:responses({$ref:'#/components/schemas/Session'})}},
    '/api/v1/calendario':{get:{operationId:'exportarCalendario',summary:'Calendário iCalendar',parameters,responses:{'200':{description:'Calendário iCalendar; sessões divergentes são TENTATIVE.',content:{'text/calendar':{schema:{type:'string'}}}}}}}
  },
  components:{schemas:{
    Meta:{type:'object',required:['cinema','timezone','periodo','verificadoEm','desatualizada','fonte'],properties:{cinema:{type:'string',const:'Cine Bangüê'},timezone:{type:'string',const:'America/Fortaleza'},periodo:{type:'string',pattern:'^\\d{4}-\\d{2}$'},verificadoEm:{type:'string',format:'date-time'},desatualizada:{type:'boolean'},contingencia:{type:'boolean'},fonte:{type:'string',format:'uri'},divergenciasPendentes:{type:'integer'},armazenamento:{type:'string',enum:['turso','snapshot']}}},
    Film:{type:'object',required:['id','title','sourceUrl'],properties:{id:{type:'string'},title:{type:'string'},director:nullableString,year:nullableNumber,duration:{...nullableNumber,description:'Minutos informados pela FUNESC.'},rating:nullableString,synopsis:nullableString,country:nullableString,genre:nullableString,poster:nullableString,backdrop:nullableString,trailer:{anyOf:[{type:'object',required:['youtubeId','url','title','language','sourceUrl'],properties:{youtubeId:{type:'string',pattern:'^[A-Za-z0-9_-]{11}$'},url:{type:'string',format:'uri'},title:{type:'string'},language:{type:'string'},sourceUrl:{type:'string',format:'uri'}}},{type:'null'}]},tmdbId:nullableNumber,sourceUrl:{type:'string',format:'uri'}}},
    Session:{type:'object',required:['id','venue','date','time','startsAt','title','filmId','kind','needsReview','warnings'],properties:{id:{type:'string'},venue:{type:'string',const:'Cine Bangüê'},date:{type:'string',format:'date'},time:{type:'string',pattern:'^([01]\\d|2[0-3]):[0-5]\\d$'},startsAt:{type:'string',format:'date-time'},title:{type:'string'},filmId:nullableString,kind:{type:'string',enum:['film','shorts']},debate:{type:'boolean'},accessible:{type:'boolean'},children:{type:'boolean'},free:{type:'boolean'},price:{type:'object',properties:{full:nullableNumber,half:nullableNumber}},sourceUrl:{type:'string',format:'uri'},sourceText:{type:'string'},needsReview:{type:'boolean'},warnings:{type:'array',items:{type:'object',required:['code','message'],properties:{code:{type:'string'},message:{type:'string'}}}},film:{anyOf:[{$ref:'#/components/schemas/Film'},{type:'null'}]}}}
  }}
};
export function GET(){return Response.json(spec,{headers:{'Cache-Control':'public, max-age=3600','Access-Control-Allow-Origin':'*'}});}

import { mcpHandler } from '@/lib/mcp';
import { allowed, apiError } from '@/lib/api';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function POST(request:Request) {
  if(!await allowed(request))return apiError('Limite de consultas atingido.',429);
  const response=await mcpHandler.fetch(request);
  response.headers.set('Access-Control-Allow-Origin','*');
  response.headers.set('Cache-Control','no-store');
  return response;
}
export function GET(){return new Response('Use Streamable HTTP POST neste endpoint MCP.',{status:405,headers:{Allow:'POST, OPTIONS','Access-Control-Allow-Origin':'*'}});}
export function OPTIONS(){return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id, Mcp-Method, Mcp-Name, Mcp-Client-Info, Mcp-Server-Info, Mcp-Protocol-Version','Access-Control-Expose-Headers':'MCP-Protocol-Version, MCP-Session-Id'}});}

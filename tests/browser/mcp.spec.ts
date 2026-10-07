import { test,expect } from '@playwright/test';
import { Client,StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
test('MCP SDK discovers read-only tools, queries exact venue and reports unavailable months',async()=>{
  const client=new Client({name:'bangue-test',version:'1.0.0'});
  const transport=new StreamableHTTPClientTransport(new URL(`${process.env.TEST_BASE_URL||'http://localhost:3000'}/mcp`));
  try{
    await client.connect(transport);
    const tools=await client.listTools();expect(tools.tools).toHaveLength(4);expect(tools.tools.every(t=>t.annotations?.readOnlyHint)).toBeTruthy();
    const response=await client.callTool({name:'consultar_programacao',arguments:{inicio:'2026-10-07',fim:'2026-10-07'}});
    const payload=response.structuredContent as {meta:{cinema:string};sessions:{venue:string}[]};
    expect(payload.meta.cinema).toBe('Cine Bangüê');expect(payload.sessions).toHaveLength(3);expect(payload.sessions.every(s=>s.venue==='Cine Bangüê')).toBeTruthy();
    const missing=await client.callTool({name:'consultar_programacao',arguments:{inicio:'2026-11-01'}});expect(missing.isError).toBeTruthy();
    const film=await client.callTool({name:'detalhar_filme',arguments:{id:'ran'}});expect(film.isError).not.toBeTruthy();
    const resources=await client.listResources();expect(resources.resources[0].uri).toBe('bangue://programacao');
    const resource=await client.readResource({uri:'bangue://programacao'});expect(resource.contents).toHaveLength(1);
  }finally{await client.close();}
});
test('MCP supports legacy initialize/tools calls and exposes machine-readable docs',async({request})=>{
  const headers={'Content-Type':'application/json','Accept':'application/json, text/event-stream','MCP-Protocol-Version':'2025-03-26'};
  const initialize=await request.post('/mcp',{headers,data:{jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'legacy-test',version:'1'}}}});
  expect(initialize.status()).toBe(200);expect(await initialize.text()).toContain('cine-bangue');
  const tools=await request.post('/mcp',{headers,data:{jsonrpc:'2.0',id:2,method:'tools/list',params:{}}});expect(tools.status()).toBe(200);expect(await tools.text()).toContain('consultar_programacao');
  const spec=await request.get('/api/v1/openapi');expect((await spec.json()).openapi).toBe('3.1.0');
  const llms=await request.get('/llms.txt');expect(await llms.text()).toContain('Cine Bangüê');
});

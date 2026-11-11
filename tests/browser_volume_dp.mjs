// Optional dynamic format bounded read regression; requires a server and Chromium CDP.
const tabs=await (await fetch((process.env.CDP_URL||'http://127.0.0.1:9223')+'/json/list')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.onopen=r);
let id=0;const pending=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}};
const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
await send('Emulation.setDeviceMetricsOverride',{width:1500,height:1100,deviceScaleFactor:1,mobile:false});
await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
await send('Page.navigate',{url:process.env.VISUALIZER_URL||'http://127.0.0.1:8000'});
for(let i=0;i<100;i++){if(await evaluate("!!document.getElementById('examples')?.querySelector('option[value=linked-reverse]')"))break;await new Promise(r=>setTimeout(r,100));}
const source="int main(){int paths[2][3][3]={0};for(int z=0;z<2;z++)for(int y=0;y<3;y++)for(int x=0;x<3;x++){if(z==0&&y==0&&x==0)paths[z][y][x]=1;else paths[z][y][x]=(z?paths[z-1][y][x]:0)+(y?paths[z][y-1][x]:0)+(x?paths[z][y][x-1]:0);}printf(\"%d\",paths[1][2][2]);}";
await evaluate(`document.getElementById('code').value=${JSON.stringify(source)};document.getElementById('code').dispatchEvent(new Event('input'));document.getElementById('run').click()`);
for(let i=0;i<100;i++){if(await evaluate("!document.getElementById('run').disabled"))break;await new Promise(r=>setTimeout(r,100));}
await evaluate("move(steps.findIndex(s=>s.event==='write'&&s.writes.some(a=>a.value===30&&a.array)))");
const detail=await evaluate("({output:steps.at(-1).output,blocks:[...document.querySelectorAll('.matrix-block')].map(x=>x.dataset.name),cells:document.querySelectorAll('.matrix-cell').length,highlight:[...document.querySelectorAll('.matrix-cell.changed')].map(x=>x.textContent)})");
if(detail.output!=='30'||detail.blocks.join(',')!=='paths[0],paths[1]'||detail.cells!==18||!detail.highlight.includes('30'))throw Error(JSON.stringify(detail));
await evaluate("document.getElementById('prev').click();document.getElementById('next').click()");
console.log(JSON.stringify({detail,playback:'passed'}));ws.close();

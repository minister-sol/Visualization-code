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
const source="int main(){unsigned int reachable[4]={2u,4u,1u,0u};for(int via=0;via<4;via++)for(int from=0;from<4;from++)if(reachable[from]&(1u<<via))reachable[from]|=reachable[via];for(int i=0;i<4;i++)printf(\"%u \",reachable[i]);}";
await evaluate(`document.getElementById('code').value=${JSON.stringify(source)};document.getElementById('code').dispatchEvent(new Event('input'));document.getElementById('run').click()`);
for(let i=0;i<100;i++){if(await evaluate("!document.getElementById('run').disabled"))break;await new Promise(r=>setTimeout(r,100));}
await evaluate("move(steps.findIndex(s=>s.event==='write'&&s.writes.some(a=>a.index===0&&a.value===7)));document.getElementById('bitVariable').value='reachable[0]';document.getElementById('bitVariable').dispatchEvent(new Event('change',{bubbles:true}))");
const detail=await evaluate("({output:steps.at(-1).output,highlight:[...document.querySelectorAll('.array-block[data-name=reachable] .bar.changed')].map(x=>x.textContent),bits:document.getElementById('integerBits').textContent,pattern:document.querySelector('.bit-pattern')?.textContent.replaceAll(' ','')})");
if(detail.output!=='7 7 7 0 '||!detail.highlight.includes('7')||!detail.bits.includes('十进制 7')||detail.pattern!=='00000000000000000000000000000111')throw Error(JSON.stringify(detail));
await evaluate("document.getElementById('prev').click();document.getElementById('next').click()");
console.log(JSON.stringify({detail,playback:'passed'}));ws.close();

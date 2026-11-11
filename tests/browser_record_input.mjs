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
const source="#include <inttypes.h>\nint main(){char label[3];int64_t value;int used;int count=scanf(\"%3c:%\" SCNd64 \"%%%n\",label,&value,&used);printf(\"%.*s %\" PRId64 \" %d %d\",3,label,value,used,count);}";
await evaluate(`document.getElementById('code').value=${JSON.stringify(source)};document.getElementById('code').dispatchEvent(new Event('input'));document.getElementById('stdin').value='abc:12345%';document.getElementById('run').click()`);
for(let i=0;i<100;i++){if(await evaluate("!document.getElementById('run').disabled"))break;await new Promise(r=>setTimeout(r,100));}
await evaluate("move(steps.findIndex(s=>s.event==='input'&&s.writes.some(a=>a.value===99&&a.index===2)))");
const detail=await evaluate("({error:document.getElementById('error').hidden?'':document.getElementById('error').textContent,output:steps.at(-1).output,cells:[...document.querySelectorAll('.array-block[data-name=label] .bar')].map(x=>x.textContent),highlight:[...document.querySelectorAll('.array-block[data-name=label] .bar.changed')].map(x=>x.textContent),consumed:steps.at(-1).input.position})");
if(detail.error||detail.output!=='abc 12345 10 2'||detail.cells.join(',')!=='a (97),b (98),c (99)'||!detail.highlight.includes('c (99)')||detail.consumed!==10)throw Error(JSON.stringify(detail));
await evaluate("document.getElementById('prev').click();document.getElementById('next').click()");
console.log(JSON.stringify({detail,playback:'passed'}));ws.close();

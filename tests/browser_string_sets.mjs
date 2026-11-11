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
const source='int main(){char text[]="12,tail";printf("%zu",strcspn(text,","));}';
await evaluate(`document.getElementById('code').value=${JSON.stringify(source)};document.getElementById('code').dispatchEvent(new Event('input'));document.getElementById('run').click()`);
for(let i=0;i<100;i++){if(await evaluate("!document.getElementById('run').disabled"))break;await new Promise(r=>setTimeout(r,100));}
const result=await evaluate("({error:document.getElementById('error').hidden?'':document.getElementById('error').textContent,output:steps.at(-1)?.output})");
if(result.error||result.output!=='2')throw Error(JSON.stringify(result));
await evaluate("move(steps.findIndex(s=>s.event==='read'&&s.expression.startsWith('strcspn(')&&s.reads.some(a=>a.name==='text'&&a.index===2)))");
const detail=await evaluate("({text:document.getElementById('accesses').textContent,highlight:[...document.querySelectorAll('.array-block[data-name=text] .bar.read')].map(x=>x.textContent),indices:steps.filter(s=>s.event==='read'&&s.expression.startsWith('strcspn(')).flatMap(s=>s.reads.filter(a=>a.name==='text').map(a=>a.index))})");
if(!detail.text.includes('text[2]')||!detail.highlight.includes(', (44)')||detail.indices.join(',')!=='0,1,2')throw Error(JSON.stringify(detail));
await evaluate("document.getElementById('prev').click();document.getElementById('next').click()");
if(!await evaluate("document.getElementById('accesses').textContent.includes('text[2]')"))throw Error('replay lost bounded read');
console.log(JSON.stringify({result,detail,playback:'passed'}));ws.close();

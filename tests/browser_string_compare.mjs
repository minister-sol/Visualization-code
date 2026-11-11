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
const source='int main(){char a[]="abTAIL";char b[]="acOTHER";printf("%d",strcmp(a,b)<0);}';
await evaluate(`document.getElementById('code').value=${JSON.stringify(source)};document.getElementById('code').dispatchEvent(new Event('input'));document.getElementById('run').click()`);
for(let i=0;i<100;i++){if(await evaluate("!document.getElementById('run').disabled"))break;await new Promise(r=>setTimeout(r,100));}
const result=await evaluate("({error:document.getElementById('error').hidden?'':document.getElementById('error').textContent,output:steps.at(-1)?.output})");
if(result.error||result.output!=='1')throw Error(JSON.stringify(result));
await evaluate("document.getElementById('historyFilter').value='compare';document.getElementById('historyFilter').dispatchEvent(new Event('change'));document.querySelectorAll('#historyList [data-step]')[1].click()");
if(!await evaluate("document.querySelectorAll('#historyList [data-step]').length===2&&steps[position].event==='compare'&&steps[position].reads.every(a=>a.index===1)"))throw Error('comparison history filter/navigation mismatch');
await evaluate("move(steps.findIndex(s=>s.event==='compare'&&s.expression==='strcmp(a, b)'&&s.reads.some(a=>a.index===1)))");
const detail=await evaluate("({text:document.getElementById('accesses').textContent,left:[...document.querySelectorAll('.array-block[data-name=a] .bar.compare')].map(x=>x.textContent),right:[...document.querySelectorAll('.array-block[data-name=b] .bar.compare')].map(x=>x.textContent),compares:steps.filter(s=>s.event==='compare'&&s.expression==='strcmp(a, b)').length})");
if(detail.compares!==2||detail.left.join(',')!=='b (98)'||detail.right.join(',')!=='c (99)')throw Error(JSON.stringify(detail));
await evaluate("document.getElementById('prev').click();document.getElementById('next').click()");
if(!await evaluate("document.querySelectorAll('.bar.compare').length===2"))throw Error('comparison replay mismatch');
console.log(JSON.stringify({result,detail,playback:'passed'}));ws.close();

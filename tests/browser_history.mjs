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
const source='int main(){int sum=0;for(int i=0;i<40;i++)sum+=i;printf("%d",sum);}';
await evaluate(`document.getElementById('code').value=${JSON.stringify(source)};document.getElementById('code').dispatchEvent(new Event('input'));document.getElementById('run').click()`);
for(let i=0;i<100;i++){if(await evaluate("!document.getElementById('run').disabled"))break;await new Promise(r=>setTimeout(r,100));}
const result=await evaluate("({error:document.getElementById('error').hidden?'':document.getElementById('error').textContent,output:steps.at(-1)?.output})");
if(result.error||result.output!=='780')throw Error(JSON.stringify(result));
await evaluate("document.getElementById('historyFilter').value='all';document.getElementById('historyFilter').dispatchEvent(new Event('change'));move(steps.length-1);document.getElementById('historyLocate').click()");
const final=await evaluate("({selected:Number(document.querySelector('#historyList [aria-current=step]')?.dataset.step),position,page:document.getElementById('historyCount').textContent})");
if(final.selected!==final.position||final.position<60)throw Error(JSON.stringify(final));
await evaluate("move(0);document.getElementById('historyLocate').click()");
const first=await evaluate("({selected:Number(document.querySelector('#historyList [aria-current=step]')?.dataset.step),first:Number(document.querySelector('#historyList [data-step]')?.dataset.step),position})");
if(first.position!==0||first.first!==0||first.selected!==0)throw Error(JSON.stringify(first));
console.log(JSON.stringify({result,final,first}));ws.close();

// Optional value-change navigation regression; requires a server and Chromium CDP.
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
const fixture={"code": "int main(){int value=0;int data[2]={0};value=1;data[1]=7;value=2;printf(\"%d\",value+data[1]);}", "expected": "9"};
await evaluate(`document.getElementById('code').value=${JSON.stringify(fixture.code)};document.getElementById('code').dispatchEvent(new Event('input'));document.getElementById('run').click()`);
for(let i=0;i<100;i++){if(await evaluate("!document.getElementById('run').disabled"))break;await new Promise(r=>setTimeout(r,100));}
const result=await evaluate("({error:document.getElementById('error').hidden?'':document.getElementById('error').textContent,steps:steps.length,output:steps.at(-1)?.output})");
if(result.error||result.output!==fixture.expected||!result.steps)throw Error(JSON.stringify(result));
await evaluate("move(steps.length-1)");
await new Promise(r=>setTimeout(r,700));
await evaluate("move(steps.findIndex(s=>s.variables.value===0&&Array.isArray(s.variables.data)));watchPath='value';renderWatch(steps[position]);document.getElementById('nextValueChange').click()");
const first=await evaluate("({value:vars(steps[position]).value,event:steps[position].event})");
if(first.value!==1||first.event!=='write')throw Error(JSON.stringify(first));
await evaluate("document.getElementById('nextValueChange').click()");
if(await evaluate("vars(steps[position]).value")!==2)throw Error('second value change missing');
const stopped=await evaluate("position");await evaluate("document.getElementById('nextValueChange').click()");
if(await evaluate("position")!==stopped||!await evaluate("document.getElementById('watchStatus').textContent.includes('没有找到')"))throw Error('no-change navigation moved');
await evaluate("move(steps.findIndex(s=>s.variables.value===0&&Array.isArray(s.variables.data)));document.getElementById('watchPath').value='data[1]';document.getElementById('watchPath').dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('nextValueChange').click()");
const detail=await evaluate("({path:watchPath,value:vars(steps[position]).data[1],event:steps[position].event,status:document.getElementById('watchStatus').textContent})");
if(detail.value!==7||detail.event!=='write'||detail.path!=='data[1]')throw Error(JSON.stringify(detail));
await evaluate("move(steps.length-1);document.getElementById('prev').click();document.getElementById('next').click()");
console.log(JSON.stringify({result,detail,playback:'forward/backward passed'}));ws.close();

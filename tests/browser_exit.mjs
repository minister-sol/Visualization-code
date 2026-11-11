// Optional early program termination regression; requires a server and Chromium CDP.
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
const fixture={"code": "#include <stdlib.h>\nint visits=0;void find(int depth){visits++;if(depth==3){printf(\"%d %d\",depth,visits);exit(7);}find(depth+1);visits=99;}int main(){find(0);printf(\"unreachable\");}", "expected": "3 4"};
await evaluate(`document.getElementById('code').value=${JSON.stringify(fixture.code)};document.getElementById('code').dispatchEvent(new Event('input'));document.getElementById('run').click()`);
for(let i=0;i<100;i++){if(await evaluate("!document.getElementById('run').disabled"))break;await new Promise(r=>setTimeout(r,100));}
await evaluate("move(steps.length-1)");
const result=await evaluate("({error:document.getElementById('error').hidden?'':document.getElementById('error').textContent,output:steps.at(-1)?.output,final:steps.at(-1),description:document.getElementById('description').textContent})");
if(result.error||result.output!==fixture.expected||result.final.exit_code!==7||result.final.variables.visits!==4||result.final.stack.length||!result.description.includes('退出码 7'))throw Error(JSON.stringify(result));
await evaluate("move(steps.findIndex(s=>s.event==='terminate'))");
const detail=await evaluate("({event:document.getElementById('event').textContent,depth:steps[position].stack.length,visits:steps[position].variables.visits})");
if(detail.event!=='结束程序'||detail.depth!==5||detail.visits!==4)throw Error(JSON.stringify(detail));
await evaluate("move(steps.length-1);document.getElementById('prev').click();document.getElementById('next').click()");
console.log(JSON.stringify({output:result.output,exitCode:result.final.exit_code,detail,playback:'forward/backward passed'}));ws.close();

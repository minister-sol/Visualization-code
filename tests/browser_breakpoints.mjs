// Optional replay breakpoint regression; requires a server and Chromium CDP.
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
const fixture={"code": "int main(){\nint total=0;\nfor(int cursor=0;cursor<3;cursor++){\ntotal+=cursor;\n}\nprintf(\"%d\",total);\n}", "expected": "3"};
await evaluate(`document.getElementById('code').value=${JSON.stringify(fixture.code)};document.getElementById('code').dispatchEvent(new Event('input'));document.querySelector('#numbers [data-source-line=\"4\"]').click();document.getElementById('run').click()`);
for(let i=0;i<100;i++){if(await evaluate("!document.getElementById('run').disabled"))break;await new Promise(r=>setTimeout(r,100));}
const result=await evaluate("({error:document.getElementById('error').hidden?'':document.getElementById('error').textContent,steps:steps.length,output:steps.at(-1)?.output})");
if(result.error||result.output!==fixture.expected||!result.steps)throw Error(JSON.stringify(result));
await evaluate("move(0)");
const hits=[];
for(let repeat=0;repeat<3;repeat++){await evaluate("document.getElementById('continueBreakpoint').click()");hits.push(await evaluate("({position,line:steps[position].line,cursor:vars(steps[position]).cursor})"));}
if(hits.some(hit=>hit.line!==4)||hits.map(hit=>hit.cursor).join(',')!=='0,1,2')throw Error(JSON.stringify(hits));
await evaluate("move(0);document.getElementById('speed').add(new Option('test','1'));document.getElementById('speed').value='1';document.getElementById('play').click()");
for(let i=0;i<100;i++){if(await evaluate("timer===null"))break;await new Promise(r=>setTimeout(r,50));}
const detail=await evaluate("({line:steps[position].line,paused:timer===null,pressed:document.querySelector('#numbers [data-source-line=\"4\"]').getAttribute('aria-pressed'),hits:"+JSON.stringify(hits)+"})");
if(detail.line!==4||!detail.paused||detail.pressed!=='true')throw Error(JSON.stringify(detail));
await evaluate("move(steps.length-1);document.getElementById('prev').click();document.getElementById('next').click()");
await evaluate("document.getElementById('code').dispatchEvent(new Event('input'))");
if(await evaluate("breakpoints.size")!==0)throw Error('old breakpoints survived edit');
console.log(JSON.stringify({result,detail,playback:'forward/backward passed'}));ws.close();

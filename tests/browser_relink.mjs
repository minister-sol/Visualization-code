// Optional byte access rendering regression; requires a server and Chromium CDP.
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
const source="struct Cell{int payload;struct Cell *forward;struct Cell *back;};int main(){struct Cell pool[3]={{1,&pool[1],&pool[2]},{2,&pool[2],&pool[0]},{3,&pool[0],&pool[1]}};struct Cell *removed=&pool[1];removed->back->forward=removed->forward;removed->forward->back=removed->back;printf(\"%d %d\",pool[0].forward->payload,pool[2].back->payload);}";
await evaluate(`document.getElementById('code').value=${JSON.stringify(source)};document.getElementById('code').dispatchEvent(new Event('input'));document.getElementById('run').click()`);
for(let i=0;i<100;i++){if(await evaluate("!document.getElementById('run').disabled"))break;await new Promise(r=>setTimeout(r,100));}
await evaluate("move(steps.findIndex(s=>s.event==='output'))");
const detail=await evaluate("({output:steps[position].output,nodes:document.querySelectorAll('#objectGraph [data-object]').length,edges:document.querySelectorAll('.reference-edge').length,objects:steps[position].objects.map(o=>({id:o.id,fields:o.fields,freed:o.freed}))})");
const objects=detail.objects.sort((a,b)=>a.fields.payload-b.fields.payload);
if(detail.output!=='3 1'||detail.nodes!==3||detail.edges!==6||objects[0].fields.forward.target!==objects[2].id||objects[2].fields.back.target!==objects[0].id||objects[1].freed)throw Error(JSON.stringify(detail));
await evaluate("document.getElementById('prev').click();document.getElementById('next').click()");
console.log(JSON.stringify({output:detail.output,nodes:detail.nodes,edges:detail.edges,playback:'passed'}));ws.close();

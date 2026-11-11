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
const source="\nstruct Item{int key;struct Item *low;struct Item *high;};\nvoid show(struct Item *node){if(node){show(node->low);printf(\"%d \",node->key);show(node->high);}}\nint main(){char text[]=\"3,1,4\";char *cursor=text;char *end;struct Item pool[3]={0};struct Item *root=0;int used=0;\nwhile(*cursor){struct Item *node=&pool[used++];node->key=(int)strtol(cursor,&end,10);struct Item **slot=&root;while(*slot){if(node->key<(*slot)->key)slot=&(*slot)->low;else slot=&(*slot)->high;}*slot=node;cursor=*end?end+1:end;}show(root);}\n";
await evaluate(`document.getElementById('code').value=${JSON.stringify(source)};document.getElementById('code').dispatchEvent(new Event('input'));document.getElementById('run').click()`);
for(let i=0;i<100;i++){if(await evaluate("!document.getElementById('run').disabled"))break;await new Promise(r=>setTimeout(r,100));}
await evaluate("move(steps.findLastIndex(s=>s.event==='output'))");
const detail=await evaluate("({error:document.getElementById('error').hidden?'':document.getElementById('error').textContent,output:steps[position].output,nodes:document.querySelectorAll('#objectGraph [data-object]').length,edges:document.querySelectorAll('.reference-edge').length,dangling:document.querySelectorAll('.reference-edge.dangling').length})");
if(detail.error||detail.output!=='1 3 4 '||detail.nodes!==3||detail.edges!==2||detail.dangling)throw Error(JSON.stringify(detail));
await evaluate("move(steps.findIndex(s=>s.event==='write'&&s.expression==='*slot = node'&&s.writes.some(a=>a.object)))");
const rotation=await evaluate("({position,objects:steps[position].writes.map(a=>a.object),highlight:[...document.querySelectorAll('#objectGraph [data-object]')].filter(g=>g.querySelector('rect')?.getAttribute('stroke')==='#e4a845').map(g=>g.dataset.object)})");
if(rotation.position<0||!rotation.objects.some(id=>rotation.highlight.includes(id)))throw Error(JSON.stringify(rotation));
await evaluate("document.getElementById('prev').click();document.getElementById('next').click();move(steps.findLastIndex(s=>s.event==='output'))");
if(!await evaluate("document.querySelectorAll('.reference-edge').length===2"))throw Error('replay topology mismatch');
const offsets=await evaluate("steps.filter(s=>s.description==='记录整数解析结束位置').map(s=>s.result.offset)");
if(offsets.join(',')!=='1,3,5')throw Error(JSON.stringify(offsets));
console.log(JSON.stringify({detail,write:rotation,offsets,playback:'passed'}));ws.close();

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
const source="\nstruct Entry {int key;int priority;struct Entry *low;struct Entry *high;};\nstruct Entry *insert(struct Entry *root,struct Entry *node){\n if(!root)return node;\n if(node->key<root->key){\n  root->low=insert(root->low,node);\n  if(root->low->priority<root->priority){struct Entry *pivot=root->low;root->low=pivot->high;pivot->high=root;root=pivot;}\n }else{\n  root->high=insert(root->high,node);\n  if(root->high->priority<root->priority){struct Entry *pivot=root->high;root->high=pivot->low;pivot->low=root;root=pivot;}\n }\n return root;\n}\nvoid show(struct Entry *root){if(root){show(root->low);printf(\"%d \",root->key);show(root->high);}}\nint main(){struct Entry pool[5]={0};int keys[5]={4,1,5,2,3};struct Entry *root=0;srand(7);for(int i=0;i<5;i++){pool[i].key=keys[i];pool[i].priority=rand();root=insert(root,&pool[i]);}show(root);}\n";
await evaluate(`document.getElementById('code').value=${JSON.stringify(source)};document.getElementById('code').dispatchEvent(new Event('input'));document.getElementById('run').click()`);
for(let i=0;i<100;i++){if(await evaluate("!document.getElementById('run').disabled"))break;await new Promise(r=>setTimeout(r,100));}
await evaluate("move(steps.findLastIndex(s=>s.event==='output'))");
const detail=await evaluate("({error:document.getElementById('error').hidden?'':document.getElementById('error').textContent,output:steps[position].output,nodes:document.querySelectorAll('#objectGraph [data-object]').length,edges:document.querySelectorAll('.reference-edge').length,dangling:document.querySelectorAll('.reference-edge.dangling').length})");
if(detail.error||detail.output!=='1 2 3 4 5 '||detail.nodes!==5||detail.edges!==4||detail.dangling)throw Error(JSON.stringify(detail));
await evaluate("move(steps.findIndex(s=>s.event==='write'&&s.expression==='pivot->high = root'))");
const rotation=await evaluate("({position,objects:steps[position].writes.map(a=>a.object),highlight:[...document.querySelectorAll('#objectGraph [data-object]')].filter(g=>g.querySelector('rect')?.getAttribute('stroke')==='#e4a845').map(g=>g.dataset.object)})");
if(rotation.position<0||!rotation.objects.some(id=>rotation.highlight.includes(id)))throw Error(JSON.stringify(rotation));
await evaluate("document.getElementById('prev').click();document.getElementById('next').click();move(steps.findLastIndex(s=>s.event==='output'))");
if(!await evaluate("document.querySelectorAll('.reference-edge').length===4"))throw Error('replay topology mismatch');
console.log(JSON.stringify({detail,rotation,playback:'passed'}));ws.close();

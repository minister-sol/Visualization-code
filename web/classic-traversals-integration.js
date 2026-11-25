(function(root){const P=root.TraversalPreparation,R=root.R1,old={install:R.install,draw:R.draw,cancel:R.cancel,reset:R.reset,describe:R.describe,describeItems:R.describeItems,inputData:R.inputData};
const LAYOUT={nodeW:82,nodeH:46,gapX:18,gapY:74,padX:28,padY:30};
let last=null,positions=new Map(),animations=[],ghosts=[],stage=null,treeScroll=null,focus=null,lastFocus=null,zoom=1,lastTopic=null,lastViewport=null;

/* 纯布局：中序编号定 x、深度定 y，保证任意形状的树节点盒互不重叠。返回画布尺寸与各节点坐标。 */
function layoutTree(tree,rootId,opts){const o={...LAYOUT,...(opts||{})};const nodes=new Map((tree||[]).map(n=>[n.id,n]));const coords=new Map();let idx=0,maxDepth=0;
const walk=(id,depth)=>{if(id===null||id===undefined||!nodes.has(id))return;const n=nodes.get(id);walk(n.left,depth+1);coords.set(id,{x:o.padX+idx*(o.nodeW+o.gapX),y:o.padY+depth*(o.nodeH+o.gapY),depth});idx++;maxDepth=Math.max(maxDepth,depth);walk(n.right,depth+1);};
walk(rootId,0);
const width=o.padX*2+Math.max(idx,1)*(o.nodeW+o.gapX)-o.gapX,height=o.padY*2+(maxDepth+1)*(o.nodeH+o.gapY)-o.gapY;
return {coords,width,height,nodeW:o.nodeW,nodeH:o.nodeH,depthMax:maxDepth,count:idx};}
R.treeLayout=layoutTree;

Object.assign(R.programs,P.programs);Object.assign(R.mapping,P.mapping);R.topics=[...R.topics,...P.topics];R.install=function(c){old.install(c);for(const t of P.topics){c.code[t]=P.programs[t].c;c[t]=input=>P.trace(t,input,R.language).map(e=>({...e,state:e.tree.map(n=>n.value),indices:[],focus:e.node,teachingTopic:t}));}};
const before=R.beforeRender;R.beforeRender=()=>{before?.();if(treeScroll)stage={x:treeScroll.scrollLeft,y:treeScroll.scrollTop};};
function cancel(){for(const a of animations)a.cancel();animations=[];for(const g of ghosts)g.remove();ghosts=[];}
R.cancel=cancel;R.reset=()=>{old.reset();cancel();positions.clear();last=null;stage=null;treeScroll=null;focus=null;lastFocus=null;zoom=1;lastTopic=null;lastViewport=null;};
R.describe=e=>P.topics.includes(e.topic)?e.variables.map(v=>`${v.name} = ${v.value}：${v.meaning}；${v.graphic}`).join('；'):old.describe(e);
R.describeItems=e=>P.topics.includes(e.topic)?e.variables.map(v=>({name:String(v.name),value:String(v.value),meaning:v.meaning,graphic:v.graphic})):(old.describeItems?old.describeItems(e):[]);
R.inputData=(t,i)=>P.topics.includes(t)?P.inputData(i):old.inputData(t,i);

R.draw=function(e,host,animate){animate=animate===undefined?R.animateNow:animate;if(!P.topics.includes(e.topic))return old.draw(e,host,animate);cancel();
const prevRects=new Map(),prevText=new Map();
if(animate&&lastViewport&&typeof lastViewport.getBoundingClientRect==='function'){const vr=lastViewport.getBoundingClientRect();for(const el of lastViewport.querySelectorAll('.r3-chip')){const r=el.getBoundingClientRect();prevRects.set(el.dataset.objectId,{x:r.left-vr.left,y:r.top-vr.top});prevText.set(el.dataset.objectId,el.textContent);}}
if(lastTopic!==e.topic){zoom=1;lastTopic=e.topic;}
// Compact node boxes keep the default five-node example readable in a phone panel.
const compact = host.clientWidth > 0 && host.clientWidth <= 560;
const treeSpacing = compact ? {nodeW:52,gapX:7,padX:8} : LAYOUT;
const ns='http://www.w3.org/2000/svg',layout=layoutTree(e.tree,e.root,treeSpacing),{coords,width,height,nodeW,nodeH}=layout;
const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.setAttribute('width',width);svg.setAttribute('height',height);svg.setAttribute('role','img');svg.setAttribute('aria-label','树的遍历：树是主图，调用栈或队列与已输出分区在右侧');
const add=(tag,attrs,text,parent=svg)=>{const n=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,''+v);if(text!==undefined)n.textContent=text;parent.append(n);return n;};
const nodes=new Map(e.tree.map(n=>[n.id,n]));
for(const n of e.tree){const p=coords.get(n.id);for(const k of ['left','right'])if(n[k]!==null&&coords.has(n[k])){const t=coords.get(n[k]);add('line',{x1:p.x+nodeW/2,y1:p.y+nodeH,x2:t.x+nodeW/2,y2:t.y,stroke:'currentColor','stroke-width':1});add('text',{x:(p.x+t.x)/2+nodeW/2,y:(p.y+t.y)/2+nodeH,fill:'currentColor','font-size':13,'text-anchor':'middle'},k==='left'?'L':'R');}}
const next=new Map();
function treeItem(id,x,y,highlight){const n=nodes.get(id);const g=add('g',{'data-object-id':'tree-'+id,transform:`translate(${x} ${y})`});add('rect',{width:nodeW,height:nodeH,rx:5,fill:'var(--r3-node-fill,#dbeafe)',stroke:'currentColor','stroke-width':highlight?3.5:1},undefined,g);add('text',{x:8,y:21,fill:'var(--r3-node-text,#17263b)','font-size':15,'font-weight':700,'font-family':'inherit'},String(n.value),g);add('text',{x:8,y:37,fill:'var(--r3-node-text,#17263b)','font-size':13,'font-family':'inherit'},'节点 '+id,g);if(highlight)add('rect',{x:-3,y:-3,width:nodeW+6,height:nodeH+6,rx:7,fill:'none',stroke:'var(--r3-focus-stroke,#a56100)','stroke-width':2,'stroke-dasharray':'4 3'},undefined,g);next.set('tree-'+id,{x,y,kind:'tree'});
const prev=positions.get('tree-'+id);if(animate&&!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches&&g.animate&&prev&&(prev.x!==x||prev.y!==y))animations.push(g.animate([{transform:`translate(${prev.x}px,${prev.y}px)`},{transform:`translate(${x}px,${y}px)`}],{duration:420}));return g;}
for(const n of e.tree){const p=coords.get(n.id);treeItem(n.id,p.x,p.y,e.node===n.id);}

const viewport=document.createElement('div');viewport.className='r3-preparation-viewport r3-trav-stage';
const main=document.createElement('div');main.className='r3-trav-main';
const bar=document.createElement('div');bar.className='r3-zoom-bar';
const mkBtn=(label,title,fn)=>{const b=document.createElement('button');b.type='button';b.className='r3-zoom-btn';b.textContent=label;b.title=title;b.setAttribute('aria-label',title);b.addEventListener('click',fn);bar.append(b);return b;};
const scroller=document.createElement('div');scroller.className='r3-trav-tree';scroller.tabIndex=0;scroller.setAttribute('aria-label','树主图，可滚动');
const zoomer=document.createElement('div');zoomer.className='r3-trav-canvas';zoomer.append(svg);scroller.append(zoomer);main.append(bar,scroller);

function applyZoom(fit){const innerW=scroller.clientWidth||main.clientWidth||600;const capH=innerW<620?420:560;
 if(fit)zoom=Math.max(.3,Math.min(1,(innerW-10)/width,(capH-10)/height));
 scroller.style.height=Math.max(318,Math.min(capH+14,height*zoom+20))+'px';
 zoomer.style.width=Math.round(width*zoom)+'px';zoomer.style.height=Math.round(height*zoom)+'px';svg.style.transformOrigin='0 0';svg.style.transform=`scale(${zoom})`;svg.style.width=width+'px';svg.style.height=height+'px';
 bar.dataset.zoom=String(Math.round(zoom*100));}
function focusIntoView(){const key=focus;if(!key)return;
 if(key.startsWith('tree-')){const p=coords.get(Number(key.slice(5)));if(!p)return;const cw=scroller.clientWidth,ch=scroller.clientHeight;
 const cx=(p.x+nodeW/2)*zoom,cy=(p.y+nodeH/2)*zoom;
 scroller.scrollLeft=Math.max(0,cx-cw/2);scroller.scrollTop=Math.max(0,cy-ch/2);return;}
 const el=viewport.querySelector(`[data-object-id="${key}"]`);if(!el)return;const wrap=el.closest('.r3-chips');if(!wrap)return;
 const r=el.getBoundingClientRect(),b=wrap.getBoundingClientRect();
 if(r.top<b.top)wrap.scrollTop-=b.top-r.top+4;else if(r.bottom>b.bottom)wrap.scrollTop+=r.bottom-b.bottom+4;}
mkBtn('放大','放大树主图',()=>{zoom=Math.min(2.5,zoom*1.25);applyZoom(false);});
mkBtn('缩小','缩小树主图',()=>{zoom=Math.max(.4,zoom/1.25);applyZoom(false);});
mkBtn('全树','缩放到整棵树可见',()=>{applyZoom(true);});
mkBtn('回到焦点','把当前聚焦节点滚入视野',()=>{applyZoom(false);focusIntoView();});

const side=document.createElement('div');side.className='r3-trav-side';
const part=(title,note,extra)=>{const s=document.createElement('section');s.className='r3-trav-part'+(extra?' '+extra:'');const h=document.createElement('h4');h.textContent=title;s.append(h);if(note){const p=document.createElement('p');p.className='r3-trav-note';p.textContent=note;s.append(p);}const chips=document.createElement('div');chips.className='r3-chips';s.append(chips);side.append(s);return chips;};
const chip=(parent,key,text,cls)=>{const c=document.createElement('span');c.className='r3-chip'+(cls?' '+cls:'');c.dataset.objectId=key;c.textContent=text;parent.append(c);next.set(key,{kind:'chip'});return c;};

if(e.topic==='levelorder'){const chips=part('FIFO 队列',`head=${e.head} · tail=${e.tail} · 长度 ${e.queue.length}`,'r3-part-queue');
 for(let i=e.head;i<e.tail;i++){const id=e.queueSlots[i];chip(chips,'queue-'+id,`[${i}] #${id}`,i===e.head?'r3-chip-head':'');}}
else{const chips=part('调用栈','含 NULL 临时帧，栈顶在最上','r3-part-stack');
 e.frames.forEach((f,i)=>chip(chips,'frame-'+f.id,`${f.node===null?'NULL':'#'+f.node}${i===e.frames.length-1?' ← 栈顶':''}`,i===e.frames.length-1?'r3-chip-top':''));}
const outChips=part('已输出',`仅 printf 增长 · 共 ${e.visitedIds.length} 项`,'r3-part-out');
e.visitedIds.forEach((id,i)=>chip(outChips,'out-'+id,`${e.output[i]} #${id}`));

viewport.append(main,side);
const summary=document.createElement('p');summary.className='r3-trav-summary';summary.textContent='输出 ['+e.output.join(', ')+']；'+(e.topic==='levelorder'?'待处理FIFO ['+e.queue.map(id=>'#'+id).join(', ')+'] head='+e.head+' tail='+e.tail:'调用栈 ['+e.stack.map(id=>id===null?'NULL':'#'+id).join(' → ')+']');
host.replaceChildren(viewport,summary);
treeScroll=scroller;
applyZoom(false);
if(stage){scroller.scrollLeft=stage.x;scroller.scrollTop=stage.y;}
focus=e.node!==null?'tree-'+e.node:e.frames?.length?'frame-'+e.frames.at(-1).id:e.topic==='levelorder'&&e.queue.length?'queue-'+e.queue[0]:e.visitedIds.length?'out-'+e.visitedIds.at(-1):null;
if(focus&&focus.startsWith('tree-')&&(last===null||last.topic!==e.topic||last===e||focus!==lastFocus))focusIntoView();
const reduced=root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
if(animate&&!reduced&&typeof viewport.getBoundingClientRect==='function'){
 const vr=viewport.getBoundingClientRect();
 for(const c of viewport.querySelectorAll('.r3-chip')){
  const key=c.dataset.objectId,r=c.getBoundingClientRect(),cur={x:r.left-vr.left,y:r.top-vr.top};
  const prev=prevRects.get(key);
  if(prev){if(Math.hypot(prev.x-cur.x,prev.y-cur.y)>3)if(c.animate)animations.push(c.animate(R.motionPath(prev,cur,key),{duration:520,easing:'cubic-bezier(.25,.8,.3,1)'}));}
  else{const id=key.split('-')[1],el=viewport.querySelector(`[data-object-id="tree-${id}"]`);const from=el?(()=>{const s=el.getBoundingClientRect();return{x:s.left-vr.left,y:s.top-vr.top};})():{x:cur.x,y:cur.y-24};
   if(c.animate)animations.push(c.animate(R.motionPath(from,cur,key),{duration:520,easing:'cubic-bezier(.25,.8,.3,1)'}));
   if(c.animate)animations.push(c.animate([{opacity:0},{opacity:1}],{duration:240}));}
 }
 for(const [key,pos] of prevRects){
  if(viewport.querySelector(`[data-object-id="${key}"]`))continue;
  const ghost=document.createElement('span');ghost.className='r3-chip r3-chip-ghost';ghost.textContent=prevText.get(key)||'';ghost.style.left=pos.x+'px';ghost.style.top=pos.y+'px';viewport.append(ghost);
  const id=key.split('-')[1],el=viewport.querySelector(`[data-object-id="tree-${id}"]`);const dst=el?(()=>{const s=el.getBoundingClientRect();return{x:s.left-vr.left,y:s.top-vr.top};})():{x:pos.x,y:pos.y-50};
  const a=ghost.animate&&ghost.animate([{transform:'translate(0,0)',opacity:1},{transform:`translate(${dst.x-pos.x}px,${dst.y-pos.y}px)`,opacity:0}],{duration:520,easing:'ease-in'});
  if(a)animations.push(a);a.finished.then(()=>ghost.remove(),()=>{});
 }
}
lastViewport=viewport;
lastFocus=focus;root.__traversalFocusKey=focus;
for(const [key,p]of positions)if(p.kind==='tree'&&!next.has(key)&&animate){const g=add('g',{'data-exit':'true',transform:`translate(${p.x} ${p.y})`});add('text',{x:0,y:18,fill:'currentColor'},'×',g);ghosts.push(g);if(g.animate&&!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches){const a=g.animate([{opacity:1},{opacity:0}],{duration:420});if(a)animations.push(a);a.finished.then(()=>g.remove(),()=>{});}else g.remove();}
positions=next;last=e;return Promise.allSettled(animations.map(a=>a.finished));};
root.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change',e=>{if(e.matches)cancel();});
})(globalThis);

(function(root){const B=root.BubbleACPreparation,R=root.R1,old={install:R.install,draw:R.draw,cancel:R.cancel,reset:R.reset,describe:R.describe,input:R.inputData,before:R.beforeRender,range:R.rangeEnd};let traceFn=null,animations=[],positions=new Map(),wrap=null,scroll=null,focus=null,lastEvent=null;
for(const t of ['bubble','ahoCorasick']){R.programs[t]=B.programs[t];R.mapping[t]={};for(const lang of ['c','cpp'])R.mapping[t][lang]=Object.fromEntries(Object.entries(B.mapping[t][lang]).map(([n,r])=>['s'+n,r.start]));}R.topics=[...R.topics,'bubble','ahoCorasick'];
R.install=function(core){old.install(core);traceFn=B.prepare({...core},root.ClassicStrings);for(const t of ['bubble','ahoCorasick']){core.code[t]=B.programs[t].c;core[t]=input=>{let ids=[],next=0;return traceFn(t,input,R.language).map(e=>{if(t==='bubble'){if(!ids.length)ids=e.state.map(()=>next++);if(e.swap)[ids[e.swap[0]],ids[e.swap[1]]]=[ids[e.swap[1]],ids[e.swap[0]]];}return {...e,topic:t,teachingTopic:t,legacyLine:e.line,step:e.line?'s'+e.line:null,vars:{},objects:t==='bubble'?e.state.map((value,i)=>({id:ids[i],value,selected:e.indices.includes(i),sorted:e.sortedFrom!==undefined&&i>=e.sortedFrom})):[]};});};}};
R.rangeEnd=e=>{if(R.language!=='java'&&e.legacyLine&&B.mapping[e.teachingTopic]){const m=B.mapping[e.teachingTopic][R.language];return m?.[e.legacyLine]?.end;}return old.range?.(e);};
R.describe=e=>['bubble','ahoCorasick'].includes(e.teachingTopic)?e.variables.map(v=>`${v.name} = ${Array.isArray(v.value)?JSON.stringify(v.value):v.value}：${v.meaning}；图中${v.graphic}`).join('；')+(e.teachingTopic==='ahoCorasick'?'；模式编号从0开始，文本起点从0开始，重复模式分别计数，允许重叠。':''):old.describe(e);
R.inputData=(t,input)=>t==='bubble'?'命令行参数：'+input.trim().replace(/[,，\s]+/g,' '):t==='ahoCorasick'?'命令行参数：'+input.split(/\r?\n/).map(r=>JSON.stringify(r.replace(/^(text|pattern) ?/,''))).join(' '):old.input(t,input);
R.beforeRender=()=>{old.before?.();if(wrap)scroll={x:wrap.scrollLeft,y:wrap.scrollTop};};function cancel(){old.cancel();for(const a of animations)a.cancel();animations=[];}R.cancel=cancel;R.reset=()=>{old.reset();cancel();positions.clear();wrap=null;scroll=null;focus=null;};
R.draw=function(e,host,animate){if(e.teachingTopic!=='ahoCorasick')return old.draw(e,host,animate);cancel();
const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),points=new Map();
const nodes=e.nodesSnapshot,N=nodes.length;
const children=nodes.map(n=>Object.entries(n.next));
const parent=new Array(N).fill(-1);children.forEach((cs,i)=>cs.forEach(([,to])=>parent[to]=i));
const depth=new Array(N).fill(0);(function dfs(id,d){depth[id]=d;for(const [,to] of children[id])dfs(to,d+1);})(0,0);
const colW=92,rowH=76,padX=24,laneX=40,padY=24,boxW=78,boxH=34;
const pos=new Array(N);let leaf=0;(function sweep(id){const cs=children[id];if(!cs.length){pos[id]=leaf++;}else{cs.forEach(([,to])=>sweep(to));pos[id]=(pos[cs[0][1]]+pos[cs.at(-1)[1]])/2;}})(0);
const cx=id=>padX+laneX+pos[id]*colW+colW/2, cy=id=>padY+depth[id]*rowH+boxH/2;
const width=Math.max(260,padX*2+laneX+leaf*colW),maxDepth=Math.max(...depth,0),height=(maxDepth+1)*rowH+padY*2+34;
svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.setAttribute('width',width);svg.setAttribute('height',height);svg.setAttribute('style','max-width:100%;height:auto');
svg.setAttribute('role','img');svg.setAttribute('aria-label','AC Trie、已建立失败链接与当前状态');
const add=(tag,attrs,text,parent=svg)=>{const n=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,''+v);if(text!==undefined)n.textContent=text;parent.append(n);return n;};
const defs=add('defs',{}),marker=add('marker',{id:'ac-flow-arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:5,markerHeight:5,orient:'auto'},undefined,defs);
add('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:'currentColor'},undefined,marker);
const f=e.indices[0]??0;
const related=new Set([f,nodes[f]?.fail,parent[f],...children[f].map(([,to])=>to)]);
// 转移边：父节点底边 → 子节点顶边，实线，避开节点内部
for(let id=0;id<N;id++){for(const[ch,to]of children[id]){const x1=cx(id),y1=cy(id)+boxH/2,x2=cx(to),y2=cy(to)-boxH/2;add('path',{d:`M ${x1} ${y1} L ${x2} ${y2}`,class:'ac-edge',fill:'none','marker-end':'url(#ac-flow-arrow)'});add('text',{x:(x1+x2)/2,y:(y1+y2)/2-4,class:'ac-edge-label'},ch);}}
// 失败链接：外围顶部总线 + 侧边 gutter 正交走线，避开节点与标签；仅焦点及其失败目标相关链接高亮，其余弱化
const boxes=pos.map((_,i)=>({x:cx(i)-boxW/2,y:cy(i)-boxH/2,w:boxW,h:boxH}));
const xL=padX,xR=width-padX,yTop=Math.max(6,padY-12);
const segH=(y,x1,x2,b,pad)=>{if(y<=b.y+pad||y>=b.y+b.h-pad)return false;const a=Math.min(x1,x2),c=Math.max(x1,x2);return c>b.x+pad&&a<b.x+b.w-pad;};
const segV=(x,y1,y2,b,pad)=>{if(x<=b.x+pad||x>=b.x+b.w-pad)return false;const a=Math.min(y1,y2),c=Math.max(y1,y2);return c>b.y+pad&&a<b.y+b.h-pad;};
const levelTop=d=>padY+d*rowH, rowTop=i=>levelTop(depth[i]), gapY=d=>Math.max(6,levelTop(d)-12);
function routeFail(s,t){
  const bs=boxes[s],bt=boxes[t],sLeft=cx(s)<=cx(0);
  const cands=[
    {top:true,gx:sLeft?xL:xR,sx:sLeft?bs.x:bs.x+bs.w,sy:cy(s)},
    {top:true,gx:sLeft?xR:xL,sx:sLeft?bs.x+bs.w:bs.x,sy:cy(s)},
    {top:false,gx:xL},{top:false,gx:xR},
  ];
  for(const c of cands){
    let d;
    if(c.top){ d=`M ${c.sx} ${c.sy} H ${c.gx} V ${yTop} H ${cx(t)} V ${bt.y}`; }
    else{ d=`M ${cx(s)} ${rowTop(s)} V ${gapY(depth[s])} H ${c.gx} V ${gapY(depth[t])} H ${cx(t)} V ${rowTop(t)}`; }
    let hit=false;
    for(let i=0;i<N;i++){if(i===s||i===t)continue;const b=boxes[i];
      const coll=c.top
        ? (segH(c.sy,c.sx,c.gx,b,3)||segV(c.gx,c.sy,yTop,b,3)||segH(yTop,c.gx,cx(t),b,3)||segV(cx(t),yTop,bt.y,b,3))
        : (segV(cx(s),rowTop(s),gapY(depth[s]),b,3)||segH(gapY(depth[s]),cx(s),c.gx,b,3)||segV(c.gx,gapY(depth[s]),gapY(depth[t]),b,3)||segH(gapY(depth[t]),c.gx,cx(t),b,3)||segV(cx(t),gapY(depth[t]),rowTop(t),b,3));
      if(coll){hit=true;break;}}
    if(!hit)return d;
  }
  return `M ${cx(s)-boxW/2} ${cy(s)} H ${laneX+padX} V ${cy(t)} H ${cx(t)-boxW/2}`;
}
for(let id=1;id<N;id++){const n=nodes[id];if(!n.failReady)continue;const q=n.fail;if(q===id)continue;const active=id===f||q===f;add('path',{d:routeFail(id,q),class:active?'ac-fail ac-fail-active':'ac-fail',fill:'none','stroke-dasharray':'5 4','marker-end':'url(#ac-flow-arrow)'});}
function object(key,text,id,selected){const g=add('g',{'data-object-id':key,transform:`translate(${cx(id)-boxW/2} ${cy(id)-boxH/2})`});add('rect',{width:boxW,height:boxH,rx:6,fill:'var(--r3-node-fill,#dbeafe)',stroke:selected?'#1874d1':related.has(id)?'#507190':'currentColor','stroke-width':selected?3:1.5},undefined,g);add('text',{x:boxW/2,y:boxH/2+5,'text-anchor':'middle',fill:'var(--r3-node-text,#17263b)'},text,g);const oldPos=positions.get(key)||{x:cx(id),y:cy(id)};points.set(key,{x:cx(id),y:cy(id)});if(animate&&!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches&&g.animate&&(oldPos.x!==cx(id)||oldPos.y!==cy(id)))animations.push(g.animate([{transform:`translate(${oldPos.x-boxW/2}px,${oldPos.y-boxH/2}px)`},{transform:`translate(${cx(id)-boxW/2}px,${cy(id)-boxH/2}px)`}],{duration:420}));}
for(let id=0;id<N;id++){const n=nodes[id];object('ac-node-'+id,'#'+id+(n.out.length?' *'+n.out.length:''),id,id===f);}
const sg=add('g',{'data-object-id':'ac-state',transform:`translate(${cx(f)-40} ${cy(f)+boxH/2+10})`});add('rect',{width:80,height:26,rx:6,fill:'#1874d1',stroke:'#0f4f86'},undefined,sg);add('text',{x:40,y:17,'text-anchor':'middle',fill:'#fff'},'state '+f,sg);
wrap=document.createElement('div');wrap.className='r3-preparation-viewport';wrap.style.width='100%';wrap.style.overflow='auto';wrap.style.maxHeight='32rem';wrap.tabIndex=0;wrap.append(svg);host.replaceChildren(wrap);
const summary=document.createElement('p');summary.textContent='当前焦点#'+f+'；该节点输出模式：'+(nodes[f].out.map(id=>id+':'+e.patternsSnapshot[id]).join('；')||'无');host.append(summary);
if(scroll){wrap.scrollLeft=scroll.x;wrap.scrollTop=scroll.y;}
// 按渲染后像素把焦点及当步关联节点（含失败链接目标）保持在可见区
const focusFollow=()=>{const wr=wrap.getBoundingClientRect();let l=1/0,t=1/0,r=-1/0,b=-1/0;const absorb=el=>{if(!el)return;const r2=el.getBoundingClientRect();l=Math.min(l,r2.left);t=Math.min(t,r2.top);r=Math.max(r,r2.right);b=Math.max(b,r2.bottom);};
  absorb(wrap.querySelector('[data-object-id="ac-state"]'));
  for(const i of related){const el=wrap.querySelector('[data-object-id="ac-node-'+i+'"]');absorb(el);}
  if(!Number.isFinite(l))return;
  if(t<wr.top)wrap.scrollTop+=t-wr.top-8;else if(b>wr.bottom)wrap.scrollTop+=b-wr.bottom+8;
  if(l<wr.left)wrap.scrollLeft+=l-wr.left-8;else if(r>wr.right)wrap.scrollLeft+=r-wr.right+8;};
globalThis.requestAnimationFrame?.(focusFollow);
focus=f;lastEvent=e;positions=points;return Promise.allSettled(animations.map(a=>a.finished));};
})(globalThis);

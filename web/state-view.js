(function(root){
'use strict';
function byteAccessText(access){
 if(!Number.isInteger(access?.byte_offset)||!Number.isInteger(access?.byte))return '';
 const byte=access.byte&255;
 return ` · 字节偏移 ${access.byte_offset}：${byte} (0x${byte.toString(16).padStart(2,'0')})`;
}
function character(value){
 if(value==null)return '未初始化';
 const byte=Number(value)&255,labels={0:'\\0',9:'\\t',10:'\\n',13:'\\r',32:'空格'};
 const label=labels[byte]??(byte>=33&&byte<=126?String.fromCharCode(byte):'\\x'+byte.toString(16).padStart(2,'0'));
 return `${label} (${value})`;
}
function conditionPresentation(step){
 const decision=step?.decision;
 if(decision?.assertion)return {label:'断言检查',outcome:decision.passed?'通过，继续执行':'失败，停止执行',note:`检查：${decision.expression||step.expression||''}`,branch:false};
 const parts=[];
 if(decision?.selected)parts.push(`执行：${decision.selected}`);
 if(decision?.skipped)parts.push(`未执行：${decision.skipped}`);
 if(decision&&typeof decision.right_evaluated==='boolean'&&!decision.skipped)parts.push(decision.right_evaluated?'右侧已执行':'右侧未执行');
 const expressionDecision=!!decision;
 return {label:decision?.comparison?'比较表达式':decision?.operator?'短路逻辑':decision?.selected?'三元选择':'条件判断',outcome:expressionDecision?(step?.result?'真':'假'):(step?.result?'成立，进入分支':'不成立，跳过分支'),note:parts.join(' · '),branch:!expressionDecision};
}
function branchEntered(previous,current){return previous?.event==='condition'&&previous.result!==undefined&&Boolean(previous.result)&&conditionPresentation(previous).branch&&current?.line!==previous.line;}
function valueSignature(step,path,value){
 function canonical(name,item){
  if(item?.kind==='reference')return {reference:[item.function||null,item.target||step?.arrays?.[name]?.id||item.label,item.member??null,item.offset??null,!!item.dangling]};
  if(Array.isArray(item))return item.map((child,index)=>canonical(`${name}[${index}]`,child));
  if(item&&typeof item==='object')return Object.fromEntries(Object.entries(item).map(([key,child])=>[key,canonical(name?`${name}.${key}`:key,child)]));
  return item;
 }
 return JSON.stringify(canonical(path,value));
}
function variableChanged(current,previous,name){return valueSignature(current,name,variables(current)[name])!==valueSignature(previous,name,variables(previous)[name]);}
function watchEntries(step){
 const entries={};
 function visit(path,value){
  if(value?.kind==='reference'){
   entries[path]=value;
   if(value.elements&&!value.dangling)value.elements.forEach((child,i)=>visit(`${path}[${i}]`,child));
  }else if(value&&typeof value==='object')Object.entries(value).forEach(([key,child])=>visit(Array.isArray(value)?`${path}[${key}]`:(path?`${path}.${key}`:key),child));
  else entries[path]=value;
 }
 visit('',variables(step));
 for(const object of step?.objects||[])if(!object.freed&&!object.expired)visit(object.id,object.array?Object.values(object.fields):object.fields);
 return entries;
}
function nextValueChange(steps,position,path){
 const start=steps[position];if(!start)return -1;
 const signature=step=>valueSignature(step,path,watchEntries(step)[path]);
 const context=step=>JSON.stringify(step.frames?.length&&step.frames.every(frame=>frame.id!==undefined&&frame.id!==null)?step.frames.map(frame=>frame.id):step.stack||[]);
 const root=path.match(/^[A-Za-z_]\w*/)?.[0],binding=start.bindings?.[root];
 const before=signature(start),stack=context(start),objectPath=path.startsWith('object-');
 for(let index=position+1;index<steps.length;index++){
  const step=steps[index];
  if(!objectPath){
   const candidate=step.bindings?.[root];
   if(binding&&candidate){if(binding!==candidate)continue;}
   else if(context(step)!==stack)continue;
  }
  if(signature(step)!==before)return index;
 }
 return -1;
}
function integerEntries(step){
 const result={},objects=(step?.objects||[]).filter(o=>!o.freed&&!o.expired),types=Object.assign({},step?.integers||{},...objects.map(o=>o.integers||{}));
 function walk(path,value,inherited){
  const meta=types[path]||inherited;
  if(value?.kind==='reference'){if(value.elements&&!value.dangling)walk(path,value.elements,meta);return;}
  if(Array.isArray(value)){value.forEach((child,i)=>walk(`${path}[${i}]`,child,meta));return;}
  if(value&&typeof value==='object'){Object.entries(value).forEach(([key,child])=>walk(path?`${path}.${key}`:key,child));return;}
  if(meta&&value!==null&&value!==undefined&&integerBits(value,meta.bits))result[path]={...meta,value};
 }
 walk('',variables(step));for(const object of objects)walk(object.id,object.array?Object.values(object.fields):object.fields);return result;
}
function integerBitChanges(current,previous,path){
 if(JSON.stringify(current?.stack||[])!==JSON.stringify(previous?.stack||[]))return null;
 const after=integerEntries(current)[path],before=integerEntries(previous)[path];
 if(!after||!before||after.bits!==before.bits||after.unsigned!==before.unsigned)return null;
 const a=integerBits(after.value,after.bits),b=integerBits(before.value,before.bits);
 return [...a.binary].flatMap((bit,index)=>bit===b.binary[index]?[]:[{index,position:a.binary.length-1-index,before:b.binary[index],after:bit}]);
}
function integerBits(value,bits){
 if(![1,8,16,32,64].includes(bits)||!(/^-?\d+$/.test(String(value))))return null;
 try{const number=BigInt(value),unsigned=BigInt.asUintN(bits,number);return {binary:unsigned.toString(2).padStart(bits,'0'),hex:unsigned.toString(16).padStart(Math.ceil(bits/4),'0'),decimal:number.toString()};}catch{return null;}
}
function variables(step){const values=step?.variables||{};return Array.isArray(values)?Object.fromEntries(values.map(item=>[item.name,item.value])):values;}
function arrayKind(step,name,values=[]){return step?.arrays?.[name]?.element_kind==='reference'||values.some(value=>value?.kind==='reference')?'reference':'value';}
function arrayRows(values){const result=[];
 function visit(name,value){
  if(value?.kind==='reference'){if(value.elements)visit(name,value.elements);return;}
  if(!value||typeof value!=='object')return;
  if(Array.isArray(value)){if(value.some(x=>x&&typeof x==='object'&&x.kind!=='reference'))value.forEach((x,i)=>visit(`${name}[${i}]`,x));else result.push([name,value]);}
  else Object.entries(value).forEach(([key,x])=>visit(`${name}.${key}`,x));
 }
 Object.entries(values||{}).forEach(([name,value])=>visit(name,value));return result;
}
function matrixWindow(step,name,grid,page,limit=30){
 let row=0,column=0;
 if(page){row=page.row;column=page.column;}
 else{
  const rows=new Map(grid.map((_,r)=>[step?.arrays?.[`${name}[${r}]`]?.id,r]).filter(([id])=>id));
  for(const access of [...(step?.writes||[]),...(step?.reads||[])]){
   const r=access.array?rows.get(access.array):grid.findIndex((_,i)=>access.name===`${name}[${i}]`);
   if(r===undefined||r<0||access.index===undefined)continue;
   const c=Number(access.index)-(step?.arrays?.[`${name}[${r}]`]?.offset||0);
   if(c<0||c>=grid[r].length)continue;
   row=Math.floor(r/limit);column=Math.floor(c/limit);break;
  }
 }
 const rowPages=Math.max(1,Math.ceil(grid.length/limit)),columnPages=Math.max(1,Math.ceil((grid[0]?.length||0)/limit));
 row=Math.max(0,Math.min(rowPages-1,row));column=Math.max(0,Math.min(columnPages-1,column));
 return {row,column,rowPages,columnPages,rowStart:row*limit,rowEnd:Math.min(grid.length,(row+1)*limit),columnStart:column*limit,columnEnd:Math.min(grid[0]?.length||0,(column+1)*limit)};
}
function arrayWindow(step,name,length,page,limit=60){
 const pages=Math.max(1,Math.ceil(length/limit)),meta=step?.arrays?.[name];
 if(page===undefined){
  const access=[...(step?.writes||[]),...(step?.reads||[])].find(a=>a.index!==undefined&&(meta&&a.array?a.array===meta.id:a.name===name)&&Number(a.index)-(meta?.offset||0)>=0&&Number(a.index)-(meta?.offset||0)<length);
  page=access?Math.floor((Number(access.index)-(meta?.offset||0))/limit):0;
 }
 page=Math.max(0,Math.min(pages-1,page));const start=page*limit;
 return {page,pages,start,end:Math.min(length,start+limit)};
}
function indexMarkers(step,name,index){
 const meta=step?.arrays?.[name],labels=new Set();
 for(const access of [...(step?.reads||[]),...(step?.writes||[])]){
  if(access.index_expression===undefined)continue;
  const matches=meta&&access.array?access.array===meta.id&&Number(access.index)===index+meta.offset:access.name===name&&Number(access.index)===index;
  if(matches)labels.add(access.index_expression);
 }
 return [...labels];
}
function previousElements(current,previous){
 const rows=new Map(arrayRows(variables(previous))),byIdentity=new Map();
 for(const [name,values] of rows){const meta=previous?.arrays?.[name];if(!meta)continue;let elements=byIdentity.get(meta.id);if(!elements){elements=new Map();byIdentity.set(meta.id,elements);}values.forEach((value,i)=>elements.set(i+meta.offset,value));}
 return (name,index)=>{const meta=current?.arrays?.[name];return meta?byIdentity.get(meta.id)?.get(index+meta.offset):rows.get(name)?.[index];};
}
function differences(current,previous,limit=24){
 const changes=[];
 function walk(path,before,after){
  if(changes.length>limit)return;
  if(before?.kind==='reference'||after?.kind==='reference'){
   if(valueSignature(previous,path,before)!==valueSignature(current,path,after))changes.push({path,before,after});
   if(before?.elements&&after?.elements)walk(path,before.elements,after.elements);
   return;
  }
  if(before&&after&&typeof before==='object'&&typeof after==='object'&&Array.isArray(before)===Array.isArray(after)){
   for(const key of new Set([...Object.keys(before),...Object.keys(after)]))walk(Array.isArray(after)?`${path}[${key}]`:(path?`${path}.${key}`:key),before[key],after[key]);return;
  }
  if(JSON.stringify(before)!==JSON.stringify(after))changes.push({path,before,after});
 }
 // Switching visible frames is not a mutation of their local variables.
 if(JSON.stringify(current?.stack||[])===JSON.stringify(previous?.stack||[]))walk('',variables(previous),variables(current));
 const oldObjects=new Map((previous?.objects||[]).map(o=>[o.id,o]));
 for(const object of current?.objects||[]){const old=oldObjects.get(object.id);if(!old){changes.push({path:object.id,before:undefined,after:'新对象'});if(changes.length>limit)break;continue;}walk(object.id,old.fields,object.fields);const state=x=>x.freed?'已释放':x.expired?'作用域已结束':'有效';walk(`${object.id}.状态`,state(old),state(object));if(changes.length>limit)break;}
 return {changes:changes.slice(0,limit),truncated:changes.length>limit};
}
function nextBreakpoint(steps,position,lines){
 const marked=new Set(lines);
 for(let index=position+1;index<steps.length;index++){
  const step=steps[index],prior=steps[index-1];
  if(['error','complete'].includes(step.event))return index;
  if(marked.has(step.line)&&(step.line!==prior.line||JSON.stringify(step.stack||[])!==JSON.stringify(prior.stack||[])))return index;
 }
 return Math.max(0,steps.length-1);
}
function nextSourceStep(steps,position,leave=false){
 const start=steps[position];if(!start)return 0;const depth=(start.stack||[]).length;
 for(let index=position+1;index<steps.length;index++){
  const step=steps[index],nextDepth=(step.stack||[]).length;
  if(['error','complete'].includes(step.event))return index;
  if(leave?nextDepth<depth:nextDepth<depth||(nextDepth===depth&&step.line!==start.line))return index;
 }
 return Math.max(0,steps.length-1);
}
function matrices(values){const result=[];function visit(name,value){if(!value||typeof value!=='object')return;if(value.kind==='reference'){if(value.elements)visit(name,value.elements);return;}if(Array.isArray(value)&&value.length&&value.every(row=>Array.isArray(row)&&row.length===value[0].length&&row.every(cell=>cell===null||typeof cell!=='object'||cell.kind==='reference'))){result.push([name,value]);return;}for(const [key,child] of Object.entries(value))visit(Array.isArray(value)?`${name}[${key}]`:(name?`${name}.${key}`:key),child);}visit('',values||{});return result;}
const api={byteAccessText,character,conditionPresentation,branchEntered,valueSignature,variableChanged,watchEntries,nextValueChange,nextBreakpoint,arrayKind,integerBitChanges,integerEntries,integerBits,matrixWindow,arrayWindow,indexMarkers,variables,arrayRows,previousElements,differences,nextSourceStep,matrices};if(typeof module!=='undefined')module.exports=api;else root.StateView=api;
})(globalThis);

/* Topology-driven layout: no algorithm names or source-code patterns. */
(function(root){
'use strict';
function fields(value,prefix='',out=[]){
 for(const [key,v] of Object.entries(value||{})){
  const path=prefix?(Array.isArray(value)?`${prefix}[${key}]`:`${prefix}.${key}`):key;
  if(v&&typeof v==='object'&&v.kind!=='reference')fields(v,path,out);else out.push([path,v]);
 }
 return out;
}
function displayFields(object,compact=true){
 const nulls=new Set(object.nullFields||[]),all=fields(object.fields);
 if(!compact||nulls.size<5)return all;
 return [...all.filter(([key])=>!nulls.has(key)),['其余空引用',nulls.size]];
}
function fieldText(key,value){return `${key}: ${value?.kind==='reference'?(value.dangling?'悬空 → ':'→ ')+(value.target||value.label)+(value.member!==undefined&&value.member!==null?'.'+value.member:'')+(value.offset!==undefined&&value.offset!==null?' [偏移 '+value.offset+']':''):value==null?'未初始化':String(value)}`;}
function visibleObjects(objects,variables,activeOnly=false){
 if(!activeOnly)return objects;
 const live=objects.filter(object=>!object.freed&&!object.expired),required=new Set(live.map(object=>object.id));
 const retainReferences=value=>{for(const [,reference] of fields(value))if(reference?.kind==='reference'&&reference.target)required.add(reference.target);};
 retainReferences(variables);for(const object of live)retainReferences(object.fields);
 return objects.filter(object=>required.has(object.id));
}
function accessed(accesses,id){return (accesses||[]).some(access=>access.object===id||(access.objects||[]).includes(id));}
function layout(objects,{compact=true}={}){
 const ids=new Set(objects.map(o=>o.id)),outgoing=new Map(),incoming=new Map(objects.map(o=>[o.id,0]));
 const edges=[];
 for(const obj of objects){const refs=fields(obj.fields).filter(([,v])=>v?.kind==='reference'&&ids.has(v.target));outgoing.set(obj.id,refs.map(([,v])=>v.target));for(const [field,v] of refs){incoming.set(v.target,incoming.get(v.target)+1);edges.push({from:obj.id,to:v.target,field,targetMember:v.member??null,dangling:!!v.dangling});}}
 const levels=new Map(),queue=[];
 const visit=(id,level)=>{if(levels.has(id))return;levels.set(id,level);queue.push(id);};
 for(const obj of objects)if(!incoming.get(obj.id))visit(obj.id,0);
 function drain(){for(let i=0;i<queue.length;i++){const id=queue[i];for(const target of outgoing.get(id)||[])visit(target,levels.get(id)+1);}queue.length=0;}
 drain();for(const obj of objects)if(!levels.has(obj.id)){visit(obj.id,0);drain();}
 const rows=[];for(const obj of objects){const level=levels.get(obj.id);(rows[level]??=[]).push(obj);}
 const widths=new Map(objects.map(obj=>[obj.id,Math.min(420,Math.max(205,...displayFields(obj,compact).map(([key,value])=>fieldText(key,value).length*7+24)))]));
 const rowWidth=row=>row.reduce((total,obj)=>total+widths.get(obj.id)+40,0)-40;
 const width=Math.max(720,...rows.map(row=>rowWidth(row)+80)),positions=new Map();let y=45;
 for(const row of rows){let x=(width-rowWidth(row))/2,maxHeight=0;row.forEach(obj=>{const height=Math.max(65,32+displayFields(obj,compact).length*19),nodeWidth=widths.get(obj.id);positions.set(obj.id,{x,y,height,width:nodeWidth});x+=nodeWidth+40;maxHeight=Math.max(maxHeight,height);});y+=maxHeight+80;}
 return {positions,edges,width,height:y+20};
}
const api={visibleObjects,accessed,fields,displayFields,fieldText,layout};if(typeof module!=='undefined')module.exports=api;else root.ObjectLayout=api;
})(globalThis);

(function(root){
if(!root.R1||!root.R3Preparation||!root.R3MotionPreparation)throw Error('R3 dependency load order');
const R1=root.R1,P=root.R3Preparation,old={install:R1.install,draw:R1.draw,cancel:R1.cancel,reset:R1.reset,describe:R1.describe,inputData:R1.inputData,trace:R1.trace};let traceAPI=null,motion=null,last=null;
Object.assign(R1.programs,P.programs);Object.assign(R1.mapping,P.mappings);R1.topics=[...R1.topics,...P.topics];
R1.install=function(core){old.install(core);traceAPI=P.prepare({...core});for(const topic of P.topics){core.code[topic]=P.programs[topic].c;core[topic]=input=>trace(topic,input);}};
function trace(topic,input){const base=traceAPI.trace(topic,input,'c').map(e=>({...e,indices:e.indices||[],teachingTopic:topic}));const key=R1.language==='java'?'java':R1.language==='cpp'?'cpp':'c';if(R1.mapping[topic]&&R1.mapping[topic][key]){for(const e of base){if(e.step&&R1.mapping[topic][key][e.step]!==undefined)e.line=R1.mapping[topic][key][e.step];}}return base;}
R1.trace=(topic,input)=>P.topics.includes(topic)?trace(topic,input):old.trace(topic,input);
R1.beforeRender=function(){motion?.captureScroll();};
R1.cancel=function(){old.cancel();motion?.cancel();};
R1.reset=function(){old.reset();motion?.cancel();motion=null;last=null;};
R1.describe=e=>P.topics.includes(e.teachingTopic)?P.variables(e).map(v=>`${v.name} = ${v.value}：${v.meaning}；图中${v.graphic}`).join('；'):old.describe(e);
R1.inputData=(topic,input)=>P.topics.includes(topic)?P.inputData(topic,input):old.inputData(topic,input);
R1.draw=function(event,host,animate){if(!P.topics.includes(event.teachingTopic))return old.draw(event,host,animate);if(!motion)motion=R3MotionPreparation.create(P,host);const previous=last?.topic===event.topic?last:null;const result=motion.present(event,previous,{animate,reduced:root.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false});last=event;return result.finished;};
root.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change',e=>{if(e.matches)R1.cancel();});
})(globalThis);

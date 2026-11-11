// Optional browser regression: requires a running server and Chromium CDP.
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

await evaluate(`window.originalFetch=window.fetch;window.pendingRuns=[];window.fetch=(url,options)=>url==='/api/trace'?new Promise(resolve=>pendingRuns.push({resolve,signal:options.signal})):originalFetch(url,options);
window.replyRun=(index,output)=>pendingRuns[index].resolve({ok:true,json:async()=>({steps:[{line:1,event:'complete',description:'done',variables:{},objects:[],stack:[],output}],preprocessed_source:'source '+output,output})});
document.getElementById('code').value='int main(){printf("old");}';document.getElementById('code').dispatchEvent(new Event('input'));document.getElementById('run').click();
document.getElementById('code').value='int main(){printf("new");}';document.getElementById('code').dispatchEvent(new Event('input'));document.getElementById('run').click();replyRun(0,'old');`);
await new Promise(r=>setTimeout(r,100));
const pendingState=await evaluate(`({busy:document.getElementById('run').disabled,steps:steps.length,aborted:pendingRuns[0].signal.aborted,expanded:document.getElementById('expandedSource').hidden})`);
if(!pendingState.busy||pendingState.steps!==0||!pendingState.aborted||!pendingState.expanded)throw Error(JSON.stringify(pendingState));
await evaluate(`replyRun(1,'new')`);await new Promise(r=>setTimeout(r,100));
const latest=await evaluate(`({busy:document.getElementById('run').disabled,output:steps.at(-1)?.output,source:document.getElementById('expandedCode').textContent,error:document.getElementById('error').hidden})`);
if(latest.busy||latest.output!=='new'||!latest.source.includes('source new')||!latest.error)throw Error(JSON.stringify(latest));
await evaluate(`document.getElementById('run').click();document.getElementById('stdin').value='changed';document.getElementById('stdin').dispatchEvent(new Event('input'));replyRun(2,'stale input')`);await new Promise(r=>setTimeout(r,100));
const edited=await evaluate(`({steps:steps.length,busy:document.getElementById('run').disabled,hidden:document.getElementById('expandedSource').hidden})`);
if(edited.steps||edited.busy||!edited.hidden)throw Error(JSON.stringify(edited));
await evaluate(`window.fetch=window.originalFetch`);
console.log(JSON.stringify({pendingState,latest,edited,races:'passed'}));ws.close();

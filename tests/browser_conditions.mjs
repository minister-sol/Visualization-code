// Optional condition/short-circuit/assertion rendering regression; requires a server and Chromium CDP.
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
const source='#include <assert.h>\nint main(){\nint n=1;\nassert(n);\nint flag=n||n++;\nint chosen=flag?7:9;\nif(chosen){\nn=2;\n}\nassert(n==3);\n}';
await evaluate(`document.getElementById('code').value=${JSON.stringify(source)};document.getElementById('code').dispatchEvent(new Event('input'));document.getElementById('run').click()`);
for(let i=0;i<100;i++){if(await evaluate("!document.getElementById('run').disabled"))break;await new Promise(r=>setTimeout(r,100));}
const checks=await evaluate(`(()=>{
 const result=[];
 for(const [index,step] of steps.entries())if(step.event==='condition'){
  move(index);
  result.push({index,assertion:!!step.decision?.assertion,passed:step.decision?.passed,operator:step.decision?.operator,comparison:!!step.decision?.comparison,selected:step.decision?.selected,label:document.querySelector('#evaluation .eval-label')?.textContent,text:document.getElementById('evaluation').textContent,notice:document.getElementById('stepNotice').textContent});
 }
 return result;
})()`);
const passed=checks.find(x=>x.assertion&&x.passed),failed=checks.find(x=>x.assertion&&!x.passed),logical=checks.find(x=>x.operator&&!x.comparison),ternary=checks.find(x=>x.selected);
if(!passed?.text.includes('通过，继续执行')||!failed?.text.includes('失败，停止执行')||checks.filter(x=>x.assertion).some(x=>/右侧|进入分支|跳过分支/.test(x.text)))throw Error(JSON.stringify(checks));
if(logical?.label!=='短路逻辑'||!logical.text.includes('未执行：n++')||/进入分支|跳过分支/.test(logical.text))throw Error(JSON.stringify(logical));
if(ternary?.label!=='三元选择'||!ternary.text.includes('执行：7')||!ternary.text.includes('未执行：9'))throw Error(JSON.stringify(ternary));
const comparison=checks.find(x=>x.comparison);
if(comparison?.label!=='比较表达式'||/进入分支|跳过分支/.test(comparison.text))throw Error(JSON.stringify(comparison));
if(!checks.some(x=>!x.assertion&&!x.operator&&!x.selected&&x.text.includes('成立，进入分支')))throw Error('ordinary branch outcome missing');
if(!await evaluate("document.getElementById('error').textContent.includes('断言失败')&&steps.at(-1).variables.n===2"))throw Error('failure state lost');
await evaluate("move(steps.length-1);document.getElementById('prev').click();document.getElementById('next').click()");
console.log(JSON.stringify({checks,playback:'forward/backward passed'}));ws.close();

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const [endpoint, evidence] = process.argv.slice(2);
const pages = await fetch(endpoint + '/json/list').then(response => response.json());
const socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, {once: true});
  socket.addEventListener('error', reject, {once: true});
});
const pending = new Map();
let nextId = 0;
socket.addEventListener('message', ({data}) => {
  const message = JSON.parse(data);
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  if (message.error) request.reject(Error(message.error.message));
  else request.resolve(message.result);
});
function call(method, params = {}) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    pending.set(id, {resolve, reject});
    socket.send(JSON.stringify({id, method, params}));
  });
}
async function evaluate(fn, ...args) {
  const expression = '(' + fn + ')(...' + JSON.stringify(args) + ')';
  const response = await call('Runtime.evaluate', {expression, awaitPromise:true, returnByValue:true});
  assert.ok(!response.exceptionDetails, response.exceptionDetails?.exception?.description);
  return response.result.value;
}
const sizes = [[1440, 1000], [390, 844]];
try {
  await fs.mkdir(evidence, {recursive:true});
  await call('Page.navigate', {url:pathToFileURL(path.resolve('web/index.html')).href});
  for (let attempt = 0; attempt < 50; attempt++) {
    if (await evaluate(() => Boolean(globalThis.UX17))) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const count = await evaluate(() => {
    const assert = (value, label) => { if (!value) throw Error(label); };
    const id = name => document.getElementById(name);
    function select(control, name) {
      id(control).value = name;
      id(control).dispatchEvent(new Event('change'));
      assert(id(control).value === name && !id('error').textContent, name + ' could not be selected');
    }
    const names = Object.keys(CLibrary.examples);
    assert(names.length === 54, '54 library functions');
    assert([...id('topic').options].every(option => !names.includes(option.value)), 'separate algorithm options');
    assert([...id('libraryTopic').options].filter(option => option.value).length === 54, 'separate library options');
    for (const name of names) {
      select('libraryTopic', name);
      id('next').click();
      assert(id('code').querySelector('.line.active')?.textContent.includes(name + '('), name + ' active line');
      assert(id('code').querySelector('.syntax-keyword') && id('code').querySelector('.syntax-comment'), name + ' syntax');
      assert(id('teaching').textContent.includes('这个样板怎么用') && id('state').querySelector('mark'), name + ' guide');
      id('next').click();
      assert(id('message').textContent.includes('程序输出'), name + ' output');
    }
    for (const entry of ClassicCatalog.entries.filter(entry => !names.includes(entry.id))) {
      select('topic', entry.id);
      id('next').click();
      assert(!id('state').querySelector('.library-guide'), entry.id + ' algorithm state');
    }
    id('topicSearch').value = 'snprintf';
    id('topicSearch').dispatchEvent(new Event('input'));
    assert([...id('libraryTopic').options].filter(option => option.value).length === 1, 'library search');
    select('libraryTopic', 'snprintf');
    id('topicSearch').value = '';
    id('topicSearch').dispatchEvent(new Event('input'));
    return names.length;
  });
  assert.equal(count, 54);
  await evaluate(async () => {
    const id = name => document.getElementById(name);
    const assert = (value, label) => { if (!value) throw Error(label); };
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const at = () => Number(id('timeline').value);
    id('speed').value = '650';
    id('play').click();
    for (let i = 0; i < 60 && at() === 0; i++) await sleep(20);
    assert(at() === 1, 'advanced one step');
    id('play').click();
    await sleep(850);
    assert(at() === 1, 'paused');
    id('play').click();
    for (let i = 0; i < 60 && at() !== 2; i++) await sleep(20);
    assert(at() === 2 && id('play').textContent.includes('播放'), 'resumed and stopped at end');
    id('timeline').value = '1';
    id('timeline').dispatchEvent(new Event('input'));
    assert(at() === 1 && id('code').querySelector('.active').textContent.includes('snprintf('), 'seek');
    id('input').value = 'hello\n6';
    id('input').dispatchEvent(new Event('input'));
    assert(id('play').disabled, 'old steps invalidated');
    id('run').click();
    id('next').click();
    id('next').click();
    assert(id('message').textContent.includes('hello\\n5'), 'rerun');
    id('codeFullscreen').click();
    assert(id('fsCode').querySelector('.syntax-comment'), 'fullscreen coloring');
    id('fsExit').click();
    id('libraryTopic').value = 'realloc';
    id('libraryTopic').dispatchEvent(new Event('change'));
    id('input').value = '3\nfailure';
    id('run').click();
    id('next').click();
    assert(id('message').textContent.includes('模拟 realloc 返回 NULL'), 'simulated failure');
    id('next').click();
    assert(id('message').textContent.includes('NULL\\n7') &&
      id('code').querySelector('.active').textContent.includes('@failure_output'), 'old block stays readable');
    id('libraryTopic').value = 'snprintf';
    id('libraryTopic').dispatchEvent(new Event('change'));
    id('next').click();
    id('panels').scrollIntoView({block:'start'});
  });
  for (const [width, height] of sizes) {
    await call('Emulation.setDeviceMetricsOverride', {width,height,deviceScaleFactor:1,mobile:false});
    const layout = await evaluate(async width => {
      await new Promise(requestAnimationFrame);
      const algorithmControl = document.querySelector(width <= 700 ? '.topic-trigger' : '#topic');
      const libraryControl = document.querySelector('#libraryTopic');
      const selects = [algorithmControl, libraryControl].map(node => node.getBoundingClientRect());
      const state = document.getElementById('state');
      return {
        width, innerWidth, rects: selects.map(r => [r.left,r.right,r.top,r.bottom]), columns: getComputedStyle(document.querySelector(".topic-pickers")).gridTemplateColumns, noHorizontalOverflow: document.documentElement.scrollWidth <= width,
        bothControlsVisible: selects.every(rect => rect.height > 0),
        expectedSelectLayout: width < 560 ? selects[1].top > selects[0].bottom : selects[1].left >= selects[0].right,
        guideFitsPanel: state.scrollWidth <= state.clientWidth + 1
      };
    }, width);
    assert.ok(layout.noHorizontalOverflow && layout.bothControlsVisible && layout.expectedSelectLayout && layout.guideFitsPanel, JSON.stringify(layout));
    await evaluate(() => window.scrollTo(0, document.querySelector('.topic-pickers').getBoundingClientRect().top + window.scrollY - 12));
    const shot = await call('Page.captureScreenshot', {format:'png',captureBeyondViewport:false});
    await fs.writeFile(path.join(evidence, 'stdlib-' + width + '.png'), Buffer.from(shot.data, 'base64'));
    await evaluate(() => document.getElementById('panels').scrollIntoView({block:'start'}));
    const guideShot = await call('Page.captureScreenshot', {format:'png',captureBeyondViewport:false});
    await fs.writeFile(path.join(evidence, 'guide-' + width + '.png'), Buffer.from(guideShot.data, 'base64'));
  }
  await evaluate(() => {
    const trigger = document.querySelector('.topic-trigger');
    trigger.click();
    const dialog = document.querySelector('.topic-dialog');
    const bubble = [...dialog.querySelectorAll('button')].find(item => item.textContent === '冒泡排序');
    if (!dialog.open || !bubble || dialog.textContent.includes('snprintf')) throw Error('mobile algorithm picker');
    bubble.click();
    if (document.getElementById('topic').value !== 'bubble' || document.getElementById('libraryTopic').value)
      throw Error('mobile algorithm change');
  });
  console.log('54 library guides and syntax, 77 algorithms, playback, seek, rerun, fullscreen, and both layouts passed');
} finally {
  await call('Browser.close').catch(() => {});
  socket.close();
}

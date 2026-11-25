(function () {
    const topics = ['linear', 'twoPointer', 'window', 'prefix', 'monoStack', 'monoQueue'];
    const previous = {...R1};
    const teaching = {
        linear: '从左到右查找。返回首个匹配的 0 起始下标，未找到返回 -1。数组可为空。',
        twoPointer: '输入须非递减。返回两个不同的 0 起始下标，保留重复值。和太小移动左端，太大移动右端。',
        window: '窗口长度须在 1 到数组长度之间。先加入右端，再移出过期左端，仅比较完整窗口的和。',
        prefix: 'prefix[k] 累加前 k 项。查询包含左右端点，使用 prefix[right + 1] 减去 prefix[left]。',
        monoStack: '保存尚无答案的索引。严格更大的值才弹栈，相等值留栈。空答案用 ∅ 表示。',
        monoQueue: '队首是当前最大值。先移出过期索引，再移出小于或等于新值的队尾，平局保留最新索引。'
    };
    R1.teaching = {
        ...R1.teaching,
        linear: {purpose:'在无序数组中寻找目标', io:teaching.linear, legend:'i 是正在比较的槽位下标，target 是目标值，result 是结果。'},
        twoPointer: {purpose:'在有序数组中查找两数之和', io:teaching.twoPointer + ' 无解时返回 -1。', legend:'left 和 right 标出两个候选槽位，sum 是两项之和。'},
        window: {purpose:'求固定长度连续子数组的最大和', io:teaching.window, legend:'left 和 right 标出窗口端点，sum 是窗口和，best 是已比较的最大和。'},
        prefix: {purpose:'用一次预处理回答区间和查询', io:teaching.prefix, legend:'left 和 right 是原数组下标，累积区显示 prefix，prefix[0] 为 0。'},
        monoStack: {purpose:'寻找每个位置右侧首个更大值', io:teaching.monoStack, legend:'i 是当前下标，stack 区显示等待答案的下标，结果区按原下标排列。'},
        monoQueue: {purpose:'求每个完整滑动窗口的最大值', io:teaching.monoQueue, legend:'deque 区按队首到队尾显示候选下标，left 和 right 标出窗口边界。'}
    };
    const meanings = {i:'当前扫描下标',left:'左端下标（包含）',right:'右端下标（包含）',sum:'当前累计和',best:'完整窗口的最大和',windowSize:'窗口长度',target:'目标值',result:'算法结果',stack:'等待更大值的索引栈',deque:'候选最大值的索引队列',prefix:'前 k 项的累积数组'};
    let animations = [], last = new Map();
    for (const topic of topics) {
        R1.programs[topic] = ScanPrograms[topic];
        R1.mapping[topic] = {};
        for (const lang of ['c','cpp']) {
            const entries = [];
            ScanPrograms[topic][lang].forEach((line, i) => {
                const marker = line.match(/@(\d+)/);
                if (marker) entries.push([marker[1], i + 1]);
            });
            R1.mapping[topic][lang] = Object.fromEntries(entries);
        }
    }
    R1.install = function (core) {
        previous.install(core);
        for (const topic of topics) {
            const run = core[topic];
            core[topic] = input => run(input).map(e => ({...e, teachingTopic: topic, step: e.line == null ? null : String(e.line)}));
            core.code[topic] = ScanPrograms[topic].c;
        }
    };
    R1.inputData = (topic, input) => {
        if (!topics.includes(topic)) return previous.inputData(topic, input);
        const [line, ...rest] = input.split(/\r?\n/);
        const a = line.match(/[+-]?\d+/g) || [];
        return [a.length, a.join(' '), ...(rest.join(' ').match(/[+-]?\d+/g) || [])].join('\n');
    };
    R1.describe = e => {
        if (!topics.includes(e.teachingTopic)) return previous.describe(e);
        const vars = Object.keys(meanings).filter(k => e[k] !== undefined).map(k =>
            k + ' = ' + JSON.stringify(e[k]) + '，' + meanings[k] + '，见图中 ' + k + ' 标记或结果行');
        return teaching[e.teachingTopic] + ' ' + vars.join('。');
    };
    R1.cancel = () => { previous.cancel(); animations.forEach(a => a.cancel()); animations = []; };
    R1.reset = () => { previous.reset(); R1.cancel(); last.clear(); };
    R1.draw = (e, host, animate) => {
        if (!topics.includes(e.teachingTopic)) return previous.draw(e, host, animate);
        R1.cancel();
        const panel = document.createElement('div');
        panel.className = 'scan-diagram';
        const current = new Map();
        function row(label, items) {
            const title = document.createElement('p');
            title.textContent = label;
            panel.append(title);
            const line = document.createElement('div');
            line.className = 'scan-row';
            for (const {key,text,active} of items) {
                const cell = document.createElement('span');
                cell.className = active ? 'scan-cell scan-active' : 'scan-cell';
                cell.textContent = text;
                cell.dataset.objectId = key;
                line.append(cell);
                current.set(key, cell);
            }
            panel.append(line);
        }
        row('输入槽位（下标 · 值；元素身份不随排序改变）', e.state.map((v,i) => {
            const tags = [...(e.left === i ? ['left'] : []), ...(e.right === i ? ['right'] : []),
                ...(e.indices.includes(i) ? ['i'] : [])];
            return {key:'input-'+i,text:'下标 '+i+' · 值 '+v+' '+tags.join('/'),
                active:e.indices.includes(i)||(e.kind==='window' && i>=e.left && i<=e.right)};
        }));
        if (e.prefix) row('prefix[k]（前 k 项累计）', e.prefix.map((v,k)=>({key:'prefix-'+k,text:'['+k+'] '+v,active:k===e.left||k===e.right+1})));
        for (const key of ['stack','deque']) if (e[key]) row(key+'（索引引用）',e[key].map(i=>({key:key+'-'+i,text:'→ 下标 '+i+' · 值 '+e.state[i]})));
        row('当前累计与结果', ['target','windowSize','sum','best','result'].filter(k=>e[k]!==undefined)
            .map(k=>({key:'value-'+k,text:k+' = '+(Array.isArray(e[k])?'['+e[k].map(v=>v??'∅').join(', ')+']':e[k]??'未定')})));
        host.replaceChildren(panel);
        const positions = new Map();
        for (const [key,cell] of current) {
            const rect = cell.getBoundingClientRect();
            const p = {x:rect.x,y:rect.y};
            positions.set(key,p);
            const prior = last.get(key);
            const dx = prior ? prior.x-p.x : 0, dy = prior ? prior.y-p.y : -14;
            if (animate && (dx||dy) && !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
                animations.push(cell.animate([{transform:'translate('+dx+'px,'+dy+'px)',opacity:prior?1:.35},{transform:'none',opacity:1}],{duration:280}));
        }
        last = positions;
        return Promise.allSettled(animations.map(a=>a.finished));
    };
    globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change', e=>{if(e.matches)R1.cancel();});
})();

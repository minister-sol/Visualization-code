(() => {
    const previous = {...R1};
    const lineSteps = {
        quickSelect: {1:'init', 3:'pivot', 5:'compare', 7:'place', 8:'result', 9:'shrink'},
        countSort: {1:'init', 2:'count', 5:'emit', 6:'decrement', 9:'done'},
        radix: {2:'init', 3:'distribute', 4:'collect', 6:'done'},
        bucket: {1:'init', 2:'place', 3:'sort', 4:'merge'},
        shell: {1:'gap', 3:'save', 4:'compare', 5:'shift', 7:'place', 10:'done'}
    };
    const topics = Object.keys(lineSteps);

    const teaching = {
        quickSelect: {
            purpose: '快速选择用分区定位第 K 大，平均 O(n)，不必完整排序；重复值按位置计数。',
            io: '首行最多 20 个整数，第二行 k 为正整数（1 到数组长度）；输出第 K 大的值。',
            legend: '末位作基准，较大元素放左侧；p 是基准归位下标，target = k-1；区间按 p 向左或向右收缩。'
        },
        countSort: {
            purpose: '计数排序统计 -20..20 各值出现次数，再按值序收集，线性且稳定。',
            io: '最多 20 个 -20..20 整数，允许空数组与重复值；输出升序结果。',
            legend: 'count[v+20] 记录次数；收集按值从小到大，重复值按计数依次展开。'
        },
        radix: {
            purpose: '基数排序从最低位到最高位逐位分配到 10 个桶再收集，LSD 稳定排序。',
            io: '最多 20 个 0..999 非负整数，允许空数组与重复值；输出升序结果。',
            legend: 'exp 为当前位权；digit = (v/exp) % 10；每轮按桶号 0→9 顺序收集，保持同桶内先后。'
        },
        bucket: {
            purpose: '桶排序按十位分 10 个桶，桶内升序后按桶号合并。',
            io: '最多 20 个 0..99 整数，允许空数组与重复值；输出升序结果。',
            legend: '桶号 = ⌊v/10⌋；每桶内部排序，再按桶 0→9 依次合并。'
        },
        shell: {
            purpose: '希尔排序按递减间隔做分组插入排序，间隔逐次减半直至 1。',
            io: '最多 20 个 -999..999 整数，允许空数组与重复值；输出升序结果。',
            legend: 'gap 为当前间隔；j 与 j-gap 比较，较大值右移，暂存值最后落位。'
        }
    };

    for (const topic of topics) {
        const lines = SelectSortPrograms[topic];
        const markers = {};
        lines.forEach((line, index) => {
            const match = line.match(/@(\w+)/);
            if (match) markers[match[1]] = index + 1;
        });
        R1.programs[topic] = {c:lines, cpp:lines};
        R1.mapping[topic] = {c:markers, cpp:markers};
        (R1.teaching ??= {})[topic] = teaching[topic];
    }

    R1.install = core => {
        previous.install(core);
        for (const topic of topics) {
            const trace = core[topic];
            core[topic] = input => trace(input).map(event => ({
                ...event, teachingTopic:topic, step:lineSteps[topic][event.line]
            }));
            core.code[topic] = SelectSortPrograms[topic];
        }
    };

    function parseArray(text) {
        const s = (text || '').trim().replace(/^[,，\s]+|[,，\s]+$/g, '');
        return s ? s.split(/[,，\s]+/).map(Number) : [];
    }
    function toStdin(topic, input) {
        if (topic === 'quickSelect') {
            const lines = input.split(/\r?\n/).filter(x => x.trim());
            const a = parseArray(lines[0] || '');
            const m = /^k\s+(\d+)$/.exec((lines[1] || '').trim());
            const k = m ? +m[1] : 0;
            return [a.length + ' ' + k, a.join(' ')].join('\n');
        }
        const a = parseArray(input);
        return [a.length, a.join(' ')].join('\n');
    }
    R1.inputData = (topic, input) => topics.includes(topic) ? toStdin(topic, input) : previous.inputData(topic, input);

    const explanations = {
        k: ['第 K 大的序号，从 1 开始', '目标序号 k'],
        target: ['目标下标，target = k-1，从 0 开始', '数组目标槽位'],
        left: ['当前待查区间左端点', '区间左边界'],
        right: ['当前待查区间右端点', '区间右边界'],
        pivot: ['本轮选中的基准值', '末位基准卡片'],
        p: ['基准归位下标，也是左分区边界', '基准落位槽位'],
        j: ['当前比较下标', '正在比较的槽位'],
        result: ['已确定的第 K 大值', '结果卡片'],
        size: ['输入元素个数', '数组长度'],
        value: ['当前处理的值', '当前值卡片'],
        exp: ['当前位权（1、10、100）', '位权标签'],
        digit: ['当前位数字，0–9', '目标桶编号'],
        bucket: ['桶编号（十位，0–9）', '对应桶列'],
        gap: ['当前分组间隔', '间隔标签'],
        i: ['当前待插入下标', '当前槽位'],
        j: ['当前移动下标', '正在移动的槽位']
    };
    R1.describe = event => {
        if (!topics.includes(event.teachingTopic)) return previous.describe(event);
        const entries = Object.entries(event.variables || {});
        if (!entries.length) return '当前步骤无额外变量；见上方图形与说明。';
        return entries.map(([name, value]) => {
            const spec = explanations[name] || ['当前工作数据', '当前图形'];
            return name + ' = ' + value + '：' + spec[0] + '；图中' + spec[1];
        }).join('；');
    };

    let pathAnimations = [];
    let viewRects = new Map();
    R1.cancel = () => { previous.cancel(); for (const a of pathAnimations) a.cancel(); pathAnimations = []; };
    R1.reset = () => { previous.reset(); R1.cancel(); viewRects.clear(); };
    R1.beforeRender = () => {
        previous.beforeRender?.();
        viewRects.clear();
        const host = document.querySelector('#state');
        const base = host?.getBoundingClientRect();
        if (!base) return;
        host.querySelectorAll('[data-object-id^="src-"], [data-object-id^="item-"], [data-object-id^="out-"]').forEach(el => {
            const r = el.getBoundingClientRect();
            viewRects.set(el.dataset.objectId, {x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height});
        });
    };

    const ns = 'http://www.w3.org/2000/svg';
    const svgEl = (tag, attrs, text) => {
        const el = document.createElementNS(ns, tag);
        for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, '' + v);
        if (text !== undefined) el.textContent = text;
        return el;
    };

    function drawArray(event, host) {
        /* 终态帧显示排序结果；计数排序等无桶主题的 done 事件 state 仍是输入，需取 result。 */
        const state = event.step === 'done' && event.result && event.result.length === (event.state || []).length ? event.result.slice() : (event.state || []);
        const n = state.length;
        const hostW = host.clientWidth || 420;
        const pad = 16;
        const cellW = n ? Math.min(76, Math.max(44, Math.floor((hostW - pad * 2) / n))) : 60;
        const width = Math.max(240, n * cellW + pad * 2);
        const svg = svgEl('svg', {viewBox:`0 0 ${width} 170`, width, height:170, role:'img', 'aria-label':'数组当前状态'});
        svg.setAttribute('style','width:100%;height:auto');
        state.forEach((v, i) => {
            const x = pad + i * cellW;
            const active = event.indices.includes(i);
            const g = svgEl('g', {'data-object-id':'cell-' + i, transform:`translate(${x} 56)`});
            g.append(svgEl('rect', {width:cellW - 12, height:34, rx:6,
                fill:active ? '#b4e5bf' : '#dbeafe', stroke:active ? '#245c35' : '#24527c'}));
            g.append(svgEl('text', {x:(cellW - 12) / 2, y:22, 'text-anchor':'middle', 'font-size':13}, String(v)));
            svg.append(g);
            svg.append(svgEl('text', {x:(cellW - 12) / 2, y:116, 'text-anchor':'middle', 'font-size':14}, '[' + i + ']'));
        });
        if (state.length === 0) svg.append(svgEl('text', {x:20, y:80, 'font-size':12}, '空数组'));
        host.replaceChildren(svg);
    }

    /* 桶视图：来源槽常显；桶内 chip 的身份按“值 + 出现顺序”绑定来源下标。
       chip 只在真正换位时从上一帧位置连续飞行——已在桶内的对象不会再从来源槽重飞。
       收集/合并步把桶内对象连续移到输出槽，输出槽顺序与事件数组一致；下一轮来源槽改用已收集序列。 */
    function drawBuckets(event, host, animate) {
        const buckets = event.buckets || [];
        const state = event.state || [];
        const output = event.result && event.result.length === state.length ? event.result.slice() : state.slice();
        /* 来源槽与身份都从事件序列推导，不依赖上一帧渲染：同一帧无论拖动、单步还是播放进入都一致。 */
        const list = typeof events !== 'undefined' && Array.isArray(events) ? events : null;
        const at = list ? list.indexOf(event) : -1;
        let sourceState = state.slice();
        if (at >= 0) {
            for (let i = at; i >= 0; --i) {
                if (i === 0 || list[i].step === 'init') { sourceState = (list[i].state || []).slice(); break; }
            }
        }
        const identityValues = ((list && list[0] && list[0].state) || state).slice();
        const done = event.step === 'done';
        const collecting = (event.step === 'collect' || event.step === 'merge') && buckets.some(b => b.length);
        const activeBucket = event.variables?.digit ?? event.variables?.bucket ?? null;
        const pools = new Map();
        identityValues.forEach((value, i) => {
            if (!pools.has(value)) pools.set(value, []);
            pools.get(value).push(i);
        });
        const claimedSources = new Set();
        const chips = [];
        for (let d = 0; d < 10; ++d) {
            (buckets[d] || []).forEach((value, i) => {
                const pool = pools.get(value);
                const idx = pool && pool.length ? pool.shift() : `x${d}-${i}`;
                let srcIdx = sourceState.findIndex((sv, si) => !claimedSources.has(si) && sv === value);
                if (srcIdx < 0) srcIdx = sourceState.findIndex((sv, si) => !claimedSources.has(si));
                if (srcIdx >= 0) claimedSources.add(srcIdx);
                chips.push({value, idx, srcIdx, slot:chips.length});
            });
        }
        const matching = chips.length === output.length && chips.every((chip, k) => chip.value === output[k]);
        const merging = done || (collecting && matching);
        const movers = [];
        /* 终态帧即使桶数组清空也要保留排序结果：按输出值从身份池取回对应 item。 */
        let shown = chips;
        if (done && !matching) {
            const seen = new Map();
            identityValues.forEach((value, i) => {
                if (!seen.has(value)) seen.set(value, []);
                seen.get(value).push(i);
            });
            shown = output.map((value, k) => {
                const pool = seen.get(value);
                return {value, idx: pool && pool.length ? pool.shift() : `o-${k}`, srcIdx: -1};
            });
        }

        const srcBar = document.createElement('div');
        srcBar.className = 'bucket-source';
        const srcLabel = document.createElement('div');
        srcLabel.className = 'bucket-source-label';
        srcLabel.textContent = merging ? '输出槽' : '来源槽';
        srcBar.append(srcLabel);
        const srcRow = document.createElement('div');
        srcRow.className = 'bucket-source-row' + (merging ? ' bucket-out-row' : '');
        if (merging) {
            shown.forEach((info, k) => {
                const cell = document.createElement('div');
                cell.className = 'bucket-src-cell bucket-out-cell';
                cell.setAttribute('data-object-id', `out-${k}`);
                const chip = document.createElement('div');
                chip.className = 'bucket-item';
                chip.setAttribute('data-object-id', `item-${info.idx}`);
                chip.textContent = String(info.value);
                cell.append(chip);
                srcRow.append(cell);
                movers.push({chip, idx:info.idx, srcIdx:info.srcIdx});
            });
        } else {
            sourceState.forEach((value, i) => {
                const cell = document.createElement('div');
                cell.className = 'bucket-src-cell';
                cell.setAttribute('data-object-id', `src-${i}`);
                cell.textContent = String(value);
                if (claimedSources.has(i)) cell.classList.add('moved');                srcRow.append(cell);
            });
        }
        srcBar.append(srcRow);

        const grid = document.createElement('div');
        grid.className = 'bucket-grid';
        let cursor = 0;
        for (let d = 0; d < 10; ++d) {
            const items = buckets[d] || [];
            const active = d === activeBucket;
            const col = document.createElement('div');
            col.className = 'bucket-col' + (active ? ' active' : '');
            col.setAttribute('data-object-id', `frame-${d}`);
            const label = document.createElement('div');
            label.className = 'bucket-label';
            label.textContent = event.teachingTopic === 'radix' ? `桶 ${d}` : `${d * 10}–${d * 10 + 9}`;
            col.append(label);
            items.forEach(value => {
                const info = chips[cursor++];
                if (merging) return;
                const chip = document.createElement('div');
                chip.className = 'bucket-item';
                chip.setAttribute('data-object-id', `item-${info.idx}`);
                chip.textContent = String(value);
                col.append(chip);
                movers.push({chip, idx:info.idx, srcIdx:info.srcIdx});
            });
            grid.append(col);
        }
        const shell = document.createElement('div');
        shell.className = 'bucket-view';
        shell.append(srcBar, grid);
        host.replaceChildren(shell);

        const base = host.getBoundingClientRect();
        const rectOf = el => {
            const r = el.getBoundingClientRect();
            return {x: r.left - base.left, y: r.top - base.top};
        };
        const targets = new Map();
        srcRow.querySelectorAll('[data-object-id]').forEach(el => targets.set(el.dataset.objectId, rectOf(el)));
        movers.forEach(({chip, idx}) => targets.set(`item-${idx}`, rectOf(chip)));
        const reduce = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const duration = R1.motionMs ? R1.motionMs(520) : 520;
        if (animate !== false && !reduce) {
            movers.forEach(({chip, idx, srcIdx}) => {
                const from = viewRects.get(`item-${idx}`) || (srcIdx >= 0 ? viewRects.get(`src-${srcIdx}`) : undefined);
                const to = targets.get(`item-${idx}`);
                if (!from || !to) return;
                const dx = from.x - to.x, dy = from.y - to.y;
                if (Math.abs(dx) + Math.abs(dy) < 2) return;
                const a = chip.animate([
                    {transform:`translate(${dx}px, ${dy}px)`},
                    {transform:'translate(0, 0)'}
                ], {duration, easing:'cubic-bezier(.2,.7,.3,1)'});
                pathAnimations.push(a);
            });
        }
        viewRects = targets;
    }

    R1.draw = (event, host, animate) => {
        if (!topics.includes(event.teachingTopic)) return previous.draw(event, host, animate);
        R1.cancel();
        if (event.buckets) drawBuckets(event, host, animate === undefined ? R1.animateNow : animate);
        else drawArray(event, host);
        return Promise.allSettled(pathAnimations.map(a => a.finished));
    };
})();

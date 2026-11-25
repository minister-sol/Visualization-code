(() => {
    const previous = {...R1};
    const lineSteps = {
        intervalGrouping: {1:'sort', 2:'init', 4:'find', 5:'create', 6:'assign', 8:'result'},
        fractionalKnapsack: {1:'sort', 2:'init', 4:'full', 5:'take', 6:'record',
                             7:'fraction', 8:'reduce', 9:'remaining', 11:'result'}
    };
    const topics = Object.keys(lineSteps);
    for (const topic of topics) {
        const lines = GreedyPrograms[topic];
        const markers = {};
        lines.forEach((line, index) => {
            const match = line.match(/@(\w+)/);
            if (match) markers[match[1]] = index + 1;
        });
        R1.programs[topic] = {c:lines, cpp:lines};
        R1.mapping[topic] = {c:markers, cpp:markers};
        (R1.teaching ??= {})[topic] = {
            purpose: topic === 'intervalGrouping'
                ? '区间分组（会议室问题）：按开始时间排序，把每个区间分给结束不晚于其开始的空闲资源；没有空闲资源时新增一个。'
                : '分数背包：按单位价值（价值/重量）交叉相乘降序，依次尽量取用，可以只取一部分重量；这不是 0/1 背包。',
            io: topic === 'intervalGrouping'
                ? '每行 interval 开始 结束；开始 < 结束，范围 -100..100，最多 12 个半开区间；输出各资源的编号分组。'
                : '首行 capacity 0–100；每行 item 重量 价值，重量 1–100、价值 0–999，最多 12 个；总价值输出精确分数。',
            legend: topic === 'intervalGrouping'
                ? '半开区间 [start,end)：端点相接可以复用同一资源；泳道 R0、R1… 代表不同资源，当前区间高亮。'
                : '密度比较用 value×对方重量 交叉相乘，避免浮点误差；同密度按输入编号；取用条表示已取重量占比。'
        };
    }
    R1.install = core => {
        previous.install(core);
        for (const topic of topics) {
            const trace = core[topic];
            core[topic] = input => trace(input).map(event => ({
                ...event, teachingTopic:topic, step:lineSteps[topic][event.line]
            }));
            core.code[topic] = GreedyPrograms[topic];
        }
    };
    R1.inputData = (topic, input) => topics.includes(topic) ? input : previous.inputData(topic, input);

    const explanations = {
        intervals:['待分配区间总数','全部区间条形'],
        index:['当前区间/物品在排序后序列中的下标','当前高亮条形或卡片'],
        start:['区间左端点（半开，包含）','条形左边界'],
        end:['区间右端点（半开，不包含）','条形右边界'],
        resource:['分配到的资源编号；-1 表示无空闲、需新建','对应泳道 R 编号'],
        resources:['最终需要的资源总数','泳道数量'],
        items:['物品总数','全部物品卡片'],
        capacity:['背包总容量','容量条上限'],
        weight:['物品重量','卡片重量与取用条分母'],
        value:['物品价值','卡片价值'],
        taken:['本次取用的重量','卡片取用条填充部分'],
        numerator:['累计价值分子（精确分数）','价值说明分子'],
        denominator:['累计价值分母（精确分数）','价值说明分母'],
        remaining:['剩余可装重量','容量条剩余部分']
    };
    R1.describeItems = event => topics.includes(event.teachingTopic)
        ? Object.entries(event.variables || {}).map(([name, value]) => {
            const spec = explanations[name] || ['当前工作数据','当前图形'];
            return {name, value, meaning:spec[0], graphic:spec[1]};
        })
        : (previous.describeItems ? previous.describeItems(event) : null);
    R1.describe = event => topics.includes(event.teachingTopic)
        ? R1.describeItems(event).map(item => item.name + ' = ' + item.value + '：' + item.meaning + '；图中' + item.graphic).join('；')
        : previous.describe(event);

    let animations = [];
    let positions = new Map();
    R1.cancel = () => {
        previous.cancel();
        for (const animation of animations) animation.cancel();
        animations = [];
    };
    R1.reset = () => {
        previous.reset();
        R1.cancel();
        positions.clear();
    };

    const ns = 'http://www.w3.org/2000/svg';
    const svgEl = (tag, attrs, text) => {
        const el = document.createElementNS(ns, tag);
        for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, '' + v);
        if (text !== undefined) el.textContent = text;
        return el;
    };

    function parseIntervals(state) {
        return state.map(text => {
            const m = text.match(/^#(\d+) \[(-?\d+), (-?\d+)\)$/);
            return m ? {id:+m[1], start:+m[2], end:+m[3], label:text} : null;
        }).filter(Boolean);
    }
    function parseItems(state) {
        return state.map(text => {
            const m = text.match(/^#(\d+) 重(\d+) 值(\d+) 比(\d+)\/(\d+)$/);
            return m ? {id:+m[1], weight:+m[2], value:+m[3], density:m[4] + '/' + m[5], label:text} : null;
        }).filter(Boolean);
    }

    R1.draw = (event, host, animate) => {
        if (!topics.includes(event.teachingTopic)) return previous.draw(event, host, animate);
        R1.cancel();
        const oldPositions = positions;
        positions = new Map();
        const motion = animate && !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const wrap = document.createElement('div');
        wrap.className = 'scan-diagram';

        if (event.teachingTopic === 'intervalGrouping') {
            const intervals = parseIntervals(event.state);
            const groups = event.result || [];
            const rowOf = new Map();
            groups.forEach((group, row) => group.forEach(id => rowOf.set(id, row)));
            const hostW = host.clientWidth || 600;
            const chartX = 62;
            const railW = Math.max(104, Math.min(168, hostW * 0.27));
            const chartRight = Math.max(chartX + 110, hostW - railW - 14);
            const lo = Math.min(...intervals.map(a => a.start), 0);
            const hi = Math.max(...intervals.map(a => a.end), 1);
            const span = Math.max(1, hi - lo);
            const scale = (chartRight - chartX) / span;
            const rows = Math.max(groups.length, 1);
            const unassigned = intervals.filter(a => !rowOf.has(a.id));
            const band = 44;
            const height = 34 + (rows + unassigned.length) * band + 18;
            const width = hostW;
            const svg = svgEl('svg', {viewBox:`0 0 ${width} ${height}`, width, height, role:'img', 'aria-label':'区间分组泳道：资源泳道、时间轴与区间条形'});
            svg.setAttribute('style','width:100%;max-width:100%;height:auto');
            const x = v => chartX + (v - lo) * scale;
            const textW = s => [...String(s)].reduce((a, c) => a + (/[\u4e00-\u9fff]/.test(c) ? 12 : 6.9), 0);
            const railX = chartRight + 12;
            svg.append(svgEl('line', {x1:chartX, y1:22, x2:chartRight, y2:22, stroke:'currentColor'}));
            for (const value of [...new Set(intervals.flatMap(a => [a.start, a.end]))].sort((a,b)=>a-b)) {
                svg.append(svgEl('text', {x:x(value), y:14, 'text-anchor':'middle', 'font-size':13}, String(value)));
                svg.append(svgEl('line', {x1:x(value), y1:22, x2:x(value), y2:27, stroke:'currentColor'}));
            }
            for (let r = 0; r < rows; ++r) {
                svg.append(svgEl('text', {x:12, y:34 + r * band + 19, 'font-size':17.2, 'font-weight':600}, 'R' + r));
            }
            intervals.forEach((a, i) => {
                const assigned = rowOf.has(a.id);
                const row = assigned ? rowOf.get(a.id) : rows + unassigned.indexOf(a);
                const y = 34 + row * band;
                const active = event.indices.includes(i);
                const bx = x(a.start);
                const bw = Math.max(3, (a.end - a.start) * scale);
                const g = svgEl('g', {'data-object-id':'interval-' + a.id, transform:`translate(${bx} ${y})`});
                const rect = svgEl('rect', {
                    width:bw, height:28, rx:5,
                    class:'r1-bar' + (active ? ' r1-selected' : ' r1-object')
                });
                g.append(rect);
                const label = `#${a.id} [${a.start},${a.end})`;
                const inside = svgEl('text', {x:6, y:19, 'font-size':17.2}, label);
                g.append(inside);
                let fit = textW(label);
                try { const measured = inside.getComputedTextLength(); if (measured > 0) fit = measured; } catch (error) { /* 假 DOM 无测量 API，退回估算 */ }
                if (fit > bw - 10) {
                    if (typeof inside.remove === 'function') inside.remove();
                    if (bw >= textW('#' + a.id) + 10) g.append(svgEl('text', {x:bw / 2, y:19, 'font-size':17.2, 'text-anchor':'middle'}, '#' + a.id));
                    svg.append(svgEl('line', {x1:bx + bw + 3, y1:y + 13, x2:railX - 4, y2:y + 13, class:'r1-leader'}));
                    const outside = svgEl('text', {x:railX, y:y + 19, 'font-size':17.2}, label);
                    svg.append(outside);
                    let outsideW = textW(label);
                    try { const measured = outside.getComputedTextLength(); if (measured > 0) outsideW = measured; } catch (error) { /* 同上 */ }
                    if (railX + outsideW > width - 6) outside.setAttribute('x', Math.max(chartX, width - outsideW - 6));
                }
                svg.append(g);
                if (!assigned) svg.append(svgEl('text', {x:12, y:y + 19, 'font-size':13}, '待分配'));
                const key = 'interval-' + a.id;
                const old = oldPositions.get(key);
                positions.set(key, {x:bx, y});
                if (motion && g.animate && old && (old.x !== bx || old.y !== y)) {
                    animations.push(g.animate([
                        {transform:`translate(${old.x}px, ${old.y}px)`},
                        {transform:`translate(${bx}px, ${y}px)`}
                    ], {duration:300, easing:'ease-out'}));
                }
            });
            wrap.append(svg);
        } else {
            const items = parseItems(event.state);
            const choices = new Map((event.choices || []).map(c => [c.id, c.taken]));
            const capacity = event.variables?.capacity ?? event.variables?.remaining ?? 0;
            const remaining = event.remaining ?? event.variables?.remaining ?? 0;
            const grid = document.createElement('div');
            grid.className = 'knapsack-grid';
            items.forEach((item, i) => {
                const taken = choices.get(item.id) || 0;
                const card = document.createElement('div');
                card.className = 'knapsack-card' + (event.indices.includes(i) ? ' active' : '');
                card.setAttribute('data-object-id', 'knapsack-' + item.id);
                const head = document.createElement('div'); head.className = 'knapsack-head'; head.textContent = '#' + item.id;
                const w = document.createElement('div'); w.textContent = '重 ' + item.weight;
                const v = document.createElement('div'); v.textContent = '值 ' + item.value;
                const d = document.createElement('div'); d.textContent = '密度 ' + item.density;
                const bar = document.createElement('div'); bar.className = 'knapsack-bar';
                const fill = document.createElement('div'); fill.className = 'knapsack-fill';
                fill.style.width = (item.weight ? 100 * taken / item.weight : 0) + '%';
                bar.append(fill);
                const t = document.createElement('div'); t.className = 'knapsack-taken'; t.textContent = `已取 ${taken}/${item.weight}`;
                card.append(head, w, v, d, bar, t);
                grid.append(card);
                const key = 'knapsack-' + item.id;
                const old = oldPositions.get(key);
                positions.set(key, {x: 0, y: 0});
                if (motion && card.animate && old) {
                    animations.push(card.animate([{opacity:.3},{opacity:1}], {duration:300, easing:'ease-out'}));
                }
            });
            wrap.append(grid);
            const capLine = document.createElement('div'); capLine.className = 'knapsack-cap-line';
            capLine.textContent = `剩余容量 ${remaining} / ${capacity}`;
            const capBar = document.createElement('div'); capBar.className = 'knapsack-cap-bar';
            const capFill = document.createElement('div'); capFill.className = 'knapsack-cap-fill';
            capFill.style.width = capacity ? (capacity - remaining) / capacity * 100 + '%' : '0%';
            capBar.append(capFill);
            const frac = event.result ? `${event.result.numerator}/${event.result.denominator}` : '0/1';
            const fracLine = document.createElement('div'); fracLine.className = 'knapsack-frac';
            fracLine.textContent = `累计价值 ${frac}`;
            wrap.append(capLine, capBar, fracLine);
        }
        host.replaceChildren(wrap);
        return Promise.allSettled(animations.map(a => a.finished));
    };
})();

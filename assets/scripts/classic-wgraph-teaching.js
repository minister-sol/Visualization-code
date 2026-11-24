(() => {
    const previous = { ...R1 };
    const lineSteps = {
        dijkstra: { 2: 'init', 4: 'select', 6: 'settle', 7: 'check', 9: 'relax', 13: 'done' },
        bellmanFord: { 2: 'init', 4: 'check', 5: 'relax', 9: 'affected', 11: 'propagate', 12: 'mark', 13: 'done' },
        floydWarshall: { 1: 'init', 6: 'relax', 8: 'negative', 11: 'propagate', 12: 'done' },
        prim: { 1: 'init', 5: 'root', 9: 'candidate', 10: 'pick', 11: 'join', 14: 'done' },
        kruskal: { 1: 'init', 4: 'check', 6: 'merge', 7: 'pick', 5: 'skip', 10: 'done' }
    };
    const topics = Object.keys(lineSteps);

    const teaching = {
        dijkstra: {
            purpose: 'Dijkstra 在非负权图上反复选出距离最小的未确定顶点，松弛其出边；一旦顶点被确定，其最短距离不再改变。',
            io: 'vertices、mode directed/undirected、start 起点、edge 起点 终点 非负整数权重；最多 12 顶点、30 边。输出各顶点距离与前驱，不可达记 -1 / -。',
            legend: '黄色描边为当前聚焦顶点，绿色填充为已确定顶点；节点下方为当前距离，∞ 表示不可达。'
        },
        bellmanFord: {
            purpose: 'Bellman–Ford 对全部弧做 n-1 轮松弛，可处理负权；再检查仍可松弛的弧，沿弧传播标记受起点可达负环影响的顶点。',
            io: '最多 10 顶点、30 边、权重 -99 至 99；有向或无向，非空图须 start；不可达为 ∞，可达负环影响为 −∞。',
            legend: '黄色描边为当前聚焦弧终点；绿色填充为受负环影响顶点；节点下方为当前距离，−∞ 表示无有限最短距离。'
        },
        floydWarshall: {
            purpose: 'Floyd–Warshall 以每个顶点 k 为中转更新全源距离矩阵；位于负环上的顶点及其可达顶点对标记 −∞。',
            io: '最多 10 顶点、30 边、权重 -99 至 99；有向或无向；∞ 不可达，经过负环的顶点对为 −∞。',
            legend: '矩阵行列按顶点声明顺序排列；当前检查位置在矩阵中高亮；−∞ 表示受负环影响。'
        },
        prim: {
            purpose: 'Prim 从生长中的森林出发，反复选取一端在森林内、一端在外的最小权边，把外部顶点并入森林；不连通时得到最小生成森林。',
            io: '无向带权图；可负权，不连通时输出最小生成森林；start 可选，等权按边输入顺序。',
            legend: '绿色填充为已在森林中的顶点；绿色边为已选入生成树的边；边标签为权重。'
        },
        kruskal: {
            purpose: 'Kruskal 把边按权重（并列按输入序号）排序，用并查集判断两端；两端不同集合则合并并选边，已连通则跳过环边。',
            io: '无向带权图；可负权，不连通时输出最小生成森林；等权按边输入顺序。',
            legend: '绿色边为已选边；被跳过的边两端已属同一集合；并查集父指针在说明行展示。'
        }
    };

    for (const topic of topics) {
        const lines = WGraphPrograms[topic];
        const markers = {};
        lines.forEach((line, index) => {
            const match = line.match(/@(\w+)/);
            if (match) markers[match[1]] = index + 1;
        });
        R1.programs[topic] = { c: lines, cpp: lines };
        R1.mapping[topic] = { c: markers, cpp: markers };
        (R1.teaching ??= {})[topic] = teaching[topic];
    }

    R1.install = core => {
        previous.install(core);
        for (const topic of topics) {
            const trace = core[topic];
            core[topic] = input => trace(input).map(event => ({
                ...event,
                teachingTopic: topic,
                step: lineSteps[topic][event.line]
            }));
            core.code[topic] = WGraphPrograms[topic];
        }
    };

    R1.inputData = (topic, input) => topics.includes(topic) ? input : previous.inputData(topic, input);

    const fmtDist = d => {
        if (d === null || d === undefined) return '∅';
        if (d === Infinity) return '∞';
        if (d === -Infinity) return '−∞';
        return String(d);
    };

    const auxiliary = event => {
        const g = event.graph;
        const parts = [];
        if (event.teachingTopic === 'dijkstra') {
            parts.push('距离/前驱：' + g.vertices.map(v =>
                `${v}=${fmtDist(event.distance[v])}/${event.parent[v] === null || event.parent[v] === undefined ? '—' : event.parent[v]}`
            ).join('，'));
        } else if (event.teachingTopic === 'bellmanFord') {
            parts.push('距离：' + g.vertices.map(v => `${v}=${fmtDist(event.distance[v])}`).join('，'));
            if (event.affected && event.affected.length) parts.push(`受负环影响 [${event.affected.join(', ')}]`);
        } else if (event.teachingTopic === 'floydWarshall') {
            if (event.row !== undefined && event.column !== undefined)
                parts.push(`当前位置 [${g.vertices[event.row]}, ${g.vertices[event.column]}]`);
        } else if (event.teachingTopic === 'prim') {
            const edges = (event.chosen || []).map(e => `${e[0]}–${e[1]}(${e[2]})`);
            parts.push(`已选边 ${edges.join('、') || '无'}`);
            parts.push(`总权重 ${event.total}`);
            parts.push(event.connected ? '图连通，得到最小生成树' : '图不连通，得到最小生成森林');
        } else if (event.teachingTopic === 'kruskal') {
            const edges = (event.chosen || []).map(e => `${e[0]}–${e[1]}(${e[2]})`);
            parts.push('并查集：' + g.vertices.map(v => `${v}→${event.parent[v]}`).join('，'));
            parts.push(`已选边 ${edges.join('、') || '无'}`);
            parts.push(`总权重 ${event.total}`);
        }
        return parts.join('；');
    };

    R1.describe = event => {
        if (!topics.includes(event.teachingTopic)) return previous.describe(event);
        const aux = auxiliary(event);
        return aux || '当前步骤无额外变量；见上方图形与说明。';
    };

    R1.cancel = () => { previous.cancel(); };
    R1.reset = () => { previous.reset(); R1.cancel(); };

    const ns = 'http://www.w3.org/2000/svg';
    const svgEl = (tag, attrs, text) => {
        const el = document.createElementNS(ns, tag);
        for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, '' + v);
        if (text !== undefined) el.textContent = text;
        return el;
    };

    function layout(vertices) {
        const n = vertices.length;
        const coords = {};
        vertices.forEach((v, i) => {
            const a = 2 * Math.PI * i / Math.max(n, 1) - Math.PI / 2;
            coords[v] = [160 + 100 * Math.cos(a), 140 + 95 * Math.sin(a)];
        });
        return coords;
    }

    function chosenSet(event) {
        const set = new Set();
        for (const e of (event.chosen || [])) {
            const pair = [e[0], e[1]].sort().join('|');
            set.add(pair);
        }
        return set;
    }

    function drawGraphSVG(event) {
        const g = event.graph;
        const topic = event.teachingTopic;
        const wrap = document.createElement('div');
        wrap.className = 'ac-wrap';
        const svg = svgEl('svg', { viewBox: '0 0 320 280', width: 320, height: 280, role: 'img', class: 'graph-svg', style: 'width:320px;max-width:none;height:auto',
            'aria-label': `图：${g.directed ? '有向' : '无向'}，顶点 ${g.vertices.join('、') || '空'}` });
        const defs = svgEl('defs', {});
        const marker = svgEl('marker', { id: 'wgraph-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5,
            markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, undefined);
        marker.append(svgEl('path', { d: 'M 0 0 L 10 5 L 0 10 z', class: 'graph-arrow' }));
        defs.append(marker);
        svg.append(defs);

        const coords = layout(g.vertices);
        const chosen = chosenSet(event);

        for (const edge of g.edges) {
            const [u, v, w] = edge;
            const [x1, y1] = coords[u], [x2, y2] = coords[v];
            const pair = [u, v].sort().join('|');
            const isChosen = chosen.has(pair);
            let d;
            if (u === v) {
                d = `M ${x1 - 10} ${y1 - 17} C ${x1 - 38} ${y1 - 65}, ${x1 + 38} ${y1 - 65}, ${x1 + 10} ${y1 - 17}`;
            } else {
                const dx = x2 - x1, dy = y2 - y1, length = Math.hypot(dx, dy) || 1;
                const ux = dx / length, uy = dy / length;
                const bend = (g.directed && g.edges.some(e => e[0] === v && e[1] === u)) ? 22 : 0;
                d = `M ${x1 + ux * 20} ${y1 + uy * 20} Q ${(x1 + x2) / 2 - uy * bend} ${(y1 + y2) / 2 + ux * bend} ${x2 - ux * 24} ${y2 - uy * 24}`;
            }
            svg.append(svgEl('path', { d, class: 'graph-edge' + (isChosen ? ' visited' : ''),
                ...(g.directed ? { 'marker-end': 'url(#wgraph-arrow)' } : {}) }));
            const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
            svg.append(svgEl('text', { x: mx, y: my - 6, 'text-anchor': 'middle', class: 'ac-edge-label' }, String(w)));
        }

        const affected = new Set(event.affected || []);
        for (const v of g.vertices) {
            const [x, y] = coords[v];
            const cls = 'graph-node' + ((event.seen || []).includes(v) || affected.has(v) ? ' visited' : '') + (g.focus === v ? ' focused' : '');
            const node = svgEl('g', { 'data-object-id': `wgraph-${v}`, transform: `translate(${x} ${y})` });
            node.append(svgEl('circle', { r: 19, class: cls }));
            node.append(svgEl('text', { x: 0, y: 5, 'text-anchor': 'middle', class: 'graph-label' }, v));
            let sub = '';
            if (topic === 'dijkstra') sub = fmtDist(event.distance[v]);
            if (topic === 'bellmanFord') sub = fmtDist(event.distance[v]);
            if (sub) node.append(svgEl('text', { x: 0, y: 34, 'text-anchor': 'middle', class: 'ac-edge-label' }, sub));
            svg.append(node);
        }
        wrap.append(svg);

        /* 变量汇总由 R1.describe 渲染到 stateHint，图形内不再重复。 */

        if (topic === 'floydWarshall' && event.dist && event.dist.length) {
            const table = document.createElement('table');
            table.className = 'wgraph-matrix';
            const head = document.createElement('tr');
            const h0 = document.createElement('th');
            head.append(h0);
            for (const v of g.vertices) {
                const th = document.createElement('th');
                th.textContent = v;
                head.append(th);
            }
            table.append(head);
            event.dist.forEach((row, i) => {
                const tr = document.createElement('tr');
                const th = document.createElement('th');
                th.textContent = g.vertices[i];
                tr.append(th);
                row.forEach((value, j) => {
                    const td = document.createElement('td');
                    td.textContent = fmtDist(value);
                    if (event.row === i && event.column === j) td.classList.add('focused');
                    tr.append(td);
                });
                table.append(tr);
            });
            wrap.append(table);
        }
        return wrap;
    }

    R1.draw = (event, host) => {
        if (!topics.includes(event.teachingTopic)) return previous.draw(event, host);
        R1.cancel();
        if (!event.graph || !event.graph.vertices.length) {
            const empty = document.createElement('span');
            empty.className = 'empty';
            empty.textContent = '空图';
            host.replaceChildren(empty);
            return Promise.allSettled([]);
        }
        host.replaceChildren(drawGraphSVG(event));
        return Promise.allSettled([]);
    };
})();

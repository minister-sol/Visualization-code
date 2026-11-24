(() => {
    const previous = { ...R1 };
    const lineSteps = {
        graph: { 6: 'list', 7: 'done' },
        graphDFS: { 3: 'visit', 4: 'check', 9: 'done' },
        graphBFS: { 2: 'init', 4: 'visit', 5: 'check', 7: 'enqueue', 11: 'done' },
        graphShortest: { 3: 'init', 5: 'visit', 6: 'check', 8: 'distance', 9: 'parent', 13: 'done' },
        graphTopo: { 2: 'indeg', 3: 'seed', 5: 'pop', 7: 'decr', 8: 'enqueue', 11: 'done' }
    };
    const topics = Object.keys(lineSteps);

    const teaching = {
        graph: {
            purpose: '把图的顶点与边整理成邻接表，每个顶点记录其邻接点；邻接点按顶点声明顺序排列。',
            io: 'vertices 顶点列表、mode directed/undirected、可选 start、edge 起点 终点；最多 12 顶点、30 边。输出各顶点邻接表。',
            legend: '圆点为顶点，箭头为有向边，无向边双向连通；绿色描边为当前聚焦顶点，绿色填充为已访问。'
        },
        graphDFS: {
            purpose: '深度优先搜索沿一条分支走到尽头再回退，用递归栈记录当前路径；从起点探索可达部分。',
            io: '非空图必须提供 start 起点；顶点最多 12、边最多 30，邻接点按声明顺序访问。输出访问顺序。',
            legend: '递归栈保存当前路径（栈顶在右）；已访问顶点不再重复进入；回退时弹出栈顶。'
        },
        graphBFS: {
            purpose: '广度优先搜索按层扩展，用队列保存待访问顶点；先访问距离起点近的顶点。',
            io: '非空图必须提供 start 起点；顶点最多 12、边最多 30，邻接点按声明顺序访问。输出访问顺序。',
            legend: '队头在左、队尾在右；标记并入队同时发生；出队时记入访问顺序。'
        },
        graphShortest: {
            purpose: '无权图中 BFS 层数即最短边数；记录每个可达顶点的距离与前驱，不可达顶点距离为空。',
            io: '非空图必须提供 start 起点；顶点最多 12、边最多 30。输出各顶点距离与前驱，不可达记 -1 / -。',
            legend: 'distance 是到起点的最短边数，parent 记录前驱；沿前驱回溯得到最短路径；未到达顶点距离为空。'
        },
        graphTopo: {
            purpose: 'Kahn 算法反复取出入度为 0 的顶点加入拓扑序，并递减其邻接点入度；有环时剩余顶点无法入队。',
            io: '仅有向图；vertices、mode directed、edge 起点 终点；最多 12 顶点、30 边。输出拓扑序与 cycle 标记。',
            legend: '队列保存入度为 0 的顶点；入度减到 0 才入队；最终已排顶点数少于顶点数即存在有向环。'
        }
    };

    for (const topic of topics) {
        const lines = GraphPrograms[topic];
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
            core.code[topic] = GraphPrograms[topic];
        }
    };

    R1.inputData = (topic, input) => topics.includes(topic) ? input : previous.inputData(topic, input);

    const auxiliary = event => {
        const g = event.graph;
        const parts = [];
        const adj = g.vertices.map(v => `${v}: ${(event.adjacency[v] || []).join(', ') || '∅'}`).join('；');
        parts.push(`邻接表 ${adj}`);
        if (event.order && event.order.length) parts.push(`访问顺序 [${event.order.join(' → ')}]`);
        if (event.stack && event.stack.length) parts.push(`递归栈 [${event.stack.join(' → ')}]（栈顶在右）`);
        if (event.queue && event.queue.length) parts.push(`队列 [${event.queue.join(' → ')}]（队头在左）`);
        if (event.teachingTopic === 'graphShortest') {
            parts.push('距离/前驱：' + g.vertices.map(v =>
                `${v}=${event.distance[v] === null ? '不可达' : event.distance[v]}/${event.parent[v] === null ? '—' : event.parent[v]}`
            ).join('，'));
        }
        if (event.teachingTopic === 'graphTopo') {
            parts.push('入度：' + g.vertices.map(v => `${v}=${event.indegree[v]}`).join('，'));
            if (event.cycle) parts.push('检测到有向环，无法完成拓扑排序');
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

    function drawGraphSVG(event) {
        const g = event.graph;
        const wrap = document.createElement('div');
        wrap.className = 'ac-wrap';
        const svg = svgEl('svg', { viewBox: '0 0 320 280', width: 320, height: 280, role: 'img', class: 'graph-svg', style: 'width:320px;max-width:none;height:auto',
            'aria-label': `图：${g.directed ? '有向' : '无向'}，顶点 ${g.vertices.join('、') || '空'}` });
        const defs = svgEl('defs', {});
        const marker = svgEl('marker', { id: 'graph-arrow-teaching', viewBox: '0 0 10 10', refX: 9, refY: 5,
            markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, undefined);
        marker.append(svgEl('path', { d: 'M 0 0 L 10 5 L 0 10 z', class: 'graph-arrow' }));
        defs.append(marker);
        svg.append(defs);

        const coords = layout(g.vertices);

        for (const [u, v] of g.edges) {
            const [x1, y1] = coords[u], [x2, y2] = coords[v];
            let d;
            if (u === v) {
                d = `M ${x1 - 10} ${y1 - 17} C ${x1 - 38} ${y1 - 65}, ${x1 + 38} ${y1 - 65}, ${x1 + 10} ${y1 - 17}`;
            } else {
                const dx = x2 - x1, dy = y2 - y1, length = Math.hypot(dx, dy) || 1;
                const ux = dx / length, uy = dy / length;
                const bend = (g.directed && g.edges.some(e => e[0] === v && e[1] === u)) ? 22 : 0;
                d = `M ${x1 + ux * 20} ${y1 + uy * 20} Q ${(x1 + x2) / 2 - uy * bend} ${(y1 + y2) / 2 + ux * bend} ${x2 - ux * 24} ${y2 - uy * 24}`;
            }
            svg.append(svgEl('path', { d, class: 'graph-edge', ...(g.directed ? { 'marker-end': 'url(#graph-arrow-teaching)' } : {}) }));
        }

        for (const v of g.vertices) {
            const [x, y] = coords[v];
            const cls = 'graph-node' + (event.seen.includes(v) ? ' visited' : '') + (g.focus === v ? ' focused' : '');
            const node = svgEl('g', { 'data-object-id': `graph-${v}`, transform: `translate(${x} ${y})` });
            node.append(svgEl('circle', { r: 19, class: cls }));
            node.append(svgEl('text', { x: 0, y: 5, 'text-anchor': 'middle', class: 'graph-label' }, v));
            let sub = '';
            if (event.teachingTopic === 'graphShortest') sub = event.distance[v] === null ? '∞' : String(event.distance[v]);
            if (event.teachingTopic === 'graphTopo') sub = `入${event.indegree[v]}`;
            if (sub) node.append(svgEl('text', { x: 0, y: 34, 'text-anchor': 'middle', class: 'ac-edge-label' }, sub));
            svg.append(node);
        }
        wrap.append(svg);

        const info = document.createElement('div');
        info.className = 'graph-aux';
        const rows = [];
        if (event.order && event.order.length) rows.push(`访问顺序：${event.order.join(' → ')}`);
        if (event.stack && event.stack.length) rows.push(`递归栈：${event.stack.join(' → ')}`);
        if (event.queue && event.queue.length) rows.push(`队列：${event.queue.join(' → ')}`);
        if (event.teachingTopic === 'graphShortest') {
            rows.push('距离/前驱：' + g.vertices.map(v =>
                `${v} ${event.distance[v] === null ? '不可达' : event.distance[v]}（前驱 ${event.parent[v] === null ? '—' : event.parent[v]}）`
            ).join('；'));
        }
        if (event.teachingTopic === 'graphTopo') {
            rows.push('入度：' + g.vertices.map(v => `${v}=${event.indegree[v]}`).join('，'));
        }
        info.textContent = rows.join('　');
        wrap.append(info);
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

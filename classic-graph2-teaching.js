(() => {
    const previous = { ...R1 };
    const lineSteps = {
        bipartite: { 1: 'init', 4: 'root', 6: 'pop', 7: 'check', 8: 'color', 9: 'conflict', 16: 'augmentTry', 18: 'match', 24: 'done' },
        scc: { 1: 'init', 3: 'visit', 5: 'finish', 8: 'reverseStart', 10: 'add', 14: 'component', 16: 'done' },
        cutBridge: { 1: 'init', 4: 'discover', 5: 'check', 9: 'lowUp', 10: 'cut', 11: 'bridge', 12: 'backLow', 14: 'rootCut', 17: 'done' },
        maze: { 1: 'init', 3: 'pop', 4: 'arrive', 8: 'enqueue', 12: 'unreachable', 14: 'backtrack', 15: 'done' },
        zeroOneBFS: { 3: 'init', 5: 'pop', 6: 'check', 8: 'relax', 9: 'enqueue', 13: 'done' },
        maxFlow: { 2: 'init', 4: 'empty', 7: 'search', 9: 'pop', 11: 'enqueue', 14: 'noPath', 16: 'bottleneck', 18: 'residual', 20: 'flow', 22: 'done' }
    };
    const topics = Object.keys(lineSteps);

    const teaching = {
        bipartite: {
            purpose: 'BFS 把无向图分成 0/1 两色：相邻顶点必须异色；同色相邻即不是二分图。合法二分图再从 0 色侧增广求最大匹配。',
            io: '无向简单图，vertices、mode undirected、edge 起点 终点；最多 12 顶点、30 边。输出染色合法性与匹配对，允许空图。',
            legend: '节点下方为当前颜色（0/1，未染色为空）；绿色描边为当前聚焦顶点，绿色填充为已染色；高亮边为当前匹配对。'
        },
        scc: {
            purpose: 'Kosaraju 两遍 DFS：先在原图按完成顺序记录顶点，再按完成序逆序在反图上收集强连通分量。',
            io: '仅有向图；vertices、mode directed、edge 起点 终点；最多 12 顶点、30 边。输出各强连通分量，允许空图、自环与非连通图。',
            legend: '绿色填充为本轮已访问顶点；节点下方为所属分量编号；第二遍在反图上沿反向边收集同一分量。'
        },
        cutBridge: {
            purpose: 'Tarjan 用 disc/low 时间戳识别割点与桥：子树回不到祖先上方即为割点；子树连不回当前顶点祖先即为桥。',
            io: '无向简单图，vertices、mode undirected、edge 起点 终点；最多 12 顶点、30 边。输出割点集合与桥集合，允许空图、自环与非连通图。',
            legend: '节点下方为发现序 disc；父边直接跳过；割点描边加粗，桥用高亮边标出；low 越小表示子树越早能回连。'
        },
        maze: {
            purpose: 'BFS 在 0/1 网格中按上→右→下→左顺序扩展，记录前驱；回溯前驱得到最短路径，终点不可达时路径为空。',
            io: 'grid 后为等长 0/1 行（0 可走、1 墙），最多 10×10；再写 start 行 列 与 end 行 列。空网格仅写 grid。',
            legend: '灰色为墙，蓝色描边为当前搜索格，绿色为已入队格，高亮路径为回溯得到的最短路径；行列从 0 开始。'
        },
        zeroOneBFS: {
            purpose: '0/1 权图用双端队列：0 权松弛后入队首，1 权松弛后入队尾，等价于按距离分层扩展；∞ 表示不可达。',
            io: 'vertices、mode directed/undirected、start 起点、edge 起点 终点 0|1 权；最多 10 顶点、30 边，非空图必须指定 start。',
            legend: '节点下方为当前距离，∞ 表示不可达；双端队列队头在左；0 权新顶点插队首，1 权新顶点排队尾。'
        },
        maxFlow: {
            purpose: 'Edmonds–Karp 在残量网络上反复 BFS 找最短增广路：按瓶颈推送流量，正向残量递减、反向残量递增；无可增广路时源侧集合即最小割。',
            io: 'vertices、mode directed、source 源点、sink 汇点、edge 起点 终点 容量(0–99)；最多 10 顶点、30 条有向边；空网络最大流为 0，拒绝自环与同向重复边。',
            legend: '边上方数字为当前残量；高亮边为增广路径；绿色填充为本轮 BFS 可达顶点；终态源侧与跨割边给出最小割容量。'
        }
    };

    for (const topic of topics) {
        const lines = Graph2Programs[topic];
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
            core.code[topic] = Graph2Programs[topic];
        }
    };

    R1.inputData = (topic, input) => topics.includes(topic) ? input : previous.inputData(topic, input);

    const fmtDist = d => d === null || d === undefined ? '∅' : d === Infinity ? '∞' : String(d);

    const auxiliary = event => {
        const g = event.graph;
        const parts = [];
        if (event.teachingTopic === 'bipartite') {
            parts.push('颜色：' + g.vertices.map(v =>
                `${v}=${event.color[v] === undefined ? '未染色' : event.color[v]}`).join('，'));
            if (event.queue && event.queue.length) parts.push(`队列 [${event.queue.join(' → ')}]（队头在左）`);
            const matching = (event.matching || []).map(([l, r]) => `${l}–${r}`);
            parts.push(`匹配 ${matching.join('、') || '无'}`);
            if (event.valid === false) parts.push('同色相邻：不是二分图，无法执行二分匹配');
        } else if (event.teachingTopic === 'scc') {
            parts.push(event.details ? event.details.split('；')[0] : `第 ${event.phase ?? '?'} 遍`);
            if (event.stack && event.stack.length) parts.push(`递归栈 [${event.stack.join(' → ')}]（栈顶在右）`);
            if (event.finish && event.finish.length) parts.push(`完成顺序 [${event.finish.join(' → ')}]`);
            if (event.working && event.working.length) parts.push(`当前分量 [${event.working.join(' → ')}]`);
            const done = (event.components || []).map(a => `[${a.join(', ')}]`);
            if (done.length) parts.push(`已完成 ${done.join(' ')}`);
        } else if (event.teachingTopic === 'cutBridge') {
            parts.push('发现序：' + g.vertices.map(v => `${v}=${event.disc[v] ?? '∅'}`).join('，'));
            parts.push('low：' + g.vertices.map(v => `${v}=${event.low[v] ?? '∅'}`).join('，'));
            if (event.stack && event.stack.length) parts.push(`递归栈 [${event.stack.join(' → ')}]`);
            parts.push(`割点 [${(event.cuts || []).join(', ') || '无'}]`);
            const bridges = (event.bridges || []).map(e => e.join('–'));
            parts.push(`桥 ${bridges.join('、') || '无'}`);
        } else if (event.teachingTopic === 'maxFlow') {
            parts.push(`当前最大流 ${event.value}`);
            if (event.queue && event.queue.length) parts.push(`BFS 队列 [${event.queue.join(' → ')}]（队头在左）`);
            const parent = g.vertices.map(v => `${v}=${event.parent[v] === null || event.parent[v] === undefined ? '—' : event.parent[v]}`);
            parts.push('前驱：' + parent.join('，'));
            if (event.path && event.path.length) parts.push(`增广路径 [${event.path.join(' → ')}]，瓶颈 ${event.delta}`);
            if (event.sourceSide && event.sourceSide.length) parts.push(`源侧 [${event.sourceSide.join(', ')}]，割容量 ${event.cutCapacity}`);
            const resid = g.vertices.flatMap(u => g.vertices.filter(v => event.residual && event.residual[u] && event.residual[u][v] > 0).map(v => `${u}→${v}:${event.residual[u][v]}`));
            if (resid.length) parts.push('残量：' + resid.join('，'));
        } else if (event.teachingTopic === 'zeroOneBFS') {
            parts.push(`双端队列 [${(event.deque || []).join(' → ')}]（队头在左）`);
            parts.push('距离：' + g.vertices.map(v => `${v}=${fmtDist(event.distance[v])}`).join('，'));
            parts.push('前驱：' + g.vertices.map(v => `${v}=${event.parent[v] === null || event.parent[v] === undefined ? '—' : event.parent[v]}`).join('，'));
        } else if (event.teachingTopic === 'maze') {
            return event.details || '当前步骤无额外变量；见上方网格与说明。';
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
        let pairs = event.teachingTopic === 'cutBridge' ? (event.bridges || []) : (event.chosen || event.matching || []);
        if (event.teachingTopic === 'maxFlow' && Array.isArray(event.path) && event.path.length > 1) {
            pairs = [];
            for (let i = 0; i + 1 < event.path.length; ++i) pairs.push([event.path[i], event.path[i + 1]]);
        }
        for (const e of pairs) {
            if (!Array.isArray(e)) continue;
            set.add([e[0], e[1]].sort().join('|'));
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
        const marker = svgEl('marker', { id: 'graph2-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5,
            markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, undefined);
        marker.append(svgEl('path', { d: 'M 0 0 L 10 5 L 0 10 z', class: 'graph-arrow' }));
        defs.append(marker);
        svg.append(defs);

        const coords = layout(g.vertices);
        const chosen = chosenSet(event);

        for (const [u, v] of g.edges) {
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
            svg.append(svgEl('path', { d, class: 'graph-edge' + (isChosen ? ' chosen' : ''),
                ...(g.directed ? { 'marker-end': 'url(#graph2-arrow)' } : {}) }));
            if (topic === 'maxFlow') {
                const hit = g.edges.find(e => e[0] === u && e[1] === v);
                const w0 = hit ? hit[2] : 0;
                const res = event.residual && event.residual[u] && event.residual[u][v] !== undefined ? event.residual[u][v] : w0;
                svg.append(svgEl('text', { x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 8, 'text-anchor': 'middle', class: 'ac-edge-label' }, `残${res}`));
            }
        }

        const compIndex = {};
        if (topic === 'scc') (event.components || []).forEach((comp, i) => comp.forEach(v => compIndex[v] = i + 1));
        const cuts = new Set(event.cuts || []);

        for (const v of g.vertices) {
            const [x, y] = coords[v];
            const cls = 'graph-node' + ((event.seen || []).includes(v) ? ' visited' : '') + (g.focus === v ? ' focused' : '') + (cuts.has(v) ? ' cut' : '');
            const node = svgEl('g', { 'data-object-id': `graph2-${v}`, transform: `translate(${x} ${y})` });
            node.append(svgEl('circle', { r: 19, class: cls }));
            node.append(svgEl('text', { x: 0, y: 5, 'text-anchor': 'middle', class: 'graph-label' }, v));
            let sub = '';
            if (topic === 'bipartite') sub = event.color[v] === undefined ? '' : String(event.color[v]);
            if (topic === 'scc') sub = compIndex[v] === undefined ? '' : `#${compIndex[v]}`;
            if (topic === 'cutBridge') sub = event.disc[v] === undefined || event.disc[v] === null ? '' : String(event.disc[v]);
            if (topic === 'zeroOneBFS') sub = fmtDist(event.distance[v]);
            if (sub) node.append(svgEl('text', { x: 0, y: 34, 'text-anchor': 'middle', class: 'ac-edge-label' }, sub));
            svg.append(node);
        }
        wrap.append(svg);
        return wrap;
    }

    function drawMaze(event) {
        const wrap = document.createElement('div');
        wrap.className = 'ac-wrap';
        const maze = event.maze;
        if (!maze) {
            const empty = document.createElement('span');
            empty.className = 'empty';
            empty.textContent = '空网格';
            wrap.append(empty);
            return wrap;
        }
        const grid = document.createElement('div');
        grid.className = 'maze-grid';
        grid.setAttribute('style', `grid-template-columns:repeat(${maze.columns},minmax(36px,1fr))`);
        const pathSet = new Set((event.path || []).map(p => `${p[0]},${p[1]}`));
        event.state.forEach((value, i) => {
            const cell = document.createElement('div');
            const r = Math.floor(i / maze.columns), c = i % maze.columns;
            cell.className = 'maze-cell' + (maze.grid[r][c] === '1' ? ' wall' : '') +
                (event.indices.includes(i) ? ' selected' : '') + (pathSet.has(`${r},${c}`) ? ' path' : '');
            cell.textContent = value;
            grid.append(cell);
        });
        wrap.append(grid);
        return wrap;
    }

    R1.draw = (event, host) => {
        if (!topics.includes(event.teachingTopic)) return previous.draw(event, host);
        R1.cancel();
        if (event.teachingTopic === 'maze') {
            host.replaceChildren(drawMaze(event));
            return Promise.allSettled([]);
        }
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

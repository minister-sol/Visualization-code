(() => {
    const previous = { ...R1 };
    const lineSteps = {
        lca: { 2: 'target', 3: 'leftReturn', 4: 'rightReturn', 5: 'ancestor', 6: 'return', 8: 'result' },
        huffman: { 1: 'init', 4: 'sort', 5: 'take', 6: 'merge', 10: 'codeLeaf', 14: 'result' }
    };
    const topics = Object.keys(lineSteps);

    const teaching = {
        lca: {
            purpose: '最近公共祖先（LCA）按层序索引识别节点，重复值也按索引区分。后序遍历二叉树：遇到目标节点即返回该节点；汇总左右子树返回，两侧各有一个目标时当前节点就是最近公共祖先，否则把非空一侧向上返回。',
            io: '首行为层序数组，null/# 表示空位，其余为 -999..999 整数，最多 31 个位置；第二行 `query 索引 索引`。输出最近公共祖先的层序索引与值；查询节点不存在、孤儿节点或空树查询被拒绝。',
            legend: '表格按层序位置展示节点值，空位记 ∅；当前遍历到的节点高亮。左右子树返回后，两目标分居两侧时当前节点判定为祖先；同节点查询返回自身。'
        },
        huffman: {
            purpose: '哈夫曼编码统计字符频率，反复取权重最小（并列按编号最小）的两个节点合并为内部节点，直到只剩一棵树；左分支记 0、右分支记 1，叶节点到根的路径即为无前缀冲突的二进制编码。',
            io: '输入最多 50 个可打印 ASCII 字符（不含换行）；输出各字符前缀编码与整串编码。空串编码为空、无字符编码；单个符号编码为 0。',
            legend: '每格为一个节点：叶节点标注字符与权重，内部节点标注合并权重；队列按权重、编号排序后取出两个合并。底部列出字符编码与位串，任一编码都不是另一编码的前缀。'
        }
    };

    for (const topic of topics) {
        const lines = FinalPrograms[topic];
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
            core.code[topic] = FinalPrograms[topic];
        }
    };

    R1.inputData = (topic, input) => topics.includes(topic) ? input : previous.inputData(topic, input);

    function cellText(value) {
        return value === null || value === undefined ? '∅' : String(value);
    }

    function describeLca(event) {
        const state = event.state || [];
        const parts = [`层序节点值 [${state.join(', ')}]`];
        if (event.focus !== null && event.focus !== undefined) {
            parts.push(`当前聚焦节点编号 #${event.focus}`);
        }
        if (event.result !== null && event.result !== undefined) {
            parts.push(`最近公共祖先索引 ${event.result}。`);
        } else {
            parts.push('最近公共祖先尚未确定。');
        }
        return parts.join('；');
    }

    function describeHuffman(event) {
        const queue = event.queue || [];
        const codes = event.codes || {};
        const parts = [`待合并队列节点编号 [${queue.join(', ')}]`];
        const entries = Object.entries(codes);
        parts.push(entries.length
            ? `编码 ${entries.map(([k, v]) => `${JSON.stringify(k)}=${v}`).join('，')}`
            : '尚未生成字符编码');
        parts.push(event.encoded ? `位串 ${event.encoded}` : '位串为空');
        return parts.join('；');
    }

    R1.describe = event => {
        if (!topics.includes(event.teachingTopic)) return previous.describe(event);
        switch (event.teachingTopic) {
            case 'lca': return describeLca(event);
            case 'huffman': return describeHuffman(event);
            default: return previous.describe(event);
        }
    };

    R1.cancel = () => { previous.cancel(); };
    R1.reset = () => { previous.reset(); R1.cancel(); };

    function tableShell(title, columns) {
        const table = document.createElement('table');
        table.className = 'dp-table';
        const head = document.createElement('tr');
        const th0 = document.createElement('th');
        th0.textContent = title;
        head.append(th0);
        columns.forEach(label => {
            const th = document.createElement('th');
            th.textContent = label;
            head.append(th);
        });
        table.append(head);
        return table;
    }

    function drawLca(event) {
        const wrap = document.createElement('div');
        wrap.className = 'dp-wrap';
        const tree = event.tree || [];
        const t = tableShell('层序', tree.map((_, i) => String(i)));
        const row = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = '值';
        row.append(th);
        tree.forEach(node => {
            const td = document.createElement('td');
            td.textContent = cellText(node?.value);
            if (event.focus === node?.id) td.className = 'active';
            row.append(td);
        });
        t.append(row);
        wrap.append(t);
        const note = document.createElement('p');
        note.className = 'stateHint';
        note.textContent = event.result === null || event.result === undefined
            ? '最近公共祖先尚未确定。'
            : `最近公共祖先索引 ${event.result}，值 ${cellText((event.tree || [])[event.result]?.value)}。`;
        wrap.append(note);
        return wrap;
    }

    function drawHuffman(event) {
        const wrap = document.createElement('div');
        wrap.className = 'dp-wrap';
        const grid = document.createElement('div');
        grid.className = 'sieve-grid';
        const nodes = event.nodesSnapshot || [];
        nodes.forEach(node => {
            const cell = document.createElement('div');
            const label = node.ch === null ? `#${node.id} 内部:${node.weight}` : `#${node.id} ${JSON.stringify(node.ch)}:${node.weight}`;
            cell.className = 'cell';
            cell.textContent = label;
            grid.append(cell);
        });
        if (nodes.length === 0) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.textContent = '空串';
            grid.append(cell);
        }
        wrap.append(grid);
        const note = document.createElement('p');
        note.className = 'stateHint';
        const codes = event.codes || {};
        const entries = Object.entries(codes);
        note.textContent = entries.length
            ? `编码 ${entries.map(([k, v]) => `${JSON.stringify(k)}=${v}`).join('，')}；位串 ${event.encoded || '空'}。`
            : '尚未生成字符编码。';
        wrap.append(note);
        return wrap;
    }

    R1.draw = (event, host) => {
        if (!topics.includes(event.teachingTopic)) return previous.draw(event, host);
        R1.cancel();
        let view;
        switch (event.teachingTopic) {
            case 'lca': view = drawLca(event); break;
            case 'huffman': view = drawHuffman(event); break;
            default: view = document.createElement('span');
        }
        host.replaceChildren(view);
        return Promise.resolve();
    };
})(globalThis);

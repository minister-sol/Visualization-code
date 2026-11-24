(() => {
    const previous = { ...R1 };
    const lineSteps = {
        segmentTree: { 1: 'init', 2: 'leaf', 3: 'build', 6: 'set', 7: 'update', 9: 'query', 11: 'leftAdd', 12: 'rightAdd', 13: 'moveUp', 15: 'result', 18: 'done' },
        fenwick: { 1: 'init', 3: 'add', 8: 'set', 11: 'query', 12: 'accumulate', 13: 'result', 16: 'done' }
    };
    const topics = Object.keys(lineSteps);

    const teaching = {
        segmentTree: {
            purpose: '迭代线段树把区间和拆成 O(log n) 个节点：叶子位于 n+i，父节点为两子之和；单点修改自叶向根更新祖先，区间查询左右边界交替收拢累加。',
            io: '首行最多 16 个整数（-999..999，可空）；后续每行 set 索引 值 或 sum 左 右（闭区间），最多 40 条；空数组不能操作，索引越界或左大于右拒收。',
            legend: '第一行为原数组，高亮为当前聚焦索引；第二行为线段树节点（1 起编号，叶子在 n+i）；下方为已出区间和结果。'
        },
        fenwick: {
            purpose: '树状数组用 lowbit 把前缀和拆成若干 BIT 节点：修改沿 p += lowbit(p) 向上累加差值，前缀查询沿 p -= lowbit(p) 向左累加。',
            io: '首行最多 16 个整数（-999..999，可空）；后续每行 set 索引 值 或 sum 索引（含该位置的前缀和），最多 40 条；空数组不能操作，索引越界拒收。',
            legend: '第一行为原数组；第二行为 BIT（下标从 1 开始）；高亮为当前操作索引；下方为已出前缀和结果。'
        }
    };

    for (const topic of topics) {
        const lines = RangePrograms[topic];
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
            core.code[topic] = RangePrograms[topic];
        }
    };

    R1.inputData = (topic, input) => topics.includes(topic) ? input : previous.inputData(topic, input);

    const auxiliary = event => {
        const topic = event.teachingTopic;
        const parts = [];
        const arr = event.state || [];
        parts.push('数组：' + (arr.length ? arr.map((v, i) => `${i}=${v}`).join('，') : '空'));
        const tree = topic === 'segmentTree' ? (event.treeArray || []) : (event.bit || []);
        const label = topic === 'segmentTree' ? '线段树' : 'BIT';
        parts.push(`${label}：` + (tree.length > 1 ? tree.map((v, i) => `${i}:${v}`).filter((_, i) => i > 0).join('，') : '空'));
        if (event.indices && event.indices.length) parts.push(`聚焦索引 [${event.indices.join(', ')}]`);
        if (event.result !== null && event.result !== undefined) parts.push(`当前查询结果 ${event.result}`);
        if (event.results && event.results.length) parts.push(`已出结果 [${event.results.join(', ')}]`);
        return parts.join('；');
    };

    R1.describe = event => {
        if (!topics.includes(event.teachingTopic)) return previous.describe(event);
        const aux = auxiliary(event);
        return aux || '当前步骤无额外变量；见上方图形与说明。';
    };

    R1.cancel = () => { previous.cancel(); };
    R1.reset = () => { previous.reset(); R1.cancel(); };

    function chipTable(title, prefix, values, labels, active) {
        const table = document.createElement('table');
        table.className = 'dp-table';
        const head = document.createElement('tr');
        const th0 = document.createElement('th');
        th0.textContent = title;
        head.append(th0);
        labels.forEach(label => {
            const th = document.createElement('th');
            th.textContent = label;
            head.append(th);
        });
        table.append(head);
        const tr = document.createElement('tr');
        const td0 = document.createElement('td');
        td0.textContent = '值';
        tr.append(td0);
        values.forEach((v, i) => {
            const td = document.createElement('td');
            td.textContent = v;
            td.dataset.objectId = `${prefix}-${labels[i]}`;
            if (active && active.includes(i)) td.classList.add('active');
            tr.append(td);
        });
        table.append(tr);
        return table;
    }

    function drawRange(event) {
        const topic = event.teachingTopic;
        const wrap = document.createElement('div');
        wrap.className = 'ac-wrap';
        const arr = event.state || [];
        if (!arr.length) {
            const empty = document.createElement('span');
            empty.className = 'empty';
            empty.textContent = '空数组';
            wrap.append(empty);
            return wrap;
        }
        wrap.append(chipTable('数组', 'range-a', arr, arr.map((_, i) => i), event.indices || []));
        const tree = topic === 'segmentTree' ? (event.treeArray || []) : (event.bit || []);
        if (tree.length > 1) {
            const vals = tree.slice(1);
            const labels = vals.map((_, i) => i + 1);
            wrap.append(chipTable(topic === 'segmentTree' ? '线段树' : 'BIT', topic === 'segmentTree' ? 'range-tree' : 'range-bit', vals, labels, []));
        }
        const results = event.results || [];
        if (results.length) {
            const line = document.createElement('p');
            line.textContent = `已出结果：[${results.join(', ')}]`;
            wrap.append(line);
        }
        return wrap;
    }

    R1.draw = (event, host) => {
        if (!topics.includes(event.teachingTopic)) return previous.draw(event, host);
        R1.cancel();
        host.replaceChildren(drawRange(event));
        return Promise.allSettled([]);
    };
})();

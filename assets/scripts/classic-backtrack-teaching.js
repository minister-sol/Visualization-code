(() => {
    const previous = { ...R1 };
    const lineSteps = {
        permutations: { 1: 'init', 3: 'found', 6: 'choose', 8: 'undo', 11: 'result' },
        queens: { 1: 'init', 3: 'found', 5: 'check', 6: 'place', 8: 'undo', 12: 'result' }
    };
    const topics = Object.keys(lineSteps);

    const teaching = {
        permutations: {
            purpose: "回溯枚举全排列：每次从剩余候选中选一个放入当前路径，递归填下一个位置；路径填满即得到一个排列，回退后尝试下一个候选。先升序排序并用「相邻相等且前一个未使用则跳过」的规则去除重复值的重复排列。",
            io: '输入最多 6 个 -999999 至 999999 的整数，逗号、中文逗号或空白分隔；空输入得到一个空排列。输出所有互不相同的全排列。',
            legend: '上排为排序后的候选值，被选中使用的候选高亮；下排为当前路径，按位置展示已选值；底部列出已找到的排列。撤销选择时路径末位退回候选。'
        },
        queens: {
            purpose: 'N 皇后按行回溯：每行从左到右尝试一列，与已有皇后不同列、不同两条对角线才放置；放下后递归下一行，一行无处可放就回退撤销，尝试下一列。',
            io: '输入 0 至 6 的整数 n（纯十进制数字）；输出所有合法布局，每个方案为各行皇后所在列索引。n=0 约定有一个空方案，n=2、3 无解。',
            legend: '棋盘格中 ♛ 为已放皇后，· 为空位；当前检查的行列高亮。右侧/下方文字记录当前各行皇后列索引与已找到方案数。'
        }
    };

    for (const topic of topics) {
        const lines = BacktrackPrograms[topic];
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
            core.code[topic] = BacktrackPrograms[topic];
        }
    };

    R1.inputData = (topic, input) => topics.includes(topic) ? input : previous.inputData(topic, input);

    function cellText(value) {
        return value === null || value === undefined ? '∅' : String(value);
    }

    function describePermutations(event) {
        const state = event.state || [];
        const path = event.path || [];
        const solutions = event.solutions || [];
        const parts = [`排序后候选值 [${state.join(', ')}]；当前路径 [${path.join(', ')}]`];
        parts.push(solutions.length ? `已得到 ${solutions.length} 个不同排列。` : '尚未得到完整排列。');
        return parts.join('；');
    }

    function describeQueens(event) {
        const state = event.state || [];
        const solutions = event.solutions || [];
        const parts = [`当前各行皇后列索引 [${state.join(', ')}]`];
        if (event.row !== undefined && event.column !== undefined) {
            parts.push(`正在检查行 ${event.row} 列 ${event.column}`);
        }
        parts.push(solutions.length ? `已找到 ${solutions.length} 个方案。` : '尚未找到合法方案。');
        return parts.join('；');
    }

    R1.describe = event => {
        if (!topics.includes(event.teachingTopic)) return previous.describe(event);
        switch (event.teachingTopic) {
            case 'permutations': return describePermutations(event);
            case 'queens': return describeQueens(event);
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

    function drawPermutations(event) {
        const wrap = document.createElement('div');
        wrap.className = 'dp-wrap';
        const state = event.state || [];
        const active = new Set(event.indices || []);
        const candidate = tableShell('候选', state.map((_, i) => String(i)));
        const rowC = document.createElement('tr');
        const thC = document.createElement('th');
        thC.textContent = '值';
        rowC.append(thC);
        state.forEach((value, i) => {
            const td = document.createElement('td');
            td.textContent = cellText(value);
            if (active.has(i)) td.className = 'active';
            rowC.append(td);
        });
        candidate.append(rowC);
        wrap.append(candidate);

        const path = event.path || [];
        const pathCols = state.map((_, i) => i < path.length ? String(i) : '');
        const pathTable = tableShell('路径', pathCols);
        const rowP = document.createElement('tr');
        const thP = document.createElement('th');
        thP.textContent = '值';
        rowP.append(thP);
        state.forEach((_, i) => {
            const td = document.createElement('td');
            td.textContent = i < path.length ? cellText(path[i]) : '·';
            rowP.append(td);
        });
        pathTable.append(rowP);
        wrap.append(pathTable);

        const note = document.createElement('p');
        note.className = 'stateHint';
        const solutions = event.solutions || [];
        note.textContent = solutions.length
            ? `已得到 ${solutions.length} 个排列：${solutions.map(s => '[' + s.join(', ') + ']').join('、')}。`
            : '尚未得到完整排列。';
        wrap.append(note);
        return wrap;
    }

    function drawQueens(event) {
        const wrap = document.createElement('div');
        wrap.className = 'dp-wrap';
        const grid = document.createElement('div');
        const table = event.table || [];
        const cols = table.length ? table[0].length : 0;
        grid.className = 'queens-board';
        if (cols) grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
        if (table.length === 0) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.textContent = '空棋盘';
            grid.append(cell);
        }
        table.forEach((row, r) => {
            row.forEach((mark, c) => {
                const cell = document.createElement('div');
                cell.className = 'cell' + (mark === '·' ? ' empty' : '')
                    + (event.row === r && event.column === c ? ' r1-comparing' : '');
                cell.textContent = mark;
                grid.append(cell);
            });
        });
        wrap.append(grid);
        const note = document.createElement('p');
        note.className = 'stateHint';
        const solutions = event.solutions || [];
        note.textContent = solutions.length
            ? `已找到 ${solutions.length} 个方案：${solutions.map(s => '[' + s.join(', ') + ']').join('、')}。`
            : '尚未找到合法方案。';
        wrap.append(note);
        return wrap;
    }

    R1.draw = (event, host) => {
        if (!topics.includes(event.teachingTopic)) return previous.draw(event, host);
        R1.cancel();
        let view;
        switch (event.teachingTopic) {
            case 'permutations': view = drawPermutations(event); break;
            case 'queens': view = drawQueens(event); break;
            default: view = document.createElement('span');
        }
        host.replaceChildren(view);
        return Promise.resolve();
    };
})(globalThis);

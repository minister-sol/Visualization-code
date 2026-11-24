(() => {
    const previous = { ...R1 };
    const lineSteps = {
        knapsack: { 1: 'init', 5: 'noItem', 6: 'compare', 9: 'result' },
        completeKnapsack: { 1: 'init', 5: 'noItem', 6: 'compare', 9: 'result' },
        coinChange: { 1: 'init', 2: 'base', 5: 'check', 6: 'relax', 10: 'result' },
        matrixChain: { 2: 'empty', 3: 'init', 7: 'interval', 9: 'split', 10: 'update', 15: 'result' },
        lcs: { 1: 'init', 4: 'match', 5: 'differ', 8: 'backtrack', 10: 'collect', 11: 'up', 12: 'left', 14: 'result' },
        lis: { 1: 'init', 4: 'compare', 8: 'endpoint', 10: 'backtrack', 11: 'result' },
        editDistance: { 1: 'init', 2: 'initRow', 3: 'initCol', 6: 'same', 7: 'differ', 10: 'result' }
    };
    const topics = Object.keys(lineSteps);

    const teaching = {
        knapsack: {
            purpose: '0/1 背包在容量受限的前提下选择物品，每件物品最多取一次。二维表 dp[i][w] 表示前 i 件物品、容量 w 的最大价值；不取沿用上一行，取则加上一行 w-weight 的价值，因此同一件物品不会被重复装入。',
            io: '首行 capacity 容量（0–20）；其后每行 item 重量 价值（重量 1–20，价值 0–999，最多 12 件）。输出 dp[n][capacity] 的最大价值；容量为 0 或无物品时价值为 0。',
            legend: '表格行为物品编号（0 表示尚未取物品），列为容量 0…capacity；高亮单元格为当前计算的 dp[i][w]。上一行是前 i-1 件的结果，同一行内不允许回取当前物品。'
        },
        completeKnapsack: {
            purpose: '完全背包中同一种物品可无限次选取。dp[i][w] 表示前 i 种物品、容量 w 的最大价值；不取沿用上一行，取则取同一行 w-weight 的值再加价值，因此当前物品可以在同一轮被重复装入。',
            io: '首行 capacity 容量（0–20）；其后每行 item 重量 价值（重量 1–20，价值 0–999，最多 12 种）。输出 dp[n][capacity] 的最大价值；容量为 0 或无物品时价值为 0。',
            legend: '表格行为物品种类编号，列为容量 0…capacity；高亮单元格为当前计算的 dp[i][w]。与 0/1 背包不同，取物品时参考的是同一行的 w-weight，一维等价写法容量须正序遍历。'
        },
        coinChange: {
            purpose: '硬币找零求凑出目标金额的最少硬币枚数，面额可无限次使用。dp[s] 为凑出金额 s 的最少枚数，不可达记为无穷大；dp[0]=0，枚举面额从可达金额转移取最小值。',
            io: '首行 amount 金额（0–50）；其后每行 coin 面额（1–50，最多 12 种）。输出最少枚数；目标金额无法凑出时显示无解。',
            legend: '一行状态为 dp[0]…dp[amount]，∞ 表示当前金额不可达；高亮列为正在检查的金额 s。候选来自 dp[s-coin]+1，面额可重复使用。'
        },
        matrixChain: {
            purpose: '矩阵链乘法求括号化方案，使标量乘法次数最少。dp[i][j] 为矩阵 A(i+1) 至 A(j+1) 相乘的最少次数；按区间长度递推，枚举切分点 k，代价为 dp[i][k]+dp[k+1][j]+dims[i]·dims[k+1]·dims[j+1]。',
            io: '输入 2–9 个 1–50 的整数表示相邻矩阵维度（逗号、中文逗号或空白分隔）；空输入表示空矩阵链。输出最少乘法次数与一种最优括号方案；代价相等时保留最左切分点。',
            legend: '上三角表格 dp[i][j] 为区间最少次数，第二张表 split[i][j] 记录切分位置 k（-1 表示单矩阵）；高亮区间 [i,j]。A1、A2… 为矩阵编号，× 表示两侧子链相乘。'
        },
        lcs: {
            purpose: '最长公共子序列（LCS）在两个字符串中找一个相对位置不变、但不要求连续的最长公共子序列。dp[i][j] 表示 A 前 i 个字符与 B 前 j 个字符的 LCS 长度；字符相同取左上加一，不同取上方与左方较大值，最后从右下角回溯出一个序列。',
            io: '两行 text 字符串，每行最多 15 个可打印 ASCII，均可为空；输出 LCS 长度与一个最长公共子序列。存在多个最优解时，回溯按上方不小于左方先向上走，只展示其中一个。',
            legend: '表格行为 A 前缀长度 i，列为 B 前缀长度 j；高亮单元格为当前计算的 dp[i][j]。回溯阶段从右下角出发，匹配字符加入序列，否则向上或向左移动。'
        },
        lis: {
            purpose: '最长严格递增子序列（LIS）求序列中最长的一段相对位置不变、且严格递增的子序列。dp[i] 为以 a[i] 结尾的最长长度，prev[i] 记录前驱下标；仅当 a[j] < a[i] 才接续，相等值不延长。',
            io: '最多 16 个 -999 至 999 的整数，逗号、中文逗号或空白分隔；空输入长度为 0。输出最长严格递增子序列长度与一个序列；并列保留最先出现的结尾。',
            legend: '第一行是原数组 a，第二行 dp[i] 是以 a[i] 结尾的最长长度，prev[i] 记录前驱下标；高亮当前比较的下标对。结尾选定后沿 prev 回溯得到序列。'
        },
        editDistance: {
            purpose: '编辑距离（Levenshtein）把串 A 变成串 B 的最少操作次数，插入、删除、替换代价均为 1。dp[i][j] 为 A 前 i 个字符与 B 前 j 个字符的距离；字符相同沿用左上，不同取删除上方、插入左方、替换左上三者最小再加一。',
            io: '两行 text 字符串，每行最多 15 个可打印 ASCII，均可为空；输出最少编辑次数。相同输入距离为 0，一空串到另一串的距离即另一串长度。',
            legend: '表格行为 A 前缀 i，列为 B 前缀 j；第一行/列分别为删空/插空代价。高亮单元格为当前计算的 dp[i][j]：上方对应删除 A 字符，左方对应插入 B 字符，左上对应替换。'
        }
    };

    for (const topic of topics) {
        const lines = DpPrograms[topic];
        const markers = {};
        lines.forEach((line, index) => {
            const match = line.match(/@(\w+)/);
            if (match) markers[match[1]] = index + 1;
        });
        R1.programs[topic] = { c: lines, cpp: lines };
        R1.mapping[topic] = { c: markers, cpp: markers };
        (R1.teaching ??= {})[topic] = teaching[topic];
    }

    function stripTag(row, tag) {
        if (row === tag) return '';
        return row.startsWith(tag + ' ') ? row.slice(tag.length + 1) : row;
    }
    function parseLcs(input) {
        const rows = (input || '').split(/\r?\n/);
        return { a: stripTag(rows[0] || '', 'text'), b: stripTag(rows[1] || '', 'text') };
    }

    R1.install = core => {
        previous.install(core);
        for (const topic of topics) {
            const trace = core[topic];
            core[topic] = input => {
                const parsed = (topic === 'lcs' || topic === 'editDistance') ? parseLcs(input) : null;
                return trace(input).map(event => ({
                    ...event,
                    teachingTopic: topic,
                    step: lineSteps[topic][event.line],
                    ...(parsed ? { a: parsed.a, b: parsed.b } : {})
                }));
            };
            core.code[topic] = DpPrograms[topic];
        }
    };

    R1.inputData = (topic, input) => topics.includes(topic) ? input : previous.inputData(topic, input);

    function cellText(value) {
        return value === Infinity ? '∞' : value === -Infinity ? '−∞' : (value === null || value === undefined ? '∅' : String(value));
    }

    function describeKnapsack(event, complete) {
        const i = event.row, w = event.column;
        const parts = [];
        parts.push(`dp[i][w] 表示前 ${i} 件${complete ? '种' : ''}物品、容量 ${w} 的最大价值；图中高亮第 ${i} 行第 ${w} 列单元格。`);
        if (event.result !== null && event.result !== undefined) {
            parts.push(`当前表右下角参考值 ${event.result}。`);
        }
        parts.push(complete
            ? '取当前物品时参考同一行 w-weight，物品可重复选取；不取则沿用上一行。'
            : '取当前物品时只能参考上一行 w-weight，每件物品最多取一次；不取则沿用上一行。');
        return parts.join('；');
    }

    function describeCoin(event) {
        const s = event.indices && event.indices[0];
        const parts = [`dp[s] 为凑出金额 ${s} 所需最少硬币枚数；图中高亮金额 ${s} 一列。`];
        const unreachable = event.dp && event.dp[s] === Infinity;
        parts.push(unreachable ? '该金额当前仍不可达（∞）。' : `该金额当前最少 ${event.dp[s]} 枚。`);
        parts.push('候选来自可达金额 s-coin 再加一枚；面额可无限次使用。');
        if (event.result === null) parts.push('目标金额无法凑出，结果为无解。');
        else if (event.result !== undefined) parts.push(`目标金额最少 ${event.result} 枚。`);
        return parts.join('；');
    }

    function describeMatrix(event) {
        const i = event.row, j = event.column;
        const parts = [`dp[i][j] 是矩阵 A${i + 1} 至 A${j + 1} 相乘的最少标量乘法次数；图中高亮区间 [${i}, ${j}]。`];
        if (event.split && event.split[i] && event.split[i][j] >= 0) {
            parts.push(`split[${i}][${j}] = ${event.split[i][j] + 1}，即在 A${event.split[i][j] + 1} 后切分。`);
        }
        if (event.result) {
            parts.push(`最终最少 ${event.result.cost} 次，方案 ${event.result.order || '空链'}。`);
        }
        return parts.join('；');
    }

    function describeLcs(event) {
        const i = event.row, j = event.column;
        const parts = [`dp[i][j] 是 A 前 ${i} 个字符与 B 前 ${j} 个字符的 LCS 长度；图中高亮第 ${i} 行第 ${j} 列单元格。`];
        if (event.sequence) parts.push(`当前回溯序列 ${event.sequence}。`);
        if (event.result !== null && event.result !== undefined) parts.push(`最长公共子序列长度 ${event.result}。`);
        return parts.join('；');
    }

    function describeEdit(event) {
        const i = event.row, j = event.column;
        const parts = [`dp[i][j] 是 A 前 ${i} 个字符与 B 前 ${j} 个字符前缀的编辑距离；高亮 [${i}, ${j}]。`];
        if (event.result !== null && event.result !== undefined) parts.push(`编辑距离为 ${event.result}。`);
        return parts.join('；');
    }

    function describeLis(event) {
        const parts = [];
        if (event.indices && event.indices.length === 2) {
            parts.push(`比较索引 ${event.indices[0]} 和 ${event.indices[1]}；仅当 a[${event.indices[0]}] < a[${event.indices[1]}] 才允许接续。`);
        } else if (event.indices && event.indices.length === 1) {
            parts.push(`当前关注索引 ${event.indices[0]}。`);
        }
        if (Array.isArray(event.dp)) parts.push(`长度 dp [${event.dp.join(', ')}]。`);
        if (Array.isArray(event.sequence) && event.sequence.length) parts.push(`当前序列 [${event.sequence.join(', ')}]。`);
        if (event.result !== undefined) parts.push(`最长严格递增子序列长度 ${event.result}。`);
        return parts.join('；');
    }

    R1.describe = event => {
        if (!topics.includes(event.teachingTopic)) return previous.describe(event);
        switch (event.teachingTopic) {
            case 'knapsack': return describeKnapsack(event, false);
            case 'completeKnapsack': return describeKnapsack(event, true);
            case 'coinChange': return describeCoin(event);
            case 'matrixChain': return describeMatrix(event);
            case 'lcs': return describeLcs(event);
            case 'lis': return describeLis(event);
            case 'editDistance': return describeEdit(event);
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

    function drawKnapsack(event, complete) {
        const wrap = document.createElement('div');
        wrap.className = 'dp-wrap';
        const table = event.table || [];
        const cap = table[0] ? table[0].length - 1 : 0;
        const columns = Array.from({ length: cap + 1 }, (_, w) => `w=${w}`);
        const t = tableShell(complete ? '种\\w' : '件\\w', columns);
        table.forEach((row, i) => {
            const tr = document.createElement('tr');
            const th = document.createElement('th');
            th.textContent = `i=${i}`;
            tr.append(th);
            row.forEach((value, w) => {
                const td = document.createElement('td');
                td.textContent = cellText(value);
                if (i === event.row && w === event.column) td.classList.add('active');
                tr.append(td);
            });
            t.append(tr);
        });
        wrap.append(t);
        if (event.result !== null && event.result !== undefined) {
            const note = document.createElement('p');
            note.className = 'stateHint';
            note.textContent = `最大价值 ${event.result}`;
            wrap.append(note);
        }
        return wrap;
    }

    function drawCoin(event) {
        const wrap = document.createElement('div');
        wrap.className = 'dp-wrap';
        const state = event.state || [];
        const columns = state.map((_, s) => `s=${s}`);
        const t = tableShell('金额', columns);
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = '枚数';
        tr.append(th);
        state.forEach((value, s) => {
            const td = document.createElement('td');
            td.textContent = cellText(value);
            if (event.indices && event.indices[0] === s) td.classList.add('active');
            tr.append(td);
        });
        t.append(tr);
        wrap.append(t);
        const note = document.createElement('p');
        note.className = 'stateHint';
        note.textContent = event.result === null ? '目标金额不可达（无解）。' : `最少 ${event.result} 枚硬币。`;
        wrap.append(note);
        return wrap;
    }

    function drawMatrix(event) {
        const wrap = document.createElement('div');
        wrap.className = 'dp-wrap';
        const table = event.table || [];
        const n = table.length;
        if (!n) {
            const empty = document.createElement('span');
            empty.className = 'empty';
            empty.textContent = '空矩阵链：乘法次数为 0，无括号方案。';
            wrap.append(empty);
            return wrap;
        }
        const columns = Array.from({ length: n }, (_, i) => `A${i + 1}`);
        const t = tableShell('i\\j', columns);
        table.forEach((row, i) => {
            const tr = document.createElement('tr');
            const th = document.createElement('th');
            th.textContent = `A${i + 1}`;
            tr.append(th);
            row.forEach((value, j) => {
                const td = document.createElement('td');
                td.textContent = cellText(value);
                if (i === event.row && j === event.column) td.classList.add('active');
                tr.append(td);
            });
            t.append(tr);
        });
        wrap.append(t);

        if (event.split) {
            const s = tableShell('切分 k', columns);
            event.split.forEach((row, i) => {
                const tr = document.createElement('tr');
                const th = document.createElement('th');
                th.textContent = `A${i + 1}`;
                tr.append(th);
                row.forEach((value, j) => {
                    const td = document.createElement('td');
                    td.textContent = value < 0 ? '—' : `k=${value + 1}`;
                    if (i === event.row && j === event.column) td.classList.add('active');
                    tr.append(td);
                });
                s.append(tr);
            });
            wrap.append(s);
        }
        if (event.result) {
            const note = document.createElement('p');
            note.className = 'stateHint';
            note.textContent = `最少 ${event.result.cost} 次标量乘法；方案 ${event.result.order}`;
            wrap.append(note);
        }
        return wrap;
    }

    function drawLcs(event) {
        const wrap = document.createElement('div');
        wrap.className = 'dp-wrap';
        const table = event.table || [];
        const a = event.a || '', b = event.b || '';
        const t = tableShell('A\\B', Array.from(b));
        table.forEach((row, i) => {
            const tr = document.createElement('tr');
            const th = document.createElement('th');
            th.textContent = i === 0 ? '∅' : a[i - 1];
            tr.append(th);
            row.forEach((value, j) => {
                const td = document.createElement('td');
                td.textContent = cellText(value);
                if (i === event.row && j === event.column) td.classList.add('active');
                tr.append(td);
            });
            t.append(tr);
        });
        wrap.append(t);
        const note = document.createElement('p');
        note.className = 'stateHint';
        note.textContent = event.result === null || event.result === undefined ? '' : `长度 ${event.result}；序列 ${event.sequence || '空'}。`;
        wrap.append(note);
        return wrap;
    }

    function drawEdit(event) {
        const wrap = document.createElement('div');
        wrap.className = 'dp-wrap';
        const table = event.table || [];
        const a = event.a || '', b = event.b || '';
        const t = tableShell('A\\B', Array.from(b));
        table.forEach((row, i) => {
            const tr = document.createElement('tr');
            const th = document.createElement('th');
            th.textContent = i === 0 ? '∅' : a[i - 1];
            tr.append(th);
            row.forEach((value, j) => {
                const td = document.createElement('td');
                td.textContent = cellText(value);
                if (i === event.row && j === event.column) td.classList.add('active');
                tr.append(td);
            });
            t.append(tr);
        });
        wrap.append(t);
        const note = document.createElement('p');
        note.className = 'stateHint';
        note.textContent = event.result === null || event.result === undefined ? '' : `编辑距离 ${event.result}。`;
        wrap.append(note);
        return wrap;
    }

    function drawLis(event) {
        const wrap = document.createElement('div');
        wrap.className = 'dp-wrap';
        const a = event.state || [];
        if (!a.length) {
            const empty = document.createElement('span');
            empty.className = 'empty';
            empty.textContent = '空数组：最长严格递增子序列长度为 0。';
            wrap.append(empty);
            return wrap;
        }
        const t = tableShell('a', a.map((_, i) => `[${i}]`));
        const rowVals = document.createElement('tr');
        const thV = document.createElement('th');
        thV.textContent = '值';
        rowVals.append(thV);
        a.forEach((value, i) => {
            const td = document.createElement('td');
            td.textContent = value;
            if (event.indices.includes(i)) td.classList.add('active');
            rowVals.append(td);
        });
        t.append(rowVals);
        const dp = event.dp || [];
        const rowDp = document.createElement('tr');
        const thD = document.createElement('th');
        thD.textContent = 'dp';
        rowDp.append(thD);
        dp.forEach((value, i) => {
            const td = document.createElement('td');
            td.textContent = value;
            if (event.indices.includes(i)) td.classList.add('active');
            rowDp.append(td);
        });
        t.append(rowDp);
        wrap.append(t);
        const note = document.createElement('p');
        note.className = 'stateHint';
        note.textContent = `长度 ${event.result}；序列 [${(event.sequence || []).join(', ')}]。`;
        wrap.append(note);
        return wrap;
    }

    R1.draw = (event, host) => {
        if (!topics.includes(event.teachingTopic)) return previous.draw(event, host);
        R1.cancel();
        let view;
        switch (event.teachingTopic) {
            case 'knapsack': view = drawKnapsack(event, false); break;
            case 'completeKnapsack': view = drawKnapsack(event, true); break;
            case 'coinChange': view = drawCoin(event); break;
            case 'matrixChain': view = drawMatrix(event); break;
            case 'lcs': view = drawLcs(event); break;
            case 'lis': view = drawLis(event); break;
            case 'editDistance': view = drawEdit(event); break;
            default: view = document.createElement('span');
        }
        host.replaceChildren(view);
        return Promise.resolve();
    };
})(globalThis);

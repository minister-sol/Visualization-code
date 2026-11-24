(() => {
    const previous = { ...R1 };
    const lineSteps = {
        gcd: { 1: 'init', 3: 'remainder', 4: 'updateA', 5: 'updateB', 7: 'result' },
        extGcd: { 1: 'init', 3: 'quotient', 4: 'updateRemainder', 5: 'updateX', 6: 'updateY', 8: 'result' },
        sieve: { 1: 'init', 2: 'zeroMark', 3: 'oneMark', 5: 'checkPrime', 6: 'exclude', 9: 'result' },
        fastPower: { 2: 'init', 4: 'multiply', 5: 'square', 6: 'halve', 8: 'result' }
    };
    const topics = Object.keys(lineSteps);

    const teaching = {
        gcd: {
            purpose: '最大公约数（GCD）是两个整数公共约数中最大的非负整数。欧几里得算法反复用余数替换较大数：gcd(a, b) = gcd(b, a mod b)，直到余数为 0，剩余非负数即结果。',
            io: '输入两个 -999999 至 999999 的整数，逗号、中文逗号或空白分隔；负数先取绝对值。输出最大公约数；两数均为 0 时约定结果为 0。',
            legend: '两个槽位依次为当前的 a、b（均为绝对值）；余数 remainder = a mod b 求出后，a 换成原 b，b 换成余数。高亮当前更新的槽位；最终 b 为 0 时 a 即 gcd。'
        },
        extGcd: {
            purpose: '扩展欧几里得算法在求 gcd 的同时求出贝祖系数 x、y，使 a·x + b·y = gcd(a, b)。余数递推的同时维护两对系数 (oldX, x) 与 (oldY, y)，最后按原输入符号翻转输出系数。',
            io: '输入两个 -999999 至 999999 的整数，逗号、中文逗号或空白分隔；输出 gcd 与满足贝祖等式的 x、y。(0,0) 的 gcd 约定为 0。',
            legend: '上排为余数对 oldR、r；下排为当前系数 x、y（已按原输入符号翻转展示）。商 q = ⌊oldR / r⌋，余数与系数同步按 old − q·new 递推；余数 r 为 0 时 oldR 即 gcd。'
        },
        sieve: {
            purpose: '埃拉托斯特尼筛法一次性求出 0 到 n 的全部素数：先把所有数标为候选，再从最小素数起，把它的倍数逐个排除，留下的候选即素数。',
            io: '输入一个 0 至 100 的非负整数 n（纯十进制数字）；输出 2 到 n 之间的全部素数。n 为 0 或 1 时结果为空。',
            legend: '每格对应一个数字，“候选”为浅色格、“排除”为暗色格；当前检查或排除的数字高亮。从 p² 开始、步长 p 划去倍数；0 与 1 一开始就排除。'
        },
        fastPower: {
            purpose: '快速幂用二进制指数把 a^e mod m 拆成平方与累乘：指数为奇数时把当前底数乘进结果，底数平方取模，指数整除 2，避免逐次乘到 e 次。',
            io: '输入底数（-999999 至 999999）、指数（0 至 1000000）、模数（1 至 1000000），逗号、中文逗号或空白分隔；输出模幂结果。模数必须 ≥ 1，模 0 被拒绝。',
            legend: '三个槽位依次为当前底数余数 a、剩余指数 e、当前结果 result；先把底数对模数取非负余数，结果初始为 1 mod 模数。奇数位累乘、底数平方、指数折半交替进行。'
        }
    };

    for (const topic of topics) {
        const lines = MathPrograms[topic];
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
            core.code[topic] = MathPrograms[topic];
        }
    };

    R1.inputData = (topic, input) => topics.includes(topic) ? input : previous.inputData(topic, input);

    function cellText(value) {
        return value === null || value === undefined ? '∅' : String(value);
    }

    function describeGcd(event) {
        const parts = [`当前两个绝对值为 a = ${event.state[0]}，b = ${event.state[1]}；图中两个槽位依次对应 a、b。`];
        if (event.step === 'result' && event.result !== null && event.result !== undefined) {
            parts.push(`最大公约数为 ${event.result}。`);
        }
        return parts.join('；');
    }

    function describeExtGcd(event) {
        const parts = [`余数对 oldR = ${event.state[0]}，r = ${event.state[1]}；图中上排两个槽位依次对应 oldR、r。`];
        if (event.x !== undefined) parts.push(`当前系数 x = ${event.x}，y = ${event.y}；下排两个槽位依次对应 x、y。`);
        if (event.step === 'result' && event.gcd !== undefined) parts.push(`贝祖等式：a·x + b·y = ${event.gcd}。`);
        return parts.join('；');
    }

    function describeSieve(event) {
        const parts = [`筛子覆盖 0 到 ${(event.state || []).length - 1}；每格状态为候选或排除。`];
        if (event.indices && event.indices.length) {
            parts.push(`当前数字 ${event.indices[0]} 被高亮检查。`);
        }
        if (Array.isArray(event.result)) {
            const final = event.step === 'result';
            if (event.result.length) {
                parts.push(final
                    ? `目前保留的素数：[${event.result.join(', ')}]。`
                    : `目前尚未排除的候选：[${event.result.join(', ')}]。`);
            } else {
                parts.push(final ? '本范围内还没有素数。' : '目前还没有保留下来的候选。');
            }
        }
        return parts.join('；');
    }

    function describeFastPower(event) {
        const state = event.state || [];
        const parts = [`当前底数余数 a = ${state[0]}，剩余指数 e = ${state[1]}，当前结果 result = ${state[2]}；图中三个槽位依次对应 a、e、result。`];
        if (event.step === 'result' && event.result !== undefined) {
            parts.push(`模幂结果为 ${event.result}。`);
        } else if (event.result !== undefined) {
            parts.push(`当前累乘值 result = ${event.result}。`);
        }
        return parts.join('；');
    }

    R1.describe = event => {
        if (!topics.includes(event.teachingTopic)) return previous.describe(event);
        switch (event.teachingTopic) {
            case 'gcd': return describeGcd(event);
            case 'extGcd': return describeExtGcd(event);
            case 'sieve': return describeSieve(event);
            case 'fastPower': return describeFastPower(event);
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

    function drawGcd(event) {
        const wrap = document.createElement('div');
        wrap.className = 'dp-wrap';
        const state = event.state || [];
        const t = tableShell('变量', ['a', 'b']);
        const row = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = '值';
        row.append(th);
        state.forEach((value, i) => {
            const td = document.createElement('td');
            td.textContent = cellText(value);
            row.append(td);
        });
        t.append(row);
        wrap.append(t);
        const note = document.createElement('p');
        note.className = 'stateHint';
        note.textContent = event.step === 'result'
            ? `最大公约数 ${event.result}。`
            : `当前 a = ${state[0]}，b = ${state[1]}，余数尚未递推完成。`;
        wrap.append(note);
        return wrap;
    }

    function drawExtGcd(event) {
        const wrap = document.createElement('div');
        wrap.className = 'dp-wrap';
        const state = event.state || [];
        const t = tableShell('变量', ['oldR', 'r']);
        const rowR = document.createElement('tr');
        const thR = document.createElement('th');
        thR.textContent = '余数';
        rowR.append(thR);
        state.forEach((value, i) => {
            const td = document.createElement('td');
            td.textContent = cellText(value);
            rowR.append(td);
        });
        t.append(rowR);
        const rowC = document.createElement('tr');
        const thC = document.createElement('th');
        thC.textContent = '系数';
        rowC.append(thC);
        [event.x, event.y].forEach(value => {
            const td = document.createElement('td');
            td.textContent = cellText(value);
            rowC.append(td);
        });
        t.append(rowC);
        wrap.append(t);
        const note = document.createElement('p');
        note.className = 'stateHint';
        note.textContent = event.step === 'result'
            ? `gcd = ${event.gcd}；贝祖等式 a·x + b·y = ${event.gcd}。`
            : `当前 oldR = ${state[0]}，r = ${state[1]}；余数与系数正在同步递推，暂不列贝祖等式。`;
        wrap.append(note);
        return wrap;
    }

    function drawSieve(event) {
        const wrap = document.createElement('div');
        wrap.className = 'dp-wrap';
        const grid = document.createElement('div');
        grid.className = 'sieve-grid';
        const state = event.state || [];
        const active = new Set(event.indices || []);
        state.forEach((entry, i) => {
            const cell = document.createElement('div');
            const excluded = entry.endsWith('排除');
            cell.className = 'cell' + (excluded ? ' empty' : '') + (active.has(i) ? ' r1-comparing' : '');
            cell.textContent = String(i);
            grid.append(cell);
        });
        wrap.append(grid);
        const note = document.createElement('p');
        note.className = 'stateHint';
        const primes = event.result || [];
        const final = event.step === 'result';
        note.textContent = primes.length
            ? final ? `素数：[${primes.join(', ')}]。` : `候选：[${primes.join(', ')}]。`
            : final ? '本范围内无素数。' : '目前尚未保留候选。';
        wrap.append(note);
        return wrap;
    }

    function drawFastPower(event) {
        const wrap = document.createElement('div');
        wrap.className = 'dp-wrap';
        const state = event.state || [];
        const t = tableShell('变量', ['a', 'e', 'result']);
        const row = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = '值';
        row.append(th);
        state.forEach(value => {
            const td = document.createElement('td');
            td.textContent = cellText(value);
            row.append(td);
        });
        t.append(row);
        wrap.append(t);
        const note = document.createElement('p');
        note.className = 'stateHint';
        note.textContent = event.step === 'result'
            ? `模幂结果 ${event.result}。`
            : `当前累乘值 ${event.result}。`;
        wrap.append(note);
        return wrap;
    }

    R1.draw = (event, host) => {
        if (!topics.includes(event.teachingTopic)) return previous.draw(event, host);
        R1.cancel();
        let view;
        switch (event.teachingTopic) {
            case 'gcd': view = drawGcd(event); break;
            case 'extGcd': view = drawExtGcd(event); break;
            case 'sieve': view = drawSieve(event); break;
            case 'fastPower': view = drawFastPower(event); break;
            default: view = document.createElement('span');
        }
        host.replaceChildren(view);
        return Promise.resolve();
    };
})(globalThis);

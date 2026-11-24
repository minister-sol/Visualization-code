(() => {
    const previous = { ...R1 };
    const lineSteps = {
        kmp: { 1: 'start', 3: 'prefix_fail', 4: 'prefix_match', 5: 'pi_write', 8: 'text_fail', 9: 'text_match', 10: 'match', 12: 'done' },
        zFunction: { 1: 'start', 3: 'reuse', 4: 'compare', 5: 'increment', 7: 'interval', 9: 'done' },
        rabinKarp: { 1: 'start', 2: 'long', 5: 'pattern_hash', 6: 'window_hash', 7: 'power', 10: 'check', 12: 'remove', 13: 'add', 16: 'done' },
        palindrome: { 1: 'start', 4: 'center', 5: 'equal', 6: 'update', 7: 'expand', 11: 'done' },
        stringCompare: { 1: 'start', 3: 'prefix_fail', 4: 'prefix_match', 5: 'pi_write', 10: 'naive_compare', 11: 'naive_match', 15: 'kmp_compare', 16: 'kmp_match', 17: 'kmp_no_prefix', 18: 'kmp_fail', 20: 'kmp_found', 22: 'done' }
    };
    const topics = Object.keys(lineSteps);

    const teaching = {
        kmp: {
            purpose: 'KMP 用前缀表在失配时回退到已匹配前缀，避免从头比较，整体 O(n+m)。',
            io: '两行 text 文本与 pattern 模式，各最多 30 个 ASCII，模式不可空；返回含重叠的全部匹配起始下标。',
            legend: 'pi[i] 是 pattern[0..i] 的最长相等真前缀/后缀长度；失配时 j=pi[j-1]；整串匹配后按 pi[m-1] 继续找重叠。'
        },
        zFunction: {
            purpose: 'Z 函数求每个位置与原文前缀的最长公共前缀长度，z[0] 约定为 0；可用于模式匹配与周期检测。',
            io: '一行 text，最多 50 个可打印 ASCII，允许空串；输出 Z 数组。',
            legend: '[left,right] 是已知与前缀匹配的最右区间；i 落在区间内时先复用 min(right-i+1, z[i-left])，再向外朴素比较。'
        },
        rabinKarp: {
            purpose: '滚动哈希用固定基数与模数在窗口间递推哈希，哈希相等后再逐字符核对原文，避免哈希冲突误报。',
            io: '两行 text 与 pattern，各最多 50 个可打印 ASCII，模式不可空；输出匹配起始下标。',
            legend: 'base=31，mod=101；power 是最高位权；移出旧字符、加入新字符完成窗口滑动；哈希相等必须再核对原文。'
        },
        palindrome: {
            purpose: '中心扩展枚举每个奇数与偶数中心，向两侧比对找回文，O(n²) 且不遗漏长度 1 的回文。',
            io: '一行 text，最多 30 个可打印 ASCII，允许空串；输出最长回文子串，同长度保留最早发现者。',
            legend: 'offset=0 为奇数中心（单点），offset=1 为偶数中心（相邻两点）；left/right 相等则继续外扩，记录更长者。'
        },
        stringCompare: {
            purpose: '同一文本与模式下并排跑朴素匹配与 KMP，对比两者匹配下标与比较次数，直观看出前缀表减少的重复比较。',
            io: '两行 text 与 pattern，各最多 30 个可打印 ASCII，模式不可空；返回重叠匹配，比较次数不含前缀表构造。',
            legend: '朴素逐窗口从头比；KMP 用 pi 在失配时回退；两侧匹配结果必须一致，KMP 比较次数通常更少。'
        }
    };

    for (const topic of topics) {
        const lines = StringsPrograms[topic];
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
    const oneLine = topic => topic === 'zFunction' || topic === 'palindrome';
    function parseInput(topic, input) {
        const rows = (input || '').split(/\r?\n/);
        if (oneLine(topic)) return { text: stripTag(rows[0] || '', 'text'), pattern: '' };
        return { text: stripTag(rows[0] || '', 'text'), pattern: stripTag(rows[1] || '', 'pattern') };
    }
    function toStdin(topic, input) {
        const rows = (input || '').split(/\r?\n/);
        if (oneLine(topic)) return stripTag(rows[0] || '', 'text');
        return stripTag(rows[0] || '', 'text') + '\n' + stripTag(rows[1] || '', 'pattern');
    }

    R1.install = core => {
        previous.install(core);
        for (const topic of topics) {
            const trace = core[topic];
            core[topic] = input => {
                const parsed = parseInput(topic, input);
                return trace(input).map(event => ({
                    ...event,
                    teachingTopic: topic,
                    step: lineSteps[topic][event.line],
                    text: parsed.text,
                    pattern: parsed.pattern
                }));
            };
            core.code[topic] = StringsPrograms[topic];
        }
    };

    R1.inputData = (topic, input) => topics.includes(topic) ? toStdin(topic, input) : previous.inputData(topic, input);

    const auxiliary = {
        kmp: event => event.pi ? `pi [${event.pi.join(', ')}]` : '',
        zFunction: event => event.z ? `Z [${event.z.join(', ')}]` : '',
        rabinKarp: event => `模式哈希 ${event.patternHash ?? '—'}，窗口哈希 ${event.windowHash ?? '—'}，权 ${event.power ?? '—'}`,
        palindrome: event => `当前最长回文 ${JSON.stringify(event.result ?? '')}`,
        stringCompare: event => {
            const parts = [];
            if (Array.isArray(event.pi)) parts.push(`pi [${event.pi.join(', ')}]`);
            parts.push(`朴素匹配 [${(event.naiveMatches || []).join(', ')}] / ${event.naiveComparisons ?? '—'} 次`);
            parts.push(`KMP 匹配 [${(event.kmpMatches || []).join(', ')}] / ${event.kmpComparisons ?? '—'} 次`);
            return parts.join('；');
        }
    };
    R1.describe = event => {
        if (!topics.includes(event.teachingTopic)) return previous.describe(event);
        const parts = [];
        const aux = auxiliary[event.teachingTopic](event);
        if (aux) parts.push(aux);
        if (Array.isArray(event.matches)) parts.push(`匹配位置 [${event.matches.join(', ')}]`);
        return parts.length ? parts.join('；') : '当前步骤无额外变量；见上方图形与说明。';
    };
    R1.describeItems = event => {
        if (!topics.includes(event.teachingTopic)) return previous.describeItems ? previous.describeItems(event) : [];
        if (event.teachingTopic === 'rabinKarp') return [
            {name:'patternHash', value:event.patternHash ?? '—', meaning:'模式串的滚动哈希（base=31，mod=101）', graphic:'模式行'},
            {name:'windowHash', value:event.windowHash ?? '—', meaning:'当前窗口的滚动哈希', graphic:'文本中被绿色标出的窗口'},
            {name:'power', value:event.power ?? '—', meaning:'窗口最高位字符的权，用于移出旧字符', graphic:'窗口右端'},
            {name:'matches', value:Array.isArray(event.matches) && event.matches.length ? event.matches.join(', ') : '无', meaning:'已确认的匹配起始下标（哈希与原文都相等）', graphic:'文本窗口起点'}
        ];
        if (event.teachingTopic === 'zFunction') return [
            {name:'z', value:Array.isArray(event.z) ? '[' + event.z.join(', ') + ']' : '—', meaning:'每个位置与前缀的最长公共前缀长度，z[0] 约定为 0', graphic:'Z 行对应字符下标'}
        ];
        if (event.teachingTopic === 'kmp' || event.teachingTopic === 'stringCompare') return [
            {name:'pi', value:Array.isArray(event.pi) ? '[' + event.pi.join(', ') + ']' : '—', meaning:'前缀表：pattern[0..i] 的最长相等真前缀/后缀长度', graphic:'pi 行对应模式下标'},
            {name:'matches', value:Array.isArray(event.matches) && event.matches.length ? event.matches.join(', ') : '无', meaning:'匹配起始下标（含重叠）', graphic:'文本中被绿色标出的窗口'}
        ];
        if (event.teachingTopic === 'palindrome') return [
            {name:'result', value:JSON.stringify(event.result ?? ''), meaning:'当前最长回文子串', graphic:'文本中连续的同色字符'}
        ];
        return [];
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

    function windowStartOf(event, patternLength) {
        const indices = event.indices || [];
        if (patternLength && indices.length === patternLength && indices.every((v, k) => v === indices[0] + k)) return indices[0];
        if (patternLength && indices.length === 1) return indices[0];
        return 0;
    }
    R1.draw = (event, host) => {
        if (!topics.includes(event.teachingTopic)) return previous.draw(event, host);
        R1.cancel();
        const wrap = document.createElement('div');
        wrap.className = 'ac-wrap';
        const chars = [...(event.text || [])];
        const pattern = [...(event.pattern || [])];
        const aux = event.teachingTopic === 'zFunction' ? event.z
            : (event.teachingTopic === 'kmp' || event.teachingTopic === 'stringCompare') ? event.pi : null;
        const payload = Math.max(chars.length, pattern.length, aux ? aux.length : 0, 1);
        const hostW = host.clientWidth || 600;
        const labelW = 78, colW = 32, rowH = 42;
        const perLine = Math.max(4, Math.floor((hostW - labelW - 12) / colW));
        const textRows = Math.max(1, Math.ceil(chars.length / perLine));
        const windowStart = windowStartOf(event, pattern.length);
        const patternRow0 = Math.floor(windowStart / perLine);
        const patternRows = pattern.length ? Math.floor((windowStart + pattern.length - 1) / perLine) - patternRow0 + 1 : 0;
        const auxRows = aux ? Math.max(1, Math.ceil(aux.length / perLine)) : 0;
        const width = labelW + perLine * colW + 8;
        const height = 30 + textRows * rowH + (pattern.length ? patternRows * rowH : 0) + (aux ? auxRows * rowH : 0) + 10;
        const svg = svgEl('svg', {viewBox:`0 0 ${width} ${height}`, width, height, role:'img', 'aria-label':'文本、模式与辅助数组：索引与字符槽对齐'});
        svg.setAttribute('style', 'display:block;width:100%;height:auto;max-width:100%');
        wrap.append(svg);

        const cell = (prefix, key, ch, x, y, active) => {
            const g = svgEl('g', {'data-object-id':prefix + '-' + key, transform:`translate(${x} ${y})`});
            g.append(svgEl('rect', {width:28, height:30, rx:5,
                class:active ? 'r1-selected' : 'r1-object'}));
            g.append(svgEl('text', {x:14, y:20, 'text-anchor':'middle', 'font-size':13}, ch === '' ? '∅' : String(ch)));
            svg.append(g);
        };
        const indexLabel = (i, x, y) => svg.append(svgEl('text', {x:x + 14, y, 'text-anchor':'middle', 'font-size':13}, '[' + i + ']'));

        const textTop = 34;
        for (let i = 0; i < chars.length; ++i) {
            const row = Math.floor(i / perLine), col = i % perLine;
            cell('text', i, chars[i], labelW + col * colW, textTop + row * rowH, (event.indices || []).includes(i));
            indexLabel(i, labelW + col * colW, textTop + row * rowH + 42);
        }
        svg.append(svgEl('text', {x:6, y:textTop + 20, 'font-size':14.5}, '文本'));
        if (pattern.length) {
            const patternTop = textTop + textRows * rowH + 4;
            pattern.forEach((ch, k) => {
                const abs = windowStart + k;
                const row = Math.floor(abs / perLine) - patternRow0;
                cell('pattern', k, ch, labelW + (abs % perLine) * colW, patternTop + row * rowH, false);
            });
            svg.append(svgEl('text', {x:6, y:patternTop + 20, 'font-size':14.5}, '模式'));
            if (windowStart > 0) svg.append(svgEl('text', {x:labelW, y:patternTop - 6, 'font-size':13}, '窗口从 [' + windowStart + '] 开始'));
        }
        if (aux) {
            const auxLabel = event.teachingTopic === 'zFunction' ? 'Z' : 'pi';
            const auxTop = textTop + textRows * rowH + (pattern.length ? patternRows * rowH + 4 : 0);
            aux.forEach((v, i) => {
                const row = Math.floor(i / perLine), col = i % perLine;
                const g = svgEl('g', {'data-object-id':auxLabel + '-' + i, transform:`translate(${labelW + col * colW} ${auxTop + row * rowH})`});
                g.append(svgEl('rect', {width:28, height:30, rx:5, class:'r1-object'}));
                g.append(svgEl('text', {x:14, y:20, 'text-anchor':'middle', 'font-size':14.5}, String(v)));
                svg.append(g);
            });
            svg.append(svgEl('text', {x:6, y:auxTop + 20, 'font-size':14.5}, auxLabel));
        }
        host.replaceChildren(wrap);
        return Promise.allSettled([]);
    };
})();

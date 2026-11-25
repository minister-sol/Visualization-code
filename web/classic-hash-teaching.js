(() => {
    const previous = {...R1};
    const lineSteps = {
        hashChain: {1:'init', 3:'bucket', 4:'compare', 5:'insert', 6:'delete', 7:'result', 9:'done'},
        hashLinear: {1:'init', 3:'start', 6:'probe', 7:'match', 8:'tombstone', 9:'empty',
                     11:'insert', 12:'delete', 13:'result', 15:'done'}
    };
    const topics = Object.keys(lineSteps);
    const legends = {
        hashChain:'每行对应一个桶，箭头依次连接同桶的键；黄色标记当前比较的键。',
        hashLinear:'编号是物理槽位。∅ 是空槽，墓碑可重用，但查找必须继续探测。'
    };
    for (const topic of topics) {
        const lines = HashPrograms[topic];
        const markers = {};
        lines.forEach((line, index) => {
            const match = line.match(/@(\w+)/);
            if (match) markers[match[1]] = index + 1;
        });
        R1.programs[topic] = {c:lines, cpp:lines};
        R1.mapping[topic] = {c:markers, cpp:markers};
        (R1.teaching ??= {})[topic] = {
            purpose:topic === 'hashChain' ? '将冲突的键放在同一个桶中。' : '发生冲突时向后逐槽查找，绕回表头。',
            io:'首行 capacity 1–20。随后填写 insert、delete 或 find 加整数，最多 49 条；find 输出 1 或 0。',
            legend:legends[topic]
        };
    }
    R1.install = core => {
        previous.install(core);
        for (const topic of topics) {
            const trace = core[topic];
            core[topic] = input => trace(input).map(event => ({
                ...event, teachingTopic:topic, step:lineSteps[topic][event.line]
            }));
            core.code[topic] = HashPrograms[topic];
        }
    };
    R1.inputData = (topic, input) => topics.includes(topic) ? input : previous.inputData(topic, input);
    const explanations = {
        capacity:'图中桶或槽位的总数', key:'当前操作的键',
        bucket:'左侧标出的桶编号', index:'桶内匹配位置，从 0 开始',
        j:'正在比较的桶内位置，从 0 开始', start:'首次探测的槽位编号',
        i:'当前探测的槽位编号', step:'从起点走过的槽位数',
        found:'匹配的槽位编号', vacant:'首个可写入的槽位编号'
    };
    R1.describe = event => topics.includes(event.teachingTopic)
        ? Object.entries(event.variables).map(([name, value]) =>
            name + ' = ' + value + '（' + explanations[name] + (value === -1 ? '，尚无' : '') + '）'
        ).join('；')
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
    R1.draw = (event, host, animate) => {
        if (!topics.includes(event.teachingTopic)) return previous.draw(event, host, animate);
        R1.cancel();
        const oldPositions = positions;
        positions = new Map();
        const panel = document.createElement('div');
        panel.className = 'scan-diagram';
        const cells = [];
        const groups = event.buckets || [event.state];
        groups.forEach((values, group) => {
            const row = document.createElement('div');
            row.className = 'scan-row';
            if (event.buckets) row.append('桶 ' + group + '　');
            (values.length ? values : [null]).forEach((value, index) => {
                if (event.buckets && index) row.append(' → ');
                const cell = document.createElement('span');
                const active = event.buckets
                    ? event.indices.includes(group) && (event.variables.j === index || value === event.variables.key)
                    : event.indices.includes(index);
                cell.className = active ? 'scan-cell scan-active' : 'scan-cell';
                cell.textContent = (event.buckets ? '' : index + ': ') +
                    (value === null ? '∅' : value === 'deleted' ? '墓碑' : value);
                if (typeof value === 'number') {
                    cell.dataset.hashKey = String(value);
                    cells.push(cell);
                }
                row.append(cell);
            });
            panel.append(row);
        });
        host.replaceChildren(panel);
        const motion = animate && !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        for (const cell of cells) {
            if (!cell.getBoundingClientRect) continue;
            const old = oldPositions.get(cell.dataset.hashKey);
            const current = cell.getBoundingClientRect();
            positions.set(cell.dataset.hashKey, current);
            if (!motion || !cell.animate) continue;
            const x = old ? old.left - current.left : 0;
            const y = old ? old.top - current.top : -14;
            if (x || y) animations.push(cell.animate([
                {transform:'translate(' + x + 'px, ' + y + 'px)', opacity:old ? 1 : 0},
                {transform:'none', opacity:1}
            ], {duration:220, easing:'ease-out'}));
        }
        return Promise.allSettled(animations.map(animation => animation.finished));
    };
})();

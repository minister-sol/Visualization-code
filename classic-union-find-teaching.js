(() => {
    const previous = {...R1};
    const topic = 'unionFind';
    const steps = {1:'init', 2:'follow', 4:'roots', 5:'merge', 6:'result', 8:'done'};
    const markers = {};
    UnionFindProgram.forEach((line, index) => {
        const marker = line.match(/@(\w+)/);
        if (marker) markers[marker[1]] = index + 1;
    });
    R1.programs[topic] = {c:UnionFindProgram, cpp:UnionFindProgram};
    R1.mapping[topic] = {c:markers, cpp:markers};
    R1.teaching[topic] = {
        purpose:'合并两个集合，或判断两个顶点是否已经连通。',
        io:'首行 vertices 后列出最多 12 个顶点。每行 union 或 find 加两个顶点，最多 50 条。find 输出 1 或 0。',
        legend:'箭头从顶点指向父节点，自环表示根。查根只沿箭头前进，不改写父指针。'
    };
    R1.install = core => {
        previous.install(core);
        const trace = core[topic];
        core[topic] = input => trace(input).map(event => ({
            ...event, teachingTopic:topic, step:steps[event.line]
        }));
        core.code[topic] = UnionFindProgram;
    };
    R1.inputData = (name, input) => name === topic ? input : previous.inputData(name, input);
    const names = {x:'第一个输入顶点', y:'第二个输入顶点', a:'第一个集合的根',
                   b:'第二个集合原来的根', v:'查根当前到达的顶点'};
    R1.describe = event => {
        if (event.teachingTopic !== topic) return previous.describe(event);
        const vertices = Object.keys(event.parent);
        const variables = Object.entries(event.variables).map(([name, vertex]) =>
            name + ' = ' + vertices.indexOf(vertex) + '（' + names[name] + '，见顶点 ' + vertex + '）');
        variables.push('parent = [' + Object.values(event.parent).map(vertex => vertices.indexOf(vertex)).join(', ') +
                       ']（按输入顺序排列，见各顶点的出边）');
        return variables.join('；');
    };
    let animation;
    R1.cancel = () => {
        previous.cancel();
        animation?.cancel();
        animation = undefined;
    };
    R1.reset = () => {
        previous.reset();
        R1.cancel();
    };
    R1.draw = (event, host, animate) => {
        if (event.teachingTopic !== topic) return previous.draw(event, host, animate);
        R1.cancel();
        const vertices = Object.keys(event.parent);
        const {v, a, b} = event.variables;
        const svg = drawGraph({
            graph:{vertices, directed:true, edges:Object.entries(event.parent), focus:v ?? a},
            seen:[],
            chosen:event.step === 'merge' ? [[b, a]] : []
        });
        svg.setAttribute('aria-label', '并查集父指针图。' + event.state.join('，'));
        const scroller=document.createElement('div');scroller.style.overflow='auto';scroller.style.maxWidth='100%';scroller.append(svg);host.replaceChildren(scroller);
        if (!animate || event.step !== 'merge' ||
            globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        const edge = svg.querySelector?.('.graph-edge.chosen');
        if (edge?.animate) {
            const length = edge.getTotalLength();
            animation = edge.animate([
                {strokeDasharray:length, strokeDashoffset:length},
                {strokeDasharray:length, strokeDashoffset:0}
            ], {duration:250, easing:'ease-out'});
            return Promise.allSettled([animation.finished]);
        }
    };
})();

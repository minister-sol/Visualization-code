(function () {
    const previous = {...R1};
    const steps = {1:'init', 3:'operation', 5:'create', 6:'advance', 7:'miss', 9:'mark', 10:'result', 12:'done'};
    const markers = {};
    TrieProgram.forEach((line, index) => {
        const marker = line.match(/@(\w+)/);
        if (marker) markers[marker[1]] = index + 1;
    });
    R1.programs.trie = {c:TrieProgram, cpp:TrieProgram};
    R1.mapping.trie = {c:markers, cpp:markers};
    R1.teaching = {
        ...R1.teaching,
        trie: {
            purpose:'查找完整词或判断是否存在某个前缀。',
            io:'每行 insert、search 或 prefix 加一个小写英文词，词长 1–12，最多 50 条操作。查询输出 1 或 0。重复插入沿用原路径。',
            legend:'圆点编号对应 nodes 下标。字符标在边上，星号表示 terminal（完整词）。描边标记 node（当前位置）。'
        }
    };
    R1.install = core => {
        previous.install(core);
        const trie = core.trie;
        core.trie = input => trie(input).map(event => ({
            ...event, teachingTopic:'trie', step:steps[event.line]
        }));
        core.code.trie = TrieProgram;
    };
    R1.inputData = (topic, input) => topic === 'trie' ? input : previous.inputData(topic, input);
    R1.describe = event => {
        if (event.teachingTopic !== 'trie') return previous.describe(event);
        const node = event.nodesSnapshot.find(item => item.id === event.focus);
        return 'node = ' + event.focus + '，当前节点编号，见描边圆点。terminal = ' +
            Number(node.end) + '，是否为完整单词，见圆点星号。next_id = ' +
            event.nodesSnapshot.length + '，下一个可分配编号。';
    };
    let positions = new Map();
    let animations = [];
    let finishEdges = null;
    R1.cancel = () => {
        previous.cancel();
        for (const animation of animations) animation.cancel();
        animations = [];
        finishEdges?.();
    };
    R1.reset = () => {
        previous.reset();
        R1.cancel();
        positions.clear();
    };
    globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change', event => {
        if (event.matches) R1.cancel();
    });
    R1.draw = (event, host, animate) => {
        if (event.teachingTopic !== 'trie') return previous.draw(event, host, animate);
        R1.cancel();
        const nodesSnapshot = [];
        for (const node of event.nodesSnapshot) {
            nodesSnapshot[node.id] = {next:Object.fromEntries(node.edges),out:node.end ? [1] : []};
        }
        const graph = drawAC({nodesSnapshot, indices:[event.focus]}, 'Trie 字符边、当前节点及完整词标记');
        const circles = graph.querySelectorAll('circle');
        const labels = graph.querySelectorAll('.graph-label');
        const edges = graph.querySelectorAll('line.ac-edge');
        const edgeLabels = graph.querySelectorAll('.ac-edge-label');
        const links = nodesSnapshot.flatMap((node, source) =>
            Object.values(node.next).map(target => ({source, target})));
        host.replaceChildren(graph);
        const next = new Map();
        const motion = animate && !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        circles.forEach((circle, id) => {
            circle.dataset.objectId = 'trie-' + id;
            const point = [Number(circle.getAttribute('cx')), Number(circle.getAttribute('cy'))];
            const old = positions.get(id);
            next.set(id, point);
            if (!motion) return;
            const dx = old ? old[0] - point[0] : 0;
            const dy = old ? old[1] - point[1] : -14;
            if (!dx && !dy) return;
            const frames = [{transform:'translate(' + dx + 'px, ' + dy + 'px)', opacity:old ? 1 : 0},
                            {transform:'none', opacity:1}];
            for (const element of [circle, labels[id]]) {
                animations.push(element.animate(frames, {duration:240, easing:'ease-out'}));
            }
        });
        positions = next;
        const finished = Promise.allSettled(animations.map(animation => animation.finished));
        if (!animations.length) return finished;

        let frame;
        const updateEdges = () => {
            const visible = [...next].map(([id, point]) => {
                const transform = getComputedStyle(circles[id]).transform;
                if (transform === 'none') return point;
                const matrix = new DOMMatrixReadOnly(transform);
                return [point[0] + matrix.m41, point[1] + matrix.m42];
            });
            links.forEach(({source, target}, i) => {
                const [x1, y1] = visible[source];
                const [x2, y2] = visible[target];
                for (const [name, value] of Object.entries({x1, y1, x2, y2}))
                    edges[i].setAttribute(name, value);
                edgeLabels[i].setAttribute('x', (x1 + x2) / 2);
                edgeLabels[i].setAttribute('y', (y1 + y2) / 2 - 3);
            });
        };
        const tick = () => {
            updateEdges();
            frame = requestAnimationFrame(tick);
        };
        const finish = () => {
            if (finishEdges !== finish) return;
            cancelAnimationFrame(frame);
            updateEdges();
            finishEdges = null;
        };
        finishEdges = finish;
        tick();
        return finished.then(finish);
    };
})();

(() => {
    const previous = { ...R1 };
    const lineSteps = {
        avl: {
            4: 'rotateRightLink', 5: 'rotateRightHeight', 8: 'rotateLeftLink', 9: 'rotateLeftHeight',
            12: 'create', 13: 'goLeft', 14: 'goRight', 15: 'duplicate', 16: 'balance',
            19: 'leftRight', 20: 'rightLeft', 23: 'rootUpdate', 24: 'done'
        },
        redBlack: {
            2: 'leftRot', 3: 'rightRot', 4: 'flip', 6: 'create', 7: 'goLeft', 8: 'goRight',
            9: 'duplicate', 15: 'rootBlack', 16: 'done'
        },
        bTree: {
            3: 'splitRight', 4: 'splitMiddle', 5: 'splitPromote', 8: 'locate', 9: 'leafInsert',
            10: 'chooseChild', 12: 'afterSplit', 17: 'duplicate', 18: 'newRoot', 19: 'inserted', 21: 'done'
        }
    };
    const topics = Object.keys(lineSteps);

    const teaching = {
        avl: {
            purpose: 'AVL 树是自平衡二叉搜索树：每个节点记录高度，插入后比较左右子树高度差（平衡因子）；差值超过 1 时按 LL/RR/LR/RL 做四种旋转，把高度差压回 ±1 以内。',
            io: '单行最多 16 个整数（-999..999，逗号或空白分隔，可空）；空输入为空树，重复值不插入。中序遍历为升序，每个节点高度等于两子树高度较大值加 1。',
            legend: '圆圈内为节点值，下方为高度与 #编号；绿色描边为当前聚焦节点；L/R 标注左右父子引用；旋转步骤先调整引用，再更新两侧高度。'
        },
        redBlack: {
            purpose: '左倾红黑树用颜色和旋转保持近似平衡：新节点为红色；右红左黑时左旋，左红且左左红时右旋，左右皆红时变色；每插入一键后把根置黑。',
            io: '单行最多 16 个整数（-999..999，逗号或空白分隔，可空）；空输入为空树，重复值不插入。合法树满足根黑、红节点子节点必黑、左右黑高相等。',
            legend: '圆圈内为节点值，下方为 #编号与颜色（红/黑）；绿色描边为当前聚焦节点；L/R 为左右引用；变色步骤同时翻转父节点与两个子节点颜色。'
        },
        bTree: {
            purpose: 'B 树（最小度数 t=2，节点最多 3 个键）面向大块存储：叶节点直接插入；遇到满孩子先分裂，把中间键提升到父节点；根满时先长出新根，所有叶节点保持同一深度。',
            io: '单行最多 16 个整数（-999..999，逗号或空白分隔，可空）；空输入为空树，重复值不插入；终态中序为去重升序，孩子区间被父键有序分隔。',
            legend: '卡片内为节点键（升序），下方为 #编号；绿色描边为当前聚焦节点；连线连到各孩子；分裂时右半进入新卡片，中间键提升到父节点。'
        }
    };

    for (const topic of topics) {
        const lines = TreesPrograms[topic];
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
            core.code[topic] = TreesPrograms[topic];
        }
    };

    R1.inputData = (topic, input) => topics.includes(topic) ? input : previous.inputData(topic, input);

    const nodeLabel = n => `#${n.id} ${n.value}`;

    const auxiliary = event => {
        const topic = event.teachingTopic;
        const parts = [];
        if (topic === 'bTree') {
            const snap = event.nodesSnapshot || [];
            const focus = event.indices && event.indices.length ? snap[event.indices[0]] : null;
            parts.push(`根 #${event.root ?? '空'}`);
            parts.push('节点：' + (snap.length ? snap.map(n => `#${n.id}[${n.keys.join(', ')}]`).join('，') : '空'));
            if (focus) parts.push(`聚焦节点 #${focus.id}，键 [${focus.keys.join(', ')}]，孩子 [#${focus.children.join('], [#') || '∅'}]`);
            if (event.values && event.values.length) parts.push(`当前中序 [${event.values.join(', ')}]`);
            return parts.join('；');
        }
        const tree = event.tree || [];
        const byId = new Map(tree.map(n => [n.id, n]));
        const focus = event.focus !== null && event.focus !== undefined ? byId.get(event.focus) : null;
        parts.push(`根 ${event.root === null || event.root === undefined ? '∅' : nodeLabel(byId.get(event.root) || { id: event.root, value: '∅' })}`);
        if (topic === 'avl') {
            parts.push('节点：' + (tree.length ? tree.map(n => `${nodeLabel(n)} 高 ${n.height}`).join('，') : '空'));
            if (focus) parts.push(`聚焦 ${nodeLabel(focus)}，左 ${focus.left === null ? '∅' : '#' + focus.left}，右 ${focus.right === null ? '∅' : '#' + focus.right}`);
        } else if (topic === 'redBlack') {
            const reds = tree.filter(n => n.color === '红').map(n => n.id);
            parts.push('节点：' + (tree.length ? tree.map(n => `${nodeLabel(n)} ${n.color}`).join('，') : '空'));
            parts.push(`红节点 [#${reds.join(', #') || '无'}]`);
            if (focus) parts.push(`聚焦 ${nodeLabel(focus)}（${focus.color}），左 ${focus.left === null ? '∅' : '#' + focus.left}，右 ${focus.right === null ? '∅' : '#' + focus.right}`);
        }
        return parts.join('；');
    };

    R1.describe = event => {
        if (!topics.includes(event.teachingTopic)) return previous.describe(event);
        const aux = auxiliary(event);
        return aux || event.details || '当前步骤无额外变量；见上方图形与说明。';
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

    function drawBinary(event, host) {
        const topic = event.teachingTopic;
        const wrap = document.createElement('div');
        wrap.className = 'ac-wrap tree-viewport';
        wrap.tabIndex = 0;
        const tree = event.tree || [];
        if (!tree.length) {
            const empty = document.createElement('span');
            empty.className = 'empty';
            empty.textContent = '空树';
            wrap.append(empty);
            return wrap;
        }
        const byId = new Map(tree.map(n => [n.id, n]));
        const pos = new Map();
        let rank = 0, maxDepth = 0;
        const inorder = new Map();
        const layout = (id, depth) => {
            if (id === null || id === undefined) return;
            const n = byId.get(id);
            if (!n) return;
            layout(n.left, depth + 1);
            inorder.set(id, rank++);
            maxDepth = Math.max(maxDepth, depth);
            layout(n.right, depth + 1);
        };
        layout(event.root, 0);

        const compact = Math.min(host?.clientWidth || 9999, window.innerWidth || 9999) < 500;
        let treeW, treeH;
        if (compact) {
            const levels = [];
            const walk = (id, depth) => {
                if (id === null || id === undefined) return;
                const n = byId.get(id);
                if (!n) return;
                (levels[depth] ||= []).push(id);
                walk(n.left, depth + 1);
                walk(n.right, depth + 1);
            };
            walk(event.root, 0);
            levels.forEach(ids => ids.sort((a, b) => inorder.get(a) - inorder.get(b)));
            const maxCount = Math.max(...levels.map(ids => ids.length));
            const gap = maxCount > 1 ? Math.min(100, Math.max(70, Math.floor(280 / (maxCount - 1)))) : 100;
            levels.forEach((ids, depth) => ids.forEach((id, i) => {
                const x = 20 + i * gap + (maxCount - ids.length) * gap / 2;
                pos.set(id, [x, 55 + depth * 82]);
            }));
            treeW = Math.max(320, 20 + (maxCount - 1) * gap + 20);
            treeH = maxDepth * 82 + 110;
        } else {
            const walk = (id, depth) => {
                if (id === null || id === undefined) return;
                const n = byId.get(id);
                if (!n) return;
                walk(n.left, depth + 1);
                pos.set(id, [50 + inorder.get(id) * 90, 55 + depth * 90]);
                walk(n.right, depth + 1);
            };
            walk(event.root, 0);
            treeW = Math.max(250, rank * 90 + 20);
            treeH = maxDepth * 90 + 110;
        }
        const svg = svgEl('svg', {
            viewBox: `0 0 ${treeW} ${treeH}`, width: treeW, height: treeH,
            role: 'img', 'aria-label': '二叉树父子引用与当前聚焦节点'
        });
        svg.setAttribute('style','max-width:100%;height:auto');

        for (const n of tree) {
            const p = pos.get(n.id);
            if (!p) continue;
            for (const side of ['left', 'right']) {
                const child = n[side];
                if (child === null || child === undefined) continue;
                const q = pos.get(child);
                if (!q) continue;
                svg.append(svgEl('line', { x1: p[0], y1: p[1] + 23, x2: q[0], y2: q[1] - 23, class: 'linked-edge' }));
                svg.append(svgEl('text', { x: (p[0] + q[0]) / 2, y: (p[1] + q[1]) / 2, class: 'ac-edge-label' }, side === 'left' ? 'L' : 'R'));
            }
        }

        for (const n of tree) {
            const p = pos.get(n.id);
            if (!p) continue;
            const g = svgEl('g', { 'data-object-id': `tree-${n.id}`, transform: `translate(${p[0]} ${p[1]})` });
            g.append(svgEl('circle', { r: 25, class: 'graph-node' + (event.focus === n.id ? ' focused' : '') }));
            g.append(svgEl('text', { x: 0, y: topic === 'avl' ? -8 : -2, 'text-anchor': 'middle', class: 'graph-label' }, String(n.value)));
            if (topic === 'avl') {
                g.append(svgEl('text', { x: 0, y: 7, 'text-anchor': 'middle', class: 'graph-label' }, `高${n.height}`));
                g.append(svgEl('text', { x: 0, y: 21, 'text-anchor': 'middle', class: 'graph-label' }, `节点${n.id}`));
            } else {
                g.append(svgEl('text', { x: 0, y: 16, 'text-anchor': 'middle', class: 'graph-label' }, `节点${n.id} ${n.color}`));
            }
            svg.append(g);
        }
        wrap.append(svg);
        return wrap;
    }

    function drawBTree(event) {
        const wrap = document.createElement('div');
        wrap.className = 'ac-wrap tree-viewport';
        wrap.tabIndex = 0;
        const snap = event.nodesSnapshot || [];
        if (!snap.length) {
            const empty = document.createElement('span');
            empty.className = 'empty';
            empty.textContent = '空 B 树';
            wrap.append(empty);
            return wrap;
        }
        const byId = new Map(snap.map(n => [n.id, n]));
        const pos = new Map();
        let rank = 0, maxDepth = 0;
        const layout = (id, depth) => {
            const n = byId.get(id);
            if (!n) return;
            if (n.children.length) n.children.forEach(c => layout(c, depth + 1));
            pos.set(id, [60 + rank++ * 110, 55 + depth * 95]);
            maxDepth = Math.max(maxDepth, depth);
            if (n.children.length) {
                const first = pos.get(n.children[0]), last = pos.get(n.children[n.children.length - 1]);
                pos.set(id, [(first[0] + last[0]) / 2, 55 + depth * 95]);
            }
        };
        layout(event.root, 0);

        const btreeW = Math.max(250, rank * 110 + 30), btreeH = maxDepth * 95 + 110;
        const svg = svgEl('svg', {
            viewBox: `0 0 ${btreeW} ${btreeH}`, width: btreeW, height: btreeH,
            role: 'img', 'aria-label': 'B 树节点键与孩子引用'
        });
        svg.setAttribute('style','max-width:100%;height:auto');

        for (const n of snap) {
            for (const child of n.children) {
                const p = pos.get(n.id), q = pos.get(child);
                if (!p || !q) continue;
                svg.append(svgEl('line', { x1: p[0], y1: p[1] + 24, x2: q[0], y2: q[1] - 24, class: 'linked-edge' }));
            }
        }

        const focusIndex = event.indices && event.indices.length ? event.indices[0] : -1;
        snap.forEach((n, i) => {
            const p = pos.get(n.id);
            if (!p) return;
            const width = Math.max(56, n.keys.length * 46 + 14);
            const g = svgEl('g', { 'data-object-id': `btree-${n.id}`, transform: `translate(${p[0] - width / 2} ${p[1] - 22})` });
            g.append(svgEl('rect', { width, height: 44, rx: 6, class: 'graph-node' + (i === focusIndex ? ' focused' : '') }));
            n.keys.forEach((key, k) => {
                g.append(svgEl('text', { x: 22 + k * 46, y: 28, 'text-anchor': 'middle', class: 'graph-label' }, String(key)));
            });
            g.append(svgEl('text', { x: width / 2, y: 58, 'text-anchor': 'middle', class: 'ac-edge-label' }, `#${n.id}`));
            svg.append(g);
        });
        wrap.append(svg);
        return wrap;
    }

    R1.draw = (event, host) => {
        if (!topics.includes(event.teachingTopic)) return previous.draw(event, host);
        R1.cancel();
        const wrap = event.teachingTopic === 'bTree' ? drawBTree(event) : drawBinary(event, host);
        host.replaceChildren(wrap);
        return Promise.allSettled([]);
    };
})();

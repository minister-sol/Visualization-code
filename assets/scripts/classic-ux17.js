/* 问题十一至十三、十六的界面接线：三种工作区模式、循环队列/哈希结构化输入、
   Java 语言可用性提示。只改交互层，不改事件与渲染逻辑。 */
(() => {
  const $ = id => document.getElementById(id);

  const playbackLayout = $('playbackLayout');
  if (playbackLayout) {
    const playback = playbackLayout.closest('.playback');
    playbackLayout.addEventListener('change', () => {
      playback.dataset.layout = playbackLayout.value;
    });
    new ResizeObserver(() => {
      const height = Math.ceil(playback.getBoundingClientRect().height);
      document.body.style.setProperty('--playback-height', `${height}px`);
    }).observe(playback);
  }

  /* ---------- 三种工作区显示模式 ---------- */
  const panels = $('panels');
  const modeButtons = {split: $('wsSplit'), code: $('wsCode'), visual: $('wsVisual')};
  function setWorkspace(mode) {
    if (!panels) return;
    panels.classList.remove('mode-code', 'mode-visual');
    if (mode === 'code') panels.classList.add('mode-code');
    if (mode === 'visual') panels.classList.add('mode-visual');
    for (const [name, button] of Object.entries(modeButtons)) {
      if (button) button.setAttribute('aria-pressed', String(name === mode));
    }
    try { if (typeof ensureCodeVisible === 'function') ensureCodeVisible(); } catch (e) {}
  }
  modeButtons.split?.addEventListener('click', () => setWorkspace('split'));
  modeButtons.code?.addEventListener('click', () => setWorkspace('code'));
  modeButtons.visual?.addEventListener('click', () => setWorkspace('visual'));

  /* ---------- 结构化操作表单：循环队列、两种哈希、栈 ---------- */
  const specs = {
    queue: {
      title: '循环队列表单',
      capacity: {min: 1, max: 20, label: '容量'},
      ops: [['enqueue', '入队', 'value'], ['dequeue', '出队', null]],
      hint: '容量 1–20；入队需要整数；出队没有值。表单写入的是同一份文本，空队、满队仍按主题契约提示。'
    },
    hashChain: {
      title: '链地址哈希表单',
      capacity: {min: 1, max: 20, label: '容量'},
      ops: [['insert', '插入', 'value'], ['find', '查找', 'value'], ['delete', '删除', 'value']],
      hint: '容量 1–20；三个操作都需要整数键。查找输出 1/0，删除不存在的键按主题契约保持不变。'
    },
    hashLinear: {
      title: '线性探测哈希表单',
      capacity: {min: 1, max: 20, label: '容量'},
      ops: [['insert', '插入', 'value'], ['find', '查找', 'value'], ['delete', '删除', 'value']],
      hint: '容量 1–20；冲突时顺序探测，删除会留下可重用墓碑。'
    },
    stack: {
      title: '栈操作表单',
      capacity: null,
      ops: [['push', '入栈', 'value'], ['pop', '出栈', null]],
      hint: '容量 50；入栈需要整数，出栈不需要值；空栈出栈按契约提示。'
    },
    linked: {
      title: '链表操作表单',
      capacity: null,
      ops: [['insert', '插入', 'indexValue'], ['delete', '删除', 'index'], ['reverse', '反转', null]],
      hint: '插入需“索引 值”，删除只需索引，反转不需要参数；索引从 0 开始。'
    }
  };

  const form = $('opForm'), rowsBox = $('opRows'), capacityBox = $('opCapacity'), hintBox = $('opFormHint');
  const specOf = () => specs[$('topic').value] || null;

  function rowElement(op = null, value = '', index = '') {
    const spec = specOf();
    if (!spec) return null;
    const chosen = op || spec.ops.find(([name]) => name !== 'reverse')?.[0] || spec.ops[0][0];
    const row = document.createElement('div');
    row.className = 'op-row';
    const select = document.createElement('select');
    select.setAttribute('aria-label', '操作类型');
    for (const [name, label] of spec.ops) {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = label;
      select.append(option);
    }
    select.value = chosen;
    row.append(select);

    const valueInput = document.createElement('input');
    valueInput.type = 'number';
    valueInput.step = '1';
    valueInput.setAttribute('aria-label', '数值');
    valueInput.value = value;
    valueInput.placeholder = '数值';

    const indexInput = document.createElement('input');
    indexInput.type = 'number';
    indexInput.step = '1';
    indexInput.min = '0';
    indexInput.setAttribute('aria-label', '索引');
    indexInput.value = index;
    indexInput.placeholder = '索引';

    const sync = () => {
      const entry = spec.ops.find(([name]) => name === select.value) || spec.ops[0];
      const kind = entry[2];
      valueInput.hidden = kind !== 'value' && kind !== 'indexValue';
      indexInput.hidden = kind !== 'index' && kind !== 'indexValue';
      row.dataset.kind = kind || 'none';
    };
    select.addEventListener('change', sync);
    sync();

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'op-remove';
    remove.textContent = '删除这一行';
    remove.addEventListener('click', () => { row.remove(); if (!rowsBox.children.length) addRow(); });
    row.append(valueInput, indexInput, remove);
    row.dataset.op = chosen;
    return row;
  }

  function addRow(op = null, value = '', index = '') {
    const row = rowElement(op, value, index);
    if (row) rowsBox.append(row);
  }

  function parseExisting(text) {
    const spec = specOf();
    const lines = String(text || '').split(/\r?\n/).filter(x => x.trim());
    let capacity = '';
    if (spec?.capacity) {
      const head = /^\s*capacity\s+(\d+)/i.exec(lines[0] || '');
      if (head) { capacity = head[1]; lines.shift(); }
    }
    const ops = [];
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const entry = spec?.ops.find(([name]) => name === parts[0]);
      if (!entry) continue;
      ops.push({op: parts[0], value: parts[1] ?? '', index: ''});
    }
    return {capacity, ops};
  }

  function refreshForm() {
    const spec = specOf();
    if (!form || !spec) { if (form) form.hidden = true; return; }
    form.hidden = false;
    form.querySelector('h3')?.remove();
    const title = document.createElement('h3');
    title.textContent = spec.title;
    title.style.margin = '0';
    form.prepend(title);
    if (hintBox) hintBox.textContent = spec.hint;
    const capLabel = capacityBox?.closest('label');
    if (capLabel) capLabel.hidden = !spec.capacity;
    if (capacityBox && spec.capacity) {
      capacityBox.min = String(spec.capacity.min);
      capacityBox.max = String(spec.capacity.max);
    }
    const parsed = parseExisting($('input').value);
    if (spec.capacity) capacityBox.value = parsed.capacity || String(spec.capacity.min + 2);
    rowsBox.replaceChildren();
    if (parsed.ops.length) parsed.ops.forEach(item => addRow(item.op, item.value, item.index));
    else addRow();
  }

  function applyForm() {
    const spec = specOf();
    if (!spec) return;
    const lines = [];
    if (spec.capacity) {
      const raw = Number(capacityBox.value);
      if (!Number.isInteger(raw) || raw < spec.capacity.min || raw > spec.capacity.max) {
        if ($('error')) $('error').textContent = `容量须为 ${spec.capacity.min} 到 ${spec.capacity.max} 的整数。`;
        return;
      }
      lines.push('capacity ' + raw);
    }
    for (const row of rowsBox.children) {
      const select = row.querySelector('select');
      const kind = row.dataset.kind;
      const value = row.querySelector('input[aria-label="数值"]').value.trim();
      const index = row.querySelector('input[aria-label="索引"]').value.trim();
      if (kind === 'value' || kind === 'indexValue') {
        if (!/^[+-]?\d+$/.test(value)) { if ($('error')) $('error').textContent = `${select.value} 需要整数数值。`; return; }
      }
      if (kind === 'index' || kind === 'indexValue') {
        if (!/^\d+$/.test(index)) { if ($('error')) $('error').textContent = `${select.value} 需要非负整数索引。`; return; }
      }
      if (kind === 'indexValue') lines.push(`${select.value} ${index} ${value}`);
      else if (kind === 'index') lines.push(`${select.value} ${index}`);
      else if (kind === 'value') lines.push(`${select.value} ${value}`);
      else lines.push(select.value);
    }
    if ($('error')) $('error').textContent = '';
    const input = $('input');
    input.value = lines.join('\n');
    input.dispatchEvent(new Event('input'));
  }

  $('opAdd')?.addEventListener('click', () => addRow());
  $('opApply')?.addEventListener('click', applyForm);
  $('topic')?.addEventListener('change', () => setTimeout(refreshForm, 0));
  $('example')?.addEventListener('click', () => setTimeout(refreshForm, 0));
  refreshForm();

  /* ---------- Java 可用性：没有 Java 源码的主题把选项标为未提供，避免静默回退 ---------- */
  function languageControls() {
    const select = $('codeLang'), fs = $('fsLang');
    const topic = $('topic')?.value;
    const javaReady = !!(typeof R1 !== 'undefined' && R1.programs && R1.programs[topic] && R1.programs[topic].java);
    for (const control of [select, fs]) {
      if (!control) continue;
      const option = [...control.options].find(o => o.value === 'java');
      if (option) {
        option.disabled = !javaReady;
        option.textContent = javaReady ? 'Java' : 'Java（本主题未提供）';
      }
      if (!javaReady && control.value === 'java') control.value = 'c99';
    }
    if (!javaReady && typeof R1 !== 'undefined' && R1.language === 'java') {
      R1.language = 'c';
      if (select) select.value = 'c99';
    }
    if (typeof R1 !== 'undefined' && R1.language === 'c') {
      if (select && select.value !== 'c99') select.value = 'c99';
      if (fs && fs.value !== 'c99') fs.value = 'c99';
    }
  }
  $('topic')?.addEventListener('change', () => setTimeout(languageControls, 0));
  $('codeLang')?.addEventListener('change', () => setTimeout(languageControls, 0));
  $('fsLang')?.addEventListener('change', () => setTimeout(languageControls, 0));
  languageControls();
  globalThis.UX17 = {setWorkspace, refreshForm, applyForm, languageControls, specs};
})();

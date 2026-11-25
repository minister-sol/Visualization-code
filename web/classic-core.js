(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Classic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const code = {
    bubble: ['for (int end = n - 1; end > 0; end--) {','  for (int j = 0; j < end; j++) {','    if (a[j] > a[j + 1]) {','      int tmp = a[j]; a[j] = a[j + 1]; a[j + 1] = tmp;','    }','  }','}','return;'],
    stack: ['int stack[50], size = 0;','for (int i = 0; i < count; i++) {','  if (ops[i].type == PUSH) {','    stack[size++] = ops[i].value;','  } else if (size > 0) {','    size--;','  } else {','    /* 空栈无法出栈 */','  }','}','return;'],
    selection: ['for (let i = 0; i < a.length - 1; i++) {','  let min = i;','  for (let j = i + 1; j < a.length; j++) {','    if (a[j] < a[min]) min = j;','  }','  if (min !== i) {','    [a[i], a[min]] = [a[min], a[i]];','  }','}','return a;'],
    insertion: ['for (let i = 1; i < a.length; i++) {','  const key = a[i];','  let j = i - 1;','  while (j >= 0 && a[j] > key) {','    a[j + 1] = a[j];','    j--;','  }','  a[j + 1] = key;','}','return a;'],
    array: ['for (int i = 0; i < count; i++) {','  if (ops[i].type == INSERT) {','    for (int j = n; j > ops[i].index; j--) { a[j] = a[j-1]; } a[ops[i].index] = ops[i].value; n++;','  } else {','    for (int j = ops[i].index; j < n-1; j++) { a[j] = a[j+1]; } n--;','  }','}','return;'],
    queue: ['int slots[20] = {0};','int head = 0, size = 0;','for (int i = 0; i < count; i++) {','  if (ops[i].type == ENQUEUE && size < capacity) {','    slots[(head + size) % capacity] = ops[i].value;','    size++;','  } else if (ops[i].type == DEQUEUE && size > 0) {','    slots[head] = 0;','    head = (head + 1) % capacity;','    size--;','  } else {','    /* 队满或队空，操作无效 */','  }','}','return;']
  };
  function number(s) {
    if (!/^[+-]?\d+$/.test(s)) throw Error('请输入整数，范围为 -999 到 999。');
    const n = Number(s);
    if (!Number.isSafeInteger(n) || n < -999 || n > 999) throw Error('整数范围为 -999 到 999。');
    return n;
  }
  function values(input) {
    const t=input.trim().replace(/^[,，\s]+|[,，\s]+$/g,'');
    const a=t ? t.split(/[,，\s]+/).map(number) : [];
    if (a.length>20) throw Error('最多输入 20 个整数。');
    return a;
  }
  function lines(input) { const all=input.split(/\r?\n/).map((s,i)=>({s:s.trim(),line:i+1})).filter(x=>x.s); if(all.length>50) throw Error('最多输入 50 行操作。'); return all; }
  function emitter(a, events, extra = () => ({})) { return (line,message,indices=[])=>events.push({line,message,indices,state:a.slice(),...extra()}); }
  function bubble(input) {
    const a=values(input), events=[]; let sortedFrom=a.length; const emit=emitter(a,events,()=>({sortedFrom}));
    emit(null,'开始排序。');
    for(let end=a.length-1;end>0;end--) { emit(1,`本轮检查到索引 ${end}。`);
      for(let j=0;j<end;j++) { emit(3,`比较索引 ${j} 和 ${j+1}：${a[j]} ${a[j]>a[j+1]?'>':'≤'} ${a[j+1]}。`,[j,j+1]);
        if(a[j]>a[j+1]) { [a[j],a[j+1]]=[a[j+1],a[j]]; emit(4,'交换相邻元素。',[j,j+1]); events[events.length-1].swap=[j,j+1]; }
      }
      sortedFrom=end;
    }
    sortedFrom=0; emit(8,'排序完成。'); return events;
  }
  function stack(input) {
    const ops=lines(input).map(({s,line})=>{const p=s.split(/\s+/); try {if(p[0]==='push'&&p.length===2)return {type:'push',value:number(p[1])}; if(p[0]==='pop'&&p.length===1)return {type:'pop'};} catch(e){throw Error(`第 ${line} 行：${e.message}`);} throw Error(`第 ${line} 行无效：请使用 push 整数 或 pop。`);});
    const a=[], events=[], emit=emitter(a,events); emit(1,'初始化空栈。');
    ops.forEach((op,i)=>{emit(2,`第 ${i+1} 个操作：${op.type}${op.type==='push'?' '+op.value:''}。`);
      if(op.type==='push'){emit(3,'判断为入栈操作。');a.push(op.value);emit(4,`${op.value} 已入栈。`,[a.length-1]);events.at(-1).motion='push';}
      else if(a.length>0){emit(5,'栈非空，可以出栈。');const v=a.pop();emit(6,`${v} 已出栈。`);events.at(-1).motion='pop';events.at(-1).removed=v;}
      else {emit(5,'检查栈是否为空。');emit(null,'空栈无法出栈，状态不变。');}
    }); emit(11,'操作完成。'); return events;
  }
  function selection(input) {
    const a=values(input), events=[], emit=emitter(a,events); emit(null,'开始选择排序。');
    for(let i=0;i<a.length-1;i++){let min=i;emit(2,`从索引 ${i} 开始寻找最小值。`,[i]);
      for(let j=i+1;j<a.length;j++){emit(4,`比较 ${a[j]} 与当前最小值 ${a[min]}。`,[j,min]);if(a[j]<a[min]){min=j;emit(4,`最小值索引更新为 ${min}。`,[min]);}}
      if(min!==i){[a[i],a[min]]=[a[min],a[i]];emit(7,`将最小值放到索引 ${i}。`,[i,min]);}
    } emit(10,'排序完成。');return events;
  }
  function insertion(input) {
    const a=values(input),events=[]; let key=null; const emit=emitter(a,events,()=>({key})); emit(null,'开始插入排序。');
    for(let i=1;i<a.length;i++){key=a[i];emit(2,`取出待插入值 ${key}。`,[i]);let j=i-1;emit(3,`从索引 ${j} 开始向左检查。`,[j]);
      while(j>=0&&a[j]>key){emit(4,`${a[j]} 大于 ${key}，需要右移。`,[j]);a[j+1]=a[j];emit(5,`将索引 ${j} 的值右移。`,[j,j+1]);j--;emit(6,j>=0?`继续检查索引 ${j}。`:'已越过数组开头，下一步检查循环条件。',j>=0?[j]:[]);}
      emit(4,j<0?'已到数组开头。':`${a[j]} 不大于 ${key}，停止右移。`,j>=0?[j]:[]);a[j+1]=key;emit(8,`将 ${key} 插入索引 ${j+1}。`,[j+1]);
    } key=null;emit(10,'排序完成。');return events;
  }
  function array(input) {
    const raw=input.split(/\r?\n/); let a; try { a=values(raw.shift()||''); } catch(e) { throw Error(`首行应为初始数组（可留空）：${e.message}`); } const ops=lines(raw.join('\n')),events=[],emit=emitter(a,events);emit(null,'初始数组。');
    ops.forEach(({s,line})=>{const p=s.split(/\s+/),n=line+1; if(!/^(0|[1-9]\d*)$/.test(p[1]||''))throw Error(`第 ${n} 行：索引必须是无前导零的非负整数。`);const index=Number(p[1]);
      if(p[0]==='insert'&&p.length===3){let v;try{v=number(p[2]);}catch(e){throw Error(`第 ${n} 行：${e.message}`);}if(index>a.length)throw Error(`第 ${n} 行：插入索引超出范围 0–${a.length}。`);if(a.length>=20)throw Error(`第 ${n} 行：数组最多 20 个元素。`);emit(2,`在索引 ${index} 插入 ${v}。`);a.push(null);for(let j=a.length-1;j>index;j--){a[j]=a[j-1];emit(3,`将索引 ${j-1} 的值右移到 ${j}。`,[j-1,j]);events.at(-1).move={from:j-1,to:j};}a[index]=v;emit(3,'插入完成。',[index]);events.at(-1).motion='insert';}
      else if(p[0]==='delete'&&p.length===2){if(index>=a.length)throw Error(`第 ${n} 行：删除索引超出范围。`);emit(4,`进入删除分支：索引 ${index} 的值为 ${a[index]}。`,[index]);for(let j=index;j<a.length-1;j++){a[j]=a[j+1];emit(5,`将索引 ${j+1} 的值左移到 ${j}。`,[j,j+1]);events.at(-1).move={from:j+1,to:j};}a.pop();emit(5,'删除完成。',index<a.length?[index]:[]);events.at(-1).motion='delete';}
      else throw Error(`第 ${n} 行无效：请使用 insert 索引 整数 或 delete 索引。`);
    });emit(8,'操作完成。');return events;
  }
  function queue(input) {
    let all; try { all=lines(input); } catch(e) { throw Error('最多输入 49 条操作。'); } const first=all.shift(), m=first&&/^capacity\s+(\d+)$/.exec(first.s);if(!m||+m[1]<1||+m[1]>20)throw Error('首行请输入 capacity 容量，容量为 1–20。');const capacity=+m[1];
    const ops=all.map(({s,line})=>{const p=s.split(/\s+/);try {if(p[0]==='enqueue'&&p.length===2)return {type:'enqueue',value:number(p[1])};if(p[0]==='dequeue'&&p.length===1)return {type:'dequeue'};}catch(e){throw Error(`第 ${line} 行：${e.message}`);}throw Error(`第 ${line} 行无效：请使用 enqueue 整数 或 dequeue。`);});
    const a=Array(capacity).fill(null),events=[];let head=0,size=0;const emit=emitter(a,events,()=>({head,size,capacity}));emit(2,'初始化空队列。');
    ops.forEach(op=>{emit(3,`操作：${op.type}${op.type==='enqueue'?' '+op.value:''}。`);
      if(op.type==='enqueue'&&size<capacity){emit(4,'队列未满。');const tail=(head+size)%capacity;a[tail]=op.value;emit(5,`写入槽位 ${tail}。`,[tail]);events.at(-1).motion='enqueue';size++;emit(6,'队列长度增加。',[tail]);}
      else if(op.type==='dequeue'&&size>0){emit(7,'队列非空。',[head]);const old=head,removed=a[head];a[head]=null;emit(8,`清空队头槽位 ${head}。`,[head]);events.at(-1).motion='dequeue';events.at(-1).removed=removed;head=(head+1)%capacity;emit(9,`队头移动到槽位 ${head}。`,[head]);size--;emit(10,'队列长度减少。');}
      else emit(null,op.type==='enqueue'?'队满，无法入队。':'队空，无法出队。');
    });emit(15,'操作完成。');return events;
  }
  code.linear=['for (let i = 0; i < a.length; i++) {','  if (a[i] === target) return i;','}','return -1;'];
  code.binary=['let left = 0, right = a.length;','while (left < right) {','  const mid = Math.floor((left + right) / 2);','  if (a[mid] < target) left = mid + 1;','  else right = mid;','}','return left < a.length && a[left] === target ? left : -1;'];
  code.merge=['function sort(lo, hi) {','  if (hi - lo <= 1) return;','  const mid = Math.floor((lo + hi) / 2);','  sort(lo, mid); sort(mid, hi);','  const temp = []; let i = lo, j = mid;','  while (i < mid && j < hi) {','    if (a[i] <= a[j]) temp.push(a[i++]);','    else temp.push(a[j++]);','  }','  while (i < mid) temp.push(a[i++]);','  while (j < hi) temp.push(a[j++]);','  for (let k = 0; k < temp.length; k++) a[lo + k] = temp[k];','}','sort(0, a.length);','return a;'];
  code.quick=['function sort(lo, hi) {','  if (lo >= hi) return;','  const pivot = a[hi]; let i = lo;','  for (let j = lo; j < hi; j++) {','    if (a[j] <= pivot) {','      [a[i], a[j]] = [a[j], a[i]];','      i++;','    }','  }','  [a[i], a[hi]] = [a[hi], a[i]];','  sort(lo, i - 1); sort(i + 1, hi);','}','sort(0, a.length - 1);','return a;'];
  code.linked=["Node dummy = {0, head};","for (int i = 0; i < count; i++) {","  if (ops[i].type == REVERSE) {","    Node *prev = NULL, *curr = dummy.next;","    while (curr != NULL) {","      Node *next = curr->next;","      curr->next = prev;","      prev = curr; curr = next;","    }","    dummy.next = prev;","  } else {","    Node *prev = &dummy;","    for (int j = 0; j < ops[i].index; j++) prev = prev->next;","    if (ops[i].type == INSERT) {","      Node *node = malloc(sizeof *node); if (!node) return dummy.next; node->value = ops[i].value; node->next = prev->next;","      prev->next = node;","    } else {","      Node *removed = prev->next; prev->next = removed->next;","      free(removed);","    }","  }}","return dummy.next;"];
  function searchInput(input) {
    const raw=input.split(/\r?\n/);if(raw.length<2)throw Error('首行为数组（可空），第二行请输入 target 整数。');
    let a;try{a=values(raw.shift());}catch(e){throw Error(`首行数组：${e.message}`);}
    const rest=raw.map(x=>x.trim()).filter(Boolean);if(rest.length!==1||!/^target\s+\S+$/.test(rest[0]))throw Error('第二行请输入 target 整数。');
    return {a,target:number(rest[0].split(/\s+/)[1])};
  }
  function linear(input){const {a,target}=searchInput(input),events=[];let result=null;const emit=emitter(a,events,()=>({target,result}));emit(null,`查找 ${target}。`);for(let i=0;i<a.length;i++){emit(2,`比较索引 ${i} 的 ${a[i]} 与 ${target}。`,[i]);if(a[i]===target){result=i;emit(2,`找到首个匹配索引 ${i}。`,[i]);return events;}}result=-1;emit(4,'未找到。');return events;}
  function binary(input){const {a,target}=searchInput(input);if(a.some((x,i)=>i&&x<a[i-1]))throw Error('二分查找要求数组升序。');const events=[];let left=0,right=a.length,result=null;const emit=emitter(a,events,()=>({target,left,right,result}));emit(1,'初始化左闭右开区间。');while(left<right){const mid=Math.floor((left+right)/2);emit(3,`区间 [${left}, ${right})，中点 ${mid}。`,[mid]);if(a[mid]<target){left=mid+1;emit(4,'中点值较小，收缩左边界。',[mid]);}else{right=mid;emit(5,'中点值不小于目标，收缩右边界。',[mid]);}}result=left<a.length&&a[left]===target?left:-1;emit(7,result<0?'未找到。':`找到首个匹配索引 ${result}。`,result<0?[]:[result]);return events;}
  function merge(input){const a=values(input),events=[];let segment=null,temp=[];const emit=emitter(a,events,()=>({segment:segment&&segment.slice(),temp:temp.slice()}));emit(null,'开始归并排序。');function sort(lo,hi){segment=[lo,hi];emit(2,`处理区间 [${lo}, ${hi})。`);if(hi-lo<=1)return;const mid=Math.floor((lo+hi)/2);sort(lo,mid);sort(mid,hi);segment=[lo,hi];temp=[];let i=lo,j=mid;emit(5,`合并 [${lo}, ${mid}) 与 [${mid}, ${hi})。`);while(i<mid&&j<hi){if(a[i]<=a[j]){temp.push(a[i++]);emit(7,`取左侧值，暂存 [${temp.join(', ')}]。`,[i-1]);}else{temp.push(a[j++]);emit(8,`取右侧值，暂存 [${temp.join(', ')}]。`,[j-1]);}}while(i<mid){temp.push(a[i++]);emit(10,'复制左侧剩余值。',[i-1]);}while(j<hi){temp.push(a[j++]);emit(11,'复制右侧剩余值。',[j-1]);}for(let k=0;k<temp.length;k++){a[lo+k]=temp[k];emit(12,`写回索引 ${lo+k}。`,[lo+k]);}}sort(0,a.length);segment=null;temp=[];emit(15,'排序完成。');return events;}
  function quick(input){const a=values(input),events=[];let range=null,pivot=null;const emit=emitter(a,events,()=>({range:range&&range.slice(),pivot}));emit(null,'开始快速排序。');function sort(lo,hi){range=lo<=hi?[lo,hi]:null;emit(2,lo>hi?'空区间，无需排序。':`处理区间 [${lo}, ${hi}]。`);if(lo>=hi)return;pivot=a[hi];let i=lo;emit(3,`选择末项 ${pivot} 为基准。`,[hi]);for(let j=lo;j<hi;j++){emit(5,`比较 ${a[j]} 与基准 ${pivot}。`,[j,hi]);if(a[j]<=pivot){[a[i],a[j]]=[a[j],a[i]];emit(6,i===j?`同一位置 ${i}，交换后状态不变。`:`交换索引 ${i} 与 ${j}。`,[i,j]);i++;emit(7,`边界移动到 ${i}。`);}}[a[i],a[hi]]=[a[hi],a[i]];emit(10,`基准归位到索引 ${i}。`,[i,hi]);sort(lo,i-1);sort(i+1,hi);}sort(0,a.length-1);range=null;pivot=null;emit(14,'排序完成。');return events;}
  function linked(input){
    const raw=input.split(/\r?\n/);let initial;try{initial=values(raw.shift()||'');}catch(e){throw Error(`首行应为初始链表，空链表请保留空首行：${e.message}`);}const operations=lines(raw.join('\n'));let nextId=1;const dummy={id:0,next:null};let tail=dummy;const all=[];
    for(const value of initial){const node={id:nextId++,value,next:null};all.push(node);tail.next=node;tail=node;}
    const events=[];let prev=null,curr=null;
    function emit(line,message){const state=[];let p=dummy.next;const seen=new Set();while(p&&!seen.has(p.id)){seen.add(p.id);state.push(p.value);p=p.next;}events.push({line,message,state,indices:[],head:dummy.next?.id??null,prev:prev?.id??null,curr:curr?.id??null,nodes:all.map(n=>({id:n.id,value:n.value,next:n.next?.id??null}))});}
    emit(null,'初始链表，节点编号用于识别引用。');
    operations.forEach(({s,line})=>{const parts=s.split(/\s+/), row=line+1;let length=0;for(let p=dummy.next;p;p=p.next)length++;
      if(parts[0]==='reverse'&&parts.length===1){emit(3,'开始反转。');prev=null;curr=dummy.next;emit(4,'初始化 prev 和 curr。');while(curr!==null){const next=curr.next;emit(6,`暂存节点 ${curr.id} 的后继。`);curr.next=prev;emit(7,`反转节点 ${curr.id} 的 next 引用。`);prev=curr;curr=next;emit(8,'移动 prev 和 curr。');}dummy.next=prev;emit(10,'更新头指针。');prev=null;curr=null;}
      else {if(!['insert','delete'].includes(parts[0])||parts.length!==(parts[0]==='insert'?3:2))throw Error(`第 ${row} 行无效：请使用 insert 索引 整数、delete 索引 或 reverse。`);if(!/^(0|[1-9]\d*)$/.test(parts[1]))throw Error(`第 ${row} 行：索引须为无前导零的非负整数。`);const index=Number(parts[1]);if(index>length||(parts[0]==='delete'&&index===length))throw Error(`第 ${row} 行：索引超出范围。`);if(parts[0]==='insert'&&length>=20)throw Error(`第 ${row} 行：链表最多 20 个节点。`);let p=dummy;prev=p;emit(12,'从虚拟头节点开始。');for(let i=0;i<index;i++){p=p.next;prev=p;emit(13,`移动到节点 ${p.id}。`);}if(parts[0]==='insert'){let value;try{value=number(parts[2]);}catch(e){throw Error(`第 ${row} 行：${e.message}`);}const node={id:nextId++,value,next:p.next};all.push(node);emit(15,`创建节点 ${node.id}，next 指向原后继。`);p.next=node;emit(16,`连接新节点 ${node.id}。`);}else{const removed=p.next;p.next=p.next.next;emit(18,`跳过节点 ${removed.id}。`);all.splice(all.indexOf(removed),1);emit(19,`释放节点 ${removed.id}。`);}prev=null;}
    });emit(22,'操作完成。');return events;
  }

  code.hashChain=['const buckets = Array.from({length: capacity}, () => []);','for (const op of operations) {','  const bucket = buckets[((op.value % capacity) + capacity) % capacity];','  const index = bucket.indexOf(op.value);','  if (op.type === "insert" && index < 0) bucket.push(op.value);','  if (op.type === "delete" && index >= 0) bucket.splice(index, 1);','  if (op.type === "find") results.push(index >= 0);','}','return buckets;'];
  code.hashLinear=['const slots = Array(capacity).fill(null);','for (const op of operations) {','  const start = ((op.value % capacity) + capacity) % capacity;','  let found = -1, vacant = -1;','  for (let step = 0; step < capacity; step++) {','    const i = (start + step) % capacity;','    if (slots[i] === op.value) { found = i; break; }','    if (slots[i] === "deleted" && vacant < 0) vacant = i;','    if (slots[i] === null) { if (vacant < 0) vacant = i; break; }','  }','  if (op.type === "insert" && found < 0 && vacant >= 0) slots[vacant] = op.value;','  if (op.type === "delete" && found >= 0) slots[found] = "deleted";','  if (op.type === "find") results.push(found >= 0);','}','return slots;'];
  code.bst=["Node *insert(Node *node, int value) {", "  if (!node) { Node *p = malloc(sizeof *p); if (!p) exit(EXIT_FAILURE); *p = (Node){value, NULL, NULL}; return p; }", "  if (value < node->value) node->left = insert(node->left, value);", "  else if (value > node->value) node->right = insert(node->right, value);", "  return node;", "}", "int find(Node *node, int value) {", "  if (!node || node->value == value) return node != NULL;", "  return find(value < node->value ? node->left : node->right, value);", "}", "Node *remove_node(Node *node, int value) {", "  if (!node) return NULL;", "  if (value < node->value) node->left = remove_node(node->left, value);", "  else if (value > node->value) node->right = remove_node(node->right, value);", "  else if (!node->left) { Node *p = node->right; free(node); return p; }", "  else if (!node->right) { Node *p = node->left; free(node); return p; }", "  else {", "    Node *successor = node->right;", "    while (successor->left) successor = successor->left;", "    node->value = successor->value;", "    node->right = remove_node(node->right, successor->value);", "  }", "  return node;", "}", "Node *applyDelete(Node *root, int value) {", "  root = remove_node(root, value);", "  return root;", "}"];
  code.heap=['function push(value) {','  heap.push(value);','  let i = heap.length - 1;','  while (i > 0) {','    const p = Math.floor((i - 1) / 2);','    if (heap[p] >= heap[i]) break;','    [heap[p], heap[i]] = [heap[i], heap[p]];','    i = p;','  }','}','function pop() {','  if (!heap.length) return;','  const last = heap.pop();','  if (heap.length) {','    heap[0] = last;','    siftDown(0, heap.length);','  }','}'];
  code.heapSort=['function siftDown(i, size) {','  while (2 * i + 1 < size) {','    let child = 2 * i + 1;','    if (child + 1 < size && a[child + 1] > a[child]) child++;','    if (a[i] >= a[child]) break;','    [a[i], a[child]] = [a[child], a[i]];','    i = child;','  }','}','for (let i = Math.floor(a.length / 2) - 1; i >= 0; i--) siftDown(i, a.length);','for (let end = a.length - 1; end > 0; end--) {','  [a[0], a[end]] = [a[end], a[0]];','  siftDown(0, end);','}','return a;'];
  // push/pop and heap sort share the same max-heap sift-down routine.
  code.heap.push(...['function siftDown(i, size) {','  while (2 * i + 1 < size) {','    let child = 2 * i + 1;','    if (child + 1 < size && heap[child + 1] > heap[child]) child++;','    if (heap[i] >= heap[child]) break;','    [heap[i], heap[child]] = [heap[child], heap[i]];','    i = child;','  }','}']);
  function structOps(input, capacityRequired=false, heapMode=false){
    let all;try{all=lines(input);}catch(e){if(capacityRequired)throw Error('最多输入 49 条操作。');throw e;}let capacity=null;if(capacityRequired){const first=all.shift(),m=first&&/^capacity\s+(\d+)$/.exec(first.s);if(!m||+m[1]<1||+m[1]>20)throw Error('首行请输入 capacity 容量，范围 1–20。');capacity=+m[1];}
    const ops=all.map(({s,line})=>{const p=s.split(/\s+/);if(heapMode&&p[0]==='pop'&&p.length===1)return {type:'pop',line};if(p.length!==2||!(heapMode?['insert']:['insert','find','delete']).includes(p[0]))throw Error(`第 ${line} 行无效：${heapMode?'请使用 insert 整数 或 pop':'请使用 insert、find 或 delete 整数'}。`);try{return {type:p[0],value:number(p[1]),line};}catch(e){throw Error(`第 ${line} 行：${e.message}`);}});return {ops,capacity};
  }
  function hashChain(input){const {ops,capacity}=structOps(input,true),buckets=Array.from({length:capacity},()=>[]),events=[];let result=null, vars={capacity};const emit=(line,message,indices=[])=>events.push({line,message,indices,variables:{...vars},state:buckets.map(b=>b.length?b.join(' → '):'∅'),buckets:buckets.map(b=>b.slice()),result});emit(1,'初始化空桶。');for(const op of ops){result=null;const i=((op.value%capacity)+capacity)%capacity,b=buckets[i];vars={capacity,key:op.value,bucket:i,index:-1};emit(3,`散列到桶 ${i}${b.length?(op.type==='insert'?'，桶内已有元素，需检查冲突':'，桶内已有元素'):''}。`,[i]);let index=-1;for(let j=0;j<b.length;j++){vars.j=j;emit(4,`比较桶 ${i} 中的 ${b[j]} 与 ${op.value}。`,[i]);if(b[j]===op.value){index=j;vars.index=j;break;}}if(op.type==='insert'){if(index<0){b.push(op.value);emit(5,`插入 ${op.value}。`,[i]);}else emit(null,'重复值已存在，不插入。',[i]);}else if(op.type==='delete'){if(index>=0){b.splice(index,1);emit(6,`删除 ${op.value}。`,[i]);}else emit(null,'未找到，无法删除。',[i]);}else{result=index>=0;emit(7,result?'找到目标。':'未找到目标。',[i]);}}vars={capacity};emit(9,'操作完成。');return events;}
  function hashLinear(input){const {ops,capacity}=structOps(input,true),slots=Array(capacity).fill(null),events=[];let result=null, vars={capacity};const emit=(line,message,indices=[])=>events.push({line,message,indices,variables:{...vars},state:slots.slice(),result});emit(1,'初始化空槽。');for(const op of ops){result=null;const start=((op.value%capacity)+capacity)%capacity;vars={capacity,key:op.value,start,found:-1,vacant:-1};emit(3,`起始槽位 ${start}。`,[start]);let found=-1,vacant=-1;for(let step=0;step<capacity;step++){const i=(start+step)%capacity;Object.assign(vars,{i,step});emit(6,`探测槽位 ${i}：${slots[i]===null?'空':slots[i]==='deleted'?'已删除':slots[i]}。`,[i]);if(slots[i]===op.value){found=i;vars.found=i;emit(7,'槽位值匹配，结束探测。',[i]);break;}if(slots[i]==='deleted'&&vacant<0){vacant=i;vars.vacant=i;emit(8,'记住可重用的墓碑槽位。',[i]);}if(slots[i]===null){if(vacant<0)vacant=i;vars.vacant=vacant;emit(9,'遇到空槽，停止探测。',[i]);break;}}if(op.type==='insert'){if(found>=0)emit(null,'重复值已存在，不插入。',[found]);else if(vacant<0)emit(null,'表已满，无法插入。');else{slots[vacant]=op.value;emit(11,`写入槽位 ${vacant}。`,[vacant]);}}else if(op.type==='delete'){if(found<0)emit(null,'未找到，无法删除。');else{slots[found]='deleted';emit(12,'标记为已删除，保留探测链。',[found]);}}else{result=found>=0;emit(13,result?'找到目标。':'未找到目标。',found>=0?[found]:[]);}}vars={capacity};emit(15,'操作完成。');return events;}
  function bst(input){const {ops}=structOps(input),events=[];let root=null,nextId=1,result=null,focus=null;function emit(line,message){const tree=[];function visit(n){if(!n)return;tree.push({id:n.id,value:n.value,left:n.left?.id??null,right:n.right?.id??null});visit(n.left);visit(n.right);}visit(root);events.push({line,message,state:tree.map(n=>n.value),indices:[],tree,root:root?.id??null,focus,result});}emit(null,'初始空二叉搜索树。');
    function insert(n,v){if(!n){const x={id:nextId++,value:v,left:null,right:null};focus=x.id;return x;}focus=n.id;emit(v<n.value?3:4,`比较 ${v} 与节点 ${n.value}。`);if(v<n.value)n.left=insert(n.left,v);else if(v>n.value)n.right=insert(n.right,v);else {}return n;}
    function find(n,v){if(!n){emit(8,'未找到。');return false;}focus=n.id;emit(8,`比较 ${v} 与节点 ${n.value}。`);if(n.value===v)return true;return find(v<n.value?n.left:n.right,v);}
    function remove(n,v){
      if(!n){emit(12,'未找到，无法删除。');return null;}
      focus=n.id;
      if(v<n.value){emit(13,`比较 ${v} 与节点 ${n.value}，进入左子树。`);const old=n.left;n.left=remove(n.left,v);if(old!==n.left){focus=n.id;emit(13,`更新节点 ${n.id} 的左子引用。`);}}
      else if(v>n.value){emit(14,`比较 ${v} 与节点 ${n.value}，进入右子树。`);const old=n.right;n.right=remove(n.right,v);if(old!==n.right){focus=n.id;emit(14,`更新节点 ${n.id} 的右子引用。`);}}
      else {emit(null,`找到待删除节点 ${n.value}。`);
        if(!n.left){emit(15,`返回节点 ${n.id} 的右子树，准备摘除该节点。`);return n.right;}
        if(!n.right){emit(16,`返回节点 ${n.id} 的左子树，准备摘除该节点。`);return n.left;}
        let successor=n.right;focus=successor.id;emit(18,'寻找右子树中的后继。');while(successor.left){successor=successor.left;focus=successor.id;emit(19,'沿左子节点寻找后继。');}
        n.value=successor.value;focus=n.id;emit(20,`将后继值 ${successor.value} 复制到待删除节点。`);
        const old=n.right;n.right=remove(n.right,successor.value);if(old!==n.right){focus=n.id;emit(21,`更新节点 ${n.id} 的右子引用，摘除后继。`);}
      }return n;
    }
    function contains(n,v){while(n){if(n.value===v)return true;n=v<n.value?n.left:n.right;}return false;}
    for(const op of ops){result=null;focus=null;if(op.type==='insert'){if((function count(n){return n?1+count(n.left)+count(n.right):0;})(root)>=20&&!contains(root,op.value))throw Error(`第 ${op.line} 行：二叉搜索树最多 20 个节点。`);const exists=contains(root,op.value);root=insert(root,op.value);emit(exists?5:2,exists?`值 ${op.value} 已存在，保持原树。`:`插入 ${op.value} 操作完成。`);}else if(op.type==='find'){result=find(root,op.value);emit(8,result?'找到目标。':'未找到目标。');}else{const old=root;root=remove(root,op.value);if(root!==old){focus=root?.id??null;emit(26,'更新根引用，摘除原根节点。');}emit(null,`删除 ${op.value} 操作完成。`);}}focus=null;emit(null,'操作完成。');return events;}
  function makeHeap(input,sortMode){const a=sortMode?values(input):[],ops=sortMode?[]:structOps(input,false,true).ops,events=[];let size=a.length;const emit=emitter(a,events,()=>({heapSize:size,heapView:true}));const L=sortMode?{down:1,check:5,swap:6,move:7}:{down:19,check:23,swap:24,move:25};
    function down(i,n){while(2*i+1<n){let child=2*i+1;if(child+1<n&&a[child+1]>a[child])child++;emit(L.check,`比较父节点 ${i} 与较大子节点 ${child}。`,[i,child]);if(a[i]>=a[child])break;[a[i],a[child]]=[a[child],a[i]];emit(L.swap,`下沉：交换索引 ${i} 和 ${child}。`,[i,child]);i=child;emit(L.move,`继续检查索引 ${i}。`,[i]);}}
    emit(null,sortMode?'开始堆排序。':'初始空大顶堆。');if(sortMode){for(let i=Math.floor(a.length/2)-1;i>=0;i--){emit(10,`从索引 ${i} 开始建堆。`,[i]);down(i,a.length);}for(let end=a.length-1;end>0;end--){[a[0],a[end]]=[a[end],a[0]];size=end;emit(12,`堆顶移至索引 ${end}。`,[0,end]);down(0,end);}size=0;emit(15,'排序完成。');}
    else{for(const op of ops){if(op.type==='insert'){if(a.length>=20)throw Error(`第 ${op.line} 行：堆最多 20 个元素。`);a.push(op.value);size=a.length;emit(2,`插入 ${op.value}。`,[a.length-1]);let i=a.length-1;while(i>0){const p=Math.floor((i-1)/2);emit(6,`比较父节点 ${p} 和子节点 ${i}。`,[p,i]);if(a[p]>=a[i])break;[a[p],a[i]]=[a[i],a[p]];emit(7,`上浮：交换索引 ${p} 和 ${i}。`,[p,i]);i=p;emit(8,`继续检查索引 ${i}。`,[i]);}}else{if(!a.length){emit(12,'空堆无法删除堆顶。');continue;}const removed=a[0],last=a.pop();size=a.length;emit(13,`删除堆顶 ${removed}，移除末尾元素 ${last}。`);if(a.length){a[0]=last;emit(15,'末尾元素移到堆顶。',[0]);down(0,a.length);}}}emit(null,'操作完成。');}return events;}
  function heap(input){return makeHeap(input,false);} function heapSort(input){return makeHeap(input,true);}

  code.preorder=["#include <stdio.h>", "typedef struct Node { int value; struct Node *left, *right; } Node;", "void visit(Node *node) {", "  if (node == NULL) return;", "  printf(\"%d \", node->value);", "  visit(node->left);", "  visit(node->right);", "}", "void traverse(Node *root) { visit(root);", "}"];
  code.inorder=["#include <stdio.h>", "typedef struct Node { int value; struct Node *left, *right; } Node;", "void visit(Node *node) {", "  if (node == NULL) return;", "  visit(node->left);", "  printf(\"%d \", node->value);", "  visit(node->right);", "}", "void traverse(Node *root) { visit(root);", "}"];
  code.postorder=['function visit(node) {','  if (!node) return;','  visit(node.left);','  visit(node.right);','  output.push(node.value);','}','visit(root);','return output;'];
  code.levelorder=['const queue = root ? [root] : [];','while (queue.length) {','  const node = queue.shift();','  output.push(node.value);','  if (node.left) queue.push(node.left);','  if (node.right) queue.push(node.right);','}','return output;'];
  code.twoPointer=['let left = 0, right = a.length - 1;','while (left < right) {','  const sum = a[left] + a[right];','  if (sum === target) return [left, right];','  if (sum < target) left++;','  else right--;','}','return null;'];
  code.window=['let sum = 0, best = -Infinity;','for (let right = 0; right < a.length; right++) {','  sum += a[right];','  if (right >= size) sum -= a[right - size];','  if (right >= size - 1) best = Math.max(best, sum);','}','return best;'];
  code.prefix=['const prefix = [0];','for (let i = 0; i < a.length; i++) {','  prefix.push(prefix[i] + a[i]);','}','return prefix[right + 1] - prefix[left];'];
  function treeTraversal(input,mode){
    const text=input.trim().replace(/^[,，\s]+|[,，\s]+$/g,'');const parts=text?text.split(/[,，\s]+/):[];if(parts.length>31)throw Error('最多输入 31 个层序位置。');
    const a=parts.map((x,i)=>{if(/^(null|#)$/i.test(x))return null;try{return number(x);}catch(e){throw Error(`索引 ${i}：${e.message}`);}});if(a.length&&a[0]===null&&a.some(x=>x!==null))throw Error('空根节点不能拥有子节点。');
    const nodes=a.map((value,i)=>value===null?null:{id:i+1,value,left:null,right:null});for(let i=1;i<nodes.length;i++)if(nodes[i]&&!nodes[Math.floor((i-1)/2)])throw Error(`索引 ${i} 的父节点为空。`);
    nodes.forEach((n,i)=>{if(n){n.left=nodes[2*i+1]||null;n.right=nodes[2*i+2]||null;}});const root=nodes[0]||null,tree=nodes.filter(Boolean).map(n=>({id:n.id,value:n.value,left:n.left?.id??null,right:n.right?.id??null}));const events=[],output=[];let focus=null,queue=[],path=[],phase=null;
    const emit=(line,message)=>events.push({line,message,state:tree.map(n=>n.value),indices:[],tree,root:root?.id??null,focus,result:null,output:output.slice(),queue:queue.map(n=>n.id),...(['preorder','inorder'].includes(mode)?{path:path.slice(),phase}:{})});
    emit(null,'初始二叉树。');if(mode==='levelorder'){if(root)queue.push(root);emit(1,'初始化队列。');while(queue.length){const node=queue.shift();focus=node.id;emit(3,`取出节点 #${node.id}。`);output.push(node.value);emit(4,`访问 ${node.value}。`);if(node.left){queue.push(node.left);emit(5,`左子节点 #${node.left.id} 入队。`);}if(node.right){queue.push(node.right);emit(6,`右子节点 #${node.right.id} 入队。`);}}emit(8,'遍历完成。');}
    else if(mode==='preorder'||mode==='inorder'){
      const outputLine=mode==='preorder'?5:6,leftLine=mode==='preorder'?6:5;
      phase='start';emit(9,'从 root 开始递归。');
      function visit(node){focus=node?.id??null;if(!node){phase='empty';emit(4,'node 为 NULL，立即返回；路径保留调用者。');return;}
        path.push(node.id);phase='enter';emit(3,`进入节点 #${node.id}。`);phase='check';emit(4,'node 非空，继续。');
        if(mode==='preorder'){output.push(node.value);phase='output';emit(outputLine,`输出节点 #${node.id} 的值 ${node.value}。`);}
        phase='left';focus=node.id;emit(leftLine,`递归左子树 #${node.id} → ${node.left?'#'+node.left.id:'NULL'}。`);visit(node.left);
        focus=node.id;phase='resume';emit(leftLine,`左子树返回到 #${node.id}。`);
        if(mode==='inorder'){output.push(node.value);phase='output';emit(outputLine,`输出节点 #${node.id} 的值 ${node.value}。`);}
        phase='right';emit(7,`递归右子树 #${node.id} → ${node.right?'#'+node.right.id:'NULL'}。`);visit(node.right);
        focus=node.id;phase='return';emit(8,`节点 #${node.id} 递归结束，返回调用者。`);path.pop();
      }visit(root);focus=null;phase='done';emit(10,'遍历完成。');
    }
    else {const line=mode==='preorder'?3:mode==='inorder'?4:5;function visit(node){if(!node)return;focus=node.id;emit(null,`进入节点 #${node.id}。`);if(mode==='preorder'){output.push(node.value);emit(line,`访问 ${node.value}。`);}visit(node.left);if(mode==='inorder'){focus=node.id;output.push(node.value);emit(line,`访问 ${node.value}。`);}visit(node.right);if(mode==='postorder'){focus=node.id;output.push(node.value);emit(line,`访问 ${node.value}。`);}}visit(root);focus=null;emit(8,'遍历完成。');}return events;
  }
  function preorder(x){return treeTraversal(x,'preorder');}function inorder(x){return treeTraversal(x,'inorder');}function postorder(x){return treeTraversal(x,'postorder');}function levelorder(x){return treeTraversal(x,'levelorder');}
  function pairInput(input,pattern,example){const raw=input.split(/\r?\n/);if(raw.length<2)throw Error(`首行数组可为空，第二行请输入 ${example}。`);let a;try{a=values(raw.shift());}catch(e){throw Error(`首行数组：${e.message}`);}const rows=raw.map(x=>x.trim()).filter(Boolean);if(rows.length!==1||!pattern.test(rows[0]))throw Error(`第二行请输入 ${example}。`);return {a,parts:rows[0].split(/\s+/)};}
  function twoPointer(input){const {a,parts}=pairInput(input,/^target\s+\S+$/,'target 整数'),target=number(parts[1]);if(a.some((v,i)=>i&&a[i-1]>v))throw Error('双指针查找要求数组升序。');let left=0,right=a.length-1,result=null;const events=[],emit=emitter(a,events,()=>({left,right,target,result:result&&result.slice(),kind:'twoPointer'}));emit(1,'初始化左右指针。');while(left<right){const sum=a[left]+a[right];emit(3,`两数之和为 ${sum}。`,[left,right]);if(sum===target){result=[left,right];emit(4,'找到一组索引。',[left,right]);return events;}if(sum<target){left++;emit(5,'和较小，左指针右移。',left<=right?[left,right]:[]);}else{right--;emit(6,'和较大，右指针左移。',left<=right?[left,right]:[]);}}emit(8,'没有满足条件的两个位置。');return events;}
  function window(input){const {a,parts}=pairInput(input,/^size\s+\d+$/,'size 窗口长度'),size=Number(parts[1]);if(size<1||size>a.length)throw Error('窗口长度必须在 1 和数组长度之间；空数组没有合法窗口。');let sum=0,best=null;const events=[];let left=0,right=-1;const emit=emitter(a,events,()=>({left,right,sum,best,windowSize:size,kind:'window',result:best}));emit(1,'初始化窗口和。');for(right=0;right<a.length;right++){sum+=a[right];left=Math.max(0,right-size);emit(3,`加入索引 ${right} 的值。`,[right]);if(right>=size){sum-=a[right-size];left=right-size+1;emit(4,`移除索引 ${right-size} 的值。`,[right-size]);}if(right>=size-1){best=best===null?sum:Math.max(best,sum);emit(5,`当前完整窗口和 ${sum}，最大和 ${best}。`,Array.from({length:size},(_,i)=>left+i));}}right=a.length-1;emit(7,'计算完成。');return events;}
  function prefix(input){const {a,parts}=pairInput(input,/^range\s+\d+\s+\d+$/,'range 左索引 右索引'),left=Number(parts[1]),right=Number(parts[2]);if(left>right||right>=a.length)throw Error('查询范围须满足 0 ≤ 左索引 ≤ 右索引 < 数组长度。');const sums=[0],events=[];let result=null;const emit=emitter(a,events,()=>({left,right,prefix:sums.slice(),result,kind:'prefix'}));emit(1,'初始化前缀和 prefix[0] = 0。');for(let i=0;i<a.length;i++){sums.push(sums[i]+a[i]);emit(3,`计算 prefix[${i+1}] = ${sums[i+1]}。`,[i]);}result=sums[right+1]-sums[left];emit(5,`区间和为 ${sums[right+1]} − ${sums[left]} = ${result}。`,[left,right]);return events;}

  code.graph=['const adj = Object.fromEntries(vertices.map(v => [v, []]));','for (const [u, v] of edges) {','  adj[u].push(v);','  if (!directed && u !== v) adj[v].push(u);','}','for (const v of vertices) adj[v].sort((a, b) => vertices.indexOf(a) - vertices.indexOf(b));','return adj;'];
  code.graphDFS=['const seen = new Set(), order = [];','function visit(v) {','  seen.add(v); order.push(v);','  for (const next of adj[v]) {','    if (!seen.has(next)) visit(next);','  }','}','if (start !== null) visit(start);','return order;'];
  code.graphBFS=['const seen = new Set(), order = [], queue = [];','if (start !== null) { seen.add(start); queue.push(start); }','while (queue.length) {','  const v = queue.shift(); order.push(v);','  for (const next of adj[v]) {','    if (!seen.has(next)) {','      seen.add(next); queue.push(next);','    }','  }','}','return order;'];
  code.graphShortest=['const distance = Object.fromEntries(vertices.map(v => [v, null]));','const parent = Object.fromEntries(vertices.map(v => [v, null])), queue = [];','if (start !== null) { distance[start] = 0; queue.push(start); }','while (queue.length) {','  const v = queue.shift();','  for (const next of adj[v]) {','    if (distance[next] === null) {','      distance[next] = distance[v] + 1;','      parent[next] = v; queue.push(next);','    }','  }','}','return {distance, parent};'];
  code.graphTopo=['const indegree = Object.fromEntries(vertices.map(v => [v, 0]));','for (const v of vertices) for (const next of adj[v]) indegree[next]++;','const queue = vertices.filter(v => indegree[v] === 0), order = [];','while (queue.length) {','  const v = queue.shift(); order.push(v);','  for (const next of adj[v]) {','    indegree[next]--;','    if (indegree[next] === 0) queue.push(next);','  }','}','return {order, cycle: order.length !== vertices.length};'];
  function parseGraph(input,needStart,topo){
    const rows=input.split(/\r?\n/).map((s,i)=>({s:s.trim(),line:i+1})).filter(x=>x.s);let vertices=null,directed=null,start=null;const edges=[];
    for(const {s,line} of rows){const p=s.split(/\s+/),tag=p.shift();if(tag==='vertices'&&vertices===null){vertices=p;if(p.length>12)throw Error('最多 12 个顶点。');if(p.some(v=>!/^[A-Za-z][A-Za-z0-9_]{0,7}$/.test(v)))throw Error(`第 ${line} 行：顶点须为 1–8 位英文字母、数字或下划线，且以字母开头。`);if(new Set(p).size!==p.length)throw Error(`第 ${line} 行：顶点重复。`);}
      else if(tag==='mode'&&directed===null&&p.length===1&&['directed','undirected'].includes(p[0]))directed=p[0]==='directed';
      else if(tag==='start'&&start===null&&p.length===1)start=p[0];
      else if(tag==='edge'&&p.length===2)edges.push({u:p[0],v:p[1],line});
      else throw Error(`第 ${line} 行无效：请使用 vertices、mode、start 或 edge。`);
    }
    if(vertices===null||directed===null)throw Error('请提供 vertices 顶点列表 和 mode directed 或 undirected。');if(topo&&!directed)throw Error('拓扑排序仅适用于有向图。');if(edges.length>30)throw Error('最多 30 条边。');
    if(start!==null&&!vertices.includes(start))throw Error('起点不是已声明的顶点。');if(needStart&&vertices.length&&start===null)throw Error('非空图必须提供 start 起点。');if(!vertices.length&&start!==null)throw Error('空图不能指定起点。');
    const adj=Object.fromEntries(vertices.map(v=>[v,[]])),seen=new Set();for(const {u,v,line} of edges){if(!vertices.includes(u)||!vertices.includes(v))throw Error(`第 ${line} 行：边包含未声明顶点。`);const key=directed?`${u}|${v}`:[u,v].sort().join('|');if(seen.has(key))throw Error(`第 ${line} 行：重复边。`);seen.add(key);adj[u].push(v);if(!directed&&u!==v)adj[v].push(u);}
    for(const v of vertices)adj[v].sort((a,b)=>vertices.indexOf(a)-vertices.indexOf(b));return {vertices,directed,start,edges:edges.map(({u,v})=>[u,v]),adj};
  }
  function graphTrace(input,mode){
    const g=parseGraph(input,['graphDFS','graphBFS','graphShortest'].includes(mode),mode==='graphTopo');const {vertices,adj,start}=g;const order=[],events=[],seen=new Set(),queue=[],stack=[];const distance=Object.fromEntries(vertices.map(v=>[v,null])),parent=Object.fromEntries(vertices.map(v=>[v,null])),indegree=Object.fromEntries(vertices.map(v=>[v,0]));let focus=null,cycle=false;
    function emit(line,message){const paths={};for(const v of vertices){if(distance[v]===null||(v!==start&&parent[v]===null)){paths[v]=null;continue;}let cur=v,p=[];while(cur!==null){p.unshift(cur);cur=parent[cur];}paths[v]=p;}events.push({line,message,state:vertices.slice(),indices:[],graph:{vertices:vertices.slice(),edges:g.edges.map(e=>e.slice()),directed:g.directed,focus},adjacency:Object.fromEntries(vertices.map(v=>[v,adj[v].slice()])),seen:[...seen],order:order.slice(),queue:queue.slice(),stack:stack.slice(),distance:{...distance},parent:{...parent},paths,indegree:{...indegree},cycle,graphMode:mode});}
    emit(null,'图输入已校验。');
    if(mode==='graph'){for(const v of vertices) {focus=v;emit(6,`${v} 的邻接点：${adj[v].join('、')||'无'}。`);}focus=null;emit(7,'邻接表已生成。');}
    if(mode==='graphDFS'){function visit(v){stack.push(v);seen.add(v);order.push(v);focus=v;emit(3,`访问 ${v} 并压入递归栈。`);for(const next of adj[v]){focus=v;emit(4,`检查 ${v} → ${next}。`);if(!seen.has(next))visit(next);}stack.pop();focus=v;emit(null,`${v} 返回，弹出递归栈。`);}if(start!==null)visit(start);focus=null;emit(9,'深度优先遍历完成。');}
    if(mode==='graphBFS'){if(start!==null){seen.add(start);queue.push(start);}emit(2,'初始化起点和队列。');while(queue.length){const v=queue.shift();order.push(v);focus=v;emit(4,`取出并访问 ${v}。`);for(const next of adj[v]){emit(5,`检查 ${v} → ${next}。`);if(!seen.has(next)){seen.add(next);queue.push(next);emit(7,`${next} 标记并入队。`);}}}focus=null;emit(11,'广度优先遍历完成。');}
    if(mode==='graphShortest'){if(start!==null){distance[start]=0;seen.add(start);queue.push(start);}emit(3,'初始化起点距离和队列。');while(queue.length){const v=queue.shift();order.push(v);focus=v;emit(5,`取出 ${v}，距离 ${distance[v]}。`);for(const next of adj[v]){emit(6,`检查 ${v} → ${next}。`);if(distance[next]===null){distance[next]=distance[v]+1;emit(8,`更新 ${next} 的距离。`);parent[next]=v;seen.add(next);queue.push(next);emit(9,`记录 ${next} 的前驱 ${v} 并入队。`);}}}focus=null;emit(13,'最短路径计算完成；未到达顶点距离为空。');}
    if(mode==='graphTopo'){for(const v of vertices)for(const next of adj[v]){indegree[next]++;focus=next;emit(2,`边 ${v} → ${next}，${next} 入度增加。`);}for(const v of vertices)if(indegree[v]===0)queue.push(v);emit(3,'按顶点声明顺序加入入度为 0 的顶点。');while(queue.length){const v=queue.shift();order.push(v);seen.add(v);focus=v;emit(5,`取出 ${v} 加入拓扑序。`);for(const next of adj[v]){indegree[next]--;focus=next;emit(7,`${next} 的入度减一。`);if(indegree[next]===0){queue.push(next);emit(8,`${next} 入度为 0，加入队列。`);}}}cycle=order.length!==vertices.length;focus=null;emit(11,cycle?'存在有向环，无法完成拓扑排序。':'拓扑排序完成。');}
    return events;
  }
  function graph(x){return graphTrace(x,'graph');}function graphDFS(x){return graphTrace(x,'graphDFS');}function graphBFS(x){return graphTrace(x,'graphBFS');}function graphShortest(x){return graphTrace(x,'graphShortest');}function graphTopo(x){return graphTrace(x,'graphTopo');}

  return {code,bubble,stack,selection,insertion,array,queue,linear,binary,merge,quick,linked,hashChain,hashLinear,bst,heap,heapSort,preorder,inorder,postorder,levelorder,twoPointer,window,prefix,graph,graphDFS,graphBFS,graphShortest,graphTopo};
});

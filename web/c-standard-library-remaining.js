(() => {
  const {define} = CLibrary;
  function add(name, header, args, body, evaluate, note, helpers = '') {
    define(name, args, body, evaluate, note, header, helpers);
  }
  function integer(text, min, max) {
    const value = Number(text);
    if (!/^[+-]?\d+$/.test(text) || !Number.isSafeInteger(value) || value < min || value > max)
      throw Error('请输入 ' + min + ' 到 ' + max + ' 之间的整数。');
    return value;
  }
  function decimal(text) {
    const value = Number(text);
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text) || !Number.isFinite(value))
      throw Error('请输入有限的十进制数。');
    return value;
  }
  const stdio = (name, args, body, evaluate, note) => add(name,'stdio.h',args,body,evaluate,note);
  const utility = (name, args, body, evaluate, note, helpers) => add(name,'stdlib.h',args,body,evaluate,note,helpers);
  const text = [['text','hello']];
  const staged = 'FILE *file = tmpfile();\nif (file == NULL) return 1;\nfputs(text, file);\nrewind(file);\n';
  stdio('printf',text,'int count = printf("%s", text); /* demo */\nprintf("\\n%d\\n", count);',
    s=>s+'\n'+s.length,'成功时返回传输的字符数，出错返回负值。格式串固定为 %s，输入中的百分号作为普通数据。');
  stdio('puts',text,'int result = puts(text); /* demo */\nprintf("%d\\n", result >= 0);',
    s=>s+'\n1','向 stdout 写入字符串，随后添加换行。成功返回非负值，失败返回 EOF，样板把成功状态转为 1。');
  stdio('putchar',[['text','A']],'if (strlen(text) != 1) return 1;\nint result = putchar((unsigned char)text[0]); /* demo */\nprintf("\\n%d\\n", result);',
    s=>{if(s.length!==1)throw Error('请输入一个 ASCII 字符。');return s+'\n'+s.charCodeAt(0);},
    '向 stdout 写入一个字符，成功返回该字节转换成的 int，失败返回 EOF。');
  stdio('snprintf',[['text','hello'],['capacity','4']],
    'char buffer[33] = "";\nsize_t n = (size_t)strtoul(capacity, NULL, 10);\nif (n > sizeof buffer) return 1;\nint result = snprintf(n ? buffer : NULL, n, "%s", text); /* demo */\nprintf("%s\\n%d\\n", buffer, result);',
    (s,n)=>s.slice(0,Math.max(0,integer(n,0,33)-1))+'\n'+s.length,
    '容量含终止符。成功时返回完整结果所需字符数，不计终止符。容量大于零时，非负返回值达到容量说明发生截断。容量为零可传 NULL 来查询所需长度。');
  for (const name of ['scanf','getchar']) {
    const scan = name === 'scanf';
    stdio(name,[['text',scan?'42':'A']],
      (scan?'char token[8];\nint count = scanf("%7s", token); /* demo */\nif (count == 1) printf("%s\\n", token);\nprintf("%s\\n", count == EOF ? "EOF" : count == 1 ? "1" : "0");':'int value = getchar(); /* demo */\nif (value == EOF) puts("EOF");\nelse printf("%d\\n", value);'),
      s=>scan ? (s.trim() ? s.trim().split(/\s+/)[0].slice(0,7)+'\n1' : 'EOF') : s ? s.charCodeAt(0) : 'EOF',
      scan?'返回成功赋值的项数。匹配失败可返回 0，第一次转换前输入失败返回 EOF。样板用 %7s 限定最多读取 7 字节。':'从 stdin 消耗一个字节。返回值须先保存在 int，才能把有效字节与 EOF 区分开。样板从标准输入读取。');
    CLibrary.examples[name].stdin = true;
  }
  stdio('fgets',[['text','hello'],['capacity','4']],
    staged+'char buffer[33];\nint n = atoi(capacity);\nif (n < 2 || n > 33) return 1;\nchar *result = fgets(buffer, n, file); /* demo */\nprintf("%s\\n", result ? buffer : "NULL");\nfclose(file);',
    (s,n)=>{const cap=integer(n,2,33);return s ? s.slice(0,cap-1).split(/(?<=\n)/)[0] : 'NULL';},
    '最多读入容量减一的字节，保留读到的换行并附加终止符。没有读到数据就遇到 EOF 会返回 NULL。');
  utility('atoi',[['text','-42']], 'int value = atoi(text); /* demo */\nprintf("%d\\n", value);',
    s=>integer(s,-32768,32767),'把十进制文本转成 int。本例输入限于可移植的小整数范围。atoi 缺少错误报告，超出 int 范围会触发未定义行为。');
  utility('strtol',[['text','42xyz']], 'char *end;\nlong value = strtol(text, &end, 10); /* demo */\nprintf("%ld\\n%td\\n", value, end - text);',
    s=>{const match=/^\s*[+-]?\d+/.exec(s);return match ? integer(match[0].trim(),-2147483648,2147483647)+'\n'+match[0].length : '0\n0';},
    '按指定进制转换。通过 end 指针检查解析到哪里，等于起始地址表示没有转换；实际程序还应检查 ERANGE。');
  utility('strtod',[['text','2.5ms']], 'char *end;\ndouble value = strtod(text, &end); /* demo */\nprintf("%.8g\\n%td\\n", value, end - text);',
    s=>{if(/^\s*[+-]?(?:0x|inf|nan)/i.test(s))throw Error('样板页面使用十进制输入。');const m=/^\s*[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i.exec(s);return m ? Number(decimal(m[0].trim()).toPrecision(8))+'\n'+m[0].length : '0\n0';},
    '通过 end 指针区分转换失败和真实零值。实际程序应结合 errno 检查范围错误。本例展示十进制前缀与已使用字节数。');
  for (const name of ['malloc','calloc','realloc','free']) {
    const allocation = name === 'calloc' ? 'calloc(n, sizeof *p)' : 'malloc(n * sizeof *p)';
    const body = 'size_t n = (size_t)strtoul(count, NULL, 10);\nif (n < 1 || n > 64) return 1;\nint *p = '+allocation+';'+
      (name === 'malloc' || name === 'calloc' ? ' /* demo */' : '')+'\nif (p == NULL) return 1;\n';
    const notes = {
      malloc:'成功返回足够对齐的存储地址，失败返回 NULL。初始内容不确定，写入前勿读取。',
      calloc:'按元素数和元素大小分配，并把存储的所有位清零。失败返回 NULL。',
      realloc:'先用临时指针接收结果。非零大小的分配请求失败时旧块仍然有效，样板在此分支释放旧块。',
      free:'释放有效的分配块。释放后别再访问或重复释放该块。free(NULL) 无效果。'
    };
    const tail = {
      malloc:'p[n-1] = 7;\nprintf("%d\\n", p[n-1]);\nfree(p);',
      calloc:'printf("%d\\n", p[n-1]);\nfree(p);',
      realloc:'p[0] = 7;\nint mock_failure = strcmp(scenario, "failure") == 0;\nint *grown = mock_failure ? NULL : realloc(p, (n + 1) * sizeof *p); /* demo */\nif (grown == NULL)\n{\n    printf("NULL\\n%d\\n", p[0]); /* @failure_output */\n    free(p);\n    return 0;\n}\np = grown;\nprintf("%d\\n", p[0]);\nfree(p);',
      free:'free(p); /* demo */\np = NULL;\nprintf("%d\\n", p == NULL);'
    };
    const args = name === 'realloc' ? [['count','3'],['scenario','success']] : [['count','3']];
    utility(name,args,body+tail[name], (count, scenario) => {
      integer(count,1,64);
      if (name === 'realloc' && !['success','failure'].includes(scenario))
        throw Error('第二行填写 success 或 failure。');
      return scenario === 'failure' ? 'NULL\n7' : {malloc:7,calloc:0,realloc:7,free:1}[name];
    },notes[name] + (name === 'realloc' ? ' 第二行填 success 实际扩容，填 failure 模拟收到 NULL 并读取旧块的值 7。' : ''));
  }
  const comparator = 'static int compare_ints(const void *a, const void *b)\n{\n    int x = *(const int *)a, y = *(const int *)b;\n    return (x > y) - (x < y);\n}';
  for (const name of ['qsort','bsearch']) {
    const search = name === 'bsearch';
    utility(name, [['first','3'],['second','1'],['third','2'],...(search?[['key','2']]:[])],
      'int values[] = {atoi(first), atoi(second), atoi(third)};\nqsort(values, 3, sizeof values[0], compare_ints);'+ (search?'':' /* demo */')+'\n'+
      (search?'int target = atoi(key);\nconst int *hit = bsearch(&target, values, 3, sizeof values[0], compare_ints); /* demo */\nputs(hit ? "found" : "NULL");':'printf("%d %d %d\\n", values[0], values[1], values[2]);'),
      (...args)=>{const values=args.map(s=>integer(s,-32768,32767));return search ? (values.slice(0,3).includes(values[3])?'found':'NULL') : values.sort((a,b)=>a-b).join(' ');},
      search?'数组需按查询所用的比较器排序。找不到返回 NULL；有重复项时，返回其中哪一个未指定。':'把数组按比较器原地排序。比较器返回值只取符号；相等元素的相对次序不受保证。',comparator);
  }

  stdio('fopen',[['mode','wb']],
    'if (strcmp(mode,"wb") && strcmp(mode,"rb")) return 1;\nFILE *file = fopen("demo.bin", mode); /* demo */\nputs(file ? "opened" : "NULL");\nif (file) fclose(file);',
    s=>{if(!['wb','rb'].includes(s))throw Error('请输入 wb 或 rb。');return s==='wb'?'opened':'NULL';},
    '成功返回 FILE 指针，失败返回 NULL。页面假定空目录且可写，wb 创建或截断，rb 要求已有文件。运行样板请使用空的临时目录。');
  stdio('fclose',text,'FILE *file = tmpfile();\nif (file == NULL) return 1;\nfputs(text,file);\nint status = fclose(file); /* demo */\nprintf("%d\\n", status);',
    ()=>0,'关闭流并刷新待写数据。成功返回 0，失败返回 EOF，关闭后不能再使用原 FILE 指针。页面展示成功路径。');
  stdio('fprintf',text,'FILE *file = tmpfile();\nif (file == NULL) return 1;\nint count = fprintf(file, "%s", text); /* demo */\nprintf("%d\\n", count);\nfclose(file);',
    s=>s.length,'格式化写入指定流。成功时返回写入的字符数，失败返回负值。默认示例写入临时文件。');
  stdio('fscanf',text,staged+'char token[8];\nint count = fscanf(file,"%7s",token); /* demo */\nif (count == 1) printf("%s\\n", token);\nprintf("%s\\n", count == EOF ? "EOF" : "1");\nfclose(file);',
    s=>s.trim()?s.trim().split(/\s+/)[0].slice(0,7)+'\n1':'EOF','从指定流扫描格式化数据。返回成功赋值的项数。对 %s 设置宽度并留出终止符空间。');
  stdio('fread',[['text','abc'],['count','5']],
    staged+'char buffer[33] = "";\nsize_t n = (size_t)strtoul(count,NULL,10);\nif (n >= sizeof buffer) return 1;\nsize_t read = fread(buffer, 1, n, file); /* demo */\nprintf("%s\\n%zu\\n",buffer,read);\nfclose(file);',
    (s,n)=>{const part=s.slice(0,integer(n,0,32));return part+'\n'+part.length;},
    '返回完整读入的元素数，本例每个元素为 1 字节。发生短读时用 feof 或 ferror 区分原因。fread 不追加终止符，样板提前清零缓冲区。');
  stdio('fwrite',text,'FILE *file = tmpfile();\nif (file == NULL) return 1;\nsize_t count = fwrite(text, 1, strlen(text), file); /* demo */\nprintf("%zu\\n",count);\nfclose(file);',
    s=>s.length,'返回完整写入的元素数，本例每个元素为 1 字节。返回短计数时检查流错误。');
  for (const name of ['fseek','ftell']) {
    const seek = name === 'fseek';
    stdio(name,[['text','abcdef'],['offset','2']],staged+
      'long n = strtol(offset,NULL,10);\nif (n < 0 || (unsigned long)n > strlen(text)) return 1;\n'+
      (seek?'int status = fseek(file, n, SEEK_SET); /* demo */\nif (status != 0) return 1;\nprintf("%d %ld\\n", status, ftell(file));':'if (fseek(file,n,SEEK_SET) != 0) return 1;\nlong position = ftell(file); /* demo */\nprintf("%ld\\n",position);')+'\nfclose(file);',
      (s,n)=>{const pos=integer(n,0,s.length);return seek?'0 '+pos:pos;},
      seek?'从指定起点定位。成功返回 0，失败返回非零。样板使用二进制临时流，偏移单位为字节。':'返回流位置，失败返回 -1L。二进制流位置按字节计。文本流中的值可用于回跳，不能当通用字节偏移。');
  }
  const operations = {sqrt:Math.sqrt,pow:Math.pow,fabs:Math.abs,floor:Math.floor,ceil:Math.ceil,
    round:x=>Math.sign(x)*(Math.trunc(Math.abs(x)) + Number(Math.abs(x) % 1 >= 0.5)),sin:Math.sin,cos:Math.cos};
  const mathNotes = {
    sqrt:'求非负数的平方根。负实数输入触发域错误，具体返回值与错误报告取决于实现。',
    pow:'计算幂。负底数配非整数指数会引发域错误，零的负次幂也需单独处理。',
    fabs:'取浮点绝对值。浮点负零的绝对值为正零。',
    floor:'返回小于或等于输入的最大整数值，返回类型仍是 double。',
    ceil:'返回大于或等于输入的最小整数值，返回类型仍是 double。',
    round:'取最近整数，恰好位于中点时向远离零的方向舍入。',
    sin:'求正弦，参数使用弧度。不同实现的最低有效位可能有差异。',
    cos:'求余弦，参数使用弧度。不同实现的最低有效位可能有差异。'
  };
  for (const [name, operation] of Object.entries(operations)) {
    const power = name === 'pow';
    add(name,'math.h',[['text',name==='sqrt'?'9':'2.5'],...(power?[['exponent','2']]:[])],
      'double x = strtod(text,NULL);\n'+(power?'double y = strtod(exponent,NULL);\n':'')+
      'double result = '+name+'(x'+(power?', y':'')+'); /* demo */\nprintf("%.8g\\n", result);',
      (...args)=>{const [x,y]=args.map(decimal);
        if(name==='sqrt' && x<0 || power && (x<0 && !Number.isInteger(y) || x===0 && y<=0))
          throw Error('这组输入超出本样板的定义域。');
        const result=operation(...args.map(decimal));
        if(!Number.isFinite(result))throw Error('本样板只展示有限结果。');
        return Object.is(result,-0)?'-0':Number(result.toPrecision(8));
      },mathNotes[name]);
  }
  for (const name of ['rand','srand']) {
    const seed = name === 'srand';
    utility(name,[['seed','1']],
      'unsigned int value = (unsigned int)strtoul(seed,NULL,10);\nsrand(value);'+(seed?' /* demo */':'')+
      '\nint first = rand();'+(seed?'':' /* demo */')+
      '\nsrand(value);\nint again = rand();\nprintf("%d\\n", first == again && first >= 0 && first <= RAND_MAX);',
      s=>{integer(s,0,65535);return 1;},
      (seed?'用种子初始化伪随机序列，返回类型为 void。':'返回 0 至 RAND_MAX 之间的一个伪随机整数。')+
      '相同种子重播相同序列。具体数值随标准库实现而异，样板输出范围和重播检查是否通过。');
  }
  add('time','time.h',[['shift','60']],
    'long seconds = strtol(shift,NULL,10);\ntime_t now = time(NULL); /* demo */\nif (now == (time_t)-1) return 1;\nprintf("%s\\n%ld\\n", ctime(&now) ? "available" : "unavailable", seconds);',
    s=>'available\n'+integer(s,-3600,3600),'返回当前日历时间，无法取得时返回 (time_t)-1。样板以调用时刻为比较基准，并输出用户提供的相对秒数，实际时刻由运行环境决定。');
  add('difftime','time.h',[['start','10'],['end','70']],
    'time_t first = (time_t)strtol(start,NULL,10);\ntime_t last = (time_t)strtol(end,NULL,10);\ndouble seconds = difftime(last,first); /* demo */\nprintf("%.0f\\n", seconds);',
    (a,b)=>integer(b,0,86400)-integer(a,0,86400),'返回两个日历时间之差（结束减开始），单位为秒，类型为 double。样板使用本机以秒表示的 time_t。');
  add('clock','time.h',[['count','1000']],
    'long n = strtol(count,NULL,10);\nif (n < 0 || n > 1000000) return 1;\nclock_t start = clock(); /* demo */\nvolatile unsigned long total = 0;\nfor (long i = 0; i < n; ++i) total += (unsigned long)i;\n(void)total;\nclock_t end = clock();\nif (start == (clock_t)-1 || end == (clock_t)-1) return 1;\nprintf("%d\\n", ((double)end - (double)start)/CLOCKS_PER_SEC >= 0);',
    s=>{integer(s,0,1000000);return 1;},'标准定义为程序所使用的处理器时间的近似值。相减后除以 CLOCKS_PER_SEC 得到秒。样板在计时可用且未回绕时检查差值非负。');
})();

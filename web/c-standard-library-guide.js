CLibrary.guide = {
  "strlen": {
    "parameters": "s 为指向字符串首字节的只读指针；长度单位是字节（size_t）",
    "requires": "s 非空，所指对象完整且以 '\\0' 结尾",
    "returns": "终止符之前的字节数，不含 NUL",
    "effects": "无（只读）",
    "warning": "数到第一个 '\\0' 就停，终止符不算长度。用 strlen 之前先确认缓冲区里有终止符。sizeof 数组给出整个数组的字节数，sizeof 指针给出指针本身的大小。",
    "examples": "输入 hello 得到 5。输入中文abc 时，按 UTF-8 编码得到 9 字节。空字符串直接得到 0。"
  },
  "strcmp": {
    "parameters": "两个以 NUL 结尾的字符串，逐字节比较（按 unsigned char 取值比较）",
    "requires": "两指针均有效且字符串已终止",
    "returns": "s1 小于/等于/大于 s2 时分别 <0 / 0 / >0；具体数值不作承诺",
    "effects": "无（只读）",
    "warning": "不要写 if (strcmp(a,b)) 当“相等”用；也不要当“差多少”用",
    "examples": "默认 strcmp(\"abc\",\"abc\") → 0；自定义 strcmp(\"abc\",\"abd\") → <0；边界 strcmp(\"abc\",\"ab\") → >0（等前缀但更长者大），strcmp(\"\",\"\") → 0，char c[2]={(char)0xFF,0}; strcmp(c,\"a\") → >0"
  },
  "strncmp": {
    "parameters": "n 为最多比较的字节数（不是“第 n 个字符”）",
    "requires": "两指针有效；n 可为 0（此时两指针仍须有效）",
    "returns": "三态符号；遇 NUL 提前结束（“null 之后的字符不再比较”）",
    "effects": "无",
    "warning": "n 取 strlen(prefix) 只能比较前缀；要整串相等须 n = strlen(s)+1 或改用 strcmp",
    "examples": "默认 strncmp(\"abc\",\"abd\",2) → 0；自定义 strncmp(\"abc\",\"abd\",3) → <0；边界 strncmp(\"abc\",\"xyz\",0) → 0，strncmp(\"ab\",\"abc\",3) → <0"
  },
  "strcpy": {
    "parameters": "s1 目标缓冲区（可写），s2 源字符串（只读）；复制长度 = strlen(s2)+1 字节",
    "requires": "s1 容量 ≥ strlen(s2)+1；两对象不重叠（restrict 且条款明示重叠未定义）",
    "returns": "s1",
    "effects": "把 s2 的全部字符连同终止符写入 s1，覆盖原内容",
    "warning": "容量算的是“字符数 + 1”，少一个字节就会写出界；目标不是字符串或源已越界同样未定义",
    "examples": "默认 char d[6]; strcpy(d,\"hello\") → 内容 \"hello\"、d[5]=='\\0'；自定义 char d[5]; strcpy(d,\"abcd\") → d[4]=='\\0'（4 字符正好占 5 字节）；边界 目标先填 '#' 再 strcpy(d,\"abcd\") → 第 5 字节被写成 '\\0'，无残留 '#'"
  },
  "strcat": {
    "parameters": "s1 已终止的可写字符串，s2 源字符串；追加长度 = strlen(s2)+1 字节（含终止符）",
    "requires": "s1 容量 ≥ strlen(s1)+strlen(s2)+1；s1 必须以 NUL 结尾；两对象不重叠",
    "returns": "s1",
    "effects": "s2 首字符覆盖 s1 的终止符，追加内容并写新的终止符",
    "warning": "常见错误是给 s1 只留了 strlen(s1)+strlen(s2) 字节，漏掉终止符那 1 字节；strcat(s, s) 也是重叠，未定义",
    "examples": "默认 char b[11]=\"abc\"; strcat(b,\"de\") → \"abcde\"；自定义 char b[6]=\"abc\"; strcat(b,\"de\") → 正好 6 字节，b[5]=='\\0'；边界 strcat(b,\"\") → 内容不变"
  },
  "strchr": {
    "parameters": "c 为 int，定位前转换为 char；终止符被视为字符串的一部分",
    "requires": "s 有效且已终止",
    "returns": "指向首个匹配字符的指针；找不到返回空指针",
    "effects": "无（但返回类型是 char *，只有在原对象可写时才能通过它改写）",
    "warning": "strchr(s,'\\0') 一定返回指向终止符的指针而不是 NULL，这个“陷阱”常被当作“没找到”",
    "examples": "默认 strchr(\"hello\",'l') → 偏移 2；自定义 strchr(\"hello\",'z') → NULL；边界 strchr(\"hello\",'\\0') → 偏移 5，strchr(\"\",'a') → NULL"
  },
  "strstr": {
    "parameters": "s1 被搜索串，s2 子串；按字节匹配，子串长度 = strlen(s2)",
    "requires": "两串有效且已终止",
    "returns": "指向 s1 中首次出现的子串起点；未找到返回空指针；s2 为空串时返回 s1",
    "effects": "无",
    "warning": "空串是“永远匹配”，写 if (strstr(...)) 前要先排除空 s2；返回指针是 char * 而非 const char *",
    "examples": "默认 strstr(\"hello world\",\"world\") → 偏移 6；自定义 strstr(\"aaa\",\"aa\") → 偏移 0（允许重叠、取最左）；边界 strstr(\"hello world\",\"\") → 偏移 0，strstr(\"ab\",\"abc\") → NULL"
  },
  "memcpy": {
    "parameters": "n 为字节数，与元素类型无关；s1 可写、s2 只读，均按 void * 处理",
    "requires": "两对象各至少 n 字节；不得重叠",
    "returns": "s1",
    "effects": "把 s2 的 n 个字节原样写入 s1；n=0 不写任何字节",
    "warning": "数组请用 sizeof 计算字节数；memcpy(dst,src,sizeof src) 与 sizeof *src 是两回事；重叠必须换 memmove",
    "examples": "默认 char src[6]=\"abcde\"; memcpy(dst,src,6) → dst 为 \"abcde\" 且 dst[5]=='\\0'；自定义 memcpy(part,src,3) → 只有前 3 字节变 abc，尾部保持 'Z'；边界 memcpy(keep,src,0) → 返回 keep、内容不变"
  },
  "memmove": {
    "parameters": "n 为字节数；无 restrict，允许重叠",
    "requires": "两对象各至少 n 字节",
    "returns": "s1",
    "effects": "等价于“先把 n 字节复制到不与两者重叠的临时数组，再写回 s1”，故重叠结果确定",
    "warning": "memmove 不是“更慢的 memcpy”，而是“重叠时唯一正确”的那个；结果与方向无关",
    "examples": "默认 char b[10]=\"abcdef\"; memmove(b+2,b,4) → \"ababcd\"；自定义 memmove(b,b+2,4) → \"cdefef\"；边界 memmove(b,b,0) → 返回 b、不变"
  },
  "memset": {
    "parameters": "c 为 int，按 unsigned char 逐字节写入；n 为字节数",
    "requires": "s 至少 n 字节可写",
    "returns": "s",
    "effects": "把 s 的前 n 个字节全部置为 (unsigned char)c",
    "warning": "memset(a, 1, sizeof a) 不会把 int 数组置 1，只会得到 0x01010101；清零对象用 memset(&x, 0, sizeof x)；c 超出 0–255 的部分被截断（0x141 与 'A' 等价）",
    "examples": "默认 char m[6]; memset(m,'A',5); m[5]='\\0' → \"AAAAA\"；自定义 int x=12345; memset(&x,0,sizeof x) → x==0；边界 memset(m,'Z',0) → 内容不变，memset(m,0x141,1) → 写入 'A'"
  },
  "memcmp": {
    "parameters": "n 为参与比较的字节数；逐字节按 unsigned char 比较",
    "requires": "两对象各至少 n 字节；n 可为 0",
    "returns": "三态符号，由首个不同字节（按 unsigned char）的差值符号决定；数值不作承诺",
    "effects": "无",
    "warning": "memcmp 不认终止符，可用于含 0x00 的二进制数据；比较字符串时它不会在 NUL 处停",
    "examples": "默认 memcmp(\"abc\",\"abd\",2) → 0；自定义 memcmp(\"abc\",\"abd\",3) → <0；边界 memcmp(\"abc\",\"abd\",0) → 0，{0xFF} vs {0x01} → >0，{'a',0,'b'} vs {'a',0,'c'}（n=3）→ <0"
  },
  "isdigit": {
    "parameters": "单个字符值（int），不是字符串",
    "requires": "EOF 或 0–255 可表示值",
    "returns": "十进制数字字符为真（非零），否则 0",
    "effects": "无",
    "warning": "只认 '0'–'9'，不认全角、阿拉伯-印度数字等其他书写系统数字",
    "examples": "默认 isdigit('7') → 非零；自定义 isdigit('a') → 0；边界 isdigit(EOF) → 0，isdigit('/') → 0"
  },
  "isalpha": {
    "returns": "字母为真",
    "effects": "无",
    "warning": "'_' 不是字母（isalnum 也不是），标识符判断要自己加下划线；\"C\" locale 只认 ASCII 字母",
    "examples": "默认 isalpha('a')、isalpha('Z') → 非零；自定义 isalpha('1') → 0；边界 isalpha('_') → 0",
    "parameters": "传入一个字符值。普通 char 先转成 unsigned char；从流读取的 EOF 可直接传入。"
  },
  "isalnum": {
    "returns": "isalpha 或 isdigit 为真时为真",
    "effects": "无",
    "warning": "判断“合法标识符字符”应为 isalnum(c) || c=='_'，别漏下划线",
    "examples": "默认 isalnum('a')、isalnum('9') → 非零；自定义 isalnum(' ') → 0；边界 isalnum('-') → 0",
    "parameters": "传入一个字符值。普通 char 先转成 unsigned char；从流读取的 EOF 可直接传入。"
  },
  "isspace": {
    "returns": "标准空白字符为真：空格、\\f、\\n、\\r、\\t、\\v 共 6 个",
    "effects": "无",
    "warning": "isspace('\\0') 为假，所以 while (isspace(*p)) p++; 不会把字符串终止符当空白吞掉；换行也算空白，按行解析要单独处理 '\\n'",
    "examples": "默认 isspace(' ')、isspace('\\t') → 非零；自定义 6 个空白字符全真；边界 isspace('\\0')、isspace('a') → 0",
    "parameters": "传入一个字符值。普通 char 先转成 unsigned char；从流读取的 EOF 可直接传入。"
  },
  "toupper": {
    "returns": "若为小写字母且有对应大写，返回对应大写；否则原值不变返回",
    "effects": "无（返回新值，不改实参）",
    "warning": "toupper 不改原变量，必须写 c = toupper(c)；非字母原样返回，所以可以整串无脑映射；返回值可表示为 unsigned char，但不要依赖具体实现",
    "examples": "默认 toupper('a') → 'A'；自定义 toupper('A') → 'A'；边界 toupper('1') → '1'，toupper(EOF) → EOF",
    "parameters": "传入一个字符值。普通 char 先转成 unsigned char；从流读取的 EOF 可直接传入。"
  },
  "tolower": {
    "returns": "若为大写字母且有对应小写，返回对应小写；否则原值返回",
    "effects": "无",
    "warning": "与 toupper 同坑——返回值要接住；tolower(EOF) 返回 EOF，可用于“先判断再转换”的写法",
    "examples": "默认 tolower('A') → 'a'；自定义 tolower('a') → 'a'；边界 tolower('0') → '0'",
    "parameters": "传入一个字符值。普通 char 先转成 unsigned char；从流读取的 EOF 可直接传入。"
  },
  "printf": {
    "parameters": "format 中的转换说明必须与后续实参类型一一匹配；返回值单位是字符数",
    "requires": "format 非空；%s 实参以 NUL 结尾；%p 只接受 void *",
    "returns": "实际传输的字符数；输出错误时为负值（负值大小实现相关）",
    "effects": "写入 stdout，不改任何实参",
    "warning": "%d 传 long、%f 传 int 都是 UB；printf 的返回值可用于检查是否全部写出",
    "examples": "默认 printf(\"abc\") → 返回 3；自定义 printf(\"%d|%s\\n\", 42, \"x\") → 5（\"42|x\\n\"）；边界 printf(\"%5.2f\\n\", 3.14159) → 6（\" 3.14\" 5 字符 + 换行）"
  },
  "scanf": {
    "parameters": "转换说明 + 目标对象指针；%d→int *，%c→char *，%s→char 数组；数值按十进制等格式解析",
    "requires": "指针类型与转换说明匹配；%s/%[ 建议带宽度；流处于可读状态",
    "returns": "成功赋值的项数；首个转换前遇输入失败返回 EOF；匹配失败返回 0（已赋值 0 项）",
    "effects": "写入目标对象；%s 不配宽度会按输入长度写越界",
    "warning": "多数转换自动跳过前导空白，%c、%[、%n 不跳；区分 0 与 EOF 是判断输入结束的关键",
    "examples": "默认 输入 42 hello → scanf(\"%d\") 返回 1、得 42；自定义 输入 abc → 返回 0 且变量不变；边界 无输入（EOF）→ 返回 EOF"
  },
  "getchar": {
    "parameters": "无参数；每次读 1 字节",
    "requires": "stdin 可读",
    "returns": "下一个字符，作为 unsigned char 转 int；文件结束或读错误返回 EOF",
    "effects": "推进 stdin 位置，消耗该字节",
    "warning": "必须用 int 接收，用 char 接会把 0xFF 与 EOF 混淆",
    "examples": "默认 输入 w → 返回 'w'；自定义 scanf(\"%s\") 后留下的空格 → 返回 ' '；边界 输入耗尽 → EOF"
  },
  "putchar": {
    "parameters": "c 为 int，写出其 unsigned char 值；单位 1 字节",
    "requires": "stdout 可写",
    "returns": "写入的字符（int）；出错返回 EOF",
    "effects": "向 stdout 追加 1 字节",
    "warning": "返回值不是“成功/失败”布尔，而是字符本身，和 EOF 比较才算错误判断",
    "examples": "默认 putchar('X') → 返回 88 并输出 X；自定义 putchar('7') → 55；边界 putchar('\\n') → 10"
  },
  "puts": {
    "parameters": "s 为以 NUL 结尾的字符串；自动追加 1 个换行",
    "requires": "s 非空指针且已终止",
    "returns": "成功返回非负值；写错误返回 EOF",
    "effects": "将 s 与换行写入 stdout，不改 s",
    "warning": "puts 自带换行，别再手动加 \"\\n\"；空串会输出一个空行",
    "examples": "默认 puts(\"hi\") → 输出 hi\\n、返回非负；自定义 puts(\"\") → 只输出一个换行、返回非负；边界 打印含 '\\n' 的串会得到两个换行（按标准）"
  },
  "fgets": {
    "parameters": "n 是缓冲区大小（含终止符），最多读 n-1 字节",
    "requires": "s 至少 n 字节可写；stream 可读；n ≥ 1",
    "returns": "成功返回 s；文件结束且未读到字符、或读错误时返回 NULL",
    "effects": "写入 s，总是补 '\\0'；换行若放得下会被保留",
    "warning": "n 不是“要读多少字符”；NULL 不区分 EOF 与错误，需要 feof/ferror 才能分开",
    "examples": "默认 行 line1\\n、n=32 → \"line1\\n\"；自定义 n=8 读剩余 \"orld\\n\" → \"orld\\n\"（5 字节，含换行）；边界 无输入 → NULL"
  },
  "snprintf": {
    "parameters": "n 是缓冲区容量（字节，含 NUL）；返回值单位是字符数（不含 NUL）",
    "requires": "n > 0 时 s 至少 n 字节；n = 0 时 s 可为 NULL",
    "returns": "若无 n 限制本应写入的字符数；截断不影响该值；编码错误返回负值",
    "effects": "写入至多 n-1 个字符并补 NUL（n=0 时什么都不写）",
    "warning": "先判断返回值是否为负。容量大于零时，非负返回值大于或等于容量，说明内容被截断。容量为零是查询长度的用法。",
    "examples": "第一行输入 hello，第二行填 4，缓冲区得到 hel，返回 5。第二行改成 6，就能放下 hello 和结尾的空字符，返回值仍是 5。填 0 时不写入，仍可查询所需长度。"
  },
  "atoi": {
    "parameters": "以 NUL 结尾的字符串；解析十进制整数",
    "requires": "nptr 有效",
    "returns": "可表示时返回对应的 int；无数字返回 0",
    "effects": "无",
    "warning": "没有错误检测，结果超出 int 是 UB；转换失败与“真的读到 0”无法区分，工程代码用 strtol",
    "examples": "默认 atoi(\"42\") → 42；自定义 atoi(\"  -17xyz\") → -17；边界 atoi(\"abc\") → 0，atoi(\"\") → 0"
  },
  "strtol": {
    "parameters": "base 为 0 或 2–36；base 0 按前缀判断（0x 十六进制、0 八进制）；endptr 可为 NULL",
    "requires": "nptr 有效；base 合法；判断范围错误前先把 errno 清零",
    "returns": "转换结果；无可转换字符返回 0 且 *endptr == nptr；上/下溢返回 LONG_MAX/LONG_MIN 并置 errno = ERANGE",
    "effects": "写 *endptr（若不为 NULL）",
    "warning": "endptr 是判断“整串是否都转完”的唯一手段；base 0 下 \"077\" 是八进制 63，容易被误读",
    "examples": "默认 strtol(\"42\", &e, 10) → 42、*e=='\\0'；自定义 strtol(\"0x1F\", &e, 0) → 31；边界 strtol(\"abc\", &e, 10) → 0、*e=='a'；溢出串 → LONG_MAX + ERANGE"
  },
  "strtod": {
    "parameters": "接受十进制、指数、十六进制浮点（0x1p3）、inf、nan",
    "requires": "nptr 有效；查 ERANGE 前先清零 errno",
    "returns": "最接近的 double；无转换返回 0.0 且 *endptr == nptr；上溢返回 ±HUGE_VAL 并置 ERANGE；下溢返回不超过最小正规数的值（可能置 ERANGE）",
    "effects": "写 *endptr",
    "warning": "\"0x1p3\" 是 8.0 不是 0；nan/inf 能被解析，输入校验不能只看 strtod 成功",
    "examples": "默认 strtod(\"3.5\", &e) → 3.5；自定义 strtod(\"1e3\", &e) → 1000.0；边界 strtod(\"1e400\", &e) → +inf 且 errno==ERANGE，strtod(\"abc\", &e) → 0.0"
  },
  "malloc": {
    "parameters": "size 为字节数",
    "requires": "size 可为 0（实现定义）",
    "returns": "成功返回适合任何基本对齐的空块首地址；失败返回 NULL",
    "effects": "分配一块未初始化存储；需 free 归还",
    "warning": "内容未初始化；malloc(0) 可能返回 NULL 也可能返回可 free 的指针；sizeof 用对象写法避免类型写错",
    "examples": "默认 malloc(10 * sizeof(int)) → 非空且 10 个元素可读写；自定义 二次分配用于 realloc；边界 malloc(0) → 实现定义（本机返回非空指针）"
  },
  "calloc": {
    "parameters": "nmemb 元素个数、size 每元素字节；总量为乘积",
    "requires": "乘积应可表示；实现不保证检测乘法溢出",
    "returns": "成功返回全零位初始化的块；失败返回 NULL",
    "effects": "分配并清零",
    "warning": "全零位不保证等于“所有类型的零值”（指针、浮点尤其如此）；溢出检测不要依赖 calloc",
    "examples": "默认 8 个元素在 calloc(8, sizeof(int)) 后全为 0；自定义 calloc(1, sizeof(int)) 单元素为 0（按标准）；边界 calloc(0, n) 为 0 字节请求，返回值为实现定义或 NULL（按标准，不演示）"
  },
  "realloc": {
    "parameters": "size 为新块字节数；ptr 为 NULL 时等价 malloc",
    "requires": "ptr 必须是 malloc/calloc/realloc 返回且未释放的指针",
    "returns": "成功返回新块（地址可与旧块相同）；失败返回 NULL，旧块不被释放且内容有效",
    "effects": "可能搬移并释放旧块；保留 min(旧大小, 新大小) 字节",
    "warning": "先写 new_ptr = realloc(ptr, size)。确认 new_ptr 非空后再替换 ptr。非零大小的请求失败时，旧内存仍然有效；直接写 ptr = realloc(ptr, size) 可能丢失唯一能释放旧块的地址。",
    "examples": "第一行填元素数 3。第二行填 success，扩容后仍能读到旧值 7；改填 failure，样板模拟收到 NULL，并在释放前读出旧块中的 7。"
  },
  "free": {
    "parameters": "ptr 为动态分配返回的指针，或 NULL",
    "requires": "ptr 未被释放过，且不是 NULL 以外的非堆指针",
    "returns": "无",
    "effects": "释放块；ptr 的值变为不确定",
    "warning": "free(NULL) 是合法的空操作；重复释放、释放后继续用、释放栈地址都是 UB；释放后建议置 NULL",
    "examples": "默认 释放 malloc 块；自定义 释放 calloc 块；边界 free(NULL) 无动作"
  },
  "qsort": {
    "parameters": "nmemb 元素个数、size 每元素字节；比较器返回 <0/0/>0",
    "requires": "元素可按比较器比较；比较器给出全序且不得改数组",
    "returns": "无",
    "effects": "原地重排 base 的 nmemb 个元素；不保证稳定",
    "warning": "比较器不要写 return *a - *b（会溢出）；不要依赖相等元素的先后",
    "examples": "默认 {5,2,9,1,5,6,0,3} → 升序 0..9；自定义 重复 5 的位置不作承诺（按标准，本机仅记录命中偏移）；边界 nmemb=0 → 不重排"
  },
  "bsearch": {
    "parameters": "key 指向待查值对象（不是值本身）；nmemb 元素数、size 每元素字节",
    "requires": "数组已按同一比较器排好序",
    "returns": "指向匹配元素的 void *；找不到返回 NULL；重复元素返回哪个未指定",
    "effects": "无",
    "warning": "排序与查找的 comparator 必须一致；nmemb=0 合法并返回 NULL",
    "examples": "默认 在 {0,1,2,3,5,5,6,9} 找 9 → 命中；自定义 找 4 → NULL；边界 nmemb=0 → NULL"
  },
  "fopen": {
    "parameters": "filename 路径；mode 为 \"r\"/\"w\"/\"a\"/\"r+\"/\"w+\"/\"a+\" 及 b 变体，C11 还支持 x",
    "requires": "路径可访问；mode 合法",
    "returns": "成功返回流指针；失败返回 NULL（可查 errno）",
    "effects": "打开/创建文件；\"w\" 截断为 0 字节",
    "warning": "必须判 NULL；\"w\" 会清空已有文件；Windows 下文本模式会把 \\n 写成 \\r\\n",
    "examples": "默认 不存在的文件用 \"r\" → NULL；自定义 \"w\" 创建后写入；边界 \"rb\" 读回二进制"
  },
  "fclose": {
    "parameters": "stream 为已打开的流",
    "requires": "流未关闭；不能是 NULL",
    "returns": "成功 0；失败 EOF",
    "effects": "刷新缓冲并关闭；流不可再用",
    "warning": "fclose 失败也可能已部分写出，写文件后要检查返回值；fclose(NULL) 是 UB",
    "examples": "默认 关闭写流 → 0；自定义 关闭读流 → 0；边界 三对打开/关闭连续执行，返回值均为 0"
  },
  "fprintf": {
    "parameters": "同 printf，输出目标为 stream；返回值单位字符数",
    "requires": "流可写；格式与实参类型匹配",
    "returns": "传输字符数；出错为负值",
    "effects": "写入流缓冲",
    "warning": "写入文件的文本在 Windows 文本模式下可能多出 \\r，字节数与 ftell 会受影响",
    "examples": "默认 fprintf(f, \"%d %s\\n\", 7, \"seven\") → 8；自定义 fprintf(f, \"%s\", \"\") → 0；边界 只写换行 fprintf(f, \"\\n\") → 1（按标准）"
  },
  "fscanf": {
    "parameters": "同 scanf，来源为 stream",
    "requires": "流可读；指针类型匹配",
    "returns": "赋值项数；首个转换前失败 EOF；匹配失败 0",
    "effects": "写入目标对象，推进流位置",
    "warning": "%s 一样要限宽；读文件时 0 与 EOF 含义不同",
    "examples": "默认 读 \"%d %15s\" → 2（7, \"seven\"）；自定义 读完再读 → EOF；边界 首个字符就不匹配 → 0（按标准）"
  },
  "fread": {
    "parameters": "size 每元素字节、nmemb 元素数；返回值是元素个数不是字节数",
    "requires": "缓冲区至少 size * nmemb 字节；size/nmemb 可为 0",
    "returns": "成功读入的元素个数；短计数表示遇到 EOF 或错误",
    "effects": "写入 ptr，推进流位置",
    "warning": "要 5 个只读到 3 个时返回 3；想按字节读就令 size=1",
    "examples": "默认 读 5 个 int → 5；自定义 读到 EOF 再读 → 0；边界 文件剩 3 个元素却请求 5 → 3"
  },
  "fwrite": {
    "parameters": "size 每元素字节、nmemb 元素数；返回写入元素个数",
    "requires": "流可写；缓冲区至少 size * nmemb 字节",
    "returns": "成功写出的元素个数；短计数表示写出错误",
    "effects": "写入流缓冲",
    "warning": "文本模式写 int 数组可能被换行转换破坏，二进制数据必须 \"wb\"",
    "examples": "默认 写 5 个 int → 5；自定义 写 3 个元素 → 3（按标准）；边界 nmemb=0 → 0"
  },
  "fseek": {
    "parameters": "offset 字节偏移；whence 为 SEEK_SET/SEEK_CUR/SEEK_END",
    "requires": "流可定位（非管道/终端）；文本流只用 ftell 返回值作偏移",
    "returns": "成功 0；失败非 0",
    "effects": "移动文件位置指示器，清除 ungetc 状态",
    "warning": "文本模式下“字节 8”不保证是同一位置；跨平台按字节定位请用二进制模式",
    "examples": "默认 fseek(f, 0, SEEK_SET) → 0；自定义 SEEK_END 后 ftell 等于文件大小；边界 失败返回非 0（不演示）"
  },
  "ftell": {
    "parameters": "成功时二进制流返回字节偏移；单位字节",
    "requires": "流可定位",
    "returns": "当前位置；出错返回 -1L",
    "effects": "无",
    "warning": "long 在 32 位平台只有 2 GB 范围，大文件需平台扩展接口；出错判断用 -1L 而不是“小于 0 不一定”",
    "examples": "默认 fseek(0, SEEK_SET) 后 → 0；自定义 读一行后 → > 0；边界 SEEK_END → 文件字节数"
  },
  "sqrt": {
    "parameters": "实数，无单位约定（按调用方语义）",
    "requires": "x ≥ 0；-0.0 合法",
    "returns": "非负平方根；x < 0 为域错误（IEEE 下返回 NaN）",
    "effects": "无",
    "warning": "负数开方不会中断程序，得到 NaN 后会一路污染；判断用 isnan；sqrt(-0.0) 是 -0.0",
    "examples": "默认 sqrt(9.0) → 3.0；自定义 sqrt(2.0) → 1.41421356...；边界 sqrt(-1.0) → NaN，sqrt(-0.0) → -0.0"
  },
  "pow": {
    "parameters": "底与指数；指数不需为整数",
    "requires": "x < 0 时 y 应为整数；x = 0 且 y < 0 为极点错误",
    "returns": "x^y；标准特例 pow(±0, 0)=1、pow(-1, ±inf)=1；上溢返回 HUGE_VAL 并置 ERANGE",
    "effects": "无",
    "warning": "整数幂用连乘或 ipow，pow 有精度与性能代价；pow(0.0, -1.0) 是极点错误",
    "examples": "默认 pow(2.0, 10.0) → 1024.0；自定义 pow(2.0, 0.5) → sqrt(2)；边界 pow(0.0, 0.0) → 1.0，pow(-1.0, HUGE_VAL) → 1.0"
  },
  "fabs": {
    "parameters": "任意实数（含 inf/NaN）",
    "requires": "无",
    "returns": "|x|；fabs(-0.0) 为 +0.0",
    "effects": "无",
    "warning": "fabs 是浮点版，整数用 abs/labs；不要用 x < 0 ? -x : x 处理 -0.0",
    "examples": "默认 fabs(-3.5) → 3.5；自定义 fabs(2.5) → 2.5（按标准）；边界 fabs(-0.0) → +0.0（signbit 为假）"
  },
  "floor": {
    "parameters": "实数",
    "requires": "无",
    "returns": "不大于 x 的最大整数值，类型仍是 double",
    "effects": "无",
    "warning": "结果是 double，转 int 前要确认范围；负数向下取整更小（-2.1 → -3）",
    "examples": "默认 floor(2.7) → 2.0；自定义 floor(-2.1) → -3.0；边界 floor(-0.0) → -0.0"
  },
  "ceil": {
    "parameters": "实数",
    "requires": "无",
    "returns": "不小于 x 的最小整数值，类型 double",
    "effects": "无",
    "warning": "ceil(-0.5) 是 -0.0 而不是 0.0，signbit 能看出差别",
    "examples": "默认 ceil(2.1) → 3.0；自定义 ceil(-2.9) → -2.0；边界 ceil(-0.5) → -0.0"
  },
  "round": {
    "parameters": "实数",
    "requires": "无",
    "returns": "最接近的整数，恰好一半时远离零；类型 double",
    "effects": "无",
    "warning": "round 不是“四舍五入到偶数”，-2.5 → -3；与 rint 的半偶规则不同",
    "examples": "默认 round(2.5) → 3.0；自定义 round(-2.5) → -3.0；边界 round(-0.4) → -0.0（比较等于 0.0）"
  },
  "sin": {
    "parameters": "弧度，不是角度",
    "requires": "x 为有限值（±inf 是域错误）",
    "returns": "正弦值，范围 [-1, 1]（含端点误差内）",
    "effects": "无",
    "warning": "x 很大时精度会明显下降；传角度要先 x * 3.14159... / 180",
    "examples": "默认 sin(0.0) → 0.0；自定义 sin(pi/2) → 1.0；边界 sin(pi) → 约 1e-16（容差判定为 0）"
  },
  "cos": {
    "parameters": "弧度",
    "requires": "有限值",
    "returns": "余弦值",
    "effects": "无",
    "warning": "cos(0) 是精确 1.0，可作为快速自检",
    "examples": "默认 cos(0.0) → 1.0；自定义 cos(pi/3) → 0.5（按标准）；边界 cos(pi) → -1.0"
  },
  "rand": {
    "parameters": "无参数；返回值单位“随机数”",
    "requires": "无（未 srand 时等价种子 1）",
    "returns": "[0, RAND_MAX] 内的伪随机整数；RAND_MAX ≥ 32767",
    "effects": "推进内部序列状态",
    "warning": "序列质量不作标准承诺，不能用于加密或统计模拟；rand() % n 分布有偏",
    "examples": "默认 两次调用都在 [0, RAND_MAX]；自定义 srand(1) 后两次值与再次 srand(1) 完全一致；边界 RAND_MAX 至少 32767"
  },
  "srand": {
    "parameters": "seed 为无符号整数种子",
    "requires": "先于使用 rand",
    "returns": "无",
    "effects": "重置 rand 的序列起点",
    "warning": "同一进程里重复 srand 会重置序列；种子相同则序列相同是标准保证，跨实现不保证",
    "examples": "默认 srand(1) 两次 → 序列一致；自定义 srand(2) 首值可能不同（不作保证）；边界 不调用 srand 也能工作"
  },
  "time": {
    "parameters": "timer 可为 NULL；否则写入该对象；time_t 编码未指定，通常为秒",
    "requires": "无",
    "returns": "当前日历时间；同时写入 *timer；时间不可用时返回 (time_t)(-1)",
    "effects": "写 *timer",
    "warning": "time_t 不保证是算术类型，两时刻相减用 difftime 而不是直接减",
    "examples": "默认 time(NULL) → 当前时间（> 1.6e9）；自定义 传指针时返回值与 *timer 相同；边界 (time_t)(-1) 表示不可用（不演示）"
  },
  "difftime": {
    "parameters": "两个 time_t；返回秒（double）",
    "requires": "两个时间值有效",
    "returns": "time1 - time0 的秒数",
    "effects": "无",
    "warning": "顺序决定符号；返回值是 double，不要强转成整数丢精度",
    "examples": "默认 difftime(t+3600, t) → 3600.0；自定义 difftime(t, t+60) → -60.0；边界 difftime(t, t) → 0.0"
  },
  "clock": {
    "parameters": "无参数；返回处理器时间的 tick 数；每秒 tick 数为 CLOCKS_PER_SEC",
    "requires": "无",
    "returns": "自程序启动使用的处理器时间；不可用返回 (clock_t)(-1)；可能回绕",
    "effects": "无",
    "warning": "这是 CPU 时间不是墙钟时间；秒数 = (c1 - c0) / CLOCKS_PER_SEC，本机 CLOCKS_PER_SEC 实测 1000",
    "examples": "默认 短循环前后 c1 >= c0；自定义 换算秒数 (c1-c0)/CLOCKS_PER_SEC 非负；边界 CLOCKS_PER_SEC > 0"
  }
};

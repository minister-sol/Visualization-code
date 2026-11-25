# C 标准库教学语义核查（第一批 17 项）

CodeLens 独立复核 · 2026-11-24 · 执行者：豆包（本聊天）
核查范围：`strlen strcmp strncmp strcpy strcat strchr strstr` / `memcpy memmove memset memcmp` / `isdigit isalpha isalnum isspace toupper tolower`
状态：17/17 已覆盖条款与可执行用例；76 项断言全部通过；未提交、未改动产品文件。

## 1. 环境与来源

| 项 | 实际值 |
| --- | --- |
| 仓库 | `E:\Visualization code`，分支 `codex/c-standard-library`，HEAD `d42dfd5` |
| 工作树 | 含 Codex 与既有未提交改动（`AGENTS.md`、`web/*`、`backend/*` 等），保持原状 |
| 编译器 | `gcc.exe (Rev6, Built by MSYS2 project) 16.2.0`（`E:\DevTools\msys64\ucrt64\bin\gcc.exe`）；`clang` 不可用 |
| 标准来源 | WG14 C11 草案 N1570（`https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf`，条款正文抽取核对）；条款号另经 N1570 全文 HTML 镜像（`https://port70.net/~nsz/c/c11/n1570.html`）逐条锚点比对 |
| 本次新增 | `docs/C_STDLIB_SEMANTICS_REVIEW.md`（本文件）、`docs/cstdlib_samples/*.c`（三个原生用例） |
| 编译命令 | `gcc -std=c11 -Wall -Wextra -pedantic -o <name>.exe <name>.c` |
| 编译结果 | 三个套件均 `0` 警告、`0` 错误；运行退出码 `0` |
| 断言统计 | `strings_test` 34 项、`memory_test` 20 项、`ctype_test` 22 项，合计 **76 项，0 失败** |

三个套件只编译有定义行为的调用；未定义行为没有进代码，只在本文件第 5 节写触发条件与调用前提示。

## 2. 本批六个重点结论（页面讲解可直接采用）

1. **`strlen` 计字节**：返回终止符之前的字节数，NUL 不计入。UTF-8 `"中文abc"` 是 9 字节（每汉字 3 字节），不是 5 个“字”。
2. **`strcpy` 容量含终止符**：目标容量至少 `strlen(src) + 1`；4 个字符要 5 字节。`strcat` 同理为 `strlen(dst) + strlen(src) + 1`。
3. **重叠**：`memcpy` 源目标重叠即未定义行为；`memmove` 允许重叠，效果等价于“先整块复制到临时数组再写回”。`strcpy`、`strcat` 重叠同样是未定义行为。
4. **比较只保证符号**：`strcmp`、`strncmp`、`memcmp` 只保证 `<0 / ==0 / >0`，不保证具体数值（本机实测 `strcmp("abc","abd")` 为 `-1`，换实现可能不同）。三者都按 `unsigned char` 比较，故 `0xFF` 大于 `'a'`。
5. **`memcmp` 不比 `strcmp`“更严格”**：`memcmp` 按 `n` 个字节全比，遇 NUL 不停；`strncmp` 遇 NUL 提前结束。
6. **`ctype` 参数取值域**：实参必须是 `EOF`，或可表示为 `unsigned char` 的值；把带符号 `char` 的负值（如 0xE4 存成 -28）直接传入是未定义行为。正确写法 `isalpha((unsigned char)c)`。返回值只保证“零/非零”，不保证等于 1。

## 3. 逐函数记录

格式约定：`[]` 内为字节单位说明；返回“符号”指 `<0/0/>0` 三态；“影响”指对实参对象的写入。

### 3.1 字符串

#### 1. `strlen` — §7.24.6.3
- **头文件 / 原型 / 条款**：`#include <string.h>`；`size_t strlen(const char *s);`；C11 N1570 §7.24.6.3
- **参数与单位**：`s` 为指向字符串首字节的只读指针；长度单位是**字节**（`size_t`）
- **调用前提**：`s` 非空，所指对象完整且以 `'\0'` 结尾
- **返回值**：终止符之前的字节数，不含 NUL
- **影响**：无（只读）
- **提醒**：NUL 不计入长度；`strlen(s)` 与 `sizeof s` 在数组上结果不同（后者含终止符，且指针上会退化为指针大小）
- **三例**：默认 `strlen("hello")` → `5`；自定义 `strlen("中文abc")` → `9`；边界 `strlen("")` → `0`，`{'a','\0','b'}` → `1`，255 字节 → `255`
- **实测**：PASS（6 项）

#### 2. `strcmp` — §7.24.4.2
- **头文件 / 原型 / 条款**：`<string.h>`；`int strcmp(const char *s1, const char *s2);`；§7.24.4.2
- **参数与单位**：两个以 NUL 结尾的字符串，逐字节比较（按 `unsigned char` 取值比较）
- **调用前提**：两指针均有效且字符串已终止
- **返回值**：`s1` 小于/等于/大于 `s2` 时分别 `<0 / 0 / >0`；**具体数值不作承诺**
- **影响**：无（只读）
- **提醒**：不要写 `if (strcmp(a,b))` 当“相等”用；也不要当“差多少”用
- **三例**：默认 `strcmp("abc","abc")` → `0`；自定义 `strcmp("abc","abd")` → `<0`；边界 `strcmp("abc","ab")` → `>0`（等前缀但更长者大），`strcmp("","")` → `0`，`char c[2]={(char)0xFF,0}; strcmp(c,"a")` → `>0`
- **实测**：PASS（6 项，实测值 -1）

#### 3. `strncmp` — §7.24.4.4
- **头文件 / 原型 / 条款**：`<string.h>`；`int strncmp(const char *s1, const char *s2, size_t n);`；§7.24.4.4
- **参数与单位**：`n` 为**最多比较的字节数**（不是“第 n 个字符”）
- **调用前提**：两指针有效；`n` 可为 0（此时两指针仍须有效）
- **返回值**：三态符号；遇 NUL 提前结束（“null 之后的字符不再比较”）
- **影响**：无
- **提醒**：`n` 取 `strlen(prefix)` 只能比较前缀；要整串相等须 `n = strlen(s)+1` 或改用 `strcmp`
- **三例**：默认 `strncmp("abc","abd",2)` → `0`；自定义 `strncmp("abc","abd",3)` → `<0`；边界 `strncmp("abc","xyz",0)` → `0`，`strncmp("ab","abc",3)` → `<0`
- **实测**：PASS（5 项）

#### 4. `strcpy` — §7.24.2.3
- **头文件 / 原型 / 条款**：`<string.h>`；`char *strcpy(char * restrict s1, const char * restrict s2);`；§7.24.2.3
- **参数与单位**：`s1` 目标缓冲区（可写），`s2` 源字符串（只读）；复制长度 = `strlen(s2)+1` **字节**
- **调用前提**：`s1` 容量 ≥ `strlen(s2)+1`；两对象不重叠（`restrict` 且条款明示重叠未定义）
- **返回值**：`s1`
- **影响**：把 `s2` 的全部字符**连同终止符**写入 `s1`，覆盖原内容
- **提醒**：容量算的是“字符数 + 1”，少一个字节就会写出界；目标不是字符串或源已越界同样未定义
- **三例**：默认 `char d[6]; strcpy(d,"hello")` → 内容 `"hello"`、`d[5]=='\0'`；自定义 `char d[5]; strcpy(d,"abcd")` → `d[4]=='\0'`（4 字符正好占 5 字节）；边界 目标先填 `'#'` 再 `strcpy(d,"abcd")` → 第 5 字节被写成 `'\0'`，无残留 `'#'`
- **实测**：PASS（4 项）

#### 5. `strcat` — §7.24.3.1
- **头文件 / 原型 / 条款**：`<string.h>`；`char *strcat(char * restrict s1, const char * restrict s2);`；§7.24.3.1
- **参数与单位**：`s1` 已终止的可写字符串，`s2` 源字符串；追加长度 = `strlen(s2)+1` 字节（含终止符）
- **调用前提**：`s1` 容量 ≥ `strlen(s1)+strlen(s2)+1`；`s1` 必须以 NUL 结尾；两对象不重叠
- **返回值**：`s1`
- **影响**：`s2` 首字符覆盖 `s1` 的终止符，追加内容并写新的终止符
- **提醒**：常见错误是给 `s1` 只留了 `strlen(s1)+strlen(s2)` 字节，漏掉终止符那 1 字节；`strcat(s, s)` 也是重叠，未定义
- **三例**：默认 `char b[11]="abc"; strcat(b,"de")` → `"abcde"`；自定义 `char b[6]="abc"; strcat(b,"de")` → 正好 6 字节，`b[5]=='\0'`；边界 `strcat(b,"")` → 内容不变
- **实测**：PASS（4 项）

#### 6. `strchr` — §7.24.5.2
- **头文件 / 原型 / 条款**：`<string.h>`；`char *strchr(const char *s, int c);`；§7.24.5.2
- **参数与单位**：`c` 为 `int`，定位前**转换为 `char`**；终止符被视为字符串的一部分
- **调用前提**：`s` 有效且已终止
- **返回值**：指向首个匹配字符的指针；找不到返回空指针
- **影响**：无（但返回类型是 `char *`，只有在原对象可写时才能通过它改写）
- **提醒**：`strchr(s,'\0')` 一定返回指向终止符的指针而不是 NULL，这个“陷阱”常被当作“没找到”
- **三例**：默认 `strchr("hello",'l')` → 偏移 `2`；自定义 `strchr("hello",'z')` → `NULL`；边界 `strchr("hello",'\0')` → 偏移 `5`，`strchr("",'a')` → `NULL`
- **实测**：PASS（4 项）

#### 7. `strstr` — §7.24.5.7
- **头文件 / 原型 / 条款**：`<string.h>`；`char *strstr(const char *s1, const char *s2);`；§7.24.5.7
- **参数与单位**：`s1` 被搜索串，`s2` 子串；按字节匹配，子串长度 = `strlen(s2)`
- **调用前提**：两串有效且已终止
- **返回值**：指向 `s1` 中首次出现的子串起点；未找到返回空指针；**`s2` 为空串时返回 `s1`**
- **影响**：无
- **提醒**：空串是“永远匹配”，写 `if (strstr(...))` 前要先排除空 `s2`；返回指针是 `char *` 而非 `const char *`
- **三例**：默认 `strstr("hello world","world")` → 偏移 `6`；自定义 `strstr("aaa","aa")` → 偏移 `0`（允许重叠、取最左）；边界 `strstr("hello world","")` → 偏移 `0`，`strstr("ab","abc")` → `NULL`
- **实测**：PASS（5 项）

### 3.2 内存

#### 8. `memcpy` — §7.24.2.1
- **头文件 / 原型 / 条款**：`<string.h>`；`void *memcpy(void * restrict s1, const void * restrict s2, size_t n);`；§7.24.2.1
- **参数与单位**：`n` 为**字节数**，与元素类型无关；`s1` 可写、`s2` 只读，均按 `void *` 处理
- **调用前提**：两对象各至少 `n` 字节；**不得重叠**
- **返回值**：`s1`
- **影响**：把 `s2` 的 `n` 个字节原样写入 `s1`；`n=0` 不写任何字节
- **提醒**：数组请用 `sizeof` 计算字节数；`memcpy(dst,src,sizeof src)` 与 `sizeof *src` 是两回事；重叠必须换 `memmove`
- **三例**：默认 `char src[6]="abcde"; memcpy(dst,src,6)` → `dst` 为 `"abcde"` 且 `dst[5]=='\0'`；自定义 `memcpy(part,src,3)` → 只有前 3 字节变 `abc`，尾部保持 `'Z'`；边界 `memcpy(keep,src,0)` → 返回 `keep`、内容不变
- **实测**：PASS（6 项）

#### 9. `memmove` — §7.24.2.2
- **头文件 / 原型 / 条款**：`<string.h>`；`void *memmove(void *s1, const void *s2, size_t n);`；§7.24.2.2
- **参数与单位**：`n` 为字节数；无 `restrict`，允许重叠
- **调用前提**：两对象各至少 `n` 字节
- **返回值**：`s1`
- **影响**：等价于“先把 `n` 字节复制到不与两者重叠的临时数组，再写回 `s1`”，故重叠结果确定
- **提醒**：`memmove` 不是“更慢的 memcpy”，而是“重叠时唯一正确”的那个；结果与方向无关
- **三例**：默认 `char b[10]="abcdef"; memmove(b+2,b,4)` → `"ababcd"`；自定义 `memmove(b,b+2,4)` → `"cdefef"`；边界 `memmove(b,b,0)` → 返回 `b`、不变
- **实测**：PASS（4 项）

#### 10. `memset` — §7.24.6.1
- **头文件 / 原型 / 条款**：`<string.h>`；`void *memset(void *s, int c, size_t n);`；§7.24.6.1
- **参数与单位**：`c` 为 `int`，按 **`unsigned char`** 逐字节写入；`n` 为字节数
- **调用前提**：`s` 至少 `n` 字节可写
- **返回值**：`s`
- **影响**：把 `s` 的前 `n` 个字节全部置为 `(unsigned char)c`
- **提醒**：`memset(a, 1, sizeof a)` 不会把 `int` 数组置 1，只会得到 `0x01010101`；清零对象用 `memset(&x, 0, sizeof x)`；`c` 超出 0–255 的部分被截断（`0x141` 与 `'A'` 等价）
- **三例**：默认 `char m[6]; memset(m,'A',5); m[5]='\0'` → `"AAAAA"`；自定义 `int x=12345; memset(&x,0,sizeof x)` → `x==0`；边界 `memset(m,'Z',0)` → 内容不变，`memset(m,0x141,1)` → 写入 `'A'`
- **实测**：PASS（5 项）

#### 11. `memcmp` — §7.24.4.1
- **头文件 / 原型 / 条款**：`<string.h>`；`int memcmp(const void *s1, const void *s2, size_t n);`；§7.24.4.1
- **参数与单位**：`n` 为参与比较的字节数；逐字节按 `unsigned char` 比较
- **调用前提**：两对象各至少 `n` 字节；`n` 可为 0
- **返回值**：三态符号，由首个不同字节（按 `unsigned char`）的差值符号决定；数值不作承诺
- **影响**：无
- **提醒**：`memcmp` 不认终止符，可用于含 `0x00` 的二进制数据；比较字符串时它不会在 NUL 处停
- **三例**：默认 `memcmp("abc","abd",2)` → `0`；自定义 `memcmp("abc","abd",3)` → `<0`；边界 `memcmp("abc","abd",0)` → `0`，`{0xFF}` vs `{0x01}` → `>0`，`{'a',0,'b'}` vs `{'a',0,'c'}`（n=3）→ `<0`
- **实测**：PASS（5 项，实测值 -1）

### 3.3 字符分类与转换

共同前提（§7.4）：实参类型为 `int`，取值必须是 `EOF` 或**可表示为 `unsigned char`** 的值；其他取值未定义。返回值只保证零/非零。行为受当前 locale 影响，以下结论均为 `"C"` locale。

#### 12. `isdigit` — §7.4.1.5
- **原型**：`int isdigit(int c);`；头文件 `<ctype.h>`
- **参数与单位**：单个字符值（`int`），不是字符串
- **调用前提**：`EOF` 或 0–255 可表示值
- **返回值**：十进制数字字符为真（非零），否则 0
- **影响**：无
- **提醒**：只认 `'0'`–`'9'`，不认全角、阿拉伯-印度数字等其他书写系统数字
- **三例**：默认 `isdigit('7')` → 非零；自定义 `isdigit('a')` → `0`；边界 `isdigit(EOF)` → `0`，`isdigit('/')` → `0`
- **实测**：PASS（5 项；本机 `isdigit('7')` 原始值 `1`，仍不可依赖）

#### 13. `isalpha` — §7.4.1.2
- **原型**：`int isalpha(int c);`；`<ctype.h>`
- **前提 / 返回**：同上；字母为真
- **影响**：无
- **提醒**：`'_'` 不是字母（`isalnum` 也不是），标识符判断要自己加下划线；`"C"` locale 只认 ASCII 字母
- **三例**：默认 `isalpha('a')`、`isalpha('Z')` → 非零；自定义 `isalpha('1')` → `0`；边界 `isalpha('_')` → `0`
- **实测**：PASS（3 项）

#### 14. `isalnum` — §7.4.1.1
- **原型**：`int isalnum(int c);`；`<ctype.h>`
- **前提 / 返回**：`isalpha` 或 `isdigit` 为真时为真
- **影响**：无
- **提醒**：判断“合法标识符字符”应为 `isalnum(c) || c=='_'`，别漏下划线
- **三例**：默认 `isalnum('a')`、`isalnum('9')` → 非零；自定义 `isalnum(' ')` → `0`；边界 `isalnum('-')` → `0`
- **实测**：PASS（3 项）

#### 15. `isspace` — §7.4.1.10
- **原型**：`int isspace(int c);`；`<ctype.h>`
- **前提 / 返回**：标准空白字符为真：空格、`\f`、`\n`、`\r`、`\t`、`\v` 共 6 个
- **影响**：无
- **提醒**：`isspace('\0')` 为假，所以 `while (isspace(*p)) p++;` 不会把字符串终止符当空白吞掉；换行也算空白，按行解析要单独处理 `'\n'`
- **三例**：默认 `isspace(' ')`、`isspace('\t')` → 非零；自定义 6 个空白字符全真；边界 `isspace('\0')`、`isspace('a')` → `0`
- **实测**：PASS（3 项）

#### 16. `toupper` — §7.4.2.2
- **原型**：`int toupper(int c);`；`<ctype.h>`
- **前提 / 返回**：若为小写字母且有对应大写，返回对应大写；否则**原值不变**返回
- **影响**：无（返回新值，不改实参）
- **提醒**：`toupper` 不改原变量，必须写 `c = toupper(c)`；非字母原样返回，所以可以整串无脑映射；返回值可表示为 `unsigned char`，但不要依赖具体实现
- **三例**：默认 `toupper('a')` → `'A'`；自定义 `toupper('A')` → `'A'`；边界 `toupper('1')` → `'1'`，`toupper(EOF)` → `EOF`
- **实测**：PASS（4 项）

#### 17. `tolower` — §7.4.2.1
- **原型**：`int tolower(int c);`；`<ctype.h>`
- **前提 / 返回**：若为大写字母且有对应小写，返回对应小写；否则原值返回
- **影响**：无
- **提醒**：与 `toupper` 同坑——返回值要接住；`tolower(EOF)` 返回 `EOF`，可用于“先判断再转换”的写法
- **三例**：默认 `tolower('A')` → `'a'`；自定义 `tolower('a')` → `'a'`；边界 `tolower('0')` → `'0'`
- **实测**：PASS（3 项）

另有一条标准用法样例已实测：`for (p = txt; *p; ++p) if (isalpha((unsigned char)*p)) ++letters;`，`"Hello, C11!"` 计得 6 个字母。

## 4. 页面可直接引用的“参数单位”口径

| 函数 | 数值参数 | 单位 |
| --- | --- | --- |
| `strlen` | 返回 `size_t` | 字节（不含 NUL） |
| `strncmp` / `memcmp` / `memcpy` / `memmove` / `memset` | `n`（`size_t`） | 字节 |
| `strcpy` / `strcat` | 复制量 = `strlen(src)+1` 或 `strlen(dst)+strlen(src)+1` | 字节（含终止符） |
| `strchr` | `c`（`int`） | 单个字符值，定位前转 `char` |
| `memcmp` | 比较宽度 `n` | 字节，逐字节按 `unsigned char` |
| `memset` | `c`（`int`） | 按 `unsigned char` 写入 |
| `ctype` 全部 | `c`（`int`） | `EOF` 或可表示为 `unsigned char` 的值 |

## 5. 未定义行为：只给触发条件与调用前提示

1. `strlen(NULL)` 或未终止字符串 → 触发：空指针/越界读；提示：先确认非空且以 NUL 结尾。
2. `strcpy` 目标不足 `strlen(src)+1`，或源目标重叠 → 触发：写越界/重叠复制；提示：先算容量，必要时改 `memmove` 复制字符数组。
3. `strcat` 目标不足 `strlen(dst)+strlen(src)+1`，或 `dst` 未终止，或 `dst` 与 `src` 重叠（含 `strcat(s,s)`）→ 提示：容量按含终止符计算。
4. `memcpy` 时 `s1` 与 `s2` 重叠 → 提示：重叠一律用 `memmove`；`restrict` 已把该前提写进原型。
5. `memcpy`/`memmove`/`memset`/`memcmp` 的 `n` 超过对象剩余字节 → 提示：用 `sizeof` 或显式长度校验。
6. `ctype` 传入负的带符号 `char`（如字节 `0xE4` 存成 `-28`）或 256 以上的值 → 提示：一律 `isalpha((unsigned char)c)`。
7. `strchr`/`strstr` 传入空指针 → 提示：先判空再调用。
8. 通过 `strchr`/`strstr` 返回的指针改写**只读**对象 → 提示：原型虽返回 `char *`，可写性取决于实参对象。

## 6. 与 Codex 对接的注意点

- 页面上 `strcmp`/`strncmp`/`memcmp` 的“返回值”应显示 `<0 / 0 / >0`，若要显示具体整数，须标注“本实现实际值，非标准承诺”。
- `ctype` 的返回值显示“真/假”，不要显示 1/0 作为标准结论（本机 `isdigit('7')` 返回 1，其他实现可能是 4 之类的位掩码）。
- `strlen` 的步进演示要能看出“终止符不计入”，`strcpy` 要能看出“终止符占第 `len+1` 字节”。
- `memcpy` 与 `memmove` 的重叠对比建议并排演示：同一 `"abcdef"` 缓冲，右移两字节的结果 `"ababcd"` 与 `"ababcd"`（memmove 确定）、`memcpy` 同场景不演示结果。
- 所有演示数据只用 `"C"` locale 可判定的 ASCII；`toupper`/`tolower` 的非 ASCII 映射不作页面承诺。

## 7. 未验证项

1. 页面与样板：Codex 的 `codelens.html`、`web/*` 尚未提供对应函数页，本次只做标准语义与原生用例，未做页面对照。
2. 其余 37 项（C–F 批）未开始。
3. 仅 GCC 16.2.0 实测；`clang` 缺失，MSVC 未测，跨编译器差异（尤其 `ctype` 返回值与 `strcmp` 具体数值）未实测。
4. locale：只验证 `"C"` locale，未验证其他 locale 下的 `isalpha`/`isspace`/`toupper` 扩展行为。
5. 未定义行为示例按要求未编译、未运行，仅按条款描述触发条件。
6. 32 位目标、`size_t` 为 32 位的平台未验证。

## 8. 复现

```
cd "E:\Visualization code\docs\cstdlib_samples"
gcc -std=c11 -Wall -Wextra -pedantic -o strings_test.exe strings_test.c && .\strings_test.exe
gcc -std=c11 -Wall -Wextra -pedantic -o memory_test.exe  memory_test.c  && .\memory_test.exe
gcc -std=c11 -Wall -Wextra -pedantic -o ctype_test.exe   ctype_test.c   && .\ctype_test.exe
```

预期：三套件退出码 0，摘要分别为 `34 / 20 / 22 checks, 0 failed`。

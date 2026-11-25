/* Function examples share the C locale and an ASCII-compatible execution character set. */
(() => {
  const examples = {};
  const compare = (a, b) => a === b ? 0 : a < b ? -1 : 1;
  function define(name, args, body, evaluate, note, header = 'string.h', helpers = '') {
    const declarations = (['scanf','getchar'].includes(name) ? [] : args).map(([key, fallback], i) =>
      '    const char *' + key + ' = argc > ' + (i+1) + ' ? argv[' + (i+1) + '] : ' + JSON.stringify(fallback) + ';');
    const source = ['#include <stdio.h>', '#include <string.h>'];
    if (!['stdio.h', 'string.h'].includes(header)) source.push('#include <' + header + '>');
    if (['stdio.h', 'math.h', 'time.h'].includes(header)) source.push('#include <stdlib.h>');
    if (helpers) source.push('', ...helpers.split('\n'));
    const bodyLines = body.split('\n').flatMap(line => {
      const earlyReturn = /^(if \(.+\)) return (\d+);$/.exec(line);
      if (earlyReturn) return [earlyReturn[1], '{', '    return ' + earlyReturn[2] + ';', '}'];
      const branch = /^(if \(.+\)|else) (?!\{)(.*);$/.exec(line);
      if (branch) return [branch[1], '{', '    ' + branch[2] + ';', '}'];
      return [line];
    });
    source.push('', '/* 读取示例数据，调用 ' + name + '，输出可观察的结果。 */',
      declarations.length ? 'int main(int argc, char *argv[])' : 'int main(void)', '{', ...declarations,
      ...bodyLines.map(line => '    ' + line.replace('/* demo */', '/* @call 调用 */')), '    return 0;', '}');
    examples[name] = {args, source, evaluate, note, header};
  }

  define('strlen', [['text','cat']], 'size_t length = strlen(text);\nprintf("%zu\\n", length);',
    s => new TextEncoder().encode(s).length, '返回首个空字符之前的字节数，类型为 size_t。输入按 UTF-8 编码，一个汉字可能占多个字节。');
  for (const name of ['strcmp','strncmp','memcmp']) {
    const limited = name !== 'strcmp';
    const guards = name === 'memcmp' ? 'if (strlen(a) < 3 || strlen(b) < 3) return 1;\n' : '';
    define(name, [['a','cat'],['b','car']], guards + 'int result = ' + name + '(a, b' + (limited ? ', 3' : '') + ');\nprintf("%d\\n", (result > 0) - (result < 0));',
      (a,b) => {
        if (name === 'memcmp' && Math.min(a.length,b.length) < 3) throw Error('本例比较 3 字节，两段输入均需至少 3 字节。');
        return compare(limited ? a.slice(0,3) : a, limited ? b.slice(0,3) : b);
      }, '比较结果只保证符号。样板把它转换为 -1、0 或 1。' + (limited ? '本例最多比较开头三个字节。' : '从左到右比较至首个差异或终止符。'));
  }
  for (const name of ['strcpy','strcat','memcpy']) {
    const prefix = name === 'strcat' ? 'Hi ' : '';
    const count = name === 'memcpy' ? ', strlen(text) + 1' : '';
    define(name,[['text','cat']], 'char dest[16] = "' + prefix + '";\nif (strlen(text) >= sizeof dest - strlen(dest)) return 1;\n' + name + '(dest, text' + count + ');\nputs(dest);',
      text => {
        if (prefix.length + text.length >= 16) throw Error('目标数组容量为 16 字节，已有内容、追加的数据及终止符必须全部放得下。');
        return prefix + text;
      }, '返回目标地址。目标数组须可写，源与目标区域不能重叠。' + (count ? 'memcpy 按指定字节数复制，样板显式计入终止符。' : '为最终的空字符保留一个字节。'));
  }
  for (const name of ['strchr','strstr']) {
    const single = name === 'strchr';
    define(name,[['text','banana'],['key',single?'a':'ana']], (single?'if (key[0] && key[1]) return 1;\n':'') + 'const char *found = ' + name + '(text, ' + (single?'key[0]':'key') + ');\nif (found) printf("%td\\n", found - text);\nelse puts("NULL");',
      (text,key) => {
        if (single && key.length > 1) throw Error('第二个参数请输入一个字符；空行表示终止符。');
        const pos = single && !key ? text.length : text.indexOf(key);
        return pos < 0 ? 'NULL' : pos;
      }, '返回首次匹配的位置指针，未找到返回 NULL。样板在成功时输出字节偏移。' + (single?'搜索空字符可以找到字符串终点。':'空子串匹配偏移 0。'));
  }
  define('memmove',[['text','abcd']], 'char dest[32];\nif (strlen(text) + 2 > sizeof dest) return 1;\nstrcpy(dest, text);\nmemmove(dest + 1, dest, strlen(dest) + 1);\nputs(dest);',
    text => {if(text.length > 30) throw Error('右移一位并保留终止符，最多输入 30 字节。');return text[0] ? text[0]+text : '';},
    '将包括终止符在内的内容右移一位，源和目标可以重叠；返回目标地址。');
  define('memset',[['text','hello']], 'char dest[32];\nif (strlen(text) >= sizeof dest) return 1;\nstrcpy(dest, text);\nmemset(dest, 42, strlen(dest));\nputs(dest);',
    text => {if(text.length > 31) throw Error('目标数组最多容纳 31 字节文本和终止符。');return '*'.repeat(text.length);},
    '按字节填入指定值，返回目标地址。本例使用 ASCII 星号的值 42，保留末尾空字符。');
  const predicates = {isdigit:/^[0-9]$/,isalpha:/^[a-z]$/i,isalnum:/^[a-z0-9]$/i,isspace:/^[\t\n\v\f\r ]$/};
  for (const name of [...Object.keys(predicates),'toupper','tolower']) {
    const predicate = predicates[name];
    define(name,[['text',name === 'isdigit'?'7':name === 'isspace'?' ':'a']],
      'if (strlen(text) != 1) return 1;\nint result = ' + name + '((unsigned char)text[0]);\n' + (predicate?'printf("%d\\n", result != 0);':'printf("%c\\n", result);'),
      text => {
        if(text.length !== 1) throw Error('请输入一个 ASCII 字符。');
        return predicate ? Number(predicate.test(text)) : name === 'toupper' ? text.toUpperCase() : text.toLowerCase();
      }, '本例使用 C locale。参数必须是 EOF 或 unsigned char 可表示的值。' + (predicate?'分类函数以非零表示真，样板统一输出 1 或 0。':'有对应大小写时返回转换后的值，否则返回原值。'), 'ctype.h');
  }

  function steps(name, input) {
    const example = examples[name];
    const args = example.args.length === 1 ? [input] : input.split('\n');
    if(args.length !== example.args.length) throw Error('请按提示填写参数，每个参数单独一行。');
    if(input.includes('\0')) throw Error('命令行参数不能包含空字符。');
    if(name !== 'strlen' && args.some(arg => /[^\x01-\x7f]/.test(arg))) throw Error('本样板使用 ASCII 输入。');
    const result = example.evaluate(...args);
    const marked = example.source.findIndex(s => s.includes('/* @call'));
    const line = (marked >= 0 ? marked : example.source.findIndex(s => s.includes(name+'('))) + 1;
    const missing = (name === 'strchr' || name === 'strstr') && result === 'NULL';
    const simulatedFailure = name === 'realloc' && args[1] === 'failure';
    const outputLine = (name === 'realloc'
      ? example.source.findIndex((s, i) => i >= line && s.includes('printf') &&
          s.includes('@failure_output') === simulatedFailure)
      : example.source.findIndex((s, i) => i >= line &&
          (missing ? s.includes('puts("NULL")') : /printf|puts/.test(s)))) + 1;
    return [[example.stdin ? null : example.source.findIndex(s => s.includes('argv[1]'))+1,'读取参数 ' + JSON.stringify(args)],
      [line,(simulatedFailure ? '模拟 realloc 返回 NULL。' : '调用 ' + name + '。') + example.note],
      [outputLine,'程序输出 ' + JSON.stringify(result)]]
      .map(([line,message]) => ({line,message,state:[],indices:[],library:name}));
  }
  examples.strlen.source = [
  "#include <stdio.h>",
  "#include <string.h>",
  "",
  "/* 命令行传入一个字符串。省略参数时使用默认示例。 */",
  "int main(int argc, char *argv[])",
  "{",
  "    if (argc > 2)",
  "    {",
  "        fputs(\"Expected one string argument.\\n\", stderr);",
  "        return 1;",
  "    }",
  "",
  "    const char *text = argc == 2 ? argv[1] : \"cat\";",
  "    /* 从首字节数到终止符之前。 */",
  "    size_t length = strlen(text);",
  "    printf(\"%zu\\n\", length);",
  "    return 0;",
  "}"
];
  const prototypes = {
  "strlen": "size_t strlen(const char *s); · §7.24.6.3",
  "strcmp": "int strcmp(const char *s1, const char *s2); · §7.24.4.2",
  "strncmp": "int strncmp(const char *s1, const char *s2, size_t n); · §7.24.4.4",
  "strcpy": "char *strcpy(char * restrict s1, const char * restrict s2); · §7.24.2.3",
  "strcat": "char *strcat(char * restrict s1, const char * restrict s2); · §7.24.3.1",
  "strchr": "char *strchr(const char *s, int c); · §7.24.5.2",
  "strstr": "char *strstr(const char *s1, const char *s2); · §7.24.5.7",
  "memcpy": "void *memcpy(void * restrict s1, const void * restrict s2, size_t n); · §7.24.2.1",
  "memmove": "void *memmove(void *s1, const void *s2, size_t n); · §7.24.2.2",
  "memset": "void *memset(void *s, int c, size_t n); · §7.24.6.1",
  "memcmp": "int memcmp(const void *s1, const void *s2, size_t n); · §7.24.4.1",
  "isdigit": "int isdigit(int c); · §7.4.1.5",
  "isalpha": "int isalpha(int c); · §7.4.1.2",
  "isalnum": "int isalnum(int c); · §7.4.1.1",
  "isspace": "int isspace(int c); · §7.4.1.10",
  "toupper": "int toupper(int c); · §7.4.2.2",
  "tolower": "int tolower(int c); · §7.4.2.1"
};
  Object.assign(prototypes, {
  "printf": "int printf(const char * restrict format, ...); · §7.21.6.3",
  "scanf": "int scanf(const char * restrict format, ...); · §7.21.6.4",
  "getchar": "int getchar(void); · §7.21.7.6",
  "putchar": "int putchar(int c); · §7.21.7.8",
  "puts": "int puts(const char *s); · §7.21.7.9",
  "fgets": "char *fgets(char * restrict s, int n, FILE * restrict stream); · §7.21.7.2",
  "snprintf": "int snprintf(char * restrict s, size_t n, const char * restrict format, ...); · §7.21.6.5",
  "atoi": "int atoi(const char *nptr); · §7.22.1.2",
  "strtol": "long int strtol(const char * restrict nptr, char * restrict * restrict endptr, int base); · §7.22.1.4",
  "strtod": "double strtod(const char * restrict nptr, char * restrict * restrict endptr); · §7.22.1.3",
  "malloc": "void *malloc(size_t size); · §7.22.3.4",
  "calloc": "void *calloc(size_t nmemb, size_t size); · §7.22.3.2",
  "realloc": "void *realloc(void *ptr, size_t size); · §7.22.3.5",
  "free": "void free(void *ptr); · §7.22.3.3",
  "qsort": "void qsort(void *base, size_t nmemb, size_t size, int (*compar)(const void *, const void *)); · §7.22.5.2",
  "bsearch": "void *bsearch(const void *key, const void *base, size_t nmemb, size_t size, int (*compar)(const void *, const void *)); · §7.22.5.1",
  "fopen": "FILE *fopen(const char * restrict filename, const char * restrict mode); · §7.21.5.3",
  "fclose": "int fclose(FILE *stream); · §7.21.5.1",
  "fprintf": "int fprintf(FILE * restrict stream, const char * restrict format, ...); · §7.21.6.1",
  "fscanf": "int fscanf(FILE * restrict stream, const char * restrict format, ...); · §7.21.6.2",
  "fread": "size_t fread(void * restrict ptr, size_t size, size_t nmemb, FILE * restrict stream); · §7.21.8.1",
  "fwrite": "size_t fwrite(const void * restrict ptr, size_t size, size_t nmemb, FILE * restrict stream); · §7.21.8.2",
  "fseek": "int fseek(FILE *stream, long int offset, int whence); · §7.21.9.2",
  "ftell": "long int ftell(FILE *stream); · §7.21.9.4",
  "sqrt": "double sqrt(double x); · §7.12.7.5",
  "pow": "double pow(double x, double y); · §7.12.7.4",
  "fabs": "double fabs(double x); · §7.12.7.2",
  "floor": "double floor(double x); · §7.12.9.2",
  "ceil": "double ceil(double x); · §7.12.9.1",
  "round": "double round(double x); · §7.12.9.6",
  "sin": "double sin(double x); · §7.12.4.6",
  "cos": "double cos(double x); · §7.12.4.5",
  "rand": "int rand(void); · §7.22.2.1",
  "srand": "void srand(unsigned int seed); · §7.22.2.2",
  "time": "time_t time(time_t *timer); · §7.27.2.4",
  "difftime": "double difftime(time_t time1, time_t time0); · §7.27.2.2",
  "clock": "clock_t clock(void); · §7.27.2.1"
});
  globalThis.CLibrary = {examples, steps, prototypes, define};
})();

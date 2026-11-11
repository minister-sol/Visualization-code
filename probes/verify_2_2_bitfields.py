"""任务 2.2：位域拒绝的独立复测（不依赖 tests/test_bitfield_rejection.py）。

用法：
    python probes/verify_2_2_bitfields.py [-v]

退出码 0 表示全部用例符合预期；1 表示存在偏差（会把偏差逐条列出）。
验收口径（对应任务 2.1 的承诺）：
  - 任何形态的位域（具名、匿名、零宽、嵌套、局部、typedef、数组、初始化、指针）
    都必须在执行前抛出 CError，消息含“位域”，并带可定位行号；
  - 不得出现 TypeError 等非 CError 异常，不得产生部分执行（无 steps/output）；
  - 非位域的合法程序（含三元运算、label、注释/字符串里的“int a:3;”）不得误伤。
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.engine import CError, trace

REJECT = 'reject'
ACCEPT = 'accept'

# expect=REJECT: 必须抛 CError；line 为期望行号（None 表示不校验行号）；
# allow_any_message=True 时只要求显式拒绝（union 等错误先于位域检查，消息不一定是“位域”）。
CASES = [
    dict(name='R01 具名 int a:3（全局结构体）', expect=REJECT, line=2, code=(
        'struct S {\n'
        ' int a:3;\n'
        '};\n'
        'int main(){return 0;}\n')),
    dict(name='R02 具名 int a:3; int b:5（打包样本）', expect=REJECT, line=2, code=(
        'struct S {\n'
        ' int a:3;\n'
        ' int b:5;\n'
        '};\n'
        'int main(){return sizeof(struct S);}\n')),
    dict(name='R03 匿名位域 int :3', expect=REJECT, line=2, code=(
        'struct S {\n'
        ' int :3;\n'
        '};\n'
        'int main(){return 0;}\n')),
    dict(name='R04 零宽位域 int :0（夹在具名位域之间）', expect=REJECT, line=2, code=(
        'struct S {\n'
        ' int a:3;\n'
        ' int :0;\n'
        ' int b:3;\n'
        '};\n'
        'int main(){return 0;}\n')),
    dict(name='R05 仅零宽位域 int :0', expect=REJECT, line=2, code=(
        'struct S {\n'
        ' int :0;\n'
        '};\n'
        'int main(){return 0;}\n')),
    dict(name='R06 嵌套结构体（内层含位域）', expect=REJECT, line=1, code=(
        'struct Inner { int a:3; };\n'
        'struct Outer { struct Inner in; int x; };\n'
        'int main(){return 0;}\n')),
    dict(name='R07 嵌套结构体被实际使用', expect=REJECT, line=1, code=(
        'struct Inner { int a:3; };\n'
        'struct Outer { struct Inner in; };\n'
        'int main(){struct Outer o; o.in.a=9; return o.in.a;}\n')),
    dict(name='R08 函数内局部结构体位域', expect=REJECT, line=2, code=(
        'int main(){\n'
        ' struct L { int a:3; };\n'
        ' return 0;}\n')),
    dict(name='R09 typedef 结构体位域', expect=REJECT, line=2, code=(
        'typedef struct {\n'
        ' int a:3;\n'
        '} T;\n'
        'int main(){return 0;}\n')),
    dict(name='R10 结构体数组声明', expect=REJECT, line=1, code=(
        'struct S { int a:3; };\n'
        'struct S arr[2];\n'
        'int main(){return 0;}\n')),
    dict(name='R11 初始化列表', expect=REJECT, line=1, code=(
        'struct S { int a:3; };\n'
        'int main(){struct S s={1}; return s.a;}\n')),
    dict(name='R12 结构体指针成员', expect=REJECT, line=1, code=(
        'struct S { int a:3; } *p;\n'
        'int main(){return 0;}\n')),
    dict(name='R13 匿名结构体成员内含位域', expect=REJECT, line=1, code=(
        'struct O { struct { int a:3; } x; };\n'
        'int main(){return 0;}\n')),
    dict(name='R14 #include 之后（源头第 3 行）', expect=REJECT, line=3, code=(
        '#include <stdio.h>\n'
        'struct S {\n'
        ' int a:3;\n'
        '};\n'
        'int main(){return 0;}\n')),
    dict(name='R15 #define + 空行之后（源头第 4 行）', expect=REJECT, line=4, code=(
        '#define N 4\n'
        '\n'
        'struct S {\n'
        ' int a:3;\n'
        '};\n'
        'int main(){return 0;}\n')),
    dict(name='R16 先有合法结构体，再有位域结构体', expect=REJECT, line=2, code=(
        'struct A { int x; int y; };\n'
        'struct B { int a:1; };\n'
        'int main(){return 0;}\n')),
    dict(name='R17 unsigned char c:1（曾静默截断）', expect=REJECT, line=1, code=(
        'struct S { unsigned char c:1; };\n'
        'int main(){return 0;}\n')),
    dict(name='R18 Codex 用例 4 原样（匿名结构体成员 x:1）', expect=REJECT, line=2, code=(
        'struct S {\n'
        'struct { unsigned x:1; } inner;\n'
        '}; int main(){return sizeof(struct S);}\n')),
    dict(name='R19 位域赋值路径（s.a=9，曾静默误算）', expect=REJECT, line=1, code=(
        'struct S { int a:3; };\n'
        'int main(){struct S s; s.a=9; return s.a;}\n')),
    dict(name='R21 typedef 的整型作为位域类型', expect=REJECT, line=2, code=(
        'typedef unsigned int U;\n'
        'struct S { U a:3; };\n'
        'int main(){return 0;}\n')),
    dict(name='R22 static 存储类结构体声明', expect=REJECT, line=1, code=(
        'struct S { int a:3; } static g;\n'
        'int main(){return 0;}\n')),
    dict(name='R20 union 含位域（仅要求显式拒绝，行号归 2.5）', expect=REJECT,
         line=None, allow_any_message=True, code=(
        'union U { int a:3; };\n'
        'int main(){return 0;}\n')),
    dict(name='A01 普通结构体不误伤（sizeof=8）', expect=ACCEPT, exit_code='8', code=(
        'struct P { int x; char c; };\n'
        'int main(){return sizeof(struct P);}\n')),
    dict(name='A02 三元运算冒号不误伤', expect=ACCEPT, exit_code='2', code=(
        'int main(){int x=1?2:3; return x;}\n')),
    dict(name='A03 switch 的 case 冒号不误伤', expect=ACCEPT, exit_code='2', code=(
        'int main(){int x=1; switch(x){case 1: x=2; break; default: x=3;} return x;}\n')),
    dict(name='A04 注释/字符串里的 int a:3; 不误伤', expect=ACCEPT, exit_code='105', code=(
        '/* int a:3; */\n'
        'int main(){char*s="int a:3;"; return s[0];}\n')),
]

failures = []
skips = []


def check(case):
    try:
        result = trace(case['code'])
    except CError as exc:
        if case['expect'] != REJECT:
            return False, '预期可执行，却被拒绝: %s (line=%r)' % (exc, getattr(exc, 'line', None))
        message = str(exc)
        line = getattr(exc, 'line', None)
        steps = getattr(exc, 'steps', None)
        output = getattr(exc, 'output', '')
        problems = []
        if not case.get('allow_any_message') and '位域' not in message:
            problems.append('消息不含“位域”: %r' % message)
        if case['line'] is not None and line != case['line']:
            problems.append('行号 %r != 期望 %r' % (line, case['line']))
        if steps not in (None, []):
            problems.append('拒绝前已产生 %r 步执行' % len(steps))
        if output:
            problems.append('拒绝前已产生输出 %r' % output[:40])
        detail = 'CError: %s (line=%r)' % (message, line)
        if problems:
            return False, detail + ' | ' + '; '.join(problems)
        return True, detail
    except Exception as exc:  # TypeError 等非 CError 一律失败
        return False, '非 CError 异常 %s: %s' % (type(exc).__name__, exc)

    if case['expect'] == REJECT:
        return False, '静默执行成功（无异常）status=%r exit=%r' % (
            result.get('status'), result.get('exit_code'))
    expected_exit = case.get('exit_code')
    if expected_exit is not None and str(result.get('exit_code')) != expected_exit:
        return False, '可执行但退出码 %r != 期望 %r' % (result.get('exit_code'), expected_exit)
    return True, '可执行，exit_code=%r' % result.get('exit_code')


def main():
    for case in CASES:
        ok, detail = check(case)
        status = 'PASS' if ok else 'FAIL'
        if not ok:
            failures.append((case['name'], detail))
        if case['name'].startswith('R20'):
            skips.append(detail)
        print('[%s] %s -> %s' % (status, case['name'], detail))
    print('\n%d/%d 通过' % (len(CASES) - len(failures), len(CASES)))
    if failures:
        print('\n偏差：')
        for name, detail in failures:
            print(' - %s: %s' % (name, detail))
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())

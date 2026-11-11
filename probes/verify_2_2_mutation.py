"""临时变异测试：删除 RejectBitfields 后，2.2 探针的 must-reject 用例是否仍被拒绝。
仅用于证明探针有效，跑完即删除（勿提交）。"""
import re
import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

src = pathlib.Path('backend/engine.py').read_text(encoding='utf-8')
pattern = r"  class RejectBitfields\(c_ast\.NodeVisitor\):.*?  RejectBitfields\(\)\.visit\(tree\)\n"
m = re.search(pattern, src, re.S)
assert m, 'mutation target not found'
pathlib.Path('backend/_mut_engine.py').write_text(src[:m.start()] + src[m.end():], encoding='utf-8')
print('removed %d chars' % (m.end() - m.start()))

import probes.verify_2_2_bitfields as P
import backend._mut_engine as M

detected = total = 0
for case in P.CASES:
    if case['expect'] != 'reject':
        continue
    total += 1
    try:
        r = M.trace(case['code'])
        got = 'OK exit=%s' % r.get('exit_code')
    except Exception as e:
        got = '%s: %s' % (type(e).__name__, str(e)[:40])
    is_c = got.startswith('CError')
    detected += is_c
    print('%-30s %-28s %s' % (case['name'][:30], got[:28], 'STILL-REJECTED' if is_c else 'NOT-DETECTED'))
print('without fix, CError still raised: %d/%d' % (detected, total))
pathlib.Path('backend/_mut_engine.py').unlink()

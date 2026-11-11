"""Task 1.2 probe: re-check the blocking gaps listed in docs/ROADMAP_AUDIT.md.

Read-only against the engine; prints a compact machine-readable record for each
sample: status, output, steps count, error text, error line.
Run:  python probes/audit_1_2_probe.py
"""
import json
import sys
import traceback

sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
sys.path.insert(0, '.')

from backend.engine import trace  # noqa: E402

CASES = [
    # id, code, what the audit claims / what we want to know
    ('bitfield_value', 'struct S{int a:3;int b:5;};int main(){struct S s;s.a=7;s.b=31;printf("%d %d",s.a,s.b);}'),
    ('bitfield_overflow', 'struct S{int a:3;};int main(){struct S s;s.a=9;printf("%d",s.a);}'),
    ('bitfield_sizeof', 'struct S{int a:3;int b:5;};int main(){printf("%d",sizeof(struct S));}'),
    ('bitfield_neg', 'struct S{int a:3;};int main(){struct S s;s.a=-1;printf("%d",s.a);}'),
    ('union_decl', 'union U{int n;char c;};int main(){union U u;u.n=1;printf("%d",u.n);}'),
    ('goto_forward', 'int main(){int i=0;goto skip;i=5;skip:printf("%d",i);}'),
    ('goto_backward', 'int main(){int i=0;again:i++;if(i<3)goto again;printf("%d",i);}'),
    ('malloc_bare', 'int main(){int *p=malloc(4);p[0]=5;printf("%d",p[0]);}'),
    ('malloc_sized', 'int main(){int *p=malloc(sizeof(int)*2);p[0]=5;printf("%d",p[0]);}'),
    ('printf_percent_p', 'int main(){int x=1;int *p=&x;printf("%p",p);}'),
    ('strtok', 'int main(){char s[]="a,b";printf("%s",strtok(s,","));}'),
    ('sprintf', 'int main(){char b[16];sprintf(b,"%d",7);printf("%s",b);}'),
    ('scan_set', 'int main(){char b[8];scanf("%[a-z]",b);printf("%s",b);}'),
    ('loop_100', 'int main(){int i,s=0;for(i=0;i<100;i++)s+=i;printf("%d",s);}'),
    ('loop_500', 'int main(){int i,s=0;for(i=0;i<500;i++)s+=i;printf("%d",s);}'),
    ('loop_2000', 'int main(){int i,s=0;for(i=0;i<2000;i++)s+=i;printf("%d",s);}'),
    ('array_1000', 'int a[1000];int main(){a[999]=1;printf("%d",a[999]);}'),
    ('array_1001', 'int a[1001];int main(){a[0]=1;printf("%d",a[0]);}'),
    ('parse_error_line3', 'int main(){\n int x=1;\n int y = ;\n return 0;\n}'),
    ('undeclared_var', 'int main(){return z;}'),
]


def run(cid, code):
    rec = {'case': cid, 'status': '?', 'output': None, 'steps': None,
           'error': None, 'line': None, 'keys': None}
    try:
        r = trace(code)
        rec['status'] = 'ok'
        rec['output'] = r.get('output')
        rec['steps'] = len(r.get('steps') or [])
        rec['keys'] = sorted(r.keys())
        rec['status_field'] = r.get('status')
    except Exception as e:  # noqa: BLE001 - probe wants every failure shape
        rec['status'] = 'raised'
        rec['error'] = f'{type(e).__name__}: {e}'
        rec['line'] = getattr(e, 'line', None)
        rec['steps'] = len(getattr(e, 'steps', []) or [])
        rec['error_type'] = type(e).__name__
    return rec


if __name__ == '__main__':
    out = []
    for cid, code in CASES:
        try:
            out.append(run(cid, code))
        except BaseException:  # noqa: BLE001
            out.append({'case': cid, 'status': 'harness_crash',
                        'error': traceback.format_exc(limit=2)})
    print(json.dumps(out, ensure_ascii=False, indent=1))

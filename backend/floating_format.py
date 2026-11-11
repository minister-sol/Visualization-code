"""Finite C-style floating printf formatting for fixed widths/precisions."""
import re
FORMAT=re.compile(r'%([-+ #0]*)([0-9]*)(?:\.([0-9]*))?l?([fFeEgG])')
def format_float(spec,value,error_type):
 match=FORMAT.fullmatch(spec)
 if not match or not isinstance(value,float):raise error_type('浮点输出格式需要浮点参数')
 flags,width,precision,kind=match.groups();width=int(width or 0)
 precision=6 if precision is None else int(precision or 0)
 if width>1000 or precision>1000:raise error_type('printf字段宽度或精度超过1000')
 if kind in 'gG' and precision==0:precision=1
 sign='+' if '+' in flags else ' ' if ' ' in flags else ''
 text=format(value,sign+('#' if '#' in flags else '')+'.'+str(precision)+kind)
 if '-' in flags:return text.ljust(width)
 if '0' in flags and width>len(text):
  prefix=text[0] if text[:1] in ('-','+',' ') else ''
  return prefix+text[len(prefix):].rjust(width-len(prefix),'0')
 return text.rjust(width)

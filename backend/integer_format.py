"""Bounded C printf tokenization and integer formatting; bounded dynamic widths/precisions."""
import re
PATTERN = re.compile(r'%(?:%|[-+ #0]*(?:[0-9]*|\*)(?:\.(?:[0-9]*|\*))?(?:hh|h|ll|l|z|t|j)?[diuxXo]|[-+ #0]*(?:[0-9]*|\*)(?:\.(?:[0-9]*|\*))?l?[fFeEgG]|-?(?:[0-9]*|\*)c|-?(?:[0-9]*|\*)(?:\.(?:[0-9]*|\*))?s)')
INTEGER = re.compile(r'%([-+ #0]*)([0-9]*)(?:\.([0-9]*))?(hh|h|ll|l|z|t|j)?([diuxXo])')

def format_integer(spec, value, error_type):
    match = INTEGER.fullmatch(spec)
    if not match or not isinstance(value,int): raise error_type('printf 整数格式需要整数参数')
    flags, width, precision, length, kind = match.groups()
    width = int(width or 0)
    precision = None if precision is None else int(precision or 0)
    if width > 1000 or (precision is not None and precision > 1000): raise error_type('printf 字段宽度或精度超过1000')
    bits = 8 if length == 'hh' else 16 if length == 'h' else 64 if length in ('l','ll','z','t','j') else 32
    signed = kind in 'di'
    value = int(value)
    if not signed or length in ('h','hh'):
        value %= 1 << bits
        if signed and value >= 1 << (bits-1): value -= 1 << bits
    sign = ('-' if value < 0 else '+' if '+' in flags else ' ' if ' ' in flags else '') if signed else ''
    magnitude = abs(value) if signed else value
    digits = str(magnitude) if kind in 'diu' else format(magnitude,kind)
    if precision == 0 and magnitude == 0: digits = ''
    if precision is not None: digits = digits.rjust(precision,'0')
    prefix = ''
    if '#' in flags:
        if kind in 'xX' and magnitude: prefix = '0x' if kind == 'x' else '0X'
        if kind == 'o' and not digits.startswith('0'): prefix = '0'
    head = sign + prefix
    if '0' in flags and '-' not in flags and precision is None:
        digits = digits.rjust(max(0,width-len(head)),'0')
    text = head + digits
    return text.ljust(width) if '-' in flags else text.rjust(width)

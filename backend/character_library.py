"""ASCII C-locale character operations (classification results normalized to 0/1)."""
def alpha(c): return 65 <= c <= 90 or 97 <= c <= 122
def digit(c): return 48 <= c <= 57
FUNCTIONS = {
 'isalpha': alpha,
 'isdigit': digit,
 'isalnum': lambda c: alpha(c) or digit(c),
 'isspace': lambda c: c in (9,10,11,12,13,32),
 'isblank': lambda c: c in (9,32),
 'islower': lambda c: 97 <= c <= 122,
 'isupper': lambda c: 65 <= c <= 90,
 'isxdigit': lambda c: digit(c) or 65 <= c <= 70 or 97 <= c <= 102,
 'iscntrl': lambda c: 0 <= c < 32 or c == 127,
 'isprint': lambda c: 32 <= c <= 126,
 'isgraph': lambda c: 33 <= c <= 126,
 'ispunct': lambda c: 33 <= c <= 126 and not (alpha(c) or digit(c)),
 'tolower': lambda c: c+32 if 65 <= c <= 90 else c,
 'toupper': lambda c: c-32 if 97 <= c <= 122 else c,
}
def apply(name, arguments, error_type):
 if len(arguments) != 1 or not isinstance(arguments[0],int): raise error_type(name+' 需要一个整数字符参数')
 value = int(arguments[0])
 if not -1 <= value <= 255: raise error_type(name+' 参数须为无符号字符值或 EOF')
 return int(FUNCTIONS[name](value))

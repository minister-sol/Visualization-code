"""Bounded object and function macro expansion; deliberately not a full C preprocessor."""
import re

TOKEN = re.compile(r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|[0-9][A-Za-z_0-9.]*|[A-Za-z_]\w*|[^A-Za-z_0-9"\']+')


def splice_lines(source):
    """Join backslash-newlines, padding afterward to retain physical line numbers."""
    result = []
    pending = ''
    padding = 0
    for line in source.splitlines(keepends=True):
        if line.endswith('\\\r\n') or line.endswith('\\\n'):
            ending = 3 if line.endswith('\r\n') else 2
            pending += line[:-ending]
            padding += 1
            continue
        result.append(pending + line + '\n' * padding)
        pending = ''
        padding = 0
    if pending or padding: result.append(pending + '\n' * padding)
    return ''.join(result)


def preprocess(source, error_type):
    source = splice_lines(source)
    macros = {}
    output = []
    total = 0
    conditions = []
    enabled = True

    scan = re.compile(r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|[0-9][A-Za-z_0-9.]*|[A-Za-z_]\w*|\s+|.', re.S)

    def expand(text, active=(), depth=0):
        if depth >= 32: raise error_type('宏展开深度超过32')
        tokens = scan.findall(text)
        parts = []
        length = 0
        index = 0
        while index < len(tokens):
            token = tokens[index]
            index += 1
            if token in macros:
                definition = macros[token]
                aliases = [token]
                while isinstance(definition,str) and re.fullmatch(r'[A-Za-z_]\w*',definition.strip()) and definition.strip() in macros:
                    name = definition.strip()
                    if name in aliases or name in active or len(aliases)+len(active) >= 32: raise error_type('宏递归或展开深度超过32')
                    aliases.append(name)
                    definition = macros[name]
                if any(name in active for name in aliases): raise error_type('宏递归或展开深度超过32')
                arguments = None
                if isinstance(definition, tuple):
                    cursor = index
                    while cursor < len(tokens) and tokens[cursor].isspace(): cursor += 1
                    if cursor >= len(tokens) or tokens[cursor] != '(':
                        parts.append(aliases[-1])
                        length += len(aliases[-1])
                        continue
                    cursor += 1
                    arguments = [[]]
                    parentheses = 0
                    while cursor < len(tokens):
                        piece = tokens[cursor]
                        cursor += 1
                        if piece == ')' and parentheses == 0: break
                        if piece == ',' and parentheses == 0: arguments.append([])
                        else:
                            if piece == '(': parentheses += 1
                            elif piece == ')': parentheses -= 1
                            arguments[-1].append(piece)
                    else: raise error_type('函数式宏调用缺少右括号（暂需同一行）')
                    parameters, body = definition
                    if not parameters and not ''.join(arguments[0]).strip(): arguments = []
                    if len(arguments) != len(parameters): raise error_type('函数式宏参数数量不匹配：'+token)
                    replacements = dict(zip(parameters, [expand(''.join(arg), active, depth+1) for arg in arguments]))
                    definition = ''.join(replacements.get(piece,piece) for piece in scan.findall(body))
                    index = cursor
                if token in active or len(active) >= 32:
                    raise error_type('宏递归或展开深度超过32')
                token = expand(definition, active + tuple(aliases), depth+len(aliases))
            length += len(token)
            if length > 50000:
                raise error_type('宏展开超过源码长度限制')
            parts.append(token)
        return ''.join(parts)

    def condition(argument):
        from .pp_expression import evaluate
        pattern = r'\bdefined\s*(?:\(\s*([A-Za-z_]\w*)\s*\)|([A-Za-z_]\w*))'
        argument = re.sub(pattern, lambda m: '1' if (m.group(1) or m.group(2)) in macros else '0', argument)
        return evaluate(expand(argument), error_type)

    for line_number, line in enumerate(source.splitlines(keepends=True), 1):
        newline = '\n' if line.endswith('\n') else ''
        prefix = ''
        directive = re.fullmatch(r'\s*#\s*(if|ifdef|ifndef|elif|else|endif)\b(.*?)\s*', line)
        if directive:
            kind, argument = directive.groups()
            argument = argument.strip()
            if kind in ('if','ifdef','ifndef'):
                if len(conditions) >= 64: raise error_type('条件编译嵌套超过64层')
                if kind in ('ifdef','ifndef'):
                    if not re.fullmatch(r'[A-Za-z_]\w*',argument): raise error_type('条件编译需要宏名称')
                    selected = (argument in macros) == (kind == 'ifdef')
                elif not enabled: selected = False
                else: selected = condition(argument)
                conditions.append({'parent':enabled,'selected':selected,'else':False})
                enabled = enabled and selected
            elif kind == 'elif':
                if not argument or not conditions or conditions[-1]['else']: raise error_type('条件编译 #elif 不匹配或位于 #else 之后')
                frame = conditions[-1]
                selected = condition(argument) if frame['parent'] and not frame['selected'] else False
                enabled = frame['parent'] and selected
                frame['selected'] = frame['selected'] or selected
            elif kind == 'else':
                if argument or not conditions or conditions[-1]['else']: raise error_type('条件编译 #else 不匹配或重复')
                frame = conditions[-1]
                frame['else'] = True
                enabled = frame['parent'] and not frame['selected']
            else:
                if argument or not conditions: raise error_type('条件编译 #endif 不匹配')
                enabled = conditions.pop()['parent']
            output.append(newline)
            continue
        if not enabled:
            output.append(newline)
            continue
        if re.match(r'^\s*#', line):
            include = re.fullmatch(r'\s*#\s*include\s*(?:<(stdio|stdlib|string|stdbool|stdint|stddef|limits|ctype|math|assert|float|inttypes)\.h>|"(stdio|stdlib|string|stdbool|stdint|stddef|limits|ctype|math|assert|float|inttypes)\.h")\s*', line)
            define = re.fullmatch(r'\s*#\s*define\s+([A-Za-z_]\w*)(.*)', line.rstrip('\r\n'))
            undef = re.fullmatch(r'\s*#\s*undef\s+([A-Za-z_]\w*)\s*', line)
            if include:
                header = include.group(1) or include.group(2)
                if header == 'float':
                    for label, value in {
                        'FLT_RADIX':'2','FLT_MANT_DIG':'24','DBL_MANT_DIG':'53',
                        'FLT_MAX_EXP':'128','DBL_MAX_EXP':'1024','FLT_MIN_EXP':'(-125)','DBL_MIN_EXP':'(-1021)',
                        'FLT_MAX':'3.4028234663852886e38F','DBL_MAX':'1.7976931348623157e308',
                        'FLT_MIN':'1.1754943508222875e-38F','DBL_MIN':'2.2250738585072014e-308',
                        'FLT_EPSILON':'1.1920928955078125e-7F','DBL_EPSILON':'2.220446049250313e-16'
                    }.items():macros.setdefault(label,value)
                elif header == 'assert':
                    macros['assert'] = (['expression'], '((void)0)' if 'NDEBUG' in macros else '__cvisual_assert((expression))')
                elif header == 'stdbool':
                    macros.setdefault('bool', '_Bool')
                    macros.setdefault('true', '1')
                    macros.setdefault('false', '0')
                elif header == 'limits':
                    macros.setdefault('CHAR_BIT', '8')
                    for label, bits, suffix in [('SCHAR',8,''),('CHAR',8,''),('SHRT',16,''),('INT',32,''),('LONG',64,'L'),('LLONG',64,'LL')]:
                        maximum = (1 << (bits-1))-1
                        macros.setdefault(label+'_MAX',str(maximum)+suffix)
                        macros.setdefault(label+'_MIN','(-'+str(maximum)+suffix+'-1)')
                        unsigned_label = 'UCHAR' if label in ('SCHAR','CHAR') else 'U'+label
                        unsigned_suffix = suffix+'U' if bits >= 32 else ''
                        macros.setdefault(unsigned_label+'_MAX',str((1<<bits)-1)+unsigned_suffix)
                elif header in ('stdint','inttypes'):
                    prefix += 'typedef long long intmax_t;typedef unsigned long long uintmax_t;'
                    macros.setdefault('INTMAX_MAX','9223372036854775807LL')
                    macros.setdefault('INTMAX_MIN','(-9223372036854775807LL-1)')
                    macros.setdefault('UINTMAX_MAX','18446744073709551615ULL')
                    definitions = [('int8_t','signed char',8,False),('uint8_t','unsigned char',8,True),('int16_t','short',16,False),('uint16_t','unsigned short',16,True),('int32_t','int',32,False),('uint32_t','unsigned int',32,True),('int64_t','long long',64,False),('uint64_t','unsigned long long',64,True)]
                    for alias, typ, bits, unsigned in definitions:
                        prefix += f'typedef {typ} {alias};'
                        suffix = ('ULL' if bits == 64 else 'u') if unsigned else ('LL' if bits == 64 else '')
                        maximum = (1 << (bits if unsigned else bits-1))-1
                        macro = ('UINT' if unsigned else 'INT') + str(bits)
                        macros.setdefault(macro+'_MAX', str(maximum)+suffix)
                        if not unsigned: macros.setdefault(macro+'_MIN', '(-'+str(maximum)+suffix+'-1)')
                elif header in ('stdio','stdlib','string','stddef'):
                    macros.setdefault('NULL', '((void *)0)')
                if header in ('stdio','stdlib','string','stddef'):
                    prefix += 'typedef unsigned long long size_t;'
                if header == 'inttypes':
                    for width in (8,16,32,64):
                        for kind in 'diuoxX':
                            output_length='ll' if width==64 else ''
                            macros.setdefault('PRI'+kind+str(width),'"'+output_length+kind+'"')
                            if kind!='X':
                                input_length={8:'hh',16:'h',32:'',64:'ll'}[width]
                                macros.setdefault('SCN'+kind+str(width),'"'+input_length+kind+'"')
                    for kind in 'diuoxX':
                        macros.setdefault('PRI'+kind+'MAX','"j'+kind+'"')
                        if kind!='X':macros.setdefault('SCN'+kind+'MAX','"j'+kind+'"')
                if header == 'stddef':
                    prefix += 'typedef long long ptrdiff_t;'
                if header == 'stdlib':
                    macros.setdefault('RAND_MAX', '32767')
                    macros.setdefault('EXIT_SUCCESS', '0')
                    macros.setdefault('EXIT_FAILURE', '1')
                if header == 'stdio':
                    macros.setdefault('EOF', '(-1)')
            elif define:
                name, value = define.groups()
                if value.rstrip().endswith('\\'):
                    raise error_type(f'第{line_number}行：暂不支持跨行宏')
                if '##' in value or '#' in value:
                    raise error_type('暂不支持宏字符串化和拼接')
                if value.startswith('('):
                    function = re.fullmatch(r'\(([^)]*)\)(.*)', value)
                    if not function: raise error_type('函数式宏参数列表无效')
                    parameter_text, body = function.groups()
                    parameters = [p.strip() for p in parameter_text.split(',')] if parameter_text.strip() else []
                    if len(set(parameters)) != len(parameters) or any(not re.fullmatch(r'[A-Za-z_]\w*',p) for p in parameters): raise error_type('暂不支持此函数式宏参数列表')
                    macros[name] = (parameters, body.strip())
                else: macros[name] = value.strip()
            elif undef:
                macros.pop(undef.group(1), None)
            else:
                raise error_type(f'第{line_number}行：不支持此预处理指令')
            expanded = prefix + newline
        else:
            expanded = expand(line)
        total += len(expanded)
        if total > 50000:
            raise error_type('宏展开超过源码长度限制')
        output.append(expanded)
    if conditions: raise error_type('条件编译缺少 #endif')
    return ''.join(output)

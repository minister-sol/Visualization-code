"""Bounded integer preprocessor expressions, with 64-bit intmax/uintmax values."""
import ast
import re
from .vendor.pycparser import c_parser, c_ast

MASK = (1 << 64) - 1

def evaluate(expression, error_type):
    def fail(): raise error_type('不支持此预处理整数表达式或数值超出64位范围')
    def checked(value, unsigned=False):
        if unsigned: return value & MASK, True
        if not -(1 << 63) <= value < (1 << 63): fail()
        return value, False
    def literal(node):
        if node.type == 'char':
            value = ast.literal_eval(node.value)
            if len(value) != 1 or ord(value) > 127: fail()
            return ord(value), False
        if 'int' not in node.type: fail()
        text = re.sub(r'[uUlL]+$', '', node.value)
        base = 16 if text.lower().startswith('0x') else 8 if text.startswith('0') else 10
        value = int(text, base)
        unsigned = 'u' in node.value.lower() or (base != 10 and value >= 1 << 63)
        if value > MASK: fail()
        return checked(value, unsigned)
    def unsigned_type(node):
        if isinstance(node,c_ast.Constant): return literal(node)[1]
        if isinstance(node,c_ast.ID): return False
        if isinstance(node,c_ast.UnaryOp) and node.op in ('+','-','~','!'): return node.op != '!' and unsigned_type(node.expr)
        if isinstance(node,c_ast.BinaryOp):
            if node.op in ('&&','||','<','>','<=','>=','==','!='): return False
            if node.op in ('<<','>>'): return unsigned_type(node.left)
            return unsigned_type(node.left) or unsigned_type(node.right)
        if isinstance(node,c_ast.TernaryOp): return unsigned_type(node.iftrue) or unsigned_type(node.iffalse)
        fail()
    def visit(node, depth=0):
        if depth > 64: fail()
        if isinstance(node,c_ast.Constant): return literal(node)
        if isinstance(node,c_ast.ID): return 0, False
        if isinstance(node,c_ast.UnaryOp) and node.op in ('+','-','~','!'):
            value, unsigned = visit(node.expr,depth+1)
            if node.op == '!': return int(not value), False
            return checked({'+':lambda:value,'-':lambda:-value,'~':lambda:~value}[node.op](), unsigned)
        if isinstance(node,c_ast.TernaryOp):
            value, _ = visit(node.iftrue if visit(node.cond,depth+1)[0] else node.iffalse,depth+1)
            return checked(value,unsigned_type(node))
        if not isinstance(node,c_ast.BinaryOp): fail()
        a, ua = visit(node.left,depth+1)
        op = node.op
        if op == '&&' and not a: return 0, False
        if op == '||' and a: return 1, False
        b, ub = visit(node.right,depth+1)
        if op in ('&&','||'): return int(bool(b)), False
        unsigned = ua if op in ('<<','>>') else ua or ub
        if unsigned:
            a &= MASK
            if op not in ('<<','>>'): b &= MASK
        if op in ('/','%') and b == 0: raise error_type('预处理条件除数不能为零')
        if op in ('<<','>>') and (b < 0 or b >= 64 or a < 0): fail()
        quotient = lambda: (abs(a)//abs(b)) * (-1 if (a<0)!=(b<0) else 1)
        operations = {'+':lambda:a+b,'-':lambda:a-b,'*':lambda:a*b,'/':quotient,'%':lambda:a-quotient()*b,'&':lambda:a&b,'|':lambda:a|b,'^':lambda:a^b,'<<':lambda:a<<b,'>>':lambda:a>>b,'<':lambda:int(a<b),'>':lambda:int(a>b),'<=':lambda:int(a<=b),'>=':lambda:int(a>=b),'==':lambda:int(a==b),'!=':lambda:int(a!=b)}
        if op not in operations: fail()
        return checked(operations[op](),False if op in ('<','>','<=','>=','==','!=') else unsigned)
    try:
        tree = c_parser.CParser().parse('int f(){return ('+expression+');}')
        if len(tree.ext) != 1 or not isinstance(tree.ext[0],c_ast.FuncDef): fail()
        statements = tree.ext[0].body.block_items
        if len(statements) != 1 or not isinstance(statements[0],c_ast.Return): fail()
        node = statements[0].expr
        return bool(visit(node)[0])
    except error_type: raise
    except (Exception, RecursionError) as error:
        raise error_type('预处理条件无效：'+str(error)) from error

"""Finite real-valued math.h operations; no host code execution."""
import math

UNARY = {'sqrt': math.sqrt, 'fabs': math.fabs, 'floor': lambda x: float(math.floor(x)),
         'ceil': lambda x: float(math.ceil(x)), 'trunc': lambda x: float(math.trunc(x)),
         'round': lambda x: math.copysign(float(math.floor(abs(x)) + (abs(x)-math.floor(abs(x)) >= 0.5)), x),
         'sin': math.sin, 'cos': math.cos, 'tan': math.tan,
         'asin': math.asin, 'acos': math.acos, 'atan': math.atan,
         'exp': math.exp, 'log': math.log, 'log10': math.log10}
BINARY = {'pow': math.pow, 'hypot': math.hypot, 'atan2': math.atan2,
          'fmod': math.fmod, 'fmin': min, 'fmax': max}
FUNCTIONS = {name: (name, 64) for name in (*UNARY, *BINARY)}
FUNCTIONS.update({name+'f': (name, 32) for name in (*UNARY, *BINARY)})

def apply(name, args, convert, error_type):
 base, bits = FUNCTIONS[name]
 arity = 1 if base in UNARY else 2
 if len(args) != arity or any(not isinstance(x, (int, float)) for x in args):
  raise error_type(name+' 需要 '+str(arity)+' 个数值参数')
 values = [convert(x, bits) for x in args]
 try:
  value = (UNARY if arity == 1 else BINARY)[base](*values)
 except (ValueError, OverflowError, ZeroDivisionError):
  raise error_type(name+' 的参数超出当前有限实数模型的定义域或结果范围')
 # floor/ceil/trunc preserve the sign of a zero argument/result.
 if base in ('floor', 'ceil', 'trunc') and value == 0:
  value = math.copysign(0.0, values[0])
 return convert(value, bits)

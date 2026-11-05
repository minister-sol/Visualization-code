import sys, pathlib, re, copy, json
sys.path.insert(0,str(pathlib.Path(__file__).parent/'vendor'))
from pycparser import c_parser,c_ast
class CError(Exception): pass
class Return(Exception):
 def __init__(self,value): self.value=value
class Break(Exception): pass
class Continue(Exception): pass
class Engine:
 def __init__(self): self.env=[{}]; self.steps=[]; self.output=''; self.stack=[]; self.ops=0
 def tick(self):
  self.ops+=1
  if len(self.output)>100000: raise CError('输出超过100KB限制')
  if self.ops>30000: raise CError('执行操作超过限制，可能存在死循环')
 def emit(self,n,event='step'):
  if len(self.steps)>=3000: raise CError('执行步骤超过 3000 步限制')
  self.steps.append(dict(line=n.coord.line if n.coord else 1,event=event,variables=copy.deepcopy({k:v for e in self.env for k,v in e.items()}),stack=self.stack[:],output=self.output,description='执行第 %s 行'%(n.coord.line if n.coord else 1)))
 def get(self,k):
  for e in reversed(self.env):
   if k in e:return e[k]
  raise CError('未定义变量：'+k)
 def target(self,n):
  if isinstance(n,c_ast.ID):
   for e in reversed(self.env):
    if n.name in e:return e,n.name
   raise CError('未定义变量：'+n.name)
  if isinstance(n,c_ast.ArrayRef):
   a=self.expr(n.name); i=int(self.expr(n.subscript))
   if not isinstance(a,list) or i<0 or i>=len(a):raise CError('数组越界')
   return a,i
  raise CError('暂不支持此赋值目标或指针')
 def expr(self,n):
  self.tick()
  if n is None:return 0
  t=type(n).__name__
  if t=='Constant':
   if n.type=='string':return bytes(n.value[1:-1],'utf8').decode('unicode_escape')
   if n.type=='char':raise CError('首版暂不支持 char 类型')
   if n.type!='int':raise CError('首版数值常量仅支持 int')
   value=int(n.value,8 if len(n.value)>1 and n.value[0]=='0' and not n.value.lower().startswith('0x') else 0)
   if value>2147483647:raise CError('整数常量超出32位支持范围')
   return value
  if t=='ID':return self.get(n.name)
  if t=='ArrayRef':a,i=self.target(n);return a[i]
  if t=='Assignment':
   a,k=self.target(n.lvalue);v=self.expr(n.rvalue)
   if n.op!='=':v=self.binary(n.op[:-1],a[k],v)
   a[k]=v;return v
  if t=='BinaryOp':
   a=self.expr(n.left)
   if n.op=='&&':return int(bool(a) and bool(self.expr(n.right)))
   if n.op=='||':return int(bool(a) or bool(self.expr(n.right)))
   return self.binary(n.op,a,self.expr(n.right))
  if t=='UnaryOp':
   if '++' in n.op or '--' in n.op:
    a,k=self.target(n.expr);v=a[k];a[k]=self.binary('+',v,1 if '++' in n.op else -1);return v if n.op.startswith('p') else a[k]
   v=self.expr(n.expr)
   if n.op in ('+','-','!','~'):return {'+':lambda:+v,'-':lambda:-v,'!':lambda:int(not v),'~':lambda:~v}[n.op]()
   raise CError('暂不支持运算符 '+n.op)
  if t=='Cast':raise CError('首版暂不支持显式类型转换')
  if t=='TernaryOp':return self.expr(n.iftrue if self.expr(n.cond) else n.iffalse)
  if t=='ExprList':
   vals=[self.expr(x) for x in n.exprs];return vals[-1]
  if t=='FuncCall':
   name=n.name.name;args=[self.expr(x) for x in (n.args.exprs if n.args else [])]
   if name=='printf':
    if not args or not isinstance(args[0],str):raise CError('printf 需要格式字符串')
    fmt=args[0]
    tokens=re.findall(r'%(?:%|d|i)',fmt)
    if re.sub(r'%(?:%|d|i)','',fmt).find('%')>=0:raise CError('printf 首版仅支持 %d、%i 和 %%')
    if sum(t!='%%' for t in tokens)!=len(args)-1:raise CError('printf 参数数量不匹配')
    it=iter(args[1:]);out=re.sub(r'%(?:%|d|i)',lambda m:'%' if m.group()=='%%' else str(next(it)),fmt)
    if len(self.output)+len(out)>100000:raise CError('输出超过100KB限制')
    self.output+=out;return len(out)
   if name=='puts':
    if len(args)!=1 or not isinstance(args[0],str):raise CError('puts 需要一个字符串')
    if len(self.output)+len(args[0])+1>100000:raise CError('输出超过100KB限制')
    self.output+=args[0]+'\n';return 0
   if name not in self.funcs:raise CError('不支持的函数：'+name)
   if len(self.stack)>=80:raise CError('递归深度超过限制')
   f=self.funcs[name];params=f.decl.type.args.params if f.decl.type.args else []
   names=[p.name for p in params if getattr(p,'name',None)]
   if len(names)!=len(args):raise CError('函数参数数量不匹配')
   caller_env=self.env;self.env=[caller_env[0],dict(zip(names,args))];self.stack.append(name)
   try:self.exec(f.body);v=0
   except Return as r:v=r.value
   finally:self.stack.pop();self.env=caller_env
   return v
  raise CError('暂不支持语法：'+t)
 def binary(self,op,a,b):
  if op in ('/','%') and b==0:raise CError('除数不能为零')
  funcs={'+':lambda:a+b,'-':lambda:a-b,'*':lambda:a*b,'/':lambda:int(a/b) if isinstance(a,int) and isinstance(b,int) else a/b,'%':lambda:a-int(a/b)*b,'<':lambda:int(a<b),'>':lambda:int(a>b),'==':lambda:int(a==b),'!=':lambda:int(a!=b),'<=':lambda:int(a<=b),'>=':lambda:int(a>=b),'&':lambda:a&b,'|':lambda:a|b,'^':lambda:a^b,'<<':lambda:a<<b,'>>':lambda:a>>b}
  if op not in funcs:raise CError('不支持运算符 '+op)
  if op in ('<<','>>') and (b<0 or b>63):raise CError('移位范围超限')
  if not isinstance(a,int) or not isinstance(b,int):raise CError('首版数值运算仅支持 int')
  result=funcs[op]()
  if isinstance(result,int) and not -2147483648<=result<=2147483647:raise CError('32 位有符号整数溢出或超出支持范围')
  return result
 def exec(self,n):
  if n is None:return
  self.tick();t=type(n).__name__
  if t=='Compound':
   self.env.append({})
   try:
    for x in n.block_items or []:self.exec(x)
   finally:self.env.pop()
   return
  if t=='Decl':
   if isinstance(n.type,c_ast.ArrayDecl):
    vals=[self.expr(x) for x in n.init.exprs] if n.init else [];size=int(self.expr(n.type.dim)) if n.type.dim else len(vals)
    if size<0 or size>1000 or len(vals)>size:raise CError('数组大小无效或超过1000')
    v=vals+[0]*(size-len(vals))
   elif isinstance(n.type,c_ast.TypeDecl) and isinstance(n.type.type,c_ast.IdentifierType):v=self.expr(n.init) if n.init else 0
   else:raise CError('暂不支持声明类型：指针、结构体等')
   self.env[-1][n.name]=v
  elif t=='DeclList':
   for x in n.decls:self.exec(x)
   return
  elif t=='If':
   cond=self.expr(n.cond);self.emit(n,'condition');self.exec(n.iftrue if cond else n.iffalse);return
  elif t in ('For','While','DoWhile'):
   if t=='For':self.env.append({});self.exec(n.init)
   try:
    first=True
    while True:
     if not(t=='DoWhile' and first):
      cond=self.expr(n.cond) if n.cond else 1;self.emit(n,'condition')
      if not cond:break
     first=False
     try:self.exec(n.stmt)
     except Break:break
     except Continue:pass
     if t=='For':self.exec(n.next)
   finally:
    if t=='For':self.env.pop()
   return
  elif t=='Return':self.emit(n,'return');raise Return(self.expr(n.expr))
  elif t=='Break':raise Break()
  elif t=='Continue':raise Continue()
  elif t=='EmptyStatement':return
  else:self.expr(n)
  self.emit(n)
 def validate(self,tree):
  class Validator(c_ast.NodeVisitor):
   def visit_TypeDecl(v,n):
    if not isinstance(n.type,c_ast.IdentifierType) or n.type.names not in (['int'],['void']):raise CError('首版仅支持 int 和 void 类型')
    if n.quals:raise CError('首版暂不支持类型限定符')
   def visit_ArrayDecl(v,n):
    if not isinstance(n.type,c_ast.TypeDecl):raise CError('首版暂不支持多维数组')
    v.generic_visit(n)
   def visit_PtrDecl(v,n):raise CError('首版暂不支持指针')
   def visit_Struct(v,n):raise CError('首版暂不支持结构体')
   def visit_Union(v,n):raise CError('首版暂不支持联合体')
   def visit_Enum(v,n):raise CError('首版暂不支持枚举')
   def visit_Switch(v,n):raise CError('首版暂不支持 switch')
   def visit_Decl(v,n):
    if n.storage or n.quals:raise CError('首版暂不支持存储类别或类型限定符')
    v.generic_visit(n)
  Validator().visit(tree)
 def run(self,code,stdin=''):
  if stdin:raise CError('首版暂不支持标准输入')
  if not isinstance(code,str):raise CError('代码必须为字符串')
  if len(code)>50000:raise CError('代码超过长度限制')
  # Preserve strings and line numbers while removing comments.
  code=re.sub(r'"(?:\\.|[^"\\])*"|/\*.*?\*/|//[^\n]*',lambda m:m.group() if m.group().startswith('"') else ' '+ '\n'*m.group().count('\n'),code,flags=re.S)
  code=re.sub(r'^[ \t]*#include[ \t]*[<"](?:stdio|stdlib)[.]h[>"][ \t]*$', '',code,flags=re.M)
  if re.search(r'^[ \t]*#',code,re.M):raise CError('首版仅支持 stdio.h/stdlib.h include，不支持宏或其他预处理')
  tree=c_parser.CParser().parse(code);self.funcs={n.decl.name:n for n in tree.ext if isinstance(n,c_ast.FuncDef)}
  self.validate(tree)
  for n in tree.ext:
   if not isinstance(n,c_ast.FuncDef):self.exec(n)
  if 'main' not in self.funcs:raise CError('缺少 main 函数')
  self.expr(c_ast.FuncCall(c_ast.ID('main'),None))
  return dict(steps=self.steps,output=self.output,status='completed',mode='受限 C 解释器')
def trace(code,stdin=''):return Engine().run(code,stdin)

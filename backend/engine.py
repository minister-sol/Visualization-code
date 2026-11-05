import sys, pathlib, re, copy, json, ast
sys.path.insert(0,str(pathlib.Path(__file__).parent/'vendor'))
from pycparser import c_parser,c_ast,c_generator
class CInt(int):
 def __new__(cls,v,bits=32):
  x=int.__new__(cls,v);x.bits=bits;return x
class CError(Exception): pass
class Return(Exception):
 def __init__(self,value): self.value=value
class Break(Exception): pass
class Continue(Exception): pass
class Engine:
 def __init__(self): self.env=[{}]; self.steps=[]; self.output=''; self.stack=[]; self.ops=0;self.types={};self.input_text="";self.input_pos=0;self.gen=c_generator.CGenerator();self.last_index=0;self.trace_bytes=0
 def tick(self):
  self.ops+=1
  if len(self.output)>100000: raise CError('输出超过100KB限制')
  if self.ops>30000: raise CError('执行操作超过限制，可能存在死循环')
 def safe(self,v):
  if isinstance(v,int):return str(v) if abs(v)>9007199254740991 else int(v)
  if isinstance(v,list):return [self.safe(x) for x in v]
  if isinstance(v,dict):return {k:self.safe(x) for k,x in v.items()}
  return v
 def emit(self,n,event='step',result=None,reads=None,writes=None,description=None):
  if len(self.steps)>=3000:raise CError('执行步骤超过 3000 步限制')
  expression=self.gen.visit(n) if n else ''
  labels={'read':'读取','write':'写入','compute':'计算','condition':'判断条件','call':'调用函数','return':'函数返回','input':'读取输入','output':'输出','declare':'声明'}
  step=self.safe(dict(line=n.coord.line if n and n.coord else 1,event=event,variables=copy.deepcopy({k:v for e in self.env for k,v in e.items()}),stack=self.stack[:],output=self.output,expression=expression,result=result,reads=reads or [],writes=writes or [],input={'position':self.input_pos,'total':len(self.input_text),'remaining':self.input_text[self.input_pos:]},description=description or labels.get(event,'执行')+'：'+expression+((' → '+str(result)) if result is not None else '')))
  self.trace_bytes+=len(json.dumps(step,ensure_ascii=False).encode('utf8'))
  if self.trace_bytes>16000000:raise CError('执行轨迹超过16MB限制，请缩小输入或程序')
  self.steps.append(step)
 def info(self,n,value,index=None):
  if isinstance(n,c_ast.ArrayRef):return {'name':self.gen.visit(n.name),'index':self.last_index if index is None else index,'value':value}
  return {'name':self.gen.visit(n),'value':value}
 def checked(self,v,bits=32):
  if v is None:raise CError('读取未初始化变量')
  if not -(1<<(bits-1))<=v<(1<<(bits-1)):raise CError(str(bits)+' 位有符号整数溢出')
  return CInt(v,bits)
 def store(self,a,k,v):
  bits=self.types.get((id(a),k),self.types.get(id(a),32));a[k]=self.checked(v,bits);return a[k]
 def reads_since(self,position):
  return [r for step in self.steps[position:] if step["event"]=="read" for r in step["reads"]]
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
   a=self.get(n.name.name) if isinstance(n.name,c_ast.ID) else self.expr(n.name); i=int(self.expr(n.subscript))
   if not isinstance(a,list) or i<0 or i>=len(a):raise CError('数组越界')
   self.last_index=i
   return a,i
  raise CError('暂不支持此赋值目标或指针')
 def expr(self,n):
  self.tick()
  if n is None:return 0
  t=type(n).__name__
  if t=='Constant':
   if n.type=='string':return ast.literal_eval(n.value)
   if n.type=='char':raise CError('首版暂不支持 char 类型')
   if n.type not in ('int','long long int'):raise CError('数值常量仅支持 int/long long')
   literal=re.sub(r'[lL]+$','',n.value)
   value=int(literal,8 if len(literal)>1 and literal[0]=='0' and not literal.lower().startswith('0x') else 0)
   return self.checked(value,64 if 'l' in n.value.lower() or value>2147483647 else 32)
  if t=='ID':
   v=self.get(n.name)
   if v is None:raise CError('读取未初始化变量：'+n.name)
   self.emit(n,'read',v,reads=[self.info(n,v)]);return v
  if t=='ArrayRef':
   a,i=self.target(n);v=a[i]
   if v is None:raise CError('读取未初始化数组元素')
   self.emit(n,'read',v,reads=[self.info(n,v,i)]);return v
  if t=='Assignment':
   a,k=self.target(n.lvalue);index=k;position=len(self.steps);v=self.expr(n.rvalue)
   if n.op!='=':v=self.binary(n.op[:-1],a[k],v)
   v=self.store(a,k,v);self.emit(n,'write',v,reads=self.reads_since(position),writes=[self.info(n.lvalue,v,index)]);return v
  if t=='BinaryOp':
   position=len(self.steps);a=self.expr(n.left)
   if n.op=='&&':return int(bool(a) and bool(self.expr(n.right)))
   if n.op=='||':return int(bool(a) or bool(self.expr(n.right)))
   b=self.expr(n.right);v=self.binary(n.op,a,b);self.emit(n,'condition' if n.op in ('<','>','<=','>=','==','!=') else 'compute',v,reads=self.reads_since(position));return v
  if t=='UnaryOp':
   if '++' in n.op or '--' in n.op:
    a,k=self.target(n.expr);v=a[k];self.store(a,k,self.binary('+',v,1 if '++' in n.op else -1));self.emit(n,'write',a[k],writes=[self.info(n.expr,a[k],k)]);return v if n.op.startswith('p') else a[k]
   v=self.expr(n.expr)
   if n.op in ('+','-','!','~'):return self.checked({'+':lambda:+v,'-':lambda:-v,'!':lambda:int(not v),'~':lambda:~v}[n.op](),getattr(v,'bits',32))
   raise CError('暂不支持运算符 '+n.op)
  if t=='Cast':raise CError('首版暂不支持显式类型转换')
  if t=='TernaryOp':return self.expr(n.iftrue if self.expr(n.cond) else n.iffalse)
  if t=='ExprList':
   vals=[self.expr(x) for x in n.exprs];return vals[-1]
  if t=='FuncCall':
   name=n.name.name
   if name=='scanf':
    self.emit(n,'call',description='调用 scanf 读取标准输入');value=self.scan(n);self.emit(n,'return',value,description='scanf 返回成功读取数量 '+str(value));return value
   self.emit(n,'call',description='调用函数 '+name)
   args=[self.expr(x) for x in (n.args.exprs if n.args else [])]
   if name=='printf':
    if not args or not isinstance(args[0],str):raise CError('printf 需要格式字符串')
    fmt=args[0]
    tokens=re.findall(r'%(?:%|lld|lli|d|i)',fmt)
    if re.sub(r'%(?:%|lld|lli|d|i)','',fmt).find('%')>=0:raise CError('printf 支持 %d、%i、%lld、%lli 和 %%')
    if sum(t!='%%' for t in tokens)!=len(args)-1:raise CError('printf 参数数量不匹配')
    if any(not isinstance(x,int) for x in args[1:]):raise CError('printf 整数格式需要整数参数')
    it=iter(args[1:]);out=re.sub(r'%(?:%|lld|lli|d|i)',lambda m:'%' if m.group()=='%%' else str(next(it)),fmt)
    if len(self.output)+len(out)>100000:raise CError('输出超过100KB限制')
    self.output+=out;self.emit(n,'output',out);return CInt(len(out))
   if name=='puts':
    if len(args)!=1 or not isinstance(args[0],str):raise CError('puts 需要一个字符串')
    if len(self.output)+len(args[0])+1>100000:raise CError('输出超过100KB限制')
    self.output+=args[0]+'\n';self.emit(n,'output',args[0]+'\n');return CInt(0)
   if name not in self.funcs:raise CError('不支持的函数：'+name)
   if len(self.stack)>=80:raise CError('递归深度超过限制')
   f=self.funcs[name];params=f.decl.type.args.params if f.decl.type.args else []
   names=[p.name for p in params if getattr(p,'name',None)]
   if len(names)!=len(args):raise CError('函数参数数量不匹配')
   caller_env=self.env;frame=dict(zip(names,args))
   for param in params:
    if getattr(param,'name',None):
     bits=64 if 'long' in param.type.type.names else 32;self.types[(id(frame),param.name)]=bits;frame[param.name]=self.checked(frame[param.name],bits)
   self.env=[caller_env[0],frame];self.stack.append(name)
   try:self.exec(f.body);v=0
   except Return as r:v=r.value
   finally:self.stack.pop();self.env=caller_env
   if name!='main':self.emit(n,'return',v,description=name+' 返回 '+str(v))
   return v
  raise CError('暂不支持语法：'+t)
 def binary(self,op,a,b):
  if op in ('/','%') and b==0:raise CError('除数不能为零')
  funcs={'+':lambda:a+b,'-':lambda:a-b,'*':lambda:a*b,'/':lambda:((abs(a)//abs(b))*(-1 if (a<0)!=(b<0) else 1)) if isinstance(a,int) and isinstance(b,int) else a/b,'%':lambda:a-((abs(a)//abs(b))*(-1 if (a<0)!=(b<0) else 1))*b,'<':lambda:int(a<b),'>':lambda:int(a>b),'==':lambda:int(a==b),'!=':lambda:int(a!=b),'<=':lambda:int(a<=b),'>=':lambda:int(a>=b),'&':lambda:a&b,'|':lambda:a|b,'^':lambda:a^b,'<<':lambda:a<<b,'>>':lambda:a>>b}
  if op not in funcs:raise CError('不支持运算符 '+op)
  if op in ('<<','>>') and (b<0 or b>=getattr(a,'bits',32) or a<0):raise CError('移位范围超限或负数移位不受支持')
  if not isinstance(a,int) or not isinstance(b,int):raise CError('首版数值运算仅支持 int')
  result=funcs[op]()
  bits=max(getattr(a,'bits',32),getattr(b,'bits',32))
  return self.checked(result,bits)
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
   position=len(self.steps)
   if isinstance(n.type,c_ast.ArrayDecl):
    vals=[self.expr(x) for x in n.init.exprs] if n.init else [];size=int(self.expr(n.type.dim)) if n.type.dim else len(vals)
    if size<=0 or size>1000 or len(vals)>size:raise CError('数组大小无效或超过1000')
    bits=64 if 'long' in n.type.type.type.names else 32
    v=vals+[0 if n.init or len(self.env)==1 else None]*(size-len(vals));self.types[id(v)]=bits
    v[:]=[self.checked(x,bits) if x is not None else None for x in v]
   elif isinstance(n.type,c_ast.TypeDecl) and isinstance(n.type.type,c_ast.IdentifierType):v=self.expr(n.init) if n.init else (0 if len(self.env)==1 else None)
   else:raise CError('暂不支持声明类型：指针、结构体等')
   bits=64 if isinstance(n.type,c_ast.TypeDecl) and 'long' in n.type.type.names else 32
   if not isinstance(v,list) and v is not None:v=self.checked(v,bits)
   self.types[(id(self.env[-1]),n.name)]=bits;self.env[-1][n.name]=v
   self.emit(n,'declare',v,reads=self.reads_since(position),writes=[{'name':n.name,'value':v}]);return
  elif t=='DeclList':
   for x in n.decls:self.exec(x)
   return
  elif t=='If':
   position=len(self.steps);cond=self.expr(n.cond);self.emit(n.cond,'condition',cond,reads=self.reads_since(position));self.exec(n.iftrue if cond else n.iffalse);return
  elif t in ('For','While','DoWhile'):
   if t=='For':self.env.append({});self.exec(n.init)
   try:
    first=True
    while True:
     if not(t=='DoWhile' and first):
      position=len(self.steps);cond=self.expr(n.cond) if n.cond else 1;self.emit(n.cond or n,'condition',cond,reads=self.reads_since(position))
      if not cond:break
     first=False
     try:self.exec(n.stmt)
     except Break:break
     except Continue:pass
     if t=='For':self.exec(n.next)
   finally:
    if t=='For':self.env.pop()
   return
  elif t=='Return':
   value=self.expr(n.expr);self.emit(n,'return',value);raise Return(value)
  elif t=='Break':raise Break()
  elif t=='Continue':raise Continue()
  elif t=='EmptyStatement':return
  else:self.expr(n)
  self.emit(n)
 def scan(self,n):
  nodes=n.args.exprs if n.args else []
  if not nodes:raise CError('scanf 缺少格式字符串')
  fmt=self.expr(nodes[0]);specs=re.findall(r'%(?:lld|d)',fmt)
  if re.sub(r'%(?:lld|d)|\s+','',fmt):raise CError('scanf 仅支持空白分隔的 %d/%lld')
  if len(specs)!=len(nodes)-1:raise CError('scanf 参数数量不匹配')
  count=0
  for spec,arg in zip(specs,nodes[1:]):
   if not isinstance(arg,c_ast.UnaryOp) or arg.op!='&':raise CError('scanf 目标必须为 &变量 或 &数组元素')
   a,k=self.target(arg.expr);bits=self.types.get((id(a),k),self.types.get(id(a),32))
   if bits!=(64 if spec=='%lld' else 32):raise CError('scanf 格式与目标类型不匹配')
   rest=self.input_text[self.input_pos:];spaces=len(rest)-len(rest.lstrip());self.input_pos+=spaces;rest=rest.lstrip()
   match=re.match(r'[+-]?[0-9]+',rest)
   if not match:
    self.emit(n,'input',count,description='输入结束' if not rest else '输入不匹配，scanf 停止')
    return CInt(-1 if not rest and count==0 else count)
   value=self.checked(int(match.group()),bits);self.input_pos+=len(match.group());self.store(a,k,value);count+=1
   self.emit(n,'input',value,writes=[self.info(arg.expr,value,k)],description='从标准输入读取 '+str(value)+' 写入 '+self.gen.visit(arg.expr))
  return CInt(count)
 def validate(self,tree):
  class Validator(c_ast.NodeVisitor):
   def visit_TypeDecl(v,n):
    if not isinstance(n.type,c_ast.IdentifierType) or n.type.names not in (['int'],['void'],['long','long'],['long','long','int']):raise CError('支持 int、long long int 和 void 类型')
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
  if not isinstance(stdin,str) or len(stdin)>100000:raise CError('标准输入必须为100KB以内字符串')
  self.input_text=stdin
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
  if self.steps:
   last=copy.deepcopy(self.steps[-1]);last['event']='complete';last['description']='程序执行完成';self.steps.append(last)
  return dict(steps=self.steps,output=self.output,status='completed',mode='受限 C 解释器')
def trace(code,stdin=''):return Engine().run(code,stdin)

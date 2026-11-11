from backend.integer_parsing import parse as parse_integer_prefix
import sys, pathlib, re, copy, json, ast, math, struct
sys.path.insert(0,str(pathlib.Path(__file__).parent/'vendor'))
from pycparser import c_parser,c_ast,c_generator
from backend.preprocess import preprocess, splice_lines, TOKEN
from backend.character_library import FUNCTIONS as CHARACTER_FUNCTIONS, apply as character_operation
from backend.floating_format import format_float
from backend.math_library import FUNCTIONS as MATH_FUNCTIONS, apply as math_operation
from backend.integer_format import PATTERN as PRINTF_PATTERN, format_integer
class CInt(int):
 def __new__(cls,v,bits=32,unsigned=False):
  x=int.__new__(cls,v);x.bits=bits;x.unsigned=unsigned;return x
class FloatWidth(int):pass
class CFloat(float):
 def __new__(cls,value,bits=64):
  result=float.__new__(cls,value);result.bits=bits;return result
 def __deepcopy__(self,memo):return self
class SizeToken(int):
 def __new__(cls,spec,count=1,unit_bytes=1):
  value=int.__new__(cls,count*unit_bytes);value.spec=spec;value.count=count;value.unit_bytes=unit_bytes;value.bits=64;value.unsigned=True;return value
 def __deepcopy__(self,memo):return self
class StaticBinding:
 def __init__(self,container,key):self.container=container;self.key=key
 def __deepcopy__(self,memo):return self
class Pointer:
 def __init__(self,container,key,label,readonly=False):self.container=container;self.key=key;self.label=label;self.readonly=readonly
 def __deepcopy__(self,memo):return self
 def __bool__(self):return True
 def __str__(self):return '&'+self.label
 def __eq__(self,other):return isinstance(other,Pointer) and self.container is other.container and self.key==other.key
class FunctionPointer(Pointer):
 def __init__(self,name):self.name=name;self.container=None;self.key=0;self.label='函数 '+name;self.readonly=True
 def __str__(self):return self.label
 def __eq__(self,other):return isinstance(other,FunctionPointer) and self.name==other.name
class CError(Exception): pass
class Return(Exception):
 def __init__(self,value): self.value=value
class ProgramExit(Exception):
 def __init__(self,status):self.status=status
class Break(Exception): pass
class Continue(Exception): pass
def preserve_failure(operation):
 def wrapped(self,node,*args,**kwargs):
  try:return operation(self,node,*args,**kwargs)
  except CError as error:
   if not hasattr(error,'steps'):
    line=node.coord.line if node is not None and node.coord else 1
    snapshot=self.safe(dict(line=line,event='error',description=str(error),expression=self.describe(node) if node is not None else '',variables={k:v for scope in self.env for k,v in scope.items()},bindings=self.visible_bindings(),integers=self.integer_types(),characters=self.character_paths(),booleans=self.boolean_paths(),arrays=self.array_paths(),objects=self.graph(),stack=self.stack[:],frames=self.frame_snapshots(),output=self.output,reads=[],writes=[]))
    error.preprocessed_source=getattr(self,'preprocessed_source','');error.line=line;error.steps=self.steps+[snapshot];error.output=self.output
   raise
 return wrapped
class Engine:
 def __init__(self): self.env=[{}]; self.steps=[]; self.output=''; self.stack=[]; self.ops=0;self.types={};self.input_text="";self.input_pos=0;self.gen=c_generator.CGenerator();self.last_index=0;self.trace_bytes=0;self.structs={};self.objects={};self.object_ids={};self.pointer_slots=set();self.expired={};self.heap={};self.freed=set();self.declared_types={};self.allocation_types={};self.struct_types={};self.array_ids={};self.frame_envs=[];self.literal_pool={};self.readonly=set();self.enums={};self.enum_values={};self.enum_slots=set();self.prototypes={};self.const_slots=set();self.index_context={};self.unsigned_slots=set();self.unsigned_arrays=set();self.tag_labels={};self.static_storage={};self.literal_storage={};self.function_slots={};self.runtime_values={};self.reference_expansion=False;self.frame_serial=0;self.frame_ids={};self.binding_scopes={};self.vla_declarations={};self.vla_extent_names=set();self.vla_extent_scopes={}
 def publish_declaration(self,node,value):
  scope=self.env[-1]
  if 'static' in node.storage and len(self.env)>1:
   storage=self.static_storage.setdefault(id(node),{});storage[node.name]=value;scope[node.name]=StaticBinding(storage,node.name)
  else:scope[node.name]=value
 def finish_static(self,node):
  if 'static' not in node.storage or len(self.env)==1 or not node.name:return
  scope=self.env[-1];storage=self.static_storage.get(id(node),{});storage[node.name]=scope[node.name];self.static_storage[id(node)]=storage
  if (id(scope),node.name) in self.types:self.types[(id(storage),node.name)]=self.types[(id(scope),node.name)]
  if (id(scope),node.name) in self.function_slots:self.function_slots[(id(storage),node.name)]=self.function_slots[(id(scope),node.name)]
  for metadata in (self.const_slots,self.unsigned_slots,self.pointer_slots):
   if (id(scope),node.name) in metadata:metadata.add((id(storage),node.name))
  scope[node.name]=StaticBinding(storage,node.name)
 def describe(self,node):
  return TOKEN.sub(lambda match:('assert' if match.group()=='__cvisual_assert' else self.tag_labels.get(match.group(),match.group())),self.gen.visit(node))
 def type_signature(self,typ,ignore_top=False):
  if isinstance(typ,c_ast.FuncDecl):return ('function',self.function_signature(typ))
  if isinstance(typ,c_ast.TypeDecl):signature=self.type_signature(typ.type)
  elif isinstance(typ,c_ast.IdentifierType):return tuple(typ.names)
  elif isinstance(typ,c_ast.Struct):return ('struct',typ.name)
  elif isinstance(typ,c_ast.Enum):return ('enum',typ.name)
  elif isinstance(typ,c_ast.PtrDecl):signature=('pointer',self.type_signature(typ.type))
  elif isinstance(typ,c_ast.ArrayDecl):return ('array',self.describe(typ.dim) if typ.dim else None,self.type_signature(typ.type))
  else:raise CError('函数声明含不支持的类型')
  qualifiers=tuple(sorted(getattr(typ,'quals',[])))
  return ('qualified',qualifiers,signature) if qualifiers and not ignore_top else signature
 def object_types_compatible(self,left,right):
  if isinstance(left,c_ast.ArrayDecl) and isinstance(right,c_ast.ArrayDecl):
   dimensions=left.dim is None or right.dim is None or self.describe(left.dim)==self.describe(right.dim)
   if not dimensions:
    try:dimensions=self.constant_integer(left.dim)==self.constant_integer(right.dim)
    except CError:pass
   return dimensions and self.object_types_compatible(left.type,right.type)
  return self.type_signature(left)==self.type_signature(right)
 def merge_global_objects(self,tree):
  groups={}
  for node in tree.ext:
   if isinstance(node,c_ast.Decl) and node.name and not isinstance(node.type,c_ast.FuncDecl):groups.setdefault(node.name,[]).append(node)
  selected={}
  def merge_array(left,right):
   if isinstance(left,c_ast.ArrayDecl) and isinstance(right,c_ast.ArrayDecl):
    if left.dim is None and right.dim is not None:left.dim=copy.deepcopy(right.dim)
    merge_array(left.type,right.type)
  for name,nodes in groups.items():
   initialized=[node for node in nodes if node.init is not None]
   if len(initialized)>1:raise CError('全局对象重复初始化定义：'+name)
   definitions=[node for node in nodes if 'extern' not in node.storage or node.init is not None]
   if not definitions:continue
   representative=copy.deepcopy(initialized[0] if initialized else definitions[0])
   for node in nodes:merge_array(representative.type,node.type)
   if isinstance(representative.type,c_ast.ArrayDecl) and representative.type.dim is None and representative.init is None:representative.type.dim=c_ast.Constant('int','1')
   selected[name]=representative
  result=[];emitted=set();tags=set()
  for node in tree.ext:
   if isinstance(node,c_ast.Decl) and node.name in groups and not isinstance(node.type,c_ast.FuncDecl):
    if node.name in emitted:continue
    emitted.add(node.name)
    for declaration in groups[node.name]:
     base=declaration.type
     while isinstance(base,(c_ast.TypeDecl,c_ast.PtrDecl,c_ast.ArrayDecl)):base=base.type
     if (isinstance(base,c_ast.Struct) and base.decls is not None) or (isinstance(base,c_ast.Enum) and base.values is not None):
      identity=(type(base).__name__,base.name)
      if identity not in tags:
       tag=copy.deepcopy(declaration);tag.name=None;tag.type=copy.deepcopy(base);tag.init=None;tag.storage=[];result.append(tag);tags.add(identity)
    representative=selected.get(node.name)
    if representative is not None:
     defined=representative.type
     while isinstance(defined,(c_ast.TypeDecl,c_ast.PtrDecl,c_ast.ArrayDecl)):defined=defined.type
     if isinstance(defined,c_ast.Struct):defined.decls=None
     elif isinstance(defined,c_ast.Enum):defined.values=None
     result.append(representative)
   else:result.append(node)
  tree.ext=result
 def bind_external(self,node):
  if len(self.env)==1:return
  if node.init is not None:raise CError('局部 extern 声明不能带初始化')
  global_scope=self.env[0];scope=self.env[-1];name=node.name
  if name not in global_scope:raise CError('extern 对象在当前输入中缺少定义：'+name)
  global_type=self.declared_types.get((id(global_scope),name))
  if global_type is None or not self.object_types_compatible(node.type,global_type):raise CError('extern 对象声明类型冲突：'+name)
  existing=scope.get(name)
  if name in scope and not (isinstance(existing,StaticBinding) and existing.container is global_scope and existing.key==name):raise CError('extern 与当前作用域局部对象冲突：'+name)
  scope[name]=StaticBinding(global_scope,name);self.declared_types[(id(scope),name)]=global_type
  self.emit(node,'declare',self.safe(global_scope[name]),description='extern 绑定全局对象 '+name)
 def function_signature(self,typ):
  parameters=None
  if typ.args is not None:
   parameters=[]
   for param in typ.args.params:
    if isinstance(param,c_ast.EllipsisParam):raise CError('用户函数暂不支持可变参数声明')
    signature=('pointer',self.type_signature(param.type.type)) if isinstance(param.type,c_ast.ArrayDecl) else self.type_signature(param.type,True)
    if signature==('void',) and len(typ.args.params)==1:continue
    parameters.append(signature)
  return self.type_signature(typ.type,True),parameters
 def check_prototype(self,decl):
  signature=self.function_signature(decl.type)
  candidates=[]
  if decl.name in self.funcs:candidates.append(self.function_signature(self.funcs[decl.name].decl.type))
  if decl.name in self.prototypes:candidates.append(self.prototypes[decl.name])
  for returned,parameters in candidates:
   if returned!=signature[0] or (parameters is not None and signature[1] is not None and parameters!=signature[1]):raise CError('函数声明与定义类型冲突：'+decl.name)
  if decl.name not in self.prototypes or signature[1] is not None:self.prototypes[decl.name]=signature
 def mark_readonly(self,value):
  if not isinstance(value,(dict,list)):return
  self.readonly.add(id(value))
  for child in value.values() if isinstance(value,dict) else value:self.mark_readonly(child)
 def qualify(self,value,typ):
  if isinstance(value,Pointer) and isinstance(typ,c_ast.PtrDecl) and 'const' in getattr(typ.type,'quals',[]):return Pointer(value.container,value.key,value.label,True)
  return value
 def validate_function_pointer(self,value,typ):
  if isinstance(value,FunctionPointer) and isinstance(typ,c_ast.PtrDecl) and not isinstance(typ.type,c_ast.FuncDecl):raise CError('函数引用不能作为数据指针存储')
  if isinstance(typ,c_ast.PtrDecl) and isinstance(typ.type,c_ast.FuncDecl):
   if value is None or value==0:return
   if not isinstance(value,FunctionPointer):raise CError('函数指针需要兼容的函数或空指针')
   expected=self.function_signature(typ.type);actual=self.function_signature(self.funcs[value.name].decl.type)
   if expected[0]!=actual[0] or (expected[1] is not None and expected[1]!=actual[1]):raise CError('函数指针签名不匹配')
 def bind_const(self,container,key,typ):
  self.validate_function_pointer(container[key],typ)
  if isinstance(typ,c_ast.PtrDecl) and isinstance(typ.type,c_ast.FuncDecl):self.function_slots[(id(container),key)]=typ
  if self.is_unsigned(typ):self.unsigned_slots.add((id(container),key))
  container[key]=self.qualify(container[key],typ)
  if 'const' in getattr(typ,'quals',[]):
   self.const_slots.add((id(container),key))
   if not isinstance(typ,c_ast.PtrDecl):self.mark_readonly(container[key])
  if isinstance(typ,c_ast.ArrayDecl):
   base=typ
   while isinstance(base,c_ast.ArrayDecl):base=base.type
   if 'const' in getattr(base,'quals',[]):self.mark_readonly(container[key])
 def const_lvalue(self,node):
  try:typ=self.expression_type(node)
  except CError:return False
  if 'const' in getattr(typ,'quals',[]):return True
  if isinstance(node,c_ast.StructRef):
   if node.type=='.':return self.const_lvalue(node.name)
   owner=self.expression_type(node.name)
   return isinstance(owner,c_ast.PtrDecl) and 'const' in getattr(owner.type,'quals',[])
  if isinstance(node,c_ast.ArrayRef) and isinstance(self.expression_type(node.name),c_ast.ArrayDecl):return self.const_lvalue(node.name)
  return False
 def captured_extent(self,name):
  for scope in reversed(self.env):
   values=self.vla_extent_scopes.get(id(scope),{})
   if name in values:return values[name]
  raise CError('变长数组类型的长度不在当前作用域')
 def visible_bindings(self):
  result={}
  for scope in self.env:
   for name,value in scope.items():
    container,key=(value.container,value.key) if isinstance(value,StaticBinding) else (scope,name)
    identity=self.binding_scopes.setdefault(id(container),len(self.binding_scopes)+1)
    result[name]=f'binding-{identity}/{key}'
  return result
 def frame_snapshots(self):
  return [{'function':name,'depth':index,'id':self.frame_ids.get(id(scopes[1])),'scopes':[{'level':level,'variables':self.safe(scope)} for level,scope in enumerate(scopes[1:]) if scope]} for index,(name,scopes) in enumerate(self.frame_envs)]
 def tick(self):
  self.ops+=1
  if len(self.output)>100000: raise CError('输出超过100KB限制')
  if self.ops>30000: raise CError('执行操作超过限制，可能存在死循环')
 def read_character(self,ptr,offset,node,label):
  self.tick()
  if not isinstance(ptr,Pointer):raise CError('字符读取需要有效指针')
  container,index=self.dereference(Pointer(ptr.container,ptr.key+offset,ptr.label,ptr.readonly))
  if not isinstance(container,list) or self.types.get(id(container))!=8:raise CError('字符读取需要字符数组')
  value=container[index]
  if value is None:raise CError('字符串读取未初始化字符')
  self.emit(node,'read',value,reads=[{'name':label,'index':index,'array':self.array_id(container),'value':value}])
  return int(value)%256
 def string_value(self,value,node,label='string'):
  if isinstance(value,str):return value
  ptr=self.decay(value,label)
  container,start=self.dereference(ptr)
  if not isinstance(container,list) or self.types.get(id(container))!=8:raise CError('字符串操作需要字符数组或字符指针')
  chars=[]
  for index in range(start,len(container)):
   self.tick();byte=container[index]
   if byte is None:raise CError('字符串读取未初始化字符')
   self.emit(node,'read',byte,reads=[{'name':label,'index':index,'array':self.array_id(container),'value':byte}])
   if byte==0:return ''.join(chars)
   chars.append(chr(int(byte)%256))
  raise CError('字符串缺少零终止符，读取将越界')
 def array_id(self,value):
  if id(value) not in self.array_ids:self.array_ids[id(value)]=('array-'+str(len(self.array_ids)+1),value)
  return self.array_ids[id(value)][0]
 def array_paths(self):
  paths={}
  def metadata(array,offset):
   result={'id':self.array_id(array),'offset':offset}
   if array and all((id(array),i) in self.pointer_slots for i in range(len(array))):result['element_kind']='reference'
   return result
  def walk(name,value,allow_reference=True):
   if isinstance(value,StaticBinding):value=value.container[value.key]
   if isinstance(value,Pointer):
    if not allow_reference:return
    if isinstance(value.container,list):
     paths[name]=metadata(value.container,value.key)
     if any(isinstance(x,(dict,list)) for x in value.container):
      for i,child in enumerate(value.container[value.key:]):walk(name+'['+str(i)+']',child,False)
   elif isinstance(value,list):
    paths[name]=metadata(value,0)
    if any(isinstance(x,(dict,list)) for x in value):
     for index,item in enumerate(value):walk(name+'['+str(index)+']',item,allow_reference)
   elif isinstance(value,dict):
    for key,item in value.items():walk(name+'.'+key,item,allow_reference)
  visible={key:value for scope in self.env for key,value in scope.items()}
  for name,value in visible.items():walk(name,value)
  return paths
 def memory_cells(self,ptr,count,partial=False):
  if not isinstance(count,int) or count<0 or count>1000000:raise CError('内存操作长度无效或超过限制')
  if count==0:return []
  container,key=self.dereference(ptr);cells=[]
  def walk(owner,index,offset):
   value=owner[index]
   if isinstance(value,list):
    for child in range(len(value)):offset=walk(value,child,offset)
    return offset
   if isinstance(value,dict):
    spec=self.structs.get(self.struct_types.get(id(value)))
    if spec is None:raise CError('无法确定结构体内存布局')
    start=offset;alignment=1
    for field in spec.decls:
     _,_,_,align=self.sizeof_description(field.type)
     offset=start+((offset-start+align-1)//align)*align;alignment=max(alignment,align)
     offset=walk(value,field.name,offset)
    return start+((offset-start+alignment-1)//alignment)*alignment
   pointer=(id(owner),index) in self.pointer_slots
   bits=64 if pointer else self.types.get((id(owner),index),self.types.get(id(owner),32))
   width=8 if pointer else max(1,bits//8)
   if offset<count:
    if offset+width>count and not partial:raise CError('暂不支持截断数据单元的部分字节操作')
    cells.append({'owner':owner,'key':index,'offset':offset,'bits':bits,'pointer':pointer,'unsigned':(id(owner),index) in self.unsigned_slots or id(owner) in self.unsigned_arrays})
   return offset+width
  offset=0
  if isinstance(container,list):
   for index in range(key,len(container)):offset=walk(container,index,offset)
  else:offset=walk(container,key,offset)
  if count>offset:raise CError('内存操作超出目标范围')
  return cells
 def memory_bytes(self,ptr,count,node):
  cells=self.memory_cells(ptr,count,partial=True);position=0
  for cell in cells:
   if cell['offset']!=position:raise CError('memcmp 暂不支持比较结构体填充字节')
   value=cell['owner'][cell['key']]
   if value is None:raise CError('memcmp 读取未初始化数据单元')
   if cell['pointer']:raise CError('memcmp 暂不支持比较指针的字节表示')
   width=max(1,int(cell['bits'])//8)
   if isinstance(cell['bits'],FloatWidth):data=struct.pack('<f' if width==4 else '<d',value)
   else:data=(int(value)%(1<<(width*8))).to_bytes(width,'little')
   for offset,byte in enumerate(data):
    if position>=count:return
    self.tick();access=self.access_info(node,value,cell['owner'],cell['key']);access.update(byte_offset=offset,byte=byte)
    self.emit(node,'read',byte,reads=[access],description='memcmp 读取数据单元的第 '+str(offset)+' 个字节：'+str(byte))
    position+=1;yield byte
  if position<count:raise CError('memcmp 暂不支持比较结构体填充字节')
 def access_info(self,node,value,container,key):
  info=self.info(node,value,key)
  if isinstance(container,list):info.update(array=self.array_id(container),index=key)
  if id(container) in self.object_ids:info.update(object=self.object_ids[id(container)],field=str(key))
  if isinstance(value,(dict,list)):
   objects=[]
   def owned(item):
    if not isinstance(item,(dict,list)):return
    if id(item) in self.object_ids:objects.append(self.object_ids[id(item)])
    for child in item.values() if isinstance(item,dict) else item:owned(child)
   owned(value)
   if objects:info['objects']=list(dict.fromkeys(objects))
  return info
 def integer_types(self,objects=None):
  result={}
  def walk(name,value,container=None,key=None,allow_reference=True):
   if isinstance(value,StaticBinding):container,key=value.container,value.key;value=container[key]
   if isinstance(value,Pointer):
    if not allow_reference:return
    if isinstance(value.container,list) and self.types.get(id(value.container)) and not isinstance(self.types[id(value.container)],FloatWidth) and all(not isinstance(x,(dict,list,Pointer)) for x in value.container) and not any((id(value.container),i) in self.pointer_slots for i in range(len(value.container))):
     result[name]={'bits':self.types[id(value.container)],'unsigned':id(value.container) in self.unsigned_arrays}
    elif isinstance(value.container,list):
     for i,child in enumerate(value.container[value.key:]):walk(name+'['+str(i)+']',child,value.container,value.key+i,False)
   elif isinstance(value,list):
    if self.types.get(id(value)) and not isinstance(self.types[id(value)],FloatWidth) and all(x is None or isinstance(x,int) for x in value) and not any((id(value),i) in self.pointer_slots for i in range(len(value))):
     result[name]={'bits':self.types[id(value)],'unsigned':id(value) in self.unsigned_arrays}
    else:
     for i,child in enumerate(value):walk(name+'['+str(i)+']',child,value,i,allow_reference)
   elif isinstance(value,dict):
    for field,child in value.items():walk(name+'.'+field,child,value,field,allow_reference)
   elif isinstance(value,int) and (id(container),key) not in self.pointer_slots:
    result[name]={'bits':self.types.get((id(container),key),getattr(value,'bits',32)),'unsigned':(id(container),key) in self.unsigned_slots or getattr(value,'unsigned',False)}
  if objects is not None:
   for name,value in objects.items():walk(name,value)
  else:
   visible={}
   for scope in self.env:
    for name,value in scope.items():visible[name]=(scope,value)
   for name,(scope,value) in visible.items():walk(name,value,scope,name)
  return result
 def character_paths(self):return self.typed_paths(8)
 def boolean_paths(self):return self.typed_paths(1)
 def typed_paths(self,bits):return [path for path,metadata in self.integer_types().items() if metadata['bits']==bits]
 def is_unsigned(self,typ):
  while isinstance(typ,c_ast.TypeDecl):typ=typ.type
  return isinstance(typ,c_ast.IdentifierType) and 'unsigned' in typ.names
 def type_bits(self,typ):
  while isinstance(typ,c_ast.TypeDecl):typ=typ.type
  names=typ.names if isinstance(typ,c_ast.IdentifierType) else []
  if names in (['float'],['double']):return FloatWidth(32 if names==['float'] else 64)
  return 1 if names==['_Bool'] else 8 if 'char' in names else 16 if 'short' in names else 64 if 'long' in names else 32
 def sizeof_value(self,node):
  if isinstance(node,c_ast.ID):return self.get(node.name)
  if isinstance(node,c_ast.ArrayRef):
   value=self.sizeof_value(node.name)
   if isinstance(value,Pointer):return value.container[value.key] if value.key<len(value.container) else None
   if isinstance(value,list) and value:return value[0]
  return None
 def sizeof_description(self,typ,value=None,active=()):
  if isinstance(typ,c_ast.TypeDecl):return self.sizeof_description(typ.type,value,active)
  if isinstance(typ,c_ast.IdentifierType):
   if typ.names==['void']:raise CError('sizeof(void) 不受支持')
   size=max(1,self.type_bits(typ)//8);return typ,1,size,size
  if isinstance(typ,c_ast.PtrDecl):return typ,1,8,8
  if isinstance(typ,c_ast.Enum):return typ,1,4,4
  if isinstance(typ,c_ast.ArrayDecl):
   extent=len(value) if isinstance(value,list) else self.expr(typ.dim) if typ.dim is not None else None
   if extent is not None and not isinstance(extent,int):raise CError('sizeof数组长度必须是整数')
   if extent is None or extent<=0:raise CError('sizeof 数组长度无效')
   spec,count,unit,alignment=self.sizeof_description(typ.type,value[0] if isinstance(value,list) and value else None,active)
   if extent*count*unit>18446744073709551615:raise CError('sizeof 超过模型范围')
   return spec,extent*count,unit,alignment
  if isinstance(typ,c_ast.Struct):
   spec=self.structs.get(typ.name,typ)
   if typ.decls is not None:spec=typ
   if not spec.decls or spec.name in active:raise CError('sizeof 需要完整且非循环内嵌的结构体')
   offset=0;alignment=1
   for field in spec.decls:
    _,count,unit,align=self.sizeof_description(field.type,None,active+(spec.name,))
    offset=((offset+align-1)//align)*align+count*unit;alignment=max(alignment,align)
   size=((offset+alignment-1)//alignment)*alignment
   return spec,1,size,alignment
  raise CError('此类型不支持 sizeof')
 def integer_type(self,bits=32,unsigned=False):
  names=(['unsigned'] if unsigned else [])+(['long','long'] if bits==64 else ['int'])
  return c_ast.TypeDecl(None,[],None,c_ast.IdentifierType(names))
 def common_integer_type(self,left,right):
  floating=[typ for typ in (left,right) if isinstance(self.type_bits(typ),FloatWidth)]
  if floating:
   for typ in (left,right):
    if not isinstance(typ,c_ast.TypeDecl) or not isinstance(typ.type,(c_ast.IdentifierType,c_ast.Enum)) or getattr(typ.type,'names',None)==['void']:raise CError('算术表达式需要数值类型')
   width=max(self.type_bits(typ) for typ in floating)
   return c_ast.TypeDecl(None,[],None,c_ast.IdentifierType(['double' if width==64 else 'float']))
  for typ in (left,right):
   if not isinstance(typ,c_ast.TypeDecl) or not isinstance(typ.type,(c_ast.IdentifierType,c_ast.Enum)) or (isinstance(typ.type,c_ast.IdentifierType) and typ.type.names==['void']):raise CError('此表达式需要整数类型')
  bits=max(32,self.type_bits(left),self.type_bits(right))
  unsigned=(self.is_unsigned(left) and self.type_bits(left)>=32 and self.type_bits(left)==bits) or (self.is_unsigned(right) and self.type_bits(right)>=32 and self.type_bits(right)==bits)
  return self.integer_type(bits,unsigned)
 def conditional_type(self,node):
  left=self.expression_type(node.iftrue);right=self.expression_type(node.iffalse)
  if isinstance(left,c_ast.FuncDecl):left=c_ast.PtrDecl([],left)
  if isinstance(right,c_ast.FuncDecl):right=c_ast.PtrDecl([],right)
  if isinstance(left,c_ast.ArrayDecl):left=c_ast.PtrDecl([],left.type)
  if isinstance(right,c_ast.ArrayDecl):right=c_ast.PtrDecl([],right.type)
  if isinstance(left,c_ast.PtrDecl) or isinstance(right,c_ast.PtrDecl):
   pointer=left if isinstance(left,c_ast.PtrDecl) else right
   other=right if pointer is left else left;other_node=node.iffalse if pointer is left else node.iftrue
   if not isinstance(other,c_ast.PtrDecl):
    if not isinstance(other_node,c_ast.Constant) or self.constant_integer(other_node)!=0:raise CError('指针条件分支需要相容指针或零常量')
   else:
    if isinstance(pointer.type,c_ast.FuncDecl)!=isinstance(other.type,c_ast.FuncDecl):raise CError('函数指针与数据指针条件分支不相容')
    left_void=isinstance(pointer.type,c_ast.TypeDecl) and isinstance(pointer.type.type,c_ast.IdentifierType) and pointer.type.type.names==['void']
    right_void=isinstance(other.type,c_ast.TypeDecl) and isinstance(other.type.type,c_ast.IdentifierType) and other.type.type.names==['void']
    if not left_void and not right_void and self.type_signature(pointer.type,True)!=self.type_signature(other.type,True):raise CError('三元指针分支类型不匹配')
    if right_void:pointer=other
    pointer=copy.deepcopy(pointer)
    if hasattr(pointer.type,'quals'):pointer.type.quals=list(set(getattr(left.type,'quals',[])+getattr(right.type,'quals',[])))
   return pointer
  if isinstance(left,c_ast.TypeDecl) and isinstance(left.type,c_ast.Struct):
   if self.type_signature(left)!=self.type_signature(right):raise CError('三元结构体分支类型不匹配')
   return left
  if all(isinstance(typ,c_ast.TypeDecl) and isinstance(typ.type,c_ast.IdentifierType) and typ.type.names==['void'] for typ in (left,right)):return left
  return self.common_integer_type(left,right)
 def expression_type(self,node):
  # Type inspection never executes the operand (including side effects).
  if isinstance(node,(c_ast.Typename,c_ast.CompoundLiteral)):return node.type.type if isinstance(node,c_ast.CompoundLiteral) else node.type
  if isinstance(node,c_ast.TernaryOp):return self.conditional_type(node)
  if isinstance(node,c_ast.Assignment):return self.expression_type(node.lvalue)
  if isinstance(node,c_ast.ExprList):return self.expression_type(node.exprs[-1])
  if isinstance(node,c_ast.BinaryOp):
   if node.op in ('<','>','<=','>=','==','!=','&&','||'):return self.integer_type()
   left=self.expression_type(node.left);right=self.expression_type(node.right)
   if node.op in ('<<','>>'):return self.common_integer_type(left,self.integer_type())
   if node.op in ('+','-') and isinstance(left,(c_ast.PtrDecl,c_ast.ArrayDecl)):
    return self.integer_type(64) if isinstance(right,(c_ast.PtrDecl,c_ast.ArrayDecl)) else (c_ast.PtrDecl([],left.type) if isinstance(left,c_ast.ArrayDecl) else left)
   if node.op=='+' and isinstance(right,(c_ast.PtrDecl,c_ast.ArrayDecl)):return c_ast.PtrDecl([],right.type) if isinstance(right,c_ast.ArrayDecl) else right
   return self.common_integer_type(left,right)
  if isinstance(node,c_ast.UnaryOp) and node.op=='sizeof':return self.integer_type(64,True)
  if isinstance(node,c_ast.UnaryOp) and node.op=='&':return c_ast.PtrDecl([],self.expression_type(node.expr))
  if isinstance(node,c_ast.UnaryOp) and node.op in ('+','-','~','!'):return self.integer_type() if node.op=='!' else self.common_integer_type(self.expression_type(node.expr),self.integer_type())
  if isinstance(node,c_ast.Constant) and node.type=='string':return c_ast.ArrayDecl(c_ast.TypeDecl(None,[],None,c_ast.IdentifierType(['char'])),c_ast.Constant('int',str(len(ast.literal_eval(node.value))+1)),[])
  if isinstance(node,c_ast.UnaryOp) and node.op in ('p++','p--','++','--'):return self.expression_type(node.expr)
  if isinstance(node,c_ast.Constant) and node.type in ('float','double'):return c_ast.TypeDecl(None,[],None,c_ast.IdentifierType([node.type]))
  if isinstance(node,c_ast.Constant) and node.type!='string':
   value=self.expr(node);names=(['unsigned'] if getattr(value,'unsigned',False) else [])+(['long','long'] if getattr(value,'bits',32)==64 else ['int'])
   return c_ast.TypeDecl(None,[],None,c_ast.IdentifierType(names))
  if isinstance(node,c_ast.Cast):return node.to_type.type
  if isinstance(node,c_ast.FuncCall) and isinstance(node.name,c_ast.ID) and node.name.name in self.funcs:return self.funcs[node.name.name].decl.type.type
  if isinstance(node,c_ast.FuncCall) and isinstance(node.name,c_ast.ID):
   name=node.name.name
   if name in ('malloc','calloc','realloc','strcpy','strcat','memset','memcpy','memmove','bsearch','strchr','strrchr','strstr','strncpy','memchr','strpbrk','strncat'):return c_ast.PtrDecl([],c_ast.TypeDecl(None,[],None,c_ast.IdentifierType(['char' if name in ('strcpy','strcat','strchr','strrchr','strstr','strncpy','strpbrk','strncat') else 'void'])))
   if name in ('exit','srand','__cvisual_assert'):return c_ast.TypeDecl(None,[],None,c_ast.IdentifierType(['void']))
   if name in ('strtol','strtoll','strtoul','strtoull'):return self.integer_type(64,name in ('strtoul','strtoull'))
   if name in ('atoi','atol','atoll'):return self.integer_type(32 if name=='atoi' else 64)
   if name=='rand':return self.integer_type()
   if name in ('abs','labs','llabs'):return self.integer_type(32 if name=='abs' else 64)
   if name in MATH_FUNCTIONS:return c_ast.TypeDecl(None,[],None,c_ast.IdentifierType(['float' if MATH_FUNCTIONS[name][1]==32 else 'double']))
   if name in CHARACTER_FUNCTIONS:return self.integer_type()
   if name in ('strspn','strcspn'):return self.integer_type(64,True)
   if name in ('strlen','strcmp','strncmp','memcmp','printf','puts','scanf','getchar','putchar'):return self.integer_type(64,True) if name=='strlen' else self.integer_type()
  if isinstance(node,c_ast.FuncCall):
   typ=self.expression_type(node.name)
   if isinstance(typ,c_ast.PtrDecl):typ=typ.type
   if isinstance(typ,c_ast.FuncDecl):return typ.type
  if isinstance(node,c_ast.ID):
   if node.name in self.funcs and not any(node.name in scope for scope in self.env):return self.funcs[node.name].decl.type
   for scope in reversed(self.env):
    if node.name in scope and (id(scope),node.name) in self.enum_slots:return self.integer_type()
    typ=self.declared_types.get((id(scope),node.name))
    if typ is not None:return typ
   raise CError('无法推导变量类型：'+node.name)
  if isinstance(node,c_ast.UnaryOp) and node.op=='*':
   typ=self.expression_type(node.expr)
   if not isinstance(typ,(c_ast.PtrDecl,c_ast.ArrayDecl)):raise CError('sizeof 解引用操作数不是指针')
   return typ.type
  if isinstance(node,c_ast.ArrayRef):
   typ=self.expression_type(node.name)
   if not isinstance(typ,(c_ast.PtrDecl,c_ast.ArrayDecl)):raise CError('sizeof 下标操作数不是数组或指针')
   return typ.type
  if isinstance(node,c_ast.StructRef):
   typ=self.expression_type(node.name)
   if node.type=='->':
    if not isinstance(typ,c_ast.PtrDecl):raise CError('成员访问需要指针类型')
    typ=typ.type
   if not isinstance(typ,c_ast.TypeDecl) or not isinstance(typ.type,c_ast.Struct):raise CError('成员访问需要结构体类型')
   spec=self.structs.get(typ.type.name,typ.type)
   for field in spec.decls or []:
    if field.name==node.field.name:return field.type
   raise CError('未知结构体成员')
  raise CError('sizeof 暂不支持此表达式的类型推导')
 def declare_enum(self,spec):
  if spec.values is None:
   if spec.name not in self.enums:raise CError('枚举类型尚未定义')
   return
  next_value=0
  for item in spec.values.enumerators:
   value=self.constant_integer(item.value) if item.value is not None else self.checked(next_value)
   scope=self.env[-1]
   if item.name in scope:raise CError('重复枚举常量名')
   scope[item.name]=value;self.enum_slots.add((id(scope),item.name));next_value=int(value)+1
  if spec.name:self.enums[spec.name]=spec
 def constant_integer(self,node):
  if isinstance(node,c_ast.ID) and node.name in self.vla_extent_names:return self.captured_extent(node.name)
  if isinstance(node,c_ast.ID):
   for scope in reversed(self.env):
    if node.name in scope:
     if (id(scope),node.name) in self.enum_slots:return scope[node.name]
     break

  if isinstance(node,c_ast.Constant) and node.type!='string':
   value=self.expr(node)
   if not isinstance(value,int):raise CError('整数常量表达式不能直接使用浮点值')
   return value
  if isinstance(node,c_ast.UnaryOp) and node.op=='sizeof':
   typ=node.expr.type if isinstance(node.expr,c_ast.Typename) else self.expression_type(node.expr)
   current=typ
   while isinstance(current,c_ast.ArrayDecl):
    if current.dim is None:raise CError('常量 sizeof 需要完整数组类型')
    if isinstance(current.dim,c_ast.ID) and current.dim.name in self.vla_extent_names:raise CError('变长数组 sizeof 不是整数常量表达式')
    self.constant_integer(current.dim);current=current.type
   return self.expr(node)
  if isinstance(node,c_ast.UnaryOp) and node.op in ('+','-','!','~'):
   value=self.constant_integer(node.expr)
   return self.checked({'+':lambda:+value,'-':lambda:-value,'!':lambda:int(not value),'~':lambda:~value}[node.op](),max(32,getattr(value,'bits',32)),node.op!='!' and getattr(value,'unsigned',False) and getattr(value,'bits',32)>=32)
  if isinstance(node,c_ast.BinaryOp):
   left=self.constant_integer(node.left)
   if node.op=='&&' and not left:return CInt(0)
   if node.op=='||' and left:return CInt(1)
   return self.binary(node.op,left,self.constant_integer(node.right))
  if isinstance(node,c_ast.TernaryOp):
   condition=self.constant_integer(node.cond);value=self.constant_integer(node.iftrue if condition else node.iffalse)
   typ=self.conditional_type(node)
   if isinstance(self.type_bits(typ),FloatWidth):raise CError('整数常量表达式不能产生浮点类型')
   return self.checked(value,self.type_bits(typ),self.is_unsigned(typ))
  if isinstance(node,c_ast.Cast):
   typ=node.to_type.type
   if isinstance(typ,c_ast.TypeDecl) and isinstance(typ.type,(c_ast.IdentifierType,c_ast.Enum)):
    bits=self.type_bits(typ);unsigned=self.is_unsigned(typ)
    if isinstance(bits,FloatWidth):raise CError('整数常量表达式不能产生浮点类型')
    value=self.expr(node.expr) if isinstance(node.expr,c_ast.Constant) and node.expr.type in ('float','double') else self.constant_integer(node.expr)
    if bits==1:return CInt(int(bool(value)),1,True)
    converted=int(value)%(1<<bits)
    if not unsigned and converted>=(1<<(bits-1)):converted-=1<<bits
    return CInt(converted,bits,unsigned)
  raise CError('需要受支持的整数常量表达式')
 def initializer_items(self,initializer,size=None,names=None):
  if initializer is None:return []
  if not isinstance(initializer,c_ast.InitList):raise CError('复合初始化需要花括号')
  slots={};chained_slots=set();index=0;deep_cursor=False
  for item in initializer.exprs:
   chained=False
   if isinstance(item,c_ast.NamedInitializer):
    if not item.name:raise CError('指定初始化路径为空')
    key=item.name[0];chained=len(item.name)>1;deep_cursor=chained
    if names is not None:
     if not isinstance(key,c_ast.ID) or key.name not in names:raise CError('初始化指定了未知成员')
     index=names.index(key.name)
    else:
     if isinstance(key,c_ast.ArrayDesignator):key=key.expr
     index=int(self.constant_integer(key))
    item=c_ast.InitList([c_ast.NamedInitializer(item.name[1:],item.expr,coord=item.coord)]) if chained else item.expr
   elif deep_cursor:raise CError('嵌套指定路径后的值目前需要显式指定路径')
   if index<0 or index>=1000 or (size is not None and index>=size):raise CError('指定初始化超出元素范围')
   if index in slots:
    if chained and index in chained_slots:slots[index].exprs.extend(item.exprs)
    else:raise CError('暂不支持重复指定初始化')
   else:
    slots[index]=item
    if chained:chained_slots.add(index)
   index+=1
  length=max(slots,default=-1)+1
  return [slots.get(i) for i in range(length)]
 def aggregate_shape(self,typ,active=()):
  if isinstance(typ,c_ast.TypeDecl):return self.aggregate_shape(typ.type,active)
  if isinstance(typ,c_ast.ArrayDecl):
   if typ.dim is None:raise CError('内层数组必须有长度')
   count=int(self.constant_integer(typ.dim))
   if count<=0 or count>1000:raise CError('初始化数组长度超过限制')
   return ('array',count,self.aggregate_shape(typ.type,active),self.type_bits(typ.type)==8)
  if isinstance(typ,c_ast.Struct):
   spec=typ if typ.decls is not None else self.structs.get(typ.name,typ)
   if not spec.decls or spec.name in active:raise CError('初始化需要完整结构体')
   return ('struct',[self.aggregate_shape(field.type,active+(spec.name,)) for field in spec.decls],spec.name,[field.name for field in spec.decls])
  return None
 def consume_initializer(self,shape,items,position):
  if position>=len(items):return None,position
  item=items[position]
  if isinstance(item,c_ast.InitList):
   if shape is None:
    if len(item.exprs)!=1:raise CError('标量花括号初始化必须只有一个值')
    value,_=self.consume_initializer(None,item.exprs,0);return value,position+1
   return self.normalize_initializer(shape,item),position+1
  if shape is None:return item,position+1
  if shape[0]=='array' and shape[3] and isinstance(item,c_ast.Constant) and item.type=='string':return item,position+1
  if shape[0]=='struct':
   try:typ=self.expression_type(item)
   except CError:typ=None
   if isinstance(typ,c_ast.TypeDecl) and isinstance(typ.type,c_ast.Struct) and typ.type.name==shape[2]:return item,position+1
  children=([shape[2]]*shape[1]) if shape[0]=='array' else shape[1]
  values=[]
  for child in children:
   if position>=len(items):break
   value,position=self.consume_initializer(child,items,position);values.append(value)
  return c_ast.InitList(values),position
 def normalize_designated(self,shape,initializer):
  assigned={};children={}
  def count(part):return part[1] if part[0]=='array' else len(part[1])
  def child(part,index):return part[2] if part[0]=='array' else part[1][index]
  def at(path):
   part=shape
   for index in path:part=child(part,index)
   return part
  def following(path):
   while path:
    parent=path[:-1];index=path[-1]+1
    if index<count(at(parent)):return parent+(index,)
    path=parent
   return None
  def resolve(selectors):
   path=();part=shape
   for selector in selectors:
    if part is None:raise CError('指定初始化路径进入了标量')
    if part[0]=='struct':
     if not isinstance(selector,c_ast.ID) or selector.name not in part[3]:raise CError('初始化指定了未知成员')
     index=part[3].index(selector.name)
    else:
     if isinstance(selector,c_ast.ArrayDesignator):selector=selector.expr
     index=int(self.constant_integer(selector))
    if index<0 or index>=count(part):raise CError('指定初始化超出元素范围')
    path+=(index,);part=child(part,index)
   return path
  def remember(path):
   for length in range(len(path)):children.setdefault(path[:length],set()).add(path[length])
  def open_aggregate(path,value):
   part=at(path)
   if part is not None and part[0]=='array' and part[3] and isinstance(value,c_ast.Constant) and value.type=='string':
    text=ast.literal_eval(value.value)
    if len(text)>count(part) or any(ord(char)>127 for char in text):raise CError('字符数组字符串初始化无效')
    codes=[ord(char) for char in text]+([0] if len(text)<count(part) else [])
    value=c_ast.InitList([c_ast.Constant('int',str(code)) for code in codes])
   if isinstance(value,c_ast.InitList):
    for index,item in enumerate(value.exprs):
     child_path=path+(index,);assigned[child_path]=item;remember(child_path)
   # An overwritten aggregate value expression need not be evaluated.
  cursor=(0,)
  for original in initializer.exprs:
   if isinstance(original,c_ast.NamedInitializer):path=resolve(original.name);item=original.expr
   else:path=cursor;item=original
   if path is None:raise CError('初始化元素过多')
   part=at(path)
   while part is not None and not isinstance(item,c_ast.InitList):
    if part[0]=='array' and part[3] and isinstance(item,c_ast.Constant) and item.type=='string':break
    if part[0]=='struct':
     try:typ=self.expression_type(item)
     except CError:typ=None
     if isinstance(typ,c_ast.TypeDecl) and isinstance(typ.type,c_ast.Struct) and typ.type.name==part[2]:break
    path+=(0,);part=child(part,0)
   for length in range(1,len(path)):
    prefix=path[:length]
    if prefix in assigned:open_aggregate(prefix,assigned.pop(prefix))
   for existing in list(assigned):
    if existing[:len(path)]==path:assigned.pop(existing)
   remember(path)
   assigned[path]=self.normalize_initializer(part,item) if part is not None and isinstance(item,c_ast.InitList) else item
   cursor=following(path)
  def build(part,path=()):
   self.tick()
   if path in assigned:return assigned[path]
   if part is None:return c_ast.Constant('int','0')
   indices=children.get(path,set())
   if not indices:return c_ast.InitList([])
   return c_ast.InitList([build(child(part,index),path+(index,)) for index in range(max(indices)+1)])
  return build(shape)
 def normalize_initializer(self,shape,initializer):
  if shape is None or not isinstance(initializer,c_ast.InitList):return initializer
  if shape[0]=='array' and shape[2] is None and shape[3] and len(initializer.exprs)==1 and isinstance(initializer.exprs[0],c_ast.Constant) and initializer.exprs[0].type=='string':return initializer.exprs[0]
  if any(isinstance(item,c_ast.NamedInitializer) for item in initializer.exprs):return self.normalize_designated(shape,initializer)
  # Consume the explicit outer braces once; inner aggregate braces may be omitted.
  children=([shape[2]]*shape[1]) if shape[0]=='array' else shape[1]
  values=[];position=0
  for child in children:
   if position>=len(initializer.exprs):break
   value,position=self.consume_initializer(child,initializer.exprs,position);values.append(value)
  if position!=len(initializer.exprs):raise CError('初始化元素过多')
  return c_ast.InitList(values)
 def make_array(self,typ,initializer=None,zero=False,destination=None,publish=None):
  dims=[];base=typ
  while isinstance(base,c_ast.ArrayDecl):
   extent=self.expr(base.dim) if base.dim is not None else None
   if extent is not None and not isinstance(extent,int):raise CError('数组长度必须是整数')
   dims.append(int(extent) if extent is not None else None);base=base.type
  bits=self.type_bits(base)
  if bits==8 and len(dims)==1 and isinstance(initializer,c_ast.InitList) and len(initializer.exprs)==1 and isinstance(initializer.exprs[0],c_ast.Constant) and initializer.exprs[0].type=='string':initializer=initializer.exprs[0]
  if bits==8 and isinstance(initializer,c_ast.Constant) and initializer.type=='string':
   if len(dims)!=1:raise CError('多维字符数组需要按行初始化字符串')
   text=ast.literal_eval(initializer.value)
   if any(ord(c)>127 for c in text):raise CError('字符数组字符串目前仅支持 ASCII')
   codes=[ord(c) for c in text]
   if dims[0] is None or dims[0]>len(codes):codes.append(0)
   initializer=c_ast.InitList([c_ast.Constant('int',str(c)) for c in codes])
  total=1
  for depth,size in enumerate(dims):
   if size is None:
    if depth or not initializer:raise CError('仅最外层数组可省略长度')
    if any(isinstance(item,c_ast.NamedInitializer) for item in initializer.exprs):
     child=self.aggregate_shape(base)
     for inner in reversed(dims[1:]):
      if inner is None:raise CError('内层数组必须有长度')
      child=('array',inner,child,bits==8)
     initializer=self.normalize_designated(('array',1000,child,bits==8),initializer);size=len(initializer.exprs)
    else:
     child=self.aggregate_shape(base)
     for inner in reversed(dims[1:]):
      if inner is None:raise CError('内层数组必须有长度')
      child=('array',inner,child,bits==8)
     size=0;position=0
     while position<len(initializer.exprs):
      _,position=self.consume_initializer(child,initializer.exprs,position);size+=1
    dims[depth]=size
   total*=size
   if size<=0 or total>1000:raise CError('数组元素总数无效或超过1000')
  if isinstance(initializer,c_ast.InitList):
   shape=self.aggregate_shape(base)
   for size in reversed(dims):shape=('array',size,shape,bits==8)
   initializer=self.normalize_initializer(shape,initializer)
  def allocate(depth):
   values=[]
   for index in range(dims[depth]):
    self.tick()
    if depth+1<len(dims):value=allocate(depth+1)
    elif isinstance(base,c_ast.PtrDecl):
     value=0 if zero else None;self.pointer_slots.add((id(values),index))
    elif isinstance(base,c_ast.TypeDecl) and isinstance(base.type,c_ast.Struct):value=self.make_struct(base.type,zero)
    else:value=self.checked(0,bits,self.is_unsigned(base)) if zero else None
    values.append(value)
   self.types[id(values)]=bits
   if self.is_unsigned(base):self.unsigned_arrays.add(id(values))
   return values
  root=allocate(0) if destination is None else destination
  if publish is not None:publish(root)
  def build(depth,init,values,zero=zero):
   if depth==len(dims)-1 and bits==8 and isinstance(init,c_ast.Constant) and init.type=='string':
    text=ast.literal_eval(init.value)
    if any(ord(c)>127 for c in text):raise CError('字符数组字符串目前仅支持 ASCII')
    codes=[ord(c) for c in text]+([0] if dims[depth]>len(text) else [])
    init=c_ast.InitList([c_ast.Constant('int',str(code)) for code in codes])
   if init is not None and not isinstance(init,c_ast.InitList):raise CError('多维数组初始化请使用嵌套花括号')
   items=self.initializer_items(init,dims[depth])
   if len(items)>dims[depth]:raise CError('数组初始化元素过多')
   for i in range(dims[depth]):
    self.tick()
    item=items[i] if i<len(items) else None
    if depth+1<len(dims):value=build(depth+1,item,values[i],zero or init is not None)
    elif isinstance(base,c_ast.PtrDecl):
     value=self.decay(self.expr(item)) if item is not None else (0 if zero or init is not None else None)
     if value is not None and not isinstance(value,Pointer) and value!=0:raise CError('指针数组元素必须为引用或0')
     self.pointer_slots.add((id(values),i))
    elif isinstance(base,c_ast.TypeDecl) and isinstance(base.type,c_ast.Struct):
     value=self.make_struct(base.type,zero or init is not None,item,destination=values[i])
    else:value=self.checked(self.expr(item),bits,self.is_unsigned(base)) if item is not None else (0 if zero or init is not None else None)
    if isinstance(base,c_ast.TypeDecl) and isinstance(base.type,(c_ast.IdentifierType,c_ast.Enum)) and value is not None and not isinstance(value,(list,dict)):value=self.checked(value,bits,self.is_unsigned(base))
    values[i]=value
    if depth==len(dims)-1 and isinstance(base,c_ast.PtrDecl):self.bind_const(values,i,base)
   self.types[id(values)]=bits
   if self.is_unsigned(base):self.unsigned_arrays.add(id(values))
   return values
  return build(0,initializer,root)
 def copy_aggregate(self,destination,source,initializing=False):
  if type(destination) is not type(source):raise CError('复合赋值类型不匹配')
  if isinstance(destination,dict):
   if self.struct_types.get(id(destination))!=self.struct_types.get(id(source)) or destination.keys()!=source.keys():raise CError('结构体赋值类型不匹配')
   keys=list(destination)
  elif isinstance(destination,list):
   if len(destination)!=len(source):raise CError('内嵌数组大小不匹配')
   keys=range(len(destination))
  else:raise CError('需要复合类型')
  for key in keys:
   self.tick()
   if not initializing and (id(destination) in self.readonly or (id(destination),key) in self.const_slots):raise CError('不能赋值含 const 成员的结构体')
   value=source[key]
   if isinstance(destination[key],(dict,list)):self.copy_aggregate(destination[key],value,initializing)
   else:
    if (id(destination),key) in self.function_slots:self.validate_function_pointer(value,self.function_slots[(id(destination),key)])
    destination[key]=value
  return destination
 def make_struct(self,spec,zero=False,initializer=None,destination=None,publish=None):
  if spec.decls:self.structs[spec.name]=spec
  spec=self.structs.get(spec.name,spec)
  if not spec.decls:raise CError('结构体定义缺失')
  if publish is not None and initializer is not None and destination is None:
   destination=self.make_struct(spec,zero);publish(destination)
  source=None
  if initializer is not None and not isinstance(initializer,c_ast.InitList):
   source=self.expr(initializer);initializer=None
   if not isinstance(source,dict):raise CError('结构体初始化需要相同类型的值')
  initializer=self.normalize_initializer(self.aggregate_shape(spec),initializer)
  items=self.initializer_items(initializer,len(spec.decls),[field.name for field in spec.decls])
  if len(items)>len(spec.decls):raise CError('结构体初始化成员过多')
  zero=zero or initializer is not None
  obj=destination if destination is not None else {}
  for index,field in enumerate(spec.decls):
   self.tick()
   item=items[index] if index<len(items) else None
   if isinstance(field.type,c_ast.PtrDecl):
    value=self.decay(self.expr(item)) if item is not None else (0 if zero else None)
    if value is not None and not isinstance(value,Pointer) and value!=0:raise CError('指针成员初始化必须为引用或0')
    obj[field.name]=value;self.pointer_slots.add((id(obj),field.name))
   elif isinstance(field.type,c_ast.TypeDecl) and isinstance(field.type.type,(c_ast.IdentifierType,c_ast.Enum)):
    obj[field.name]=self.checked(self.expr(item) if item is not None else 0,self.type_bits(field.type),self.is_unsigned(field.type)) if item is not None or zero else None;self.types[(id(obj),field.name)]=self.type_bits(field.type)
   elif isinstance(field.type,c_ast.ArrayDecl):obj[field.name]=self.make_array(field.type,item,zero=zero,destination=obj.get(field.name))
   elif isinstance(field.type,c_ast.TypeDecl) and isinstance(field.type.type,c_ast.Struct):obj[field.name]=self.make_struct(field.type.type,zero,item,destination=obj.get(field.name))
   else:raise CError('不支持的结构体成员类型')
  self.struct_types[id(obj)]=spec.name or self.describe(spec)
  self.object_id(obj)
  if source is not None:self.copy_aggregate(obj,source,True)
  for field in spec.decls:self.bind_const(obj,field.name,field.type)
  return obj
 def expire_scope(self,scope):
  def expire(value):
   if not isinstance(value,(dict,list)) or id(value) in self.expired:return
   self.expired[id(value)]=value
   for child in value.values() if isinstance(value,dict) else value:expire(child)
  expire(scope)
  for holder in self.literal_storage.pop(id(scope),{}).values():expire(holder)
 def release_owned(self,value):
  # Owned inline members expire; pointed-to allocations remain independent.
  if not isinstance(value,(dict,list)) or id(value) in self.freed:return
  self.freed.add(id(value))
  for child in value.values() if isinstance(value,dict) else value:self.release_owned(child)
 def dereference(self,ptr,allow_end=False):
  if isinstance(ptr,FunctionPointer):raise CError('函数指针不能作为数据存储访问')
  if not isinstance(ptr,Pointer):raise CError('不能解引用空指针或非指针')
  if id(ptr.container) in self.freed:raise CError('释放后访问：动态内存已经释放')
  if id(ptr.container) in self.expired:raise CError('悬空指针：目标作用域已结束')
  if isinstance(ptr.container,list) and not 0<=ptr.key<len(ptr.container)+(1 if allow_end else 0):raise CError('尾后指针不能解引用或指针越界')
  return ptr.container,ptr.key
 def object_id(self,v):
  key=id(v)
  if key not in self.object_ids:
   name='object-'+str(len(self.objects)+1);self.object_ids[key]=name;self.objects[name]=v
  return self.object_ids[key]
 def graph(self):
  result=[]
  for name,obj in list(self.objects.items()):
   fields={}
   for key,value in (obj.items() if isinstance(obj,dict) else enumerate(obj)):fields[str(key)]=self.safe(value)
   nulls=[]
   def null_fields(value,path=''):
    for key,child in (value.items() if isinstance(value,dict) else enumerate(value)):
     label=(path+('['+str(key)+']' if isinstance(value,list) else '.'+str(key))) if path else str(key)
     if (id(value),key) in self.pointer_slots and child==0:nulls.append(label)
     elif isinstance(child,(dict,list)):null_fields(child,label)
   null_fields(obj)
   result.append({'id':name,'fields':fields,'array':isinstance(obj,list),'integers':self.integer_types({name:obj}),'nullFields':nulls,'expired':id(obj) in self.expired,'freed':id(obj) in self.freed})
  return result
 def safe(self,v):
  if isinstance(v,StaticBinding):return self.safe(v.container[v.key])
  if isinstance(v,bool):return v
  if isinstance(v,FunctionPointer):return {'kind':'reference','target':None,'label':v.label,'function':v.name,'offset':None,'dangling':False}
  if isinstance(v,Pointer):
   target=v.container[v.key] if not isinstance(v.container,list) or v.key<len(v.container) else None
   owner=self.object_ids.get(id(v.container))
   member=v.key if isinstance(v.container,dict) and owner is not None and not isinstance(target,dict) else None
   elements={}
   if isinstance(v.container,list) and not self.reference_expansion:
    self.reference_expansion=True
    try:elements={'elements':self.safe(v.container[v.key:])}
    finally:self.reference_expansion=False
   return {'kind':'reference','target':self.object_id(target) if isinstance(target,dict) else owner,'member':member,'label':v.label,'offset':v.key if isinstance(v.container,list) else None,'dangling':id(v.container) in self.expired or id(v.container) in self.freed,**elements}

  if isinstance(v,int):return str(v) if abs(v)>9007199254740991 else int(v)
  if isinstance(v,list):return [self.safe(x) for x in v]
  if isinstance(v,dict):return {k:self.safe(x) for k,x in v.items()}
  return v
 def emit(self,n,event='step',result=None,reads=None,writes=None,description=None,decision=None):
  if len(self.steps)>=3000:raise CError('执行步骤超过 3000 步限制')
  expression=self.describe(n) if n else ''
  labels={'read':'读取','write':'写入','compute':'计算','condition':'判断条件','call':'调用函数','return':'函数返回','input':'读取输入','output':'输出','declare':'声明'}
  step=self.safe(dict(line=n.coord.line if n and n.coord else 1,event=event,variables=copy.deepcopy({k:v for e in self.env for k,v in e.items()}),bindings=self.visible_bindings(),integers=self.integer_types(),characters=self.character_paths(),booleans=self.boolean_paths(),arrays=self.array_paths(),objects=self.graph(),stack=self.stack[:],frames=self.frame_snapshots(),output=self.output,expression=expression,result=result,reads=reads or [],writes=writes or [],input={'position':self.input_pos,'total':len(self.input_text),'remaining':self.input_text[self.input_pos:]},description=description or labels.get(event,'执行')+'：'+expression+((' → '+str(result)) if result is not None else '')))
  if decision is not None:step['decision']=self.safe(decision)
  self.trace_bytes+=len(json.dumps(step,ensure_ascii=False).encode('utf8'))
  if self.trace_bytes>16000000:raise CError('执行轨迹超过16MB限制，请缩小输入或程序')
  self.steps.append(step)
 def info(self,n,value,index=None):
  if isinstance(n,c_ast.ArrayRef):return {'name':self.describe(n.name),'index':self.last_index if index is None else index,'value':value,**self.index_context.get(id(n),{})}
  return {'name':self.describe(n),'value':value}
 def checked(self,v,bits=32,unsigned=False):
  if v is None:raise CError('读取未初始化变量')
  if isinstance(bits,FloatWidth):
   if not isinstance(v,(int,float)):raise CError('浮点目标需要数值')
   try:
    value=float(v)
    if bits==32:value=struct.unpack('f',struct.pack('f',value))[0]
   except (OverflowError,ValueError):raise CError('浮点值超出有限范围')
   if not math.isfinite(value):raise CError('当前浮点模型只支持有限值')
   return CFloat(value,int(bits))
  if bits==1 and isinstance(v,(int,float,Pointer)):return CInt(int(bool(v)),1)
  if isinstance(v,float):
   if not math.isfinite(v):raise CError('浮点转整数需要有限值')
   v=int(v)
  if bits==1 and isinstance(v,(int,Pointer)):return CInt(int(bool(v)),1)
  if not isinstance(v,int):raise CError('整数目标需要整数值')
  converted=int(v)%(1<<bits) if unsigned else int(v)
  if not unsigned and not -(1<<(bits-1))<=converted<(1<<(bits-1)):raise CError(str(bits)+' 位有符号整数溢出')
  if isinstance(v,SizeToken) and converted==int(v):
   result=SizeToken(v.spec,v.count,v.unit_bytes);result.bits=bits;result.unsigned=unsigned;return result
  return CInt(converted,bits,unsigned)
 def decay(self,value,label='array'):
  if isinstance(value,str):
   if any(ord(c)>127 for c in value):raise CError('字符串字面量目前仅支持 ASCII')
   if value not in self.literal_pool:
    data=[ord(c) for c in value]+[0];self.literal_pool[value]=data;self.types[id(data)]=8;self.readonly.add(id(data))
   return Pointer(self.literal_pool[value],0,'字符串字面量')
  return Pointer(value,0,label) if isinstance(value,list) else value
 def store(self,a,k,v):
  if (id(a),k) in self.const_slots:raise CError('不能修改 const 对象')
  if (id(a),k) in self.enum_slots:raise CError('枚举常量不能修改')
  if id(a) in self.readonly:raise CError('不能修改只读对象或字符串字面量')
  if isinstance(a[k],dict):return self.copy_aggregate(a[k],v)
  if (id(a),k) in self.pointer_slots:
   v=self.decay(v)
   if (id(a),k) in self.function_slots:self.validate_function_pointer(v,self.function_slots[(id(a),k)])
   if not isinstance(v,Pointer) and v!=0:raise CError('指针只能接收引用或空指针')
   a[k]=v;return v
  bits=self.types.get((id(a),k),self.types.get(id(a),32));a[k]=self.checked(v,bits,(id(a),k) in self.unsigned_slots or id(a) in self.unsigned_arrays);return a[k]
 def reads_since(self,position):
  return [r for step in self.steps[position:] if step["event"]=="read" for r in step["reads"]]
 def get(self,k):
  for e in reversed(self.env):
   if k in e:
    value=e[k];return value.container[value.key] if isinstance(value,StaticBinding) else value
  raise CError('未定义变量：'+k)
 def invoke_callback(self,function,values,node):
  operands=[]
  for value,label in values:
   operand=c_ast.Constant('__runtime',label,coord=node.coord);self.runtime_values[id(operand)]=value;operands.append(operand)
  try:return self.expr(c_ast.FuncCall(c_ast.ID(function.name),c_ast.ExprList(operands),coord=node.coord))
  finally:
   for operand in operands:self.runtime_values.pop(id(operand),None)
 def sort_array(self,args,node):
  if len(args)!=4:raise CError('qsort 需要数组、数量、元素大小和比较器')
  pointer,count,size,compare=args
  if not isinstance(count,int) or count<0 or count>1000:raise CError('qsort 元素数量无效')
  if not isinstance(compare,FunctionPointer):raise CError('qsort 需要有效函数比较器')
  signature=self.function_signature(self.funcs[compare.name].decl.type)
  void_pointer=('pointer',('qualified',('const',),('void',)))
  if signature!=(('int',),[void_pointer,void_pointer]):raise CError('qsort 比较器需要 int(const void *,const void *) 签名')
  if count==0:return
  pointer=self.decay(pointer)
  if not isinstance(pointer,Pointer) or isinstance(pointer,FunctionPointer) or pointer.readonly:raise CError('qsort 需要可写数组引用')
  array,start=self.dereference(pointer)
  if not isinstance(array,list) or start+count>len(array):raise CError('qsort 数组范围越界')
  typ=self.expression_type(node.args.exprs[0])
  if not isinstance(typ,(c_ast.PtrDecl,c_ast.ArrayDecl)):raise CError('qsort 需要带类型的数组')
  _,units,unit,_=self.sizeof_description(typ.type,array[start])
  if not isinstance(size,int) or size!=units*unit:raise CError('qsort 元素大小与数组类型不匹配')
  def writable(owner,key):
   if id(owner) in self.readonly or (id(owner),key) in self.const_slots:raise CError('qsort 不能修改只读元素')
   value=owner[key]
   if value is None:raise CError('qsort 数组含未初始化元素')
   if isinstance(value,(dict,list)):
    for child in value if isinstance(value,dict) else range(len(value)):writable(value,child)
  for index in range(start,start+count):writable(array,index)
  def swap(left,lk,right,rk):
   a,b=left[lk],right[rk]
   if isinstance(a,(dict,list)):
    for key in a if isinstance(a,dict) else range(len(a)):swap(a,key,b,key)
   else:self.store(left,lk,b);self.store(right,rk,a)
  label=self.describe(node.args.exprs[0])
  for end in range(1,count):
   index=end
   while index>0:
    left,right=start+index-1,start+index
    value=self.invoke_callback(compare,[(Pointer(array,left,label),f'&{label}[{index-1}]'),(Pointer(array,right,label),f'&{label}[{index}]')],node)
    if not isinstance(value,int):raise CError('qsort 比较器必须返回整数')
    if value<=0:break
    reads=[self.access_info(node,array[i],array,i) for i in (left,right)]
    self.emit(node,'read',reads=reads,description='qsort 读取待交换元素')
    swap(array,left,array,right)
    self.emit(node,'write',writes=[self.access_info(node,array[i],array,i) for i in (left,right)],description='qsort 交换相邻元素')
    index-=1
 def search_array(self,args,node):
  if len(args)!=5:raise CError('bsearch 需要键、数组、数量、元素大小和比较器')
  key,pointer,count,size,compare=args
  if not isinstance(count,int) or count<0 or count>1000:raise CError('bsearch 元素数量无效')
  if not isinstance(compare,FunctionPointer):raise CError('bsearch 需要有效函数比较器')
  void_pointer=('pointer',('qualified',('const',),('void',)))
  if self.function_signature(self.funcs[compare.name].decl.type)!=(('int',),[void_pointer,void_pointer]):raise CError('bsearch 比较器需要 int(const void *,const void *) 签名')
  if count==0:return CInt(0)
  key=self.decay(key);pointer=self.decay(pointer)
  if not isinstance(key,Pointer) or isinstance(key,FunctionPointer):raise CError('bsearch 需要有效键引用')
  self.dereference(key)
  if not isinstance(pointer,Pointer) or isinstance(pointer,FunctionPointer):raise CError('bsearch 需要数组引用')
  array,start=self.dereference(pointer)
  if not isinstance(array,list) or start+count>len(array):raise CError('bsearch 数组范围越界')
  typ=self.expression_type(node.args.exprs[1])
  if not isinstance(typ,(c_ast.PtrDecl,c_ast.ArrayDecl)):raise CError('bsearch 需要带类型的数组')
  _,units,unit,_=self.sizeof_description(typ.type,array[start])
  if not isinstance(size,int) or size!=units*unit:raise CError('bsearch 元素大小与数组类型不匹配')
  label=self.describe(node.args.exprs[1]);key_label=self.describe(node.args.exprs[0]);low,high=0,count
  while low<high:
   middle=(low+high)//2;index=start+middle
   self.emit(node,'read',reads=[self.access_info(node,array[index],array,index)],description=f'bsearch 读取候选 [{middle}]，范围 [{low}, {high})')
   value=self.invoke_callback(compare,[(Pointer(key.container,key.key,key.label,True),key_label),(Pointer(array,index,label,True),f'&{label}[{middle}]')],node)
   if not isinstance(value,int):raise CError('bsearch 比较器必须返回整数')
   self.emit(node,'compute',value,description=f'bsearch 比较候选 [{middle}] → {value}')
   if value==0:return Pointer(array,index,label,pointer.readonly)
   if value<0:high=middle
   else:low=middle+1
  return CInt(0)
 def compound_literal(self,node):
  typ=node.type.type;storage=self.literal_storage.setdefault(id(self.env[-1]),{})
  if isinstance(typ,c_ast.ArrayDecl):value=self.make_array(typ,node.init)
  elif isinstance(typ,c_ast.TypeDecl) and isinstance(typ.type,c_ast.Struct):value=self.make_struct(typ.type,initializer=node.init)
  elif isinstance(typ,c_ast.PtrDecl) or (isinstance(typ,c_ast.TypeDecl) and isinstance(typ.type,(c_ast.IdentifierType,c_ast.Enum))):
   init=node.init
   while isinstance(init,c_ast.InitList):
    if len(init.exprs)!=1:raise CError('标量复合字面量需要一个初始化值')
    init=init.exprs[0]
   value=self.expr(init)
   if isinstance(typ,c_ast.PtrDecl):
    value=self.decay(value)
    if not isinstance(value,Pointer) and value!=0:raise CError('指针复合字面量需要引用或空指针')
   else:value=self.checked(value,self.type_bits(typ),self.is_unsigned(typ))
  else:raise CError('暂不支持此复合字面量类型')
  holder=storage.get(id(node))
  if holder is None:
   holder=[value];storage[id(node)]=holder
   self.types[id(holder)]=self.type_bits(typ);self.bind_const(holder,0,typ)
  elif isinstance(value,(dict,list)):self.copy_aggregate(holder[0],value,True)
  else:holder[0]=value
  if isinstance(typ,c_ast.PtrDecl):self.pointer_slots.add((id(holder),0))
  self.bind_const(holder,0,typ)
  return holder
 def target(self,n,write=False):
  if write and self.const_lvalue(n):raise CError('不能通过 const 视图修改数据')
  if isinstance(n,c_ast.CompoundLiteral):return self.compound_literal(n),0
  if isinstance(n,c_ast.ID):
   for e in reversed(self.env):
    if n.name in e:
     value=e[n.name];return (value.container,value.key) if isinstance(value,StaticBinding) else (e,n.name)
   raise CError('未定义变量：'+n.name)
  if isinstance(n,c_ast.ArrayRef):
   a=self.get(n.name.name) if isinstance(n.name,c_ast.ID) else self.expr(n.name)
   position=len(self.steps);subscript=self.expr(n.subscript)
   if not isinstance(subscript,int):raise CError('数组下标必须是整数')
   i=int(subscript)
   sources=[{key:read[key] for key in ('name','array','index','value') if key in read} for read in self.reads_since(position)]
   self.index_context[id(n)]={'index_expression':self.describe(n.subscript),'logical_index':i,'index_reads':sources}
   if isinstance(a,str):a=self.decay(a)
   if isinstance(a,Pointer):
    if write and a.readonly:raise CError('不能通过 const 指针修改数据')
    container,key=self.dereference(a,True)
    if not isinstance(container,list) or not isinstance(key,int):raise CError('指针下标仅支持数组引用')
    a=container;i+=key
   if id(a) in self.freed:raise CError('释放后访问')
   if id(a) in self.expired:raise CError('悬空指针：数组作用域已结束')
   if not isinstance(a,list) or i<0 or i>=len(a):raise CError('数组越界')
   self.last_index=i
   return a,i
  if isinstance(n,c_ast.StructRef):
   obj=self.expr(n.name)
   if n.type=='->':
    if not isinstance(obj,Pointer):raise CError('空指针或非指针成员访问')
    if write and obj.readonly:raise CError('不能通过 const 指针修改数据')
    container,key=self.dereference(obj);obj=container[key]
    if id(obj) in self.expired:raise CError('悬空指针：结构体作用域已结束')
   if not isinstance(obj,dict) or n.field.name not in obj:raise CError('结构体成员不存在')
   return obj,n.field.name
  if isinstance(n,c_ast.UnaryOp) and n.op=='*':
   ptr=self.expr(n.expr)
   if write and isinstance(ptr,Pointer) and ptr.readonly:raise CError('不能通过 const 指针修改数据')
   return self.dereference(ptr)
  raise CError('暂不支持此赋值目标或指针')
 @preserve_failure
 def expr(self,n):
  self.tick()
  if n is None:return 0
  t=type(n).__name__
  if t=='InitList':
   if len(n.exprs)!=1:raise CError('标量花括号初始化必须只有一个值')
   return self.expr(n.exprs[0])
  if t=='Constant' and n.type=='__runtime':return self.runtime_values[id(n)]
  if t=='Constant':
   if n.type=='string':return ast.literal_eval(n.value)
   if n.type in ('float','double'):
    literal=re.sub(r'[fF]$','',n.value);value=float.fromhex(literal) if literal.lower().startswith('0x') else float(literal)
    return self.checked(value,FloatWidth(32 if n.type=='float' else 64))
   if n.type=='char':
    value=ast.literal_eval(n.value)
    if len(value)!=1 or ord(value)>127:raise CError('字符常量目前仅支持单个 ASCII 字符')
    return CInt(ord(value))
   if n.type not in ('int','long int','long long int','unsigned int','unsigned long int','unsigned long long int'):raise CError('不支持此数值常量类型')
   literal=re.sub(r'[uUlL]+$','',n.value);value=int(literal,8 if len(literal)>1 and literal[0]=='0' and not literal.lower().startswith('0x') else 0)
   unsigned='u' in n.value.lower() or (literal.startswith('0') and value>2147483647 and value<=4294967295)
   bits=64 if 'l' in n.value.lower() or value>4294967295 or (value>2147483647 and not unsigned) else 32
   return self.checked(value,bits,unsigned)
  if t=='ID':
   if n.name in self.vla_extent_names:return self.captured_extent(n.name)
   if n.name in self.funcs and not any(n.name in scope for scope in self.env):return FunctionPointer(n.name)
   v=self.get(n.name)
   if v is None:raise CError('读取未初始化变量：'+n.name)
   self.emit(n,'read',v,reads=[self.info(n,v)]);return v
  if t=='StructRef' or (t=='UnaryOp' and n.op=='*'):
   if t=='UnaryOp':
    typ=self.expression_type(n.expr)
    if isinstance(typ,c_ast.FuncDecl) or (isinstance(typ,c_ast.PtrDecl) and isinstance(typ.type,c_ast.FuncDecl)):
     function=self.expr(n.expr)
     if isinstance(function,FunctionPointer):return function
   a,k=self.target(n);v=a[k]
   if isinstance(v,list) and self.const_lvalue(n):v=Pointer(v,0,self.describe(n),True)
   if v is None:raise CError('读取未初始化成员')
   self.emit(n,'read',v,reads=[self.access_info(n,v,a,k)]);return v
  if t=='ArrayRef':
   a,i=self.target(n);v=a[i]
   if v is None:raise CError('读取未初始化数组元素')
   self.emit(n,'read',v,reads=[self.access_info(n,v,a,i)]);return v
  if t=='Assignment':
   a,k=self.target(n.lvalue,True);index=k;position=len(self.steps);v=self.expr(n.rvalue)
   if n.op!='=':v=self.binary(n.op[:-1],a[k],v)
   v=self.store(a,k,v);self.emit(n,'write',v,reads=self.reads_since(position),writes=[self.access_info(n.lvalue,v,a,k)]);return v
  if t=='BinaryOp':
   position=len(self.steps);a=self.expr(n.left)
   if n.op in ('&&','||'):
    evaluate=bool(a) if n.op=='&&' else not bool(a)
    value=CInt(int(bool(self.expr(n.right))) if evaluate else int(n.op=='||'))
    right=self.describe(n.right)
    self.emit(n,'condition',value,reads=self.reads_since(position),description='逻辑'+('与' if n.op=='&&' else '或')+' → '+str(value)+('，执行右侧' if evaluate else '，短路跳过右侧'),decision={'operator':n.op,'right_evaluated':evaluate,'skipped':None if evaluate else right})
    return value
   b=self.expr(n.right);v=self.binary(n.op,a,b);comparison=n.op in ('<','>','<=','>=','==','!=')
   self.emit(n,'condition' if comparison else 'compute',v,reads=self.reads_since(position),decision={'comparison':True,'operator':n.op} if comparison else None);return v
  if t=='UnaryOp':
   if n.op=='sizeof':
    if isinstance(n.expr,c_ast.Constant) and n.expr.type=='string':return SizeToken(c_ast.IdentifierType(['char']),len(ast.literal_eval(n.expr.value))+1,1)
    typ=self.expression_type(n.expr)
    value=self.sizeof_value(n.expr)
    spec,count,unit,_=self.sizeof_description(typ,value)
    return SizeToken(spec,count,unit)
   if n.op=='&':
    if isinstance(n.expr,c_ast.ID) and n.expr.name in self.funcs and not any(n.expr.name in scope for scope in self.env):return FunctionPointer(n.expr.name)
    a,k=self.target(n.expr);return Pointer(a,k,self.describe(n.expr))
   if '++' in n.op or '--' in n.op:
    a,k=self.target(n.expr,True);v=a[k];self.store(a,k,self.binary('+',v,1 if '++' in n.op else -1));self.emit(n,'write',a[k],writes=[self.access_info(n.expr,a[k],a,k)]);return v if n.op.startswith('p') else a[k]
   v=self.expr(n.expr)
   if isinstance(v,float):
    if n.op=='!':return CInt(int(not v))
    if n.op not in ('+','-'):raise CError('浮点值不支持此一元运算符')
    return self.checked(-v if n.op=='-' else v,FloatWidth(v.bits))
   if n.op in ('+','-','!','~'):return self.checked({'+':lambda:+v,'-':lambda:-v,'!':lambda:int(not v),'~':lambda:~v}[n.op](),max(32,getattr(v,'bits',32)),n.op!='!' and getattr(v,'unsigned',False) and getattr(v,'bits',32)>=32)
   raise CError('暂不支持运算符 '+n.op)
  if t=='Cast':
   value=self.expr(n.expr);typ=n.to_type.type
   if isinstance(typ,c_ast.PtrDecl):
    value=self.decay(value)
    if not isinstance(value,Pointer) and value!=0:raise CError('不支持整数地址转换')
    return value
   if isinstance(typ,c_ast.TypeDecl) and isinstance(typ.type,(c_ast.IdentifierType,c_ast.Enum)):
    if isinstance(typ.type,c_ast.IdentifierType) and typ.type.names==['void']:return None
    if self.type_bits(typ)==1:
     result=self.checked(self.decay(value),1);self.emit(n,'compute',result,description='显式转换为布尔值 → '+str(result));return result
    if isinstance(self.type_bits(typ),FloatWidth):return self.checked(value,self.type_bits(typ))
    if isinstance(value,float):value=int(value)
    if not isinstance(value,int):raise CError('整数转换需要整数操作数')
    bits=self.type_bits(typ);converted=int(value)%(1<<bits)
    unsigned=self.is_unsigned(typ)
    if not unsigned and converted>=(1<<(bits-1)):converted-=1<<bits
    result=CInt(converted,bits,unsigned);self.emit(n,'compute',result,description='显式转换为 '+str(bits)+(' 位无符号整数 → ' if unsigned else ' 位有符号整数 → ')+str(result));return result
   raise CError('不支持此显式转换类型')
  if t=='TernaryOp':
   typ=self.conditional_type(n)
   position=len(self.steps);condition=self.expr(n.cond);selected=n.iftrue if condition else n.iffalse;skipped=n.iffalse if condition else n.iftrue
   decision={'selected':self.describe(selected),'skipped':self.describe(skipped)}
   self.emit(n.cond,'condition',CInt(int(bool(condition))),reads=self.reads_since(position),description='三元表达式选择：'+self.describe(selected),decision=decision)
   value=self.expr(selected)
   if isinstance(typ,c_ast.PtrDecl):value=self.qualify(self.decay(value),typ)
   elif isinstance(typ,c_ast.TypeDecl) and not isinstance(typ.type,c_ast.Struct) and not (isinstance(typ.type,c_ast.IdentifierType) and typ.type.names==['void']):value=self.checked(value,self.type_bits(typ),self.is_unsigned(typ))
   self.emit(n,'compute',value,reads=self.reads_since(position),decision=decision);return value
  if t=='CompoundLiteral':return self.compound_literal(n)[0]
  if t=='ExprList':
   vals=[self.expr(x) for x in n.exprs];return vals[-1]
  if t=='FuncCall':
   if isinstance(n.name,c_ast.ID) and not any(n.name.name in scope for scope in self.env):name=n.name.name
   else:
    function=self.expr(n.name)
    if not isinstance(function,FunctionPointer):raise CError('调用目标不是有效函数指针')
    typ=self.expression_type(n.name)
    self.validate_function_pointer(function,c_ast.PtrDecl([],typ) if isinstance(typ,c_ast.FuncDecl) else typ)
    name=function.name
   if name=='scanf':
    self.emit(n,'call',description='调用 scanf 读取标准输入');value=self.scan(n);self.emit(n,'return',value,description='scanf 返回成功读取数量 '+str(value));return value
   self.emit(n,'call',description='调用函数 '+('assert' if name=='__cvisual_assert' else name))
   args=[self.expr(x) for x in (n.args.exprs if n.args else [])]
   if name=='srand':
    if len(args)!=1 or not isinstance(args[0],(int,float)):raise CError('srand 需要一个数值种子')
    self.random_state=int(self.checked(args[0],32,True));self.emit(n,'return',description='srand 设置随机种子');return None
   if name=='rand':
    if args:raise CError('rand 不接收参数')
    self.random_state=(1103515245*self.random_state+12345)&0x7fffffff
    value=CInt((self.random_state>>16)&32767);self.emit(n,'return',value,description='rand 返回 '+str(value));return value
   if name=='exit':
    if len(args)!=1 or not isinstance(args[0],(int,float)):raise CError('exit 需要一个数值退出码')
    status=self.checked(args[0],32)
    self.emit(n,'terminate',status,description='exit 结束程序，退出码 '+str(status))
    raise ProgramExit(status)
   if name=='__cvisual_assert':
    if len(args)!=1:raise CError('assert 需要一个标量表达式')
    value=self.decay(args[0])
    if not isinstance(value,(int,float,Pointer)):raise CError('assert 需要一个标量表达式')
    expression=self.describe(n.args.exprs[0]);passed=bool(value)
    self.emit(n,'condition',CInt(int(passed)),description=('断言通过：' if passed else '断言失败：')+expression,decision={'assertion':True,'passed':passed,'expression':expression})
    if not passed:raise CError('断言失败：'+expression)
    self.emit(n,'return',description='assert 检查通过');return None
   if name=='bsearch':
    value=self.search_array(args,n);self.emit(n,'return',value,description='bsearch '+('找到匹配元素' if value else '未找到匹配元素'));return value
   if name=='qsort':
    self.sort_array(args,n);self.emit(n,'return',description='qsort 排序完成');return None
   if name in ('strtol','strtoll','strtoul','strtoull'):
    if len(args)!=3 or not isinstance(args[2],int):raise CError(name+' 需要字符串、结束指针目标和整数基数')
    source=self.decay(args[0]);text=self.string_value(source,n,self.describe(n.args.exprs[0]))
    value,consumed=parse_integer_prefix(text,int(args[2]),CError);unsigned=name in ('strtoul','strtoull')
    if unsigned and not -(1<<64)<value<(1<<64):raise CError('64 位无符号整数解析溢出')
    value=self.checked(value,64,unsigned)
    if args[1]!=0:
     if self.type_signature(self.expression_type(n.args.exprs[1]))!=('pointer',('pointer',('char',))):raise CError('整数解析结束位置需要 char ** 类型')
     end=args[1];owner,key=self.dereference(end)
     if end.readonly or (id(owner),key) not in self.pointer_slots:raise CError('结束位置需要可写指针目标')
     result=Pointer(source.container,source.key+consumed,source.label,source.readonly)
     self.store(owner,key,result);self.emit(n,'write',result,writes=[self.access_info(n.args.exprs[1],result,owner,key)],description='记录整数解析结束位置')
    self.emit(n,'return',value);return value
   if name in ('atoi','atol','atoll'):
    if len(args)!=1:raise CError(name+' 需要一个字符串参数')
    text=self.string_value(args[0],n,self.describe(n.args.exprs[0]));value,_=parse_integer_prefix(text,10,CError)
    value=self.checked(value,32 if name=='atoi' else 64);self.emit(n,'return',value,description=name+' 返回 '+str(value));return value
   if name in ('abs','labs','llabs'):
    if len(args)!=1 or not isinstance(args[0],(int,float)):raise CError(name+' 需要一个数值参数')
    bits=32 if name=='abs' else 64;value=self.checked(abs(self.checked(args[0],bits)),bits)
    self.emit(n,'return',value,description=name+' 返回 '+str(value));return value
   if name in MATH_FUNCTIONS:
    value=math_operation(name,args,lambda x,bits:self.checked(x,FloatWidth(bits)),CError);self.emit(n,'return',value,description=name+' 返回 '+str(value));return value
   if name in CHARACTER_FUNCTIONS:
    value=CInt(character_operation(name,args,CError));self.emit(n,'return',value,description=name+' 返回 '+str(value));return value
   if name=='getchar':
    if args:raise CError('getchar 不接收参数')
    if self.input_pos>=len(self.input_text):value=CInt(-1)
    else:
     value=ord(self.input_text[self.input_pos])
     if value>127:raise CError('字符输入目前仅支持 ASCII')
     self.input_pos+=1;value=CInt(value)
    self.emit(n,'input',value,description='getchar 读取字符或 EOF');self.emit(n,'return',value);return value
   if name=='putchar':
    if len(args)!=1 or not isinstance(args[0],int):raise CError('putchar 需要一个整数参数')
    value=CInt(int(args[0])%256)
    if len(self.output)>=100000:raise CError('输出超过100KB限制')
    self.output+=chr(value);self.emit(n,'output',chr(value));self.emit(n,'return',value);return value
   if name in ('malloc','calloc','realloc'):
    old=None;zero=name=='calloc'
    if name=='calloc':
     if len(args)!=2 or not isinstance(args[0],int) or not isinstance(args[1],SizeToken):raise CError('calloc 需要元素数量和 sizeof 类型描述')
     args=[SizeToken(args[1].spec,args[0]*args[1].count,args[1].unit_bytes)]
    if name=='realloc':
     if len(args)!=2:raise CError('realloc 需要原引用和类型化大小')
     old,size=args
     if old!=0:
      if not isinstance(old,Pointer) or old.key!=0 or id(old.container) not in self.heap:raise CError('realloc 必须使用动态分配起始引用')
      self.dereference(old)
      old_spec=self.allocation_types[id(old.container)]
      if not isinstance(size,SizeToken) or self.describe(size.spec)!=self.describe(old_spec):raise CError('realloc 必须保留原元素类型')
     args=[size]
    if len(args)!=1 or not isinstance(args[0],SizeToken):raise CError('动态分配需要 sizeof 类型描述')
    size=args[0]
    if size.count<=0 or size.count>1000:raise CError('动态数组元素数量无效或超过1000')
    if len(self.heap)>=200:raise CError('动态节点分配超过200次限制')
    spec=size.spec;bits=self.type_bits(spec)
    if isinstance(spec,c_ast.Struct):holder=[self.make_struct(spec,zero) for _ in range(size.count)]
    elif isinstance(spec,c_ast.PtrDecl):
     holder=[0 if zero else None for _ in range(size.count)]
     for index in range(size.count):self.pointer_slots.add((id(holder),index));self.bind_const(holder,index,spec)
    else:holder=[self.checked(0,bits,self.is_unsigned(spec)) if zero else None for _ in range(size.count)]
    self.types[id(holder)]=bits
    if self.is_unsigned(spec):self.unsigned_arrays.add(id(holder))
    self.heap[id(holder)]=holder;self.allocation_types[id(holder)]=spec
    if old:
     for index in range(min(len(old.container),len(holder))):
      if isinstance(holder[index],(dict,list)):self.copy_aggregate(holder[index],old.container[index],True)
      else:holder[index]=old.container[index]
     self.release_owned(old.container)
    if not isinstance(spec,c_ast.Struct):self.object_id(holder)
    value=Pointer(holder,0,'动态内存 '+str(len(self.heap)));self.emit(n,'allocate',value,description=name+' 分配动态存储');return value
   if name=='free':
    if len(args)!=1:raise CError('free 需要一个引用')
    ptr=args[0]
    if ptr==0:return CInt(0)
    if not isinstance(ptr,Pointer) or id(ptr.container) not in self.heap or ptr.key!=0:raise CError('free 只能释放动态分配的起始引用')
    if id(ptr.container) in self.freed:raise CError('重复释放动态内存')
    self.release_owned(ptr.container);self.emit(n,'free',description='释放动态节点 '+ptr.label);return CInt(0)
   if name=='memchr':
    if len(args)!=3 or not isinstance(args[1],int) or not isinstance(args[2],(int,float)):raise CError('memchr 需要字符缓冲区、整数字节和长度')
    source=self.decay(args[0],self.describe(n.args.exprs[0]));count=self.checked(args[2],64,True);value=CInt(0)
    if count:
     owner,start=self.dereference(source)
     if not isinstance(owner,list) or self.types.get(id(owner))!=8:raise CError('memchr 当前支持字符缓冲区')
     if count>len(owner)-start:raise CError('memchr 读取范围越界')
     for offset in range(count):
      byte=self.read_character(source,offset,n,self.describe(n.args.exprs[0]))
      if byte==int(args[1])%256:value=Pointer(owner,start+offset,source.label,source.readonly);break
    self.emit(n,'return',value);return value
   if name=='memcmp':
    if len(args)!=3 or not isinstance(args[2],(int,float)):raise CError('memcmp 需要两个数据引用和数值长度')
    count=self.checked(args[2],64,True);left,right=[self.decay(value,self.describe(node)) for value,node in zip(args[:2],n.args.exprs[:2])]
    sources=[self.memory_bytes(pointer,count,node) for pointer,node in zip((left,right),n.args.exprs[:2])];value=CInt(0)
    for a,b in zip(*sources):
     value=CInt((a>b)-(a<b));self.emit(n,'compare',value,description='memcmp 比较无符号字节 '+str(a)+' 与 '+str(b))
     if value:break
    self.emit(n,'return',value);return value
   if name in ('memset','memcpy','memmove'):
    if len(args)!=3:raise CError('内存函数需要三个参数')
    target=self.decay(args[0]);count=args[2]
    if isinstance(target,Pointer) and target.readonly:raise CError('不能通过 const 指针执行内存写入')
    destinations=self.memory_cells(target,count)
    for cell in destinations:
     if id(cell['owner']) in self.readonly or (id(cell['owner']),cell['key']) in self.const_slots:raise CError('内存操作目标含只读数据')
    values=[]
    if name=='memset':
     if not isinstance(args[1],int):raise CError('memset 填充值需要整数')
     byte=int(args[1])%256
     for cell in destinations:
      if cell['pointer']:
       if byte:raise CError('指针单元暂只支持零字节填充')
       value=0
      elif isinstance(cell['bits'],FloatWidth):
       if byte:raise CError('浮点单元暂只支持零字节填充')
       value=0.0
      elif cell['bits']==1:
       if byte not in (0,1):raise CError('布尔单元填充仅支持0或1')
       value=byte
      else:value=int.from_bytes(bytes([byte])*(cell['bits']//8),'little',signed=not cell['unsigned'])
      values.append(value)
    else:
     sources=self.memory_cells(self.decay(args[1]),count)
     if [(c['offset'],c['bits'],c['pointer'],isinstance(c['bits'],FloatWidth)) for c in sources]!=[(c['offset'],c['bits'],c['pointer'],isinstance(c['bits'],FloatWidth)) for c in destinations]:raise CError('暂不支持不同数据单元布局的内存复制')
     if name=='memcpy' and {(id(c['owner']),c['key']) for c in sources}&{(id(c['owner']),c['key']) for c in destinations}:raise CError('memcpy 源和目标重叠，请使用 memmove')
     for source,destination in zip(sources,destinations):
      value=source['owner'][source['key']]
      if value is None:raise CError('暂不支持复制未初始化的数据单元')
      self.emit(n,'read',value,reads=[self.access_info(n.args.exprs[1],value,source['owner'],source['key'])],description=name+' 读取数据单元')
      if not source['pointer'] and not isinstance(source['bits'],FloatWidth):
       value=int(value)%(1<<source['bits'])
       if not destination['unsigned'] and value>=(1<<(destination['bits']-1)):value-=1<<destination['bits']
      values.append(value)
    for cell,value in zip(destinations,values):
     self.tick();value=self.store(cell['owner'],cell['key'],value);self.emit(n,'write',value,writes=[self.access_info(n.args.exprs[0],value,cell['owner'],cell['key'])],description=name+' 写入数据单元')
    self.emit(n,'return',target);return target
   if name in ('strncmp','strncpy'):
    if len(args)!=3 or not isinstance(args[2],(int,float)):raise CError(name+' 需要两个字符数组和数值长度')
    count=self.checked(args[2],64,True);labels=[self.describe(x) for x in n.args.exprs[:2]];left,right=[self.decay(value,label) for value,label in zip(args[:2],labels)]
    if name=='strncmp':
     value=CInt(0)
     for offset in range(count):
      begin=len(self.steps)
      a=self.read_character(left,offset,n,labels[0]);b=self.read_character(right,offset,n,labels[1]);value=CInt((a>b)-(a<b))
      self.emit(n,'compare',value,reads=self.reads_since(begin),description='strncmp 比较字符 '+str(a)+' 与 '+str(b))
      if value or a==0:break
     self.emit(n,'return',value);return value
    target,start=self.dereference(left)
    if left.readonly:raise CError('不能通过 const 指针写入字符串')
    if not isinstance(target,list) or self.types.get(id(target))!=8:raise CError('字符串目标需要字符数组')
    if count>len(target)-start:raise CError('strncpy 写入超出目标容量')
    values=[];ended=False;read_count=0
    for offset in range(count):
     if not ended:byte=self.read_character(right,offset,n,labels[1]);read_count+=1;ended=byte==0
     else:byte=0
     values.append(byte)
    if isinstance(right,Pointer) and right.container is target and max(start,right.key)<min(start+count,right.key+read_count):raise CError('字符串复制源与目标重叠')
    for offset,byte in enumerate(values):
     self.tick()
     if byte>=128 and id(target) not in self.unsigned_arrays and (id(target),start+offset) not in self.unsigned_slots:byte-=256
     value=self.store(target,start+offset,byte);self.emit(n,'write',value,writes=[{'name':labels[0],'array':self.array_id(target),'index':start+offset,'value':value}],description='strncpy 写入字符 '+str(byte))
    self.emit(n,'return',left);return left
   if name in ('strspn','strcspn','strpbrk'):
    if len(args)!=2:raise CError(name+' 需要两个字符串参数')
    source=self.decay(args[0]);characters=set(self.string_value(args[1],n,self.describe(n.args.exprs[1])));position=0;matched=False
    while True:
     byte=self.read_character(source,position,n,self.describe(n.args.exprs[0]))
     if byte==0:break
     if (chr(byte) in characters)==(name!='strspn'):matched=True;break
     position+=1
    if name=='strpbrk':value=Pointer(source.container,source.key+position,source.label,source.readonly) if matched else CInt(0)
    else:value=CInt(position,64,True)
    self.emit(n,'return',value,description=name+' 返回 '+str(value));return value
   if name=='strchr':
    if len(args)!=2 or not isinstance(args[1],int):raise CError('strchr 需要字符串和整数字符参数')
    source=self.decay(args[0],self.describe(n.args.exprs[0]));wanted=int(args[1])%256;offset=0;value=CInt(0)
    while True:
     byte=self.read_character(source,offset,n,self.describe(n.args.exprs[0]))
     if byte==wanted:value=Pointer(source.container,source.key+offset,source.label,source.readonly);break
     if byte==0:break
     offset+=1
    self.emit(n,'return',value,description='strchr '+('找到偏移 '+str(offset) if value else '未找到匹配'));return value
   if name=='strstr':
    if len(args)!=2:raise CError('strstr 需要两个字符串参数')
    source,needle=[self.decay(value) for value in args]
    pattern=self.string_value(needle,n,self.describe(n.args.exprs[1]));start=0
    if not pattern:self.emit(n,'return',source);return source
    while True:
     for offset in range(len(pattern)):
      begin=len(self.steps)
      a=self.read_character(source,start+offset,n,self.describe(n.args.exprs[0]));b=self.read_character(needle,offset,n,self.describe(n.args.exprs[1]))
      self.emit(n,'compare',CInt(int(a==b)),reads=self.reads_since(begin),description='strstr 起点 '+str(start)+' 比较第 '+str(offset)+' 个字符')
      if a==0:self.emit(n,'return',CInt(0));return CInt(0)
      if a!=b:break
     else:
      value=Pointer(source.container,source.key+start,source.label,source.readonly);self.emit(n,'return',value);return value
     start+=1
   if name in ('strchr','strrchr','strstr'):
    if len(args)!=2:raise CError(name+' 需要两个参数')
    source=self.decay(args[0],self.describe(n.args.exprs[0]))
    text=self.string_value(source,n,self.describe(n.args.exprs[0]))
    if name=='strstr':
     needle=self.string_value(args[1],n,self.describe(n.args.exprs[1]));offset=text.find(needle)
    else:
     if not isinstance(args[1],int):raise CError(name+' 的字符参数需要整数')
     needle=chr(int(args[1])%256)
     offset=(text+'\0').rfind(needle) if name=='strrchr' else (text+'\0').find(needle)
    value=Pointer(source.container,source.key+offset,source.label,source.readonly) if offset>=0 else CInt(0)
    self.emit(n,'return',value,description=name+(' 找到偏移 '+str(offset) if offset>=0 else ' 未找到匹配'));return value
   if name=='strncat':
    if len(args)!=3 or not isinstance(args[2],(int,float)):raise CError('strncat 需要目标、源字符缓冲区和长度')
    target=self.decay(args[0]);owner,start=self.dereference(target)
    if target.readonly:raise CError('不能通过 const 指针写入字符串')
    prefix=self.string_value(target,n,self.describe(n.args.exprs[0]));source=self.decay(args[1]);count=self.checked(args[2],64,True);values=[];read_count=0
    for offset in range(count):
     byte=self.read_character(source,offset,n,self.describe(n.args.exprs[1]));read_count+=1
     if byte==0:break
     values.append(byte)
    begin=start+len(prefix)
    if begin+len(values)>=len(owner):raise CError('strncat 写入超出目标容量（包含终止符）')
    if isinstance(source,Pointer) and source.container is owner and max(begin,source.key)<min(begin+len(values)+1,source.key+read_count):raise CError('字符串复制源与目标重叠')
    for offset,byte in enumerate(values+[0]):
     self.tick()
     if byte>=128 and id(owner) not in self.unsigned_arrays and (id(owner),begin+offset) not in self.unsigned_slots:byte-=256
     value=self.store(owner,begin+offset,byte);self.emit(n,'write',value,writes=[{'name':self.describe(n.args.exprs[0]),'array':self.array_id(owner),'index':begin+offset,'value':value}],description='strncat 写入字符')
    self.emit(n,'return',target);return target
   if name in ('strcpy','strcat'):
    if len(args)!=2:raise CError('字符串写入函数需要两个参数')
    target=self.decay(args[0]);array,start=self.dereference(target)
    if target.readonly:raise CError('不能通过 const 指针写入字符串')
    if not isinstance(array,list) or self.types.get(id(array))!=8:raise CError('字符串目标需要字符数组')
    text=self.string_value(args[1],n,self.describe(n.args.exprs[1]))
    offset=len(self.string_value(target,n,self.describe(n.args.exprs[0]))) if name=='strcat' else 0
    begin=start+offset;end=begin+len(text)+1
    if end>len(array):raise CError('字符串写入超出目标容量（包含终止符）')
    source=self.decay(args[1])
    if isinstance(source,Pointer) and source.container is array and max(begin,source.key)<min(end,source.key+len(text)+1):raise CError('字符串复制源与目标重叠')
    for index,byte in enumerate([ord(c) for c in text]+[0],begin):
     self.tick();self.store(array,index,byte)
     self.emit(n,'write',byte,writes=[{'name':self.describe(n.args.exprs[0]),'array':self.array_id(array),'index':index,'value':byte}],description=name+' 写入字符 '+str(byte))
    self.emit(n,'return',target);return target
   if name=='strcmp':
    if len(args)!=2:raise CError('strcmp 需要两个字符串参数')
    pointers=[self.decay(value) for value in args];offset=0
    while True:
     begin=len(self.steps)
     a,b=[self.read_character(pointer,offset,n,self.describe(node)) for pointer,node in zip(pointers,n.args.exprs)]
     value=CInt((a>b)-(a<b))
     self.emit(n,'compare',value,reads=self.reads_since(begin),description='strcmp 比较字符 '+str(a)+' 与 '+str(b))
     if value or a==0:break
     offset+=1
    self.emit(n,'return',value);return value
   if name in ('strlen','strcmp'):

    if len(args)!=(1 if name=='strlen' else 2):raise CError('字符串函数参数数量不匹配')
    strings=[self.string_value(value,n,self.describe(n.args.exprs[i])) for i,value in enumerate(args)]
    value=len(strings[0]) if name=='strlen' else ((strings[0]>strings[1])-(strings[0]<strings[1]))
    value=CInt(value,64,True) if name=='strlen' else CInt(value)
    self.emit(n,'return',value);return value
   if name=='printf':
    if not args:raise CError('printf 需要格式字符串')
    fmt=self.string_value(args[0],n,self.describe(n.args.exprs[0]))
    tokens=[match.group() for match in PRINTF_PATTERN.finditer(fmt)]
    if PRINTF_PATTERN.sub('',fmt).find('%')>=0:raise CError('printf 暂不支持此格式或动态字段宽度')
    if sum((t!='%%')+t.count('*') for t in tokens)!=len(args)-1:raise CError('printf 参数数量不匹配')
    it=iter(enumerate(args[1:],1))
    def format_value(match):
     spec=match.group()
     if spec=='%%':return '%'
     if '*' in spec:
      fields=re.fullmatch(r'%([-+ #0]*)(\*|[0-9]*)(?:\.(\*|[0-9]*))?(.*)',spec)
      flags,width,precision,tail=fields.groups()
      if width=='*':
       _,width=next(it)
       if not isinstance(width,int):raise CError('printf 动态宽度需要整数参数')
       if width<0:
        if '-' not in flags:flags+='-'
        width=-width
       width=str(int(width))
      if precision=='*':
       _,precision=next(it)
       if not isinstance(precision,int):raise CError('printf 动态精度需要整数参数')
       precision=str(int(precision)) if precision>=0 else None
      spec='%'+flags+width+('.'+precision if precision is not None else '')+tail
     index,value=next(it)
     if spec.endswith('s'):
      match=re.fullmatch(r'%(-?)([0-9]*)(?:\.([0-9]*))?s',spec);left,width,precision=match.groups();width=int(width or 0)
      limit=None if precision is None else int(precision or 0)
      if width>1000 or (limit is not None and limit>1000):raise CError('printf 字段宽度或精度超过1000')
      if limit is None:text=self.string_value(value,n,self.describe(n.args.exprs[index]))
      elif isinstance(value,str):text=value[:limit]
      else:
       pointer=self.decay(value);chars=[]
       for offset in range(limit):
        byte=self.read_character(pointer,offset,n,self.describe(n.args.exprs[index]))
        if byte==0:break
        chars.append(chr(byte))
       text=''.join(chars)
      return text.ljust(width) if left else text.rjust(width)

     if spec[-1] in 'fFeEgG':return format_float(spec,value,CError)
     if not isinstance(value,int):raise CError('printf 数字格式需要整数参数')
     if spec.endswith('c'):
      match=re.fullmatch(r'%(-?)([0-9]*)c',spec);left,width=match.groups();width=int(width or 0)
      if width>1000:raise CError('printf 字段宽度超过1000')
      text=chr(int(value)%256);return text.ljust(width) if left else text.rjust(width)
     return format_integer(spec,value,CError)
    out=PRINTF_PATTERN.sub(format_value,fmt)
    if len(self.output)+len(out)>100000:raise CError('输出超过100KB限制')
    self.output+=out;self.emit(n,'output',out);return CInt(len(out))
   if name=='puts':
    if len(args)!=1:raise CError('puts 需要一个字符串')
    args[0]=self.string_value(args[0],n,self.describe(n.args.exprs[0]))
    if len(self.output)+len(args[0])+1>100000:raise CError('输出超过100KB限制')
    self.output+=args[0]+'\n';self.emit(n,'output',args[0]+'\n');return CInt(0)
   if name not in self.funcs:raise CError('不支持的函数：'+name)
   if len(self.stack)>=80:raise CError('递归深度超过限制')
   f=self.funcs[name];params=f.decl.type.args.params if f.decl.type.args else []
   names=[p.name for p in params if getattr(p,'name',None)]
   if len(names)!=len(args):raise CError('函数参数数量不匹配')
   caller_env=self.env;frame=dict(zip(names,args));self.frame_serial+=1;self.frame_ids[id(frame)]=self.frame_serial
   for param in params:
    if getattr(param,'name',None):
     self.declared_types[(id(frame),param.name)]=param.type
     if isinstance(param.type,(c_ast.PtrDecl,c_ast.ArrayDecl)):
      value=self.decay(frame[param.name],param.name);frame[param.name]=value
      if not isinstance(value,Pointer) and value!=0:raise CError('指针参数必须为引用或0')
      self.pointer_slots.add((id(frame),param.name))
     elif isinstance(param.type,c_ast.TypeDecl) and isinstance(param.type.type,c_ast.Struct):
      duplicate=self.make_struct(param.type.type);self.copy_aggregate(duplicate,frame[param.name],True);frame[param.name]=duplicate
     else:
      bits=self.type_bits(param.type);self.types[(id(frame),param.name)]=bits;frame[param.name]=self.checked(frame[param.name],bits,self.is_unsigned(param.type))
   for param in params:
    if getattr(param,'name',None):self.bind_const(frame,param.name,param.type)
   self.env=[caller_env[0],frame];self.stack.append(name);self.frame_envs.append((name,self.env))
   try:self.exec(f.body);v=0
   except Return as r:v=r.value
   finally:self.expire_scope(frame);self.stack.pop();self.frame_envs.pop();self.env=caller_env
   if name!='main':self.emit(n,'return',v,description=name+' 返回 '+str(v))
   return v
  raise CError('暂不支持语法：'+t)
 def binary(self,op,a,b):
  a=self.decay(a);b=self.decay(b)
  if isinstance(a,FunctionPointer) or isinstance(b,FunctionPointer):
   if op not in ('==','!='):raise CError('函数指针仅支持相等比较')
  if isinstance(a,Pointer) or isinstance(b,Pointer):
   if op in ('==','!='):return CInt(int((a==b) if op=='==' else (a!=b)))
   if isinstance(a,Pointer) and isinstance(b,Pointer):
    self.dereference(a,True);self.dereference(b,True)
    if a.container is not b.container or not isinstance(a.container,list):raise CError('指针相减或排序比较必须属于同一数组')
    if op=='-':return CInt(a.key-b.key,64)
    if op in ('<','>','<=','>='):return CInt(int({'<':a.key<b.key,'>':a.key>b.key,'<=':a.key<=b.key,'>=':a.key>=b.key}[op]))
   ptr,offset=(a,b) if isinstance(a,Pointer) else (b,a)
   if isinstance(offset,int) and (op=='+' or (op=='-' and ptr is a)):
    container,key=self.dereference(ptr,True)
    if not isinstance(container,list):raise CError('指针算术仅支持数组引用')
    index=key+(offset if op=='+' else -offset)
    if not 0<=index<=len(container):raise CError('指针算术越界')
    return Pointer(container,index,ptr.label,ptr.readonly)
   raise CError('不支持此指针运算')

  if isinstance(a,float) or isinstance(b,float):
   if not isinstance(a,(int,float)) or not isinstance(b,(int,float)):raise CError('浮点运算需要数值操作数')
   if op not in ('+','-','*','/','<','>','<=','>=','==','!='):raise CError('浮点值不支持此二元运算符')
   width=max(value.bits for value in (a,b) if isinstance(value,CFloat)) if isinstance(a,CFloat) or isinstance(b,CFloat) else 64
   a=self.checked(a,FloatWidth(width));b=self.checked(b,FloatWidth(width))
   if op=='/' and b==0:raise CError('浮点除数不能为零')
   result={'+':lambda:a+b,'-':lambda:a-b,'*':lambda:a*b,'/':lambda:a/b,'<':lambda:int(a<b),'>':lambda:int(a>b),'<=':lambda:int(a<=b),'>=':lambda:int(a>=b),'==':lambda:int(a==b),'!=':lambda:int(a!=b)}[op]()
   return CInt(result) if op in ('<','>','<=','>=','==','!=') else self.checked(result,FloatWidth(width))

  if op=='*' and (isinstance(a,SizeToken)!=isinstance(b,SizeToken)):
   size,factor=(a,b) if isinstance(a,SizeToken) else (b,a)
   if isinstance(factor,int):return SizeToken(size.spec,size.count*factor,size.unit_bytes)

  if op in ('/','%') and b==0:raise CError('除数不能为零')
  funcs={'+':lambda:a+b,'-':lambda:a-b,'*':lambda:a*b,'/':lambda:((abs(a)//abs(b))*(-1 if (a<0)!=(b<0) else 1)) if isinstance(a,int) and isinstance(b,int) else a/b,'%':lambda:a-((abs(a)//abs(b))*(-1 if (a<0)!=(b<0) else 1))*b,'<':lambda:int(a<b),'>':lambda:int(a>b),'==':lambda:int(a==b),'!=':lambda:int(a!=b),'<=':lambda:int(a<=b),'>=':lambda:int(a>=b),'&':lambda:a&b,'|':lambda:a|b,'^':lambda:a^b,'<<':lambda:a<<b,'>>':lambda:a>>b}
  if op not in funcs:raise CError('不支持运算符 '+op)
  if op in ('<<','>>') and (b<0 or b>=max(32,getattr(a,'bits',32)) or (op=='<<' and a<0)):raise CError('移位范围超限或负数左移不受支持')
  if op in ('==','!=') and (isinstance(a,Pointer) or isinstance(b,Pointer)):return CInt(int((a==b) if op=='==' else (a!=b)))
  if not isinstance(a,int) or not isinstance(b,int):raise CError('首版数值运算仅支持 int')
  left_bits=max(32,getattr(a,'bits',32));right_bits=max(32,getattr(b,'bits',32))
  bits=left_bits if op in ('<<','>>') else max(left_bits,right_bits)
  unsigned=(getattr(a,'unsigned',False) and getattr(a,'bits',32)>=32 and left_bits==bits) or (op not in ('<<','>>') and getattr(b,'unsigned',False) and getattr(b,'bits',32)>=32 and right_bits==bits)
  if unsigned:
   a=int(a)%(1<<bits)
   if op not in ('<<','>>'):b=int(b)%(1<<bits)
  if op in ('/','%') and not unsigned and a==-(1<<(bits-1)) and b==-1:raise CError(str(bits)+' 位有符号除法或取余溢出')
  result=funcs[op]()
  if op in ('<','>','<=','>=','==','!='):return CInt(result)
  return self.checked(result,bits,unsigned)
 @preserve_failure
 def exec(self,n):
  if n is None:return
  self.tick();t=type(n).__name__
  if t=='Compound':
   self.env.append({})
   try:
    for x in n.block_items or []:self.exec(x)
   finally:self.expire_scope(self.env.pop())
   return
  if t=='Typedef' and id(n) in self.vla_declarations:
   values=self.vla_extent_scopes.setdefault(id(self.env[-1]),{})
   for name,expression in self.vla_declarations[id(n)]:
    value=self.expr(expression)
    if not isinstance(value,int) or value<=0 or value>1000:raise CError('变长数组类型长度须为1到1000的整数')
    values[name]=value
   self.emit(n,'declare',description='定义数组类型 '+n.name+'，固定当前维度');return
  if t=='Enum':self.declare_enum(n);return
  if t=='Decl':
   if isinstance(n.type,c_ast.FuncDecl):self.check_prototype(n);return
   if 'extern' in n.storage and (len(self.env)>1 or n.init is None):self.bind_external(n);return
   if n.name:self.declared_types[(id(self.env[-1]),n.name)]=n.type
   position=len(self.steps)
   if 'static' in n.storage and len(self.env)>1 and id(n) in self.static_storage:
    storage=self.static_storage[id(n)];self.env[-1][n.name]=StaticBinding(storage,n.name)
    self.emit(n,'declare',storage[n.name],description='静态局部变量保留已有值：'+n.name);return
   if n.name:
    if 'static' in n.storage and len(self.env)>1:
     storage={n.name:None};self.static_storage[id(n)]=storage;self.env[-1][n.name]=StaticBinding(storage,n.name)
    else:self.env[-1].setdefault(n.name,None)
   if isinstance(n.type,c_ast.Enum):self.declare_enum(n.type);return
   if isinstance(n.type,c_ast.TypeDecl) and isinstance(n.type.type,c_ast.Enum):self.declare_enum(n.type.type)
   if isinstance(n.type,c_ast.Struct):

    if n.type.decls is not None:self.structs[n.type.name]=n.type
    else:self.structs.setdefault(n.type.name,n.type)
    return
   if isinstance(n.type,c_ast.TypeDecl) and isinstance(n.type.type,c_ast.Struct):
    spec=n.type.type
    if spec.decls:self.structs[spec.name]=spec
    if n.name is None:return
    v=self.make_struct(spec,len(self.env)==1 or 'static' in n.storage,n.init,publish=lambda value:self.publish_declaration(n,value))
    self.object_id(v);self.env[-1][n.name]=v;self.bind_const(self.env[-1],n.name,n.type)
    self.finish_static(n);self.emit(n,'declare',v);return
   if isinstance(n.type,c_ast.PtrDecl):
    v=self.decay(self.expr(n.init),n.name) if n.init else 0
    if not isinstance(v,Pointer) and v!=0:raise CError('指针初始化必须为引用或0')
    self.env[-1][n.name]=v;self.pointer_slots.add((id(self.env[-1]),n.name));self.bind_const(self.env[-1],n.name,n.type);self.finish_static(n);self.emit(n,'declare',v);return
   if isinstance(n.type,c_ast.ArrayDecl):
    v=self.make_array(n.type,n.init,len(self.env)==1 or 'static' in n.storage,publish=lambda value:self.publish_declaration(n,value))
   elif isinstance(n.type,c_ast.TypeDecl) and isinstance(n.type.type,(c_ast.IdentifierType,c_ast.Enum)):v=self.expr(n.init) if n.init else (0 if len(self.env)==1 or 'static' in n.storage else None)
   else:raise CError('暂不支持声明类型：指针、结构体等')
   bits=self.type_bits(n.type)
   if not isinstance(v,list) and v is not None:v=self.checked(v,bits,self.is_unsigned(n.type))
   self.types[(id(self.env[-1]),n.name)]=bits;self.env[-1][n.name]=v;self.bind_const(self.env[-1],n.name,n.type)
   self.finish_static(n)
   self.emit(n,'declare',v,reads=self.reads_since(position),writes=[{'name':n.name,'value':v}]);return
  elif t=='DeclList':
   for x in n.decls:self.exec(x)
   return
  elif t=='Switch':
   value=self.expr(n.cond)
   if not isinstance(value,int):raise CError('switch选择值必须是整数')
   if not isinstance(value,int):raise CError('switch 条件需要整数')
   if not isinstance(n.stmt,c_ast.Compound):raise CError('switch 目前需要花括号语句体')
   labels=n.stmt.block_items or [];start=None;fallback=None;seen=set()
   for index,label in enumerate(labels):
    if isinstance(label,c_ast.Case):
     constant=self.constant_integer(label.expr)
     if constant in seen:raise CError('重复 case 标签')
     seen.add(constant)
     if constant==value:start=index
    elif isinstance(label,c_ast.Default):
     if fallback is not None:raise CError('重复 default 标签')
     fallback=index
    else:raise CError('switch 标签前的语句暂不支持')
   if start is None:start=fallback
   self.emit(n.cond,'select',value,description='switch 选择值 '+str(value)+('，无匹配分支' if start is None else '，进入第 '+str(labels[start].coord.line)+' 行分支'))
   if start is None:return
   self.env.append({})
   try:
    for label in labels[start:]:
     for statement in label.stmts or []:self.exec(statement)
   except Break:pass
   finally:self.expire_scope(self.env.pop())
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
    if t=='For':self.expire_scope(self.env.pop())
   return
  elif t=='Return':
   value=self.expr(n.expr)
   return_type=self.funcs[self.stack[-1]].decl.type.type if self.stack else None
   if isinstance(return_type,c_ast.TypeDecl) and isinstance(return_type.type,c_ast.Struct):
    duplicate=self.make_struct(return_type.type);self.copy_aggregate(duplicate,value,True);value=duplicate
   elif isinstance(return_type,c_ast.PtrDecl):
    value=self.qualify(self.decay(value),return_type);self.validate_function_pointer(value,return_type)
   elif isinstance(return_type,c_ast.TypeDecl) and isinstance(return_type.type,(c_ast.IdentifierType,c_ast.Enum)) and not (isinstance(return_type.type,c_ast.IdentifierType) and return_type.type.names==['void']):value=self.checked(value,self.type_bits(return_type),self.is_unsigned(return_type))
   elif isinstance(value,dict):raise CError('返回值与声明的返回类型不匹配')
   self.emit(n,'return',value);raise Return(value)
  elif t=='Break':raise Break()
  elif t=='Continue':raise Continue()
  elif t=='EmptyStatement':return
  else:self.expr(n)
  self.emit(n)
 def scan(self,n):
  nodes=n.args.exprs if n.args else []
  if not nodes:raise CError('scanf 缺少格式字符串')
  fmt=self.string_value(self.expr(nodes[0]),n,self.describe(nodes[0]));pattern=r'%(?:%|(?:[1-9][0-9]*)?(?:ll|l|hh|h|t|z|j)?[diuxXo]|(?:ll|l|hh|h|t|z|j)?n|(?:[1-9][0-9]*)?l?[fFeEgG]|[1-9][0-9]*s|s|(?:[1-9][0-9]*)?c)|\s+|[^%\s]'
  tokens=re.findall(pattern,fmt)
  if re.sub(pattern,'',fmt):raise CError('scanf 支持整数、有限浮点、%c、%s 和 %Ns')
  if sum(token.startswith('%') and token!='%%' for token in tokens)!=len(nodes)-1:raise CError('scanf 参数数量不匹配')
  count=0;argument=iter(nodes[1:]);input_start=self.input_pos
  def skip_space():
   rest=self.input_text[self.input_pos:];self.input_pos+=len(rest)-len(rest.lstrip())
  def stopped():
   self.emit(n,'input',count,description='输入结束或不匹配，scanf 停止')
   return CInt(-1 if self.input_pos>=len(self.input_text) and count==0 else count)
  for spec in tokens:
   if not spec.startswith('%'):
    if spec.isspace():skip_space()
    elif self.input_text.startswith(spec,self.input_pos):
     self.input_pos+=len(spec);self.emit(n,'input',spec,description='匹配输入分隔符 '+repr(spec))
    else:return stopped()
    continue
   if spec=='%%':
    skip_space()
    if not self.input_text.startswith('%',self.input_pos):return stopped()
    self.input_pos+=1;self.emit(n,'input','%',description='匹配输入百分号');continue
   field_width=None
   field=re.fullmatch(r'%([1-9][0-9]*)(.*[diuxXofFeEgGc])',spec)
   if field:
    field_width=int(field.group(1));spec='%'+field.group(2)
    if field_width>1000:raise CError('scanf 数值字段宽度超过1000')
   arg=next(argument)
   if spec.endswith('n'):
    pointer=self.decay(self.expr(arg));owner,key=self.dereference(pointer)
    bits=self.types.get((id(owner),key),self.types.get(id(owner),32))
    expected=8 if spec.startswith('%hh') else 16 if spec.startswith('%h') else 64 if spec.startswith(('%l','%t','%z','%j')) else 32
    if pointer.readonly or isinstance(bits,FloatWidth) or bits!=expected or (id(owner),key) in self.unsigned_slots or id(owner) in self.unsigned_arrays:raise CError('scanf %n 需要匹配宽度的可写有符号整数目标')
    value=self.store(owner,key,self.input_pos-input_start)
    self.emit(n,'input',value,writes=[self.access_info(arg.expr if isinstance(arg,c_ast.UnaryOp) and arg.op=='&' else arg,value,owner,key)],description='记录本次 scanf 已消耗字符数 '+str(value));continue
   if spec!='%c':skip_space()
   rest=self.input_text[self.input_pos:]
   if field_width is not None:rest=rest[:field_width]
   if not rest:return stopped()
   if spec=='%c' and field_width is not None and field_width>1:
    pointer=self.decay(self.expr(arg));owner,start=self.dereference(pointer)
    if pointer.readonly or not isinstance(owner,list) or self.types.get(id(owner))!=8:raise CError('scanf 多字符输入需要可写字符数组')
    if start+field_width>len(owner):raise CError('scanf 字符块超出目标容量')
    for offset in range(field_width):
     if self.input_pos>=len(self.input_text):return stopped()
     byte=ord(self.input_text[self.input_pos])
     if byte>127:raise CError('字符输入目前仅支持 ASCII')
     value=self.store(owner,start+offset,byte);self.input_pos+=1
     self.emit(n,'input',value,writes=[{'name':self.describe(arg),'array':self.array_id(owner),'index':start+offset,'value':value}],description='读取定长字符块')
    count+=1;continue
   if spec.endswith('s'):
    ptr=self.decay(self.expr(arg),self.describe(arg));array,start=self.dereference(ptr)
    if ptr.readonly:raise CError('不能向 const 指针目标读取输入')
    if not isinstance(array,list) or self.types.get(id(array))!=8:raise CError('scanf %s 需要字符数组')
    width=int(spec[1:-1]) if spec!='%s' else 1000
    if width>1000:raise CError('scanf 字符串宽度超过限制')
    match=re.match(r'\S+',rest);text=match.group()[:width] if match else ''
    if not text:return stopped()
    if start+len(text)>=len(array):raise CError('scanf 字符串将超出目标容量（包含终止符）')
    if any(ord(c)>127 for c in text):raise CError('字符串输入目前仅支持 ASCII')
    for offset,byte in enumerate([ord(c) for c in text]+[0]):
     self.store(array,start+offset,byte)
     if offset<len(text):self.input_pos+=1
     self.emit(n,'input',byte,writes=[{'name':self.describe(arg),'array':self.array_id(array),'index':start+offset,'value':byte}],description='读取字符串字符')
    count+=1;continue
   ptr=self.decay(self.expr(arg));container,key=self.dereference(ptr)
   if ptr.readonly:raise CError('不能向 const 指针目标读取输入')
   bits=self.types.get((id(container),key),self.types.get(id(container),32))
   expected_bits=8 if spec=='%c' or spec.startswith('%hh') else 16 if spec.startswith('%h') else 64 if spec.startswith(('%l','%t','%z','%j')) else 32
   unsigned=(id(container),key) in self.unsigned_slots or id(container) in self.unsigned_arrays
   floating=spec[-1] in 'fFeEgG'
   if isinstance(bits,FloatWidth)!=floating or bits!=expected_bits or (spec!='%c' and unsigned!=(spec[-1] in 'uxXo')):raise CError('scanf 格式与目标类型不匹配')
   if floating:
    match=re.match(r'[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?',rest)
    if not match:return stopped()
    text=match.group();value=float(text)
   elif spec=='%c':
    if ord(rest[0])>127:raise CError('字符输入目前仅支持 ASCII')
    text=rest[0];value=ord(text)
   else:
    kind=spec[-1]
    pattern=r'[+-]?(?:0[xX][0-9a-fA-F]+|0[0-7]*|[1-9][0-9]*)' if kind=='i' else r'[+-]?(?:0[xX])?[0-9a-fA-F]+' if kind in 'xX' else r'[+-]?[0-7]+' if kind=='o' else r'[+-]?[0-9]+'
    match=re.match(pattern,rest)
    if not match:return stopped()
    text=match.group();digits=text.lstrip('+-')
    base=(16 if digits.lower().startswith('0x') else 8 if digits.startswith('0') else 10) if kind=='i' else 16 if kind in 'xX' else 8 if kind=='o' else 10
    value=int(text,base)
   if unsigned and not -(1<<bits)<value<(1<<bits):raise CError('无符号输入超过目标范围')
   value=self.store(container,key,value);self.input_pos+=len(text);count+=1
   self.emit(n,'input',value,writes=[self.access_info(arg.expr if isinstance(arg,c_ast.UnaryOp) and arg.op=='&' else arg,value,container,key)],description='从标准输入读取 '+str(value))
  return CInt(count)
 def resolve_aliases(self,tree):
  aliases={};tag_scopes=[{}];tag_counter=[0];definitions={}
  def fresh_tag(name):
   tag_counter[0]+=1;internal='__scope_'+str(tag_counter[0])+'_'+(name or 'anonymous');self.tag_labels[internal]=name or '匿名类型';return internal
  def resolve(node):
   if isinstance(node,c_ast.Decl) and node.name is None and isinstance(node.type,c_ast.Struct) and node.type.decls is None and len(tag_scopes)>1:
    tag_scopes[-1].setdefault(node.type.name,fresh_tag(node.type.name))
   if isinstance(node,(c_ast.Struct,c_ast.Enum)):
    original=node.name;definition=node.decls if isinstance(node,c_ast.Struct) else node.values
    if definition is not None:
     if id(node) in definitions:node.name=definitions[id(node)]
     elif original is None or len(tag_scopes)>1:
      node.name=tag_scopes[-1].get(original) or fresh_tag(original)
      definitions[id(node)]=node.name
      if original is not None:tag_scopes[-1][original]=node.name
     elif original is not None:tag_scopes[0][original]=original
    elif original is not None:
     for scope in reversed(tag_scopes):
      if original in scope:node.name=scope[original];break

   if isinstance(node,c_ast.Compound):
    saved=aliases.copy();items=[];tag_scopes.append({})
    try:
     for statement in node.block_items or []:
      if isinstance(statement,c_ast.Typedef):
       typ=resolve(statement.type)
       original_type=copy.deepcopy(typ);captures=[]
       def capture_dimensions(part):
        if isinstance(part,c_ast.ArrayDecl):
         dim=part.dim
         if dim is not None and not isinstance(dim,c_ast.Constant) and not (isinstance(dim,c_ast.ID) and dim.name in self.vla_extent_names):
          name='__vla_extent_'+str(len(self.vla_extent_names)+1);self.vla_extent_names.add(name);self.tag_labels[name]=self.describe(dim)
          captures.append((name,dim));part.dim=c_ast.ID(name,coord=dim.coord)
         capture_dimensions(part.type)
        elif isinstance(part,c_ast.PtrDecl):capture_dimensions(part.type)
       capture_dimensions(typ);aliases[statement.name]=copy.deepcopy(typ)
       if captures:
        statement.type=original_type;self.vla_declarations[id(statement)]=captures;items.append(statement)
       if isinstance(typ,c_ast.TypeDecl) and isinstance(typ.type,c_ast.Enum) and typ.type.values is not None:
        items.append(typ.type);aliases[statement.name].type.values=None
      else:items.append(resolve(statement))
     node.block_items=items
    finally:aliases.clear();aliases.update(saved);tag_scopes.pop()
    return node
   if isinstance(node,c_ast.Typedef):raise CError('此位置不支持类型别名')
   if isinstance(node,c_ast.TypeDecl) and isinstance(node.type,c_ast.IdentifierType) and len(node.type.names)==1 and node.type.names[0] in aliases:
    alias=copy.deepcopy(aliases[node.type.names[0]]);base=alias
    while hasattr(base,'type') and not isinstance(base,c_ast.TypeDecl):base=base.type
    if isinstance(base,c_ast.TypeDecl):base.declname=node.declname;base.quals=list(set(base.quals+node.quals))
    return alias
   for slot in getattr(node,'__slots__',()):
    if slot in ('coord','__weakref__'):continue
    value=getattr(node,slot,None)
    if isinstance(value,c_ast.Node):setattr(node,slot,resolve(value))
    elif isinstance(value,list):setattr(node,slot,[resolve(x) if isinstance(x,c_ast.Node) else x for x in value])
   if isinstance(node,c_ast.FuncDecl) and node.args is not None:
    for param in node.args.params:
     if hasattr(param,'type') and isinstance(param.type,c_ast.FuncDecl):param.type=c_ast.PtrDecl([],param.type)
   return node
  items=[]
  for node in tree.ext:
   if isinstance(node,c_ast.Typedef):
    node.type=resolve(node.type);aliases[node.name]=copy.deepcopy(node.type)
    base=node.type
    if isinstance(base,c_ast.TypeDecl) and isinstance(base.type,c_ast.Struct) and base.type.decls:self.structs[base.type.name]=base.type
    if isinstance(base,c_ast.TypeDecl) and isinstance(base.type,c_ast.Enum) and base.type.values is not None:
     if base.type.name is None:base.type.name='__enum_alias_'+node.name
     items.append(base.type);aliases[node.name]=copy.deepcopy(base);aliases[node.name].type.values=None
   else:items.append(resolve(node))
  tree.ext=items
 def normalize_integer_types(self,tree):
  class Normalize(c_ast.NodeVisitor):
   def visit_IdentifierType(visitor,node):
    names=node.names
    integer={'signed','unsigned','short','long','int','char'}
    if not set(names)<=integer:return
    invalid=any(names.count(word)>1 for word in ('signed','unsigned','short','int','char')) or names.count('long')>2 or ('signed' in names and 'unsigned' in names)
    invalid=invalid or ('char' in names and any(word in names for word in ('short','long','int'))) or ('short' in names and 'long' in names)
    if invalid:raise CError('整数类型说明符组合无效：'+' '.join(names))
    if 'char' in names:node.names=(['unsigned'] if 'unsigned' in names else ['signed'] if 'signed' in names else [])+['char'];return
    base=['short'] if 'short' in names else ['long']*names.count('long') if 'long' in names else ['int']
    node.names=(['unsigned'] if 'unsigned' in names else [])+base
  Normalize().visit(tree)
 def validate(self,tree):
  class Validator(c_ast.NodeVisitor):
   def visit_TypeDecl(v,n):
    if isinstance(n.type,(c_ast.Struct,c_ast.Enum)):
     v.visit(n.type);return
    if not isinstance(n.type,c_ast.IdentifierType) or n.type.names not in (['float'],['double'],['long'],['long','int'],['signed','long'],['signed','long','int'],['unsigned','long'],['unsigned','long','int'],['signed','long','long'],['signed','long','long','int'],['short'],['short','int'],['signed','short'],['signed','short','int'],['unsigned','short'],['unsigned','short','int'],['int'],['signed'],['signed','int'],['unsigned'],['unsigned','int'],['unsigned','char'],['signed','char'],['unsigned','long','long'],['unsigned','long','long','int'],['_Bool'],['char'],['void'],['long','long'],['long','long','int']):raise CError('不支持此类型；当前支持整数、float/double、结构体和void等类型')
    if any(q!='const' for q in n.quals):raise CError('目前类型限定符仅支持 const')
   def visit_ArrayDecl(v,n):
    v.generic_visit(n)
   def visit_PtrDecl(v,n):v.generic_visit(n)
   def visit_Struct(v,n):v.generic_visit(n)
   def visit_Union(v,n):raise CError('首版暂不支持联合体')
   def visit_Enum(v,n):v.generic_visit(n)
   def visit_Switch(v,n):v.generic_visit(n)
   def visit_Decl(v,n):
    if any(storage not in ('static','extern') for storage in n.storage) or len(set(n.storage))>1 or any(q!='const' for q in n.quals):raise CError('暂不支持此存储类别或限定符')
    v.generic_visit(n)
  Validator().visit(tree)
 def run(self,code,stdin=''):
  self.random_state=1
  if not isinstance(stdin,str) or len(stdin)>100000:raise CError('标准输入必须为100KB以内字符串')
  self.input_text=stdin
  if not isinstance(code,str):raise CError('代码必须为字符串')
  if len(code)>50000:raise CError('代码超过长度限制')
  code=splice_lines(code)
  # Preserve strings and line numbers while removing comments.
  code=re.sub('"(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\'|/\\*.*?\\*/|//[^\\n]*',lambda m:m.group() if m.group().startswith((chr(34),chr(39))) else ' '+ '\n'*m.group().count('\n'),code,flags=re.S)
  code=preprocess(code,CError)
  self.preprocessed_source=code
  tree=c_parser.CParser().parse(code)
  class RejectBitfields(c_ast.NodeVisitor):
   def visit_Decl(v,n):
    if n.bitsize is not None:
     error=CError('暂不支持位域');coord=n.coord or n.bitsize.coord;error.line=coord.line if coord else None;raise error
    v.generic_visit(n)
  RejectBitfields().visit(tree)
  self.funcs={n.decl.name:n for n in tree.ext if isinstance(n,c_ast.FuncDef)}
  if sum(isinstance(node,c_ast.FuncDef) for node in tree.ext)!=len(self.funcs):raise CError('重复函数定义')
  self.resolve_aliases(tree)
  self.normalize_integer_types(tree)
  self.validate(tree)
  declarations={}
  for node in tree.ext:
   if isinstance(node,c_ast.Decl) and node.name and not isinstance(node.type,c_ast.FuncDecl):
    if node.name in declarations and not self.object_types_compatible(node.type,declarations[node.name]):raise CError('全局对象声明类型冲突：'+node.name)
    if node.name not in declarations or not isinstance(node.type,c_ast.ArrayDecl) or node.type.dim is not None:declarations[node.name]=node.type
  self.merge_global_objects(tree)
  for n in tree.ext:
   if not isinstance(n,c_ast.FuncDef):self.exec(n)
  if 'main' not in self.funcs:raise CError('缺少 main 函数')
  terminated=False
  try:exit_code=self.expr(c_ast.FuncCall(c_ast.ID('main'),None))
  except ProgramExit as termination:exit_code=termination.status;terminated=True
  exit_code=int(exit_code) if isinstance(exit_code,int) else 0
  if self.steps:
   last=copy.deepcopy(self.steps[-1]);last['event']='complete';last['description']=('程序通过 exit 结束' if terminated else '程序执行完成')+'，退出码 '+str(exit_code);last['exit_code']=exit_code;last['termination']='exit' if terminated else 'main';last['stack']=[];last['frames']=[];last['reads']=[];last['writes']=[];last['expression']='';last.pop('result',None);last.pop('decision',None);last['objects']=self.graph();self.steps.append(last)
  return dict(steps=self.steps,output=self.output,status='completed',exit_code=exit_code,termination='exit' if terminated else 'main',mode='受限 C 解释器',preprocessed_source=code)
def trace(code,stdin=''):return Engine().run(code,stdin)

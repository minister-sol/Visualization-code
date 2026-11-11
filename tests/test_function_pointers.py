import unittest
from backend.engine import trace

class FunctionPointers(unittest.TestCase):
 def test_callback_parameter_and_explicit_dereference(self):
  source='int compare(int a,int b){return a-b;}int choose(int a,int b,int (*cmp)(int,int)){return (*cmp)(a,b)<0?a:b;}int main(){int (*p)(int,int)=&compare;printf("%d %d",choose(7,3,p),p==compare);}'
  self.assertEqual(trace(source)['output'],'3 1')
 def test_struct_callback(self):
  source='int plus(int a,int b){return a+b;}struct Ops{int (*combine)(int,int);};int main(){struct Ops o={plus};printf("%d",o.combine(3,4));}'
  self.assertEqual(trace(source)['output'],'7')
 def test_invalid_signature(self):
  with self.assertRaisesRegex(Exception,'签名'):trace('int f(int x){return x;}int main(){int (*p)(int,int)=f;}')
 def test_null_callback(self):
  with self.assertRaisesRegex(Exception,'函数指针'):trace('int main(){int (*p)(int)=0;p(1);}')

 def test_reassignment_signature_checked(self):
  with self.assertRaisesRegex(Exception,'签名'):trace('int f(int x){return x;}int g(int a,int b){return a+b;}int main(){int (*p)(int)=f;p=g;}')
 def test_callback_sizeof_and_data_pointer_single_evaluation(self):
  source='int f(int x){return x;}int main(){int (*p)(int)=f;int a[2]={7,9};int *cursor=a;int value=*cursor++;printf("%zu %d %d",sizeof(p(1)),value,*cursor);}'
  self.assertEqual(trace(source)['output'],'4 7 9')

 def test_dispatch_array_and_function_parameter_adjustment(self):
  source='int add(int a,int b){return a+b;}int sub(int a,int b){return a-b;}int invoke(int operation(int,int),int x,int y){return operation(x,y);}int main(){int (*ops[2])(int,int)={add,sub};printf("%d %d",invoke(ops[0],7,3),ops[1](7,3));}'
  self.assertEqual(trace(source)['output'],'10 4')
 def test_array_slot_signature(self):
  for assignment in ['int (*ops[1])(int)={wrong};','int (*ops[1])(int)={right};ops[0]=wrong;']:
   with self.subTest(assignment=assignment),self.assertRaisesRegex(Exception,'签名'):
    trace('int right(int x){return x;}int wrong(int x,int y){return x+y;}int main(){'+assignment+'}')
 def test_uninitialized_pointer_can_be_assigned(self):
  self.assertEqual(trace('int f(int x){return x+1;}int main(){int (*p)(int);p=f;printf("%d",p(7));}')['output'],'8')

 def test_factory_and_function_designator_ternary(self):
  source='typedef int (*Operation)(int);int plus(int x){return x+1;}int minus(int x){return x-1;}Operation factory(int mode){return mode?plus:minus;}int main(){Operation p=factory(1);printf("%d %d",p(7),factory(0)(7));}'
  self.assertEqual(trace(source)['output'],'8 6')
 def test_pointer_ternary_and_null_branch(self):
  source='int f(int x){return x;}int main(){int (*a)(int)=f;int (*b)(int)=&f;int (*p)(int)=1?a:b;int (*q)(int)=0?f:0;printf("%d %d",p(7),q==0);}'
  self.assertEqual(trace(source)['output'],'7 1')
 def test_wrong_factory_return_rejected(self):
  with self.assertRaisesRegex(Exception,'签名'):trace('typedef int (*Operation)(int);int f(int x,int y){return x+y;}Operation factory(){return f;}int main(){factory();}')
 def test_function_reference_not_data_pointer(self):
  with self.assertRaisesRegex(Exception,'数据指针'):trace('int f(int x){return x;}int main(){int *p=f;}')

 def test_dispatch_alias_has_visible_reference_elements(self):
  source='int inc(int x){return x+1;}int dec(int x){return x-1;}int apply(int (**operations)(int),int slot,int value){return operations[slot](value);}int main(){int (*table[2])(int)={inc,dec};printf("%d",apply(table,1,7));}'
  result=trace(source)
  self.assertEqual(result['output'],'6')
  step=next(s for s in result['steps'] if isinstance(s['variables'].get('operations'),dict))
  self.assertEqual([v['function'] for v in step['variables']['operations']['elements']],['inc','dec'])
  self.assertIn('operations',step['arrays'])
 def test_pointer_array_self_reference_is_bounded(self):
  result=trace('int main(){void *links[1];links[0]=links;void **view=links;printf("%d",view[0]==links);}')
  self.assertEqual(result['output'],'1')
  import json
  self.assertLess(len(json.dumps(result)),200000)

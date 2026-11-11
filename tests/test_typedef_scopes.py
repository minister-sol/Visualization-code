import unittest
from backend.engine import trace

class TypedefScopes(unittest.TestCase):
 def test_local_shadow_restores_outer(self):
  code='typedef int Item;int main(){Item outer=3;{typedef long long Item;Item wide=9007199254740993LL;printf("%lld ",wide);}Item last=7;printf("%d %d",outer,last);}'
  self.assertEqual(trace(code)['output'],'9007199254740993 3 7')
 def test_function_local_alias_does_not_leak(self):
  code='typedef int Item;void f(){typedef char Item;Item x=65;printf("%c ",x);}int main(){f();Item x=300;printf("%d",x);}'
  self.assertEqual(trace(code)['output'],'A 300')
 def test_local_pointer_and_fixed_array_alias(self):
  self.assertEqual(trace('struct N {int x;};int main(){typedef struct N *Handle;typedef int Pair[2];struct N n={5};Handle p=&n;Pair values={2,3};printf("%d",p->x+values[1]);}')['output'],'8')
 def test_variably_modified_alias_captures_definition_length(self):
  self.assertEqual(trace('int main(){int n=2;typedef int A[n];n=5;A a;a[1]=7;printf("%zu %d",sizeof(a),a[1]);}')['output'],'8 7')

 def test_local_inline_node_typedef(self):
  code='int main(){typedef struct Node {int value;struct Node *next;} Node;Node a={3,0};Node b={7,&a};printf("%d",b.next->value);}'
  self.assertEqual(trace(code)['output'],'3')
 def test_local_tag_shadows_global_and_restores(self):
  code='struct N {int outer;};int main(){struct N a={3};{struct N {int inner;};struct N b={7};printf("%d ",b.inner);}struct N c={9};printf("%d %d",a.outer,c.outer);}'
  self.assertEqual(trace(code)['output'],'7 3 9')
 def test_local_forward_tag(self):
  code='struct N {int global;};int main(){struct N;struct N *p=0;struct N {int local;};struct N a={8};p=&a;printf("%d",p->local);}'
  self.assertEqual(trace(code)['output'],'8')
 def test_distinct_anonymous_structs_not_assignable(self):
  with self.assertRaises(Exception):trace('int main(){struct {int x;} a={1};struct {int x;} b={2};a=b;}')

 def test_internal_tag_names_not_exposed_in_expressions(self):
  result=trace('int main(){typedef struct Item {int x;} Item;Item a={3};}')
  self.assertFalse(any('__scope_' in step.get('expression','') for step in result['steps']))

 def test_vla_alias_bound_evaluated_once(self):
  self.assertEqual(trace('int main(){int n=2;typedef int A[n++];A a;A b;printf("%d %zu %zu",n,sizeof(a),sizeof(b));}')['output'],'3 8 8')
 def test_nested_vla_alias_and_typename_sizeof(self):
  source='int main(){int n=2;typedef int Row[n];int m=3;typedef Row Matrix[m];n=7;m=8;Matrix values;values[2][1]=9;printf("%zu %zu %d",sizeof(Row),sizeof(Matrix),values[2][1]);}'
  self.assertEqual(trace(source)['output'],'8 24 9')
 def test_vla_alias_scopes_and_repeated_calls(self):
  source='void f(int n){typedef int Row[n];Row values;values[0]=n;printf("%zu ",sizeof(values));}int main(){f(2);f(3);}'
  self.assertEqual(trace(source)['output'],'8 12 ')
 def test_invalid_vla_alias_extent(self):
  for n in [0,-1,1001]:
   with self.subTest(n=n),self.assertRaises(Exception):trace('int main(){int n='+str(n)+';typedef int Row[n];}')

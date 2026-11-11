import unittest
from backend.engine import trace, CError

class GlobalDefinitions(unittest.TestCase):
 def test_tentative_after_initialized_does_not_reset(self):
  result=trace('int count=7;int count;int count;int main(){printf("%d",count);}')
  self.assertEqual(result['output'],'7')
  self.assertEqual(len([s for s in result['steps'] if s['event']=='declare' and 'count' in s['variables']]),1)
 def test_complete_and_incomplete_array_declarations(self):
  self.assertEqual(trace('int a[];extern int a[3];int a[3]={2,4,6};int a[];int main(){printf("%d %zu",a[2],sizeof(a));}')['output'],'6 12')
 def test_unsized_tentative_defaults_to_one_element(self):
  self.assertEqual(trace('int a[];int main(){printf("%d %zu",a[0],sizeof(a));}')['output'],'0 4')
 def test_pointer_keeps_initialized_array_identity(self):
  source='int data[2];int *pointer=data;int data[2]={7,9};int main(){pointer[1]=8;printf("%d %d",data[0],data[1]);}'
  self.assertEqual(trace(source)['output'],'7 8')
 def test_struct_and_enum_declarations_preserved(self):
  source='struct S{int n;}item;struct S item={7};enum E{N=3}state;enum E state=N;int main(){printf("%d %d",item.n,state);}'
  self.assertEqual(trace(source)['output'],'7 3')
 def test_duplicate_initializers_rejected(self):
  with self.assertRaisesRegex(CError,'重复初始化'):trace('int n=1;int n=2;int main(){}')
 def test_only_extern_declaration_does_not_allocate(self):
  result=trace('extern int unused;int main(){int n=3;}')
  self.assertTrue(all('unused' not in s['variables'] for s in result['steps']))

 def test_later_struct_definition_completes_tentative_object(self):
  self.assertEqual(trace('struct S item;struct S{int n;}item;int main(){item.n=7;printf("%d",item.n);}')['output'],'7')
 def test_enum_multiple_objects_and_prior_enum_dependencies(self):
  self.assertEqual(trace('enum A{M=3};enum E{N=M+1}a,b;int main(){printf("%d %d %d",N,a,b);}')['output'],'4 0 0')

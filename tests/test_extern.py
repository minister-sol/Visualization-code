import unittest
from backend.engine import trace, CError

class ExternalDeclarations(unittest.TestCase):
 def test_forward_objects_and_functions(self):
  source='extern int count;extern int values[];extern int sum(void);int main(){printf("%d",sum());}int count=3;int values[3]={2,4,6};int sum(void){int result=0;for(int i=0;i<count;i++)result+=values[i];return result;}'
  self.assertEqual(trace(source)['output'],'12')
 def test_local_extern_shadows_outer_local_and_shares_global_storage(self):
  source='int value=3;void bump(void){extern int value;value++;}int main(){int value=99;{extern int value;value=7;bump();printf("%d ",value);}printf("%d",value);}'
  result=trace(source);self.assertEqual(result['output'],'8 99')
  write=next(s for s in result['steps'] if s['event']=='write' and s['result']==7)
  updated=next(s for s in result['steps'] if s['event']=='write' and s['result']==8)
  self.assertEqual(write['bindings']['value'],updated['bindings']['value'])
 def test_array_struct_pointer_and_const_bindings(self):
  source='struct N{int n;};struct N item={7};int data[2]={1,2};int *pointer=data;const int limit=9;void update(){extern struct N item;extern int data[];extern int *pointer;extern const int limit;item.n=limit;pointer=data+1;*pointer=8;}int main(){update();printf("%d %d",item.n,data[1]);}'
  self.assertEqual(trace(source)['output'],'9 8')
  with self.assertRaises(CError):trace('const int n=3;int main(){extern const int n;n=4;}')
 def test_global_extern_after_definition_does_not_reset(self):
  self.assertEqual(trace('int n=7;extern int n;int main(){printf("%d",n);}')['output'],'7')
 def test_extern_initializer_is_global_definition(self):
  self.assertEqual(trace('extern int n=7;int main(){printf("%d",n);}')['output'],'7')
 def test_missing_and_conflicting_objects_rejected(self):
  for source in ['extern int n;long n;int main(){}','extern int a[2];int a[3];int main(){}','int n;int main(){extern long n;}','int main(){extern int missing;printf("%d",missing);}','int n;int main(){extern int n=1;}','int n;int main(){int n=3;extern int n;}']:
   with self.subTest(source=source),self.assertRaises(CError):trace(source)
 def test_equivalent_array_bounds(self):
  self.assertEqual(trace('extern int a[1+1];int a[2]={3,4};int main(){printf("%d",a[1]);}')['output'],'4')
 def test_external_array_survives_local_scope(self):
  self.assertEqual(trace('int a[2]={3,4};void touch(){extern int a[];a[0]=8;}int main(){touch();printf("%d",a[0]);}')['output'],'8')

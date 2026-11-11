import unittest
from backend.engine import trace
class SemanticsTests(unittest.TestCase):
 def test_callee_cannot_read_caller_local(self):
  with self.assertRaisesRegex(Exception,'未定义变量'):trace('int f(){return x;} int main(){int x=3;return f();}')
 def test_global_and_shadow(self):
  r=trace('int x=7; int f(){return x;} int main(){int x=3;printf("%d",f());return 0;}');self.assertEqual(r['output'],'7')
 def test_for_scope(self):
  with self.assertRaisesRegex(Exception,'未定义变量'):trace('int main(){for(int i=0;i<1;i++){}return i;}')
 def test_rejections(self):
  for code in ['int main(){long double x=1.2L;}','int main(){int x=2147483647;x++;}','int main(){int x=2;while(x>0)x*=x;}','int main(){printf("%1000000000d",1);}','int main(){return 0;}'+ ' '*50001]:
   with self.subTest(code=code[:60]):
    with self.assertRaises(Exception):trace(code)
 def test_stdin_accepted(self):
  self.assertEqual(trace('int main(){return 0;}','1')['status'],'completed')
 def test_comments_preserve_strings(self):self.assertEqual(trace('int main(){puts("http://x");return 0;}')['output'],'http://x\n')
 def test_printf_percent(self):self.assertEqual(trace('int main(){printf("100%% %d",2);return 0;}')['output'],'100% 2')

 def test_matrix_custom_code(self):
  r=trace('int main(){int grid[2][3]={{1,2,3},{4,5,6}};grid[1][2]=grid[0][1]+9;printf("%d",grid[1][2]);}')
  self.assertEqual(r['output'],'11')
  self.assertTrue(any(s['variables'].get('grid')==[[1,2,3],[4,5,11]] for s in r['steps']))
 def test_matrix_bounds(self):
  with self.assertRaises(Exception):trace('int main(){int grid[2][3]={{1}};grid[0][3]=7;}')
 def test_matrix_budget(self):
  with self.assertRaises(Exception):trace('int main(){int grid[100][100];}')

 def test_explicit_integer_conversions(self):
  self.assertEqual(trace('int main(){long long wide=(long long)100000*100000;int narrowed=(int)4294967297LL;char c=(char)255;printf("%lld %d %d",wide,narrowed,c);}')['output'],'10000000000 1 -1')
 def test_cast_is_an_execution_event(self):
  result=trace('int main(){int x=(int)7LL;}')
  self.assertTrue(any(s['event']=='compute' and s['expression']=='(int) 7LL' and s['result']==7 for s in result['steps']))
 def test_integer_address_cast_still_rejected(self):
  with self.assertRaises(Exception):trace('int main(){int *p=(int *)17;}')

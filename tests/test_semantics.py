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
  for code in ['int main(){double x=1.2;}','int main(){int a[2][2];}','#define X 1\nint main(){return X;}','int main(){int x=2147483647;x++;}','int main(){int x=2;while(x>0)x*=x;}','int main(){printf("%1000000000d",1);}','int main(){return 0;}'+ ' '*50001]:
   with self.subTest(code=code[:60]):
    with self.assertRaises(Exception):trace(code)
 def test_stdin_rejected(self):
  with self.assertRaisesRegex(Exception,'标准输入'):trace('int main(){return 0;}','1')
 def test_comments_preserve_strings(self):self.assertEqual(trace('int main(){puts("http://x");return 0;}')['output'],'http://x\n')
 def test_printf_percent(self):self.assertEqual(trace('int main(){printf("100%% %d",2);return 0;}')['output'],'100% 2')

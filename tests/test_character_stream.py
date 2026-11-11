import unittest
from backend.engine import trace

class CharacterStream(unittest.TestCase):
 def test_spaces_newlines_and_eof(self):
  result=trace('#include <stdio.h>\nint main(){int c;while((c=getchar())!=EOF)putchar(c);printf("%d",getchar());}','a b\n')
  self.assertEqual(result['output'],'a b\n-1')
  inputs=[s for s in result['steps'] if s['event']=='input']
  self.assertEqual([s['input']['position'] for s in inputs],[1,2,3,4,4,4])
 def test_mixed_scan_and_character_input(self):
  self.assertEqual(trace('int main(){int n;scanf("%d",&n);int space=getchar();int c=getchar();printf("%d %d %c",n,space,c);}','7 X')['output'],'7 32 X')
 def test_putchar_return_and_conversion(self):
  self.assertEqual(trace('int main(){int result=putchar(321);printf(" %d",result);}')['output'],'A 65')
 def test_unevaluated_getchar(self):
  result=trace('int main(){printf("%zu %c",sizeof(getchar()),getchar());}','Z')
  self.assertEqual(result['output'],'4 Z')
 def test_invalid_arguments(self):
  for code in ['int main(){getchar(1);}','int main(){putchar();}']:
   with self.subTest(code=code),self.assertRaises(Exception):trace(code)

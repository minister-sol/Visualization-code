import unittest
from backend.engine import trace

class SwitchExecution(unittest.TestCase):
 def test_grouped_labels_and_fallthrough(self):
  self.assertEqual(trace('int main(){int x=2;int result=0;switch(x){case 1:case 2:result+=3;case 3:result+=4;break;default:result=9;}printf("%d",result);}')['output'],'7')
 def test_default_in_middle(self):
  self.assertEqual(trace('int main(){int result=0;switch(8){case 1:result=1;break;default:result=3;case 2:result+=4;}printf("%d",result);}')['output'],'7')
 def test_loop_continue_is_not_switch_break(self):
  self.assertEqual(trace('int main(){int sum=0;for(int i=0;i<4;i++){switch(i){case 1:continue;case 2:break;default:sum+=i;}sum+=10;}printf("%d",sum);}')['output'],'33')
 def test_constant_labels_and_no_match(self):
  self.assertEqual(trace('int main(){int x=1;switch(9){case 2+3:x=4;}printf("%d",x);}')['output'],'1')
 def test_duplicate_labels_rejected(self):
  for code in ['int main(){switch(1){case 1:break;case 1:break;}}','int main(){switch(1){default:break;default:break;}}']:
   with self.subTest(code=code),self.assertRaises(Exception):trace(code)

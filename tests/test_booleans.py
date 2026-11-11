import unittest
from backend.engine import trace

class BooleanData(unittest.TestCase):
 def test_header_and_normalized_assignments(self):
  code='#include <stdbool.h>\nint main(){bool a=false;bool b=-7;bool c=99;printf("%d %d %d",a,b,c);}'
  self.assertEqual(trace(code)['output'],'0 1 1')
 def test_array_and_parameter(self):
  self.assertEqual(trace('#include <stdbool.h>\nint count(bool flag){return flag+3;}int main(){bool marks[3]={false,true,7};printf("%d %d",marks[2],count(-4));}')['output'],'1 4')
 def test_bool_cast_pointer_and_promotion(self):
  self.assertEqual(trace('int main(){int x=1;_Bool b=(_Bool)&x;printf("%d %d",b,b<<2);}')['output'],'1 4')

 def test_boolean_type_metadata(self):
  result=trace('_Bool yes=1;int main(){_Bool marks[2]={0,1};int counts[2]={0,1};}')
  step=next(s for s in result['steps'] if 'marks' in s['variables'])
  self.assertIn('yes',step['booleans']);self.assertIn('marks',step['booleans']);self.assertNotIn('counts',step['booleans'])

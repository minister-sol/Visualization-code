import unittest
from backend.engine import trace, CError

class IntegerLibrary(unittest.TestCase):
 def test_absolute_value_widths_and_conversion(self):
  source='#include <stdlib.h>\nint main(){printf("%d %ld %lld %zu %zu %zu",abs(-12),labs(-3000000000L),llabs(-4000000000LL),sizeof(abs(1)),sizeof(labs(1)),sizeof(llabs(1)));}'
  self.assertEqual(trace(source)['output'],'12 3000000000 4000000000 4 8 8')
 def test_parameter_conversion(self):
  self.assertEqual(trace('int main(){printf("%d %ld",abs(-2.9),labs(-3.9));}')['output'],'2 3')
 def test_minimum_value_overflow_keeps_trace(self):
  for expression in ['abs(-2147483647-1)','labs(-9223372036854775807L-1)','llabs(-9223372036854775807LL-1)']:
   with self.subTest(expression=expression),self.assertRaises(CError) as caught:
    trace('int main(){long long value='+expression+';}')
   self.assertIn('溢出',str(caught.exception))
   self.assertEqual(caught.exception.steps[-1]['event'],'error')
 def test_argument_validation(self):
  for expression in ['abs()','abs(1,2)','labs("x")']:
   with self.subTest(expression=expression),self.assertRaises(CError):trace('int main(){int value='+expression+';}')
 def test_returns_visible_in_trace(self):
  result=trace('int main(){int n=-7;int distance=abs(n);}')
  self.assertTrue(any(s['event']=='return' and s['result']==7 and s['expression']=='abs(n)' for s in result['steps']))
  self.assertTrue(any(s['variables'].get('distance')==7 for s in result['steps']))

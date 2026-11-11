import unittest
from backend.engine import trace, CError

class SignedRightShift(unittest.TestCase):
 def test_arithmetic_right_shift_and_unsigned_promotion(self):
  source='int main(){int negative=-7;unsigned char byte=255;unsigned int mask=4294967295u;printf("%d %d %u",negative>>1,byte>>1,mask>>31);}'
  self.assertEqual(trace(source)['output'],'-4 127 1')
 def test_invalid_shifts_keep_error_trace(self):
  for expression in ['-1<<1','1<<32','1>>-1','1>>32']:
   with self.subTest(expression=expression),self.assertRaises(CError) as caught:trace('int main(){int n='+expression+';}')
   self.assertEqual(caught.exception.steps[-1]['event'],'error')

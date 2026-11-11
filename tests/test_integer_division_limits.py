import unittest
from backend.engine import trace, CError

class IntegerDivisionLimits(unittest.TestCase):
 def test_minimum_division_and_remainder_overflow(self):
  for typ,minimum in [('int','(-2147483647-1)'),('long long','(-9223372036854775807LL-1)')]:
   for operator in ['/','%']:
    with self.subTest(typ=typ,operator=operator),self.assertRaisesRegex(CError,'溢出') as caught:
     trace('int main(){'+typ+' value='+minimum+';'+typ+' result=value'+operator+'-1;}')
    self.assertEqual(caught.exception.steps[-1]['event'],'error')
 def test_signed_remainder_and_unsigned_conversion(self):
  source='int main(){int value=-7;printf("%d %d %u",value/3,value%3,(-2147483647-1)%-1u);}'
  self.assertEqual(trace(source)['output'],'-2 -1 2147483648')

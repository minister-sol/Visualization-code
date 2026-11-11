import unittest
from backend.engine import trace

class FixedWidth(unittest.TestCase):
 def test_stdint_aliases_and_limits(self):
  source='#include <stdint.h>\nint main(){uint16_t small=UINT16_MAX;small++;uint32_t hash=UINT32_MAX;hash+=2;int16_t low=INT16_MIN;printf("%d %u %d",small,hash,low);}'
  self.assertEqual(trace(source)['output'],'0 1 -32768')
 def test_signed_short_bounds(self):
  with self.assertRaises(Exception):trace('int main(){short n=32768;}')
 def test_64bit_and_repeated_include(self):
  source='#include <stdint.h>\n#include <stdint.h>\nint main(){uint64_t value=UINT64_MAX;value++;printf("%llu",(unsigned long long)value);}'
  self.assertEqual(trace(source)['output'],'0')
 def test_header_keeps_source_line_numbers(self):
  result=trace('#include <stdint.h>\nint main(){uint32_t n=7;printf("%u",n);}')
  self.assertTrue(any(s['event']=='declare' and s['line']==2 for s in result['steps']))

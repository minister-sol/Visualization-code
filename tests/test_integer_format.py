import unittest
from backend.engine import trace

class IntegerFormatting(unittest.TestCase):
 def test_width_sign_and_zero_padding(self):
  self.assertEqual(trace('int main(){printf("[%05d][%+6d][%-6d][% d]",-7,12,3,4);}')['output'],'[-0007][   +12][3     ][ 4]')
 def test_precision_and_alternative_prefix(self):
  self.assertEqual(trace('int main(){printf("[%#08x][%#.0o][%.0d][%08.4d][%#.4o]",42u,0u,0,7,1u);}')['output'],'[0x00002a][0][][    0007][0001]')
 def test_narrow_integer_output(self):
  self.assertEqual(trace('int main(){printf("%hhd %hhu %hx %08llX",255,257,65537,42ULL);}')['output'],'-1 1 1 0000002A')
 def test_output_format_is_bounded(self):
  for spec in ['%1001d','%.1001d','%*d']:
   with self.subTest(spec=spec),self.assertRaises(Exception):trace('int main(){printf("'+spec+'",7);}')

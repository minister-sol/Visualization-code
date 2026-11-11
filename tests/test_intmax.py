import unittest
from backend.engine import trace

class MaximumWidthIntegers(unittest.TestCase):
 def test_types_limits_and_output(self):
  source='#include <stdint.h>\nint main(){intmax_t low=INTMAX_MIN;uintmax_t high=UINTMAX_MAX;printf("%jd %ju %zu",low,high,sizeof(low));}'
  self.assertEqual(trace(source)['output'],'-9223372036854775808 18446744073709551615 8')
 def test_maximum_width_input(self):
  source='#include <stdint.h>\nint main(){intmax_t a;uintmax_t b;scanf("%jd %jx",&a,&b);printf("%jd %jx",a,b);}'
  self.assertEqual(trace(source,'-3000000000 100000000')['output'],'-3000000000 100000000')

 def test_portable_fixed_width_output_macros(self):
  source='#include <inttypes.h>\nint main(){int64_t n=-3000000000LL;uint32_t bits=42;printf("%" PRId64 " %" PRIx32,n,bits);}'
  self.assertEqual(trace(source)['output'],'-3000000000 2a')
 def test_portable_input_macros_and_maximum_width(self):
  source='#include <inttypes.h>\nint main(){uint64_t n;int8_t small;intmax_t value;scanf("%" SCNu64 " %" SCNd8 " %" SCNdMAX,&n,&small,&value);printf("%" PRIu64 " %d %" PRIdMAX,n,small,value);}'
  self.assertEqual(trace(source,'4294967296 -7 -3000000000')['output'],'4294967296 -7 -3000000000')

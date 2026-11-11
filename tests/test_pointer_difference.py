import unittest
from backend.engine import trace

class PointerDifference(unittest.TestCase):
 def test_actual_value_width_matches_expression_type(self):
  result=trace('int main(){int a[3];printf("%d %zu",(a-(a+2))<1u,sizeof(a-(a+2)));}')
  self.assertEqual(result['output'],'1 8')
 def test_ptrdiff_typedef_and_negative_distance(self):
  self.assertEqual(trace('#include <stddef.h>\nint main(){int a[4];ptrdiff_t distance=a-(a+3);printf("%lld %zu",distance,sizeof(distance));}')['output'],'-3 8')

 def test_ptrdiff_output_formats(self):
  source='#include <stddef.h>\nint main(){int a[4];ptrdiff_t distance=a-(a+3);printf("%td %+.4ti %06td",distance,distance,distance);}'
  self.assertEqual(trace(source)['output'],'-3 -0003 -00003')
 def test_unsigned_ptrdiff_output_uses_model_width(self):
  self.assertEqual(trace('int main(){printf("%tu %tx",4294967296ULL,4294967296ULL);}')['output'],'4294967296 100000000')

 def test_ptrdiff_scan_and_input_write(self):
  result=trace('#include <stddef.h>\nint main(){ptrdiff_t distance;scanf("%td",&distance);printf("%td",distance);}','-3000000000')
  self.assertEqual(result['output'],'-3000000000')
  self.assertTrue(any(step['event']=='input' and step['writes'][0]['value']==-3000000000 for step in result['steps'] if step['writes']))
 def test_size_and_unsigned_distance_input(self):
  source='#include <stddef.h>\nint main(){size_t count;unsigned long long mask;scanf("%zu %tx",&count,&mask);printf("%zu %tx",count,mask);}'
  self.assertEqual(trace(source,'4294967296 100000000')['output'],'4294967296 100000000')
 def test_ptrdiff_scan_rejects_wrong_target_width(self):
  with self.assertRaises(Exception):trace('int main(){int distance;scanf("%td",&distance);}','3')

 def test_interval_input_controls_physical_pointer_reads(self):
  from tests.test_algorithm_corpus import INPUT_PROGRAMS
  source,_,_=INPUT_PROGRAMS['pointer_interval_sum']
  for stdin,expected,status in [('1 4','18 3',0),('2 2','0 0',0),('-1 3','',2),('0 6','',2)]:
   with self.subTest(stdin=stdin):
    result=trace(source,stdin)
    self.assertEqual(result['output'],expected)
    self.assertEqual(result['exit_code'],status)
    if stdin=='1 4':
     reads=[access for step in result['steps'] if step['event']=='read' and step['expression']=='*cursor' for access in step['reads']]
     self.assertEqual([access['index'] for access in reads],[1,2,3])
     self.assertEqual(len({access['array'] for access in reads}),1)

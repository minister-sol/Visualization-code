import unittest
from backend.engine import trace, CError

class ByteSearch(unittest.TestCase):
 def test_searches_after_zero_and_preserves_alias(self):
  source='int main(){unsigned char data[4]={7,0,255,9};unsigned char *p=memchr(data,255,4);*p=8;printf("%d %td",data[2],p-data);}'
  self.assertEqual(trace(source)['output'],'8 2')
 def test_missing_zero_count_and_converted_byte(self):
  self.assertEqual(trace('int main(){char a[2]={1,2};printf("%d %d %d",memchr(a,3,2)==0,memchr(a,1,0)==0,memchr(a,257,2)==a);}')['output'],'1 1 1')
 def test_reads_stop_at_match(self):
  result=trace('int main(){char a[3]={1,2,3};char *p=memchr(a,2,3);}')
  reads=[a for s in result['steps'] if s['expression'].startswith('memchr(') for a in s['reads'] if 'index' in a]
  self.assertEqual([a['index'] for a in reads],[0,1])
 def test_bounds_and_readonly_targets(self):
  with self.assertRaises(CError):trace('int main(){char a[2]={1,2};memchr(a,1,3);}')
  with self.assertRaises(CError):trace('int main(){char *p=memchr("abc",98,3);*p=120;}')

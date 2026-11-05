import unittest
from backend.engine import trace
from backend.examples import EXAMPLES
class InputTests(unittest.TestCase):
 def test_prefix(self):
  example=next(e for e in EXAMPLES if e['id']=='prefix')
  r=trace(example['code'],'5 1 2 3 4 5 3 1 3 2 5 1 5')
  self.assertEqual(r['output'],'6\n14\n15\n')
  self.assertTrue(any(s['writes'] and s['event']=='input' for s in r['steps']))
  self.assertTrue(all('expression' in s and 'input' in s for s in r['steps']))
 def test_long_long_precision(self):
  r=trace('int main(){long long x;scanf("%lld",&x);x=x+1;printf("%lld",x);return 0;}','9007199254740992')
  self.assertEqual(r['output'],'9007199254740993')
  self.assertTrue(any(s['variables'].get('x')=='9007199254740993' for s in r['steps']))
 def test_long_long_division(self):
  self.assertEqual(trace('int main(){long long x=9007199254740993LL;printf("%lld",x/3);return 0;}')['output'],'3002399751580331')
 def test_uninitialized_array(self):
  with self.assertRaisesRegex(Exception,'未初始化'):trace('int main(){int a[2];return a[1];}')
 def test_uninitialized_scalar(self):
  with self.assertRaisesRegex(Exception,'未初始化'):trace('int main(){int x;return x;}')
 def test_eof(self):
  self.assertEqual(trace('int main(){int x;int r=scanf("%d",&x);printf("%d",r);return 0;}')['output'],'-1')
 def test_mismatch(self):
  self.assertEqual(trace('int main(){int x;int r=scanf("%d",&x);printf("%d",r);return 0;}','abc')['output'],'0')
 def test_format_type_mismatch(self):
  with self.assertRaisesRegex(Exception,'类型不匹配'):trace('int main(){int x;scanf("%lld",&x);}','1')
 def test_64_bit_overflow(self):
  with self.assertRaisesRegex(Exception,'溢出'):trace('int main(){long long x=9223372036854775807LL;x++;}')
 def test_transfer_metadata_and_final_snapshot(self):
  r=trace('int main(){int a[2]={2,3};int b[2];b[1]=a[0]+a[1];return 0;}')
  write=next(s for s in r['steps'] if s['event']=='write' and s['writes'][0]['name']=='b')
  self.assertEqual([(x['name'],x.get('index')) for x in write['reads']],[('a',0),('a',1)])
  self.assertEqual(write['writes'][0],{'name':'b','index':1,'value':5})
  self.assertEqual(r['steps'][-1]['variables']['b'],[None,5])
 def test_chinese_string(self):self.assertEqual(trace('int main(){puts("你好");return 0;}')['output'],'你好\n')

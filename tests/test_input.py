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
  self.assertEqual({key:write['writes'][0][key] for key in ('name','index','value')},{'name':'b','index':1,'value':5})
  self.assertEqual(write['writes'][0]['array'],write['arrays']['b']['id'])
  self.assertEqual(r['steps'][-1]['variables']['b'],[None,5])
 def test_chinese_string(self):self.assertEqual(trace('int main(){puts("你好");return 0;}')['output'],'你好\n')

 def test_long_formats(self):
  self.assertEqual(trace('int main(){long a;unsigned long b;scanf("%ld %lu",&a,&b);printf("%ld %li %lu",a,a,b);}','-9007199254740993 18446744073709551615')['output'],'-9007199254740993 -9007199254740993 18446744073709551615')
 def test_auto_base_integer_input(self):
  self.assertEqual(trace('int main(){int a;long b;long long c;short d;signed char e;scanf("%i %li %lli %hi %hhi",&a,&b,&c,&d,&e);printf("%d %ld %lld %d %d",a,b,c,d,e);}','0x2a -010 19 077 -0x7f')['output'],'42 -8 19 63 -127')
 def test_long_input_rejects_int_target(self):
  with self.assertRaisesRegex(Exception,'类型不匹配'):trace('int main(){int n;scanf("%ld",&n);}','7')

 def test_long_literal_width_and_members(self):
  self.assertEqual(trace('struct R{long value;unsigned long count;};int main(){struct R r={3L,7UL};r.value+=2L;printf("%ld %lu %zu",r.value,r.count,sizeof(3L));}')['output'],'5 7 8')

 def test_hexadecimal_and_octal_formats(self):
  self.assertEqual(trace('int main(){unsigned int mask;unsigned long wide;unsigned long long octal;scanf("%x %lx %llo",&mask,&wide,&octal);mask|=1u<<3;printf("%x %X %lx %llo",mask,mask,wide,octal);}','0xa0 ff 77')['output'],'a8 A8 ff 77')
 def test_narrow_unsigned_base_input_and_wrap(self):
  self.assertEqual(trace('int main(){unsigned char a;unsigned short b;unsigned int c;scanf("%hhx %ho %x",&a,&b,&c);printf("%u %u %x",a,b,c);}','ff 177777 -1')['output'],'255 65535 ffffffff')
 def test_base_formats_reject_signed_target(self):
  with self.assertRaisesRegex(Exception,'类型不匹配'):trace('int main(){int n;scanf("%x",&n);}','ff')

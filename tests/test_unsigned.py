import unittest
from backend.engine import trace

class UnsignedValues(unittest.TestCase):
 def test_wrap_and_unsigned_comparison(self):
  self.assertEqual(trace('int main(){unsigned int x=4294967295u;x++;unsigned int y=0u;y--;printf("%lld %d",(long long)y,-1<1u);}')['output'],'4294967295 0')
 def test_promotions_and_signed_wider_operand(self):
  self.assertEqual(trace('int main(){unsigned char c=255;int sum=c+1;unsigned int u=4u;long long result=-7LL+u;printf("%d %lld",sum,result);}')['output'],'256 -3')
 def test_array_struct_and_parameter(self):
  code='struct N {unsigned int value;};unsigned int next(unsigned int x){return x+1u;}int main(){unsigned int a[2]={4294967295u,0u};a[1]=next(a[0]);struct N n={4294967295u};n.value+=2u;printf("%lld %lld",(long long)a[1],(long long)n.value);}'
  self.assertEqual(trace(code)['output'],'0 1')
 def test_unsigned_cast_and_bit_operations(self):
  self.assertEqual(trace('int main(){unsigned int mask=(unsigned int)-1;mask=mask>>31;printf("%d",mask==1u);}')['output'],'1')

 def test_unsigned_return_and_output(self):
  self.assertEqual(trace('unsigned int zero(){return 0;}int main(){unsigned long long large=18446744073709551615ULL;printf("%u %llu %d",(unsigned int)-1,large,zero()>-1);}')['output'],'4294967295 18446744073709551615 0')

 def test_unsigned_input_and_normalized_trace(self):
  r=trace('int main(){unsigned int n;unsigned long long large;scanf("%u%llu",&n,&large);printf("%u %llu",n,large);}','-1 18446744073709551615')
  self.assertEqual(r['output'],'4294967295 18446744073709551615')
  step=next(s for s in r['steps'] if s['event']=='input' and s['writes'])
  self.assertEqual(step['writes'][0]['value'],4294967295)
 def test_short_unsigned_input(self):
  self.assertEqual(trace('int main(){unsigned short n;unsigned char c;scanf("%hu %hhu",&n,&c);printf("%u %u",n,c);}','65535 255')['output'],'65535 255')
 def test_input_pointer_and_format_mismatch(self):
  self.assertEqual(trace('int main(){int x=0;int *p=&x;scanf("%d",p);printf("%d",x);}','17')['output'],'17')
  with self.assertRaises(Exception):trace('int main(){unsigned int x;scanf("%d",&x);}','3')

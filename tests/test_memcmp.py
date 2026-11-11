import unittest
from backend.engine import trace, CError

class MemoryComparison(unittest.TestCase):
 def test_binary_buffers_include_zeros_and_unsigned_bytes(self):
  source='int main(){unsigned char a[3]={0,255,1};unsigned char b[3]={0,128,2};printf("%d %d %d",memcmp(a,b,1)==0,memcmp(a,b,3)>0,memcmp(a,a,3)==0);}'
  self.assertEqual(trace(source)['output'],'1 1 1')
 def test_partial_integer_and_different_layouts(self):
  source='int main(){unsigned int n=513;unsigned char bytes[4]={1,2,0,0};printf("%d %d",memcmp(&n,bytes,4)==0,memcmp(&n,bytes,1)==0);}'
  self.assertEqual(trace(source)['output'],'1 1')
 def test_float_representation_and_negative_zero(self):
  source='int main(){float a=1.0f;unsigned char bytes[4]={0,0,128,63};double positive=0.0;double negative=-0.0;printf("%d %d",memcmp(&a,bytes,4)==0,memcmp(&positive,&negative,sizeof(double))<0);}'
  self.assertEqual(trace(source)['output'],'1 1')
 def test_early_stop_and_physical_read_metadata(self):
  result=trace('int main(){unsigned char a[3]={9,2,3};unsigned char b[3]={8,2,3};int result=memcmp(a,b,3);}')
  reads=[a for s in result['steps'] if s['description'].startswith('memcmp 读取') for a in s['reads']]
  self.assertEqual([a['index'] for a in reads],[0,0])
  self.assertEqual([a['byte'] for a in reads],[9,8])
  self.assertTrue(all(a['byte_offset']==0 for a in reads))
 def test_offsets_zero_length_and_unpadded_struct(self):
  self.assertEqual(trace('struct S{int x;int y;};int main(){struct S a={1,2};struct S b={1,3};char text[]="abc";printf("%d %d %d",memcmp(text+1,"bc",2)==0,memcmp(&a,&b,sizeof(a))<0,memcmp(text,"",0)==0);}')['output'],'1 1 1')
 def test_invalid_memory_and_unsupported_representation(self):
  for source in ['int main(){int a;memcmp(&a,&a,4);}','int main(){char a[2]={1,2};memcmp(a,a,3);}','int main(){int *p=0;memcmp(&p,&p,sizeof(p));}','struct S{char c;int n;};int main(){struct S a={1,2};memcmp(&a,&a,sizeof(a));}','int main(){char *p=calloc(2,1*sizeof(char));free(p);memcmp(p,"a",1);}']:
   with self.subTest(source=source),self.assertRaises(CError) as caught:trace(source)
   self.assertEqual(caught.exception.steps[-1]['event'],'error')

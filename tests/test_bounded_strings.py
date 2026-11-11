import unittest
from backend.engine import trace, CError

class BoundedStrings(unittest.TestCase):
 def test_comparison_without_terminators_and_early_stop(self):
  self.assertEqual(trace('int main(){char a[2]={97,98};char b[2]={97,99};printf("%d %d",strncmp(a,b,1)==0,strncmp(a,b,2)<0);}')['output'],'1 1')
  result=trace('int main(){char a[2]={97,0};char b[2]={98,0};int c=strncmp(a,b,100);}')
  reads=[a for s in result['steps'] if s['event']=='read' and s['expression'].startswith('strncmp(') for a in s['reads'] if a.get('name') in ('a','b') and 'array' in a]
  self.assertEqual([a['index'] for a in reads],[0,0])
 def test_padding_and_return_alias(self):
  source='int main(){char out[5]={120,120,120,120,120};char *p=strncpy(out,"ab",4);printf("%d %d %d %s",p==out,out[2],out[3],out);}'
  self.assertEqual(trace(source)['output'],'1 0 0 ab')
 def test_truncation_does_not_add_terminator(self):
  self.assertEqual(trace('int main(){char out[3]={120,120,120};char in[2]={97,98};strncpy(out,in,2);printf("%c%c%c",out[0],out[1],out[2]);}')['output'],'abx')
 def test_offsets_and_zero_count(self):
  self.assertEqual(trace('int main(){char out[]="abcd";strncpy(out+1,"XY",2);strncpy(out,"",0);printf("%s %d",out,strncmp(out,"z",0));}')['output'],'aXYd 0')
 def test_unsigned_character_comparison_and_copy(self):
  self.assertEqual(trace('int main(){signed char a[2]={-1,0};char b[2]={1,0};char c[2];strncpy(c,a,2);printf("%d %d",strncmp(a,b,1)>0,c[0]);}')['output'],'1 -1')
 def test_overflow_const_overlap_and_missing_input(self):
  for source in ['int main(){char a[2];strncpy(a,"abc",3);}','int main(){char a[2]={97,98};char b[3];strncpy(b,a,3);}','int main(){const char a[3]="ab";strncpy(a,"x",2);}','int main(){char a[]="abcd";strncpy(a+1,a,3);}','int main(){char a[2];strncmp(a,"x",1);}','int main(){strncpy("ab","x",1);}']:
   with self.subTest(source=source),self.assertRaises(CError) as caught:trace(source)
   self.assertEqual(caught.exception.steps[-1]['event'],'error')
 def test_bounds_checked_only_when_read(self):
  self.assertEqual(trace('int main(){char a[1]={0};printf("%d",strncmp(a,"",100)==0);}')['output'],'1')
 def test_zero_padding_writes_are_traced(self):
  result=trace('int main(){char out[4];strncpy(out,"x",4);}')
  writes=[a for s in result['steps'] if s['event']=='write' for a in s['writes']]
  self.assertEqual([(a['index'],a['value']) for a in writes],[(0,120),(1,0),(2,0),(3,0)])

 def test_bounded_append_without_source_terminator(self):
  source='int main(){char out[5]="ab";char in[2]={99,100};char *p=strncat(out,in,2);printf("%s %d",out,p==out);}'
  self.assertEqual(trace(source)['output'],'abcd 1')
 def test_bounded_append_stops_at_zero_and_zero_length(self):
  self.assertEqual(trace('int main(){char out[6]="a";strncat(out,"b",4);strncat(out,"hidden",0);printf("%s",out);}')['output'],'ab')
 def test_bounded_append_capacity_and_readonly(self):
  for source in ['int main(){char a[3]="ab";strncat(a,"x",1);}','int main(){strncat("ab","x",1);}']:
   with self.subTest(source=source),self.assertRaises(CError):trace(source)

 def test_bounded_compare_pairs_are_visible(self):
  result=trace('int main(){char a[3]={97,98,120};char b[3]={97,99,121};int order=strncmp(a,b,2);}')
  comparisons=[s for s in result['steps'] if s['event']=='compare']
  self.assertEqual(len(comparisons),2)
  self.assertEqual(comparisons[-1]['result'],-1)
  self.assertEqual([a['index'] for a in comparisons[-1]['reads']],[1,1])
  self.assertEqual([a['value'] for a in comparisons[-1]['reads']],[98,99])

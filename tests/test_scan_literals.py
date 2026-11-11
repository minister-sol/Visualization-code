import unittest
from backend.engine import trace

class ScanLiterals(unittest.TestCase):
 def test_coordinate_separators_and_progress(self):
  result=trace('int main(){int x,y;int count=scanf("(%d,%d)",&x,&y);printf("%d %d %d",count,x,y);}','(3,7)')
  self.assertEqual(result['output'],'2 3 7')
  self.assertTrue(any(s['description'].startswith('匹配输入分隔符') for s in result['steps']))
 def test_key_value_and_whitespace(self):
  self.assertEqual(trace('int main(){int value;scanf("value = %d",&value);printf("%d",value);}','value  =  9')['output'],'9')
 def test_mismatch_preserves_prior_assignments(self):
  self.assertEqual(trace('int main(){int a=0,b=0;int n=scanf("%d,%d",&a,&b);printf("%d %d %d",n,a,b);}','3;7')['output'],'1 3 0')

 def test_percent_literal_not_counted_as_assignment(self):
  self.assertEqual(trace('int main(){int value;int n=scanf("%d%%",&value);printf("%d %d",n,value);}','75%')['output'],'1 75')
 def test_percent_mismatch_keeps_successful_conversion(self):
  self.assertEqual(trace('int main(){int value=0;int n=scanf("%d%%",&value);printf("%d %d",n,value);}','75x')['output'],'1 75')

 def test_consumed_count_excludes_assignment_count(self):
  source='int main(){int value,used;int count=scanf("%d,%n",&value,&used);printf("%d %d %d",value,used,count);}'
  self.assertEqual(trace(source,' 12,rest')['output'],'12 4 1')
 def test_consumed_count_is_per_call_and_needs_no_input(self):
  source='int main(){getchar();int used=9;scanf("%n",&used);printf("%d",used);}'
  self.assertEqual(trace(source,'x')['output'],'0')
 def test_consumed_count_length_modifier(self):
  source='int main(){int value;long long used;scanf("%d%lln",&value,&used);printf("%lld",used);}'
  self.assertEqual(trace(source,'123')['output'],'3')

 def test_integer_width_splits_contiguous_fields(self):
  self.assertEqual(trace('int main(){int a,b,n;scanf("%2d%2d%n",&a,&b,&n);printf("%d %d %d",a,b,n);}','1234')['output'],'12 34 4')
 def test_integer_width_includes_sign_and_length_modifier(self):
  self.assertEqual(trace('int main(){long long a;int b;scanf("%3lld%2d",&a,&b);printf("%lld %d",a,b);}','-1234')['output'],'-12 34')
 def test_integer_width_limit(self):
  from backend.engine import CError
  with self.assertRaises(CError):trace('int main(){int a;scanf("%1001d",&a);}','1')

 def test_float_width_splits_contiguous_fields(self):
  source='int main(){double data[2];int used;scanf("%4lf%4lf%n",&data[0],&data[1],&used);printf("%.2f %.2f %d",data[0],data[1],used);}'
  self.assertEqual(trace(source,'1.252.50')['output'],'1.25 2.50 8')
 def test_float_width_includes_exponent(self):
  source='int main(){float value;int rest;scanf("%5f%2d",&value,&rest);printf("%.1f %d",value,rest);}'
  self.assertEqual(trace(source,'1e+0299')['output'],'100.0 99')
 def test_float_width_skips_leading_space(self):
  source='int main(){double value;int used;scanf("%4lf%n",&value,&used);printf("%.2f %d",value,used);}'
  self.assertEqual(trace(source,'  1.25')['output'],'1.25 6')

 def test_character_block_keeps_spaces_and_no_terminator(self):
  source='int main(){char data[4]={120,120,120,120};int n=scanf("%3c",data);printf("%d [%.4s]",n,data);}'
  self.assertEqual(trace(source,' a ')['output'],'1 [ a x]')
 def test_character_block_offsets_and_count(self):
  source='int main(){char data[4]={97,0,0,0};int used;scanf("%2c%n",data+1,&used);printf("%.3s %d",data,used);}'
  self.assertEqual(trace(source,'bc')['output'],'abc 2')
 def test_character_block_capacity_rejected(self):
  from backend.engine import CError
  with self.assertRaises(CError):trace('int main(){char a[2];scanf("%3c",a);}','abc')

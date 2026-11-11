import unittest
from backend.engine import trace, CError

class DynamicFormats(unittest.TestCase):
 def test_printf_array_format_reads_and_outputs(self):
  result=trace('int main(){char format[]="%d";printf(format,7);}')
  self.assertEqual(result['output'],'7')
  reads=[a for s in result['steps'] for a in s['reads'] if a.get('name')=='format' and 'array' in a and s['expression'].startswith('printf(')]
  self.assertEqual([a['index'] for a in reads],[0,1,2])
 def test_pointer_format_and_mutation(self):
  self.assertEqual(trace('int main(){char format[]="%d";char *p=format;format[1]=120;printf(p,31);}')['output'],'1f')
 def test_scanf_array_format(self):
  self.assertEqual(trace('int main(){char format[]="%d %d";int a,b;scanf(format,&a,&b);printf("%d",a+b);}','3 7')['output'],'10')
 def test_scanf_literal_pointer_format(self):
  self.assertEqual(trace('int main(){const char *format="%lf";double value;scanf(format,&value);printf("%.1f",value);}','1.5')['output'],'1.5')
 def test_invalid_format_memory_keeps_error_trace(self):
  for source in ['int main(){char format[2]={37,100};printf(format,1);}','int main(){printf(0);}','int main(){scanf(0);}']:
   with self.subTest(source=source),self.assertRaises(CError) as caught:trace(source)
   self.assertEqual(caught.exception.steps[-1]['event'],'error')

 def test_string_width_precision_and_alignment(self):
  self.assertEqual(trace('int main(){printf("[%5.2s][%-4s][%.0s]","tree","ab","hidden");}')['output'],'[   tr][ab  ][]')
 def test_bounded_string_without_terminator(self):
  result=trace('int main(){char data[3]={97,98,99};printf("%.2s",data);}')
  self.assertEqual(result['output'],'ab')
  reads=[a for step in result['steps'] if step['expression'].startswith('printf(') for a in step['reads'] if a.get('name')=='data' and 'index' in a]
  self.assertEqual([a['index'] for a in reads],[0,1])
 def test_string_precision_stops_at_zero(self):
  self.assertEqual(trace('int main(){char data[2]={97,0};printf("%.9s",data);}')['output'],'a')
 def test_string_field_limits(self):
  with self.assertRaises(CError):trace('int main(){printf("%1001s","x");}')

 def test_runtime_string_precision_and_argument_order(self):
  source='int main(){char text[]="abcdef";int length=3;printf("[%5.*s] %d",length,text+1,7);}'
  self.assertEqual(trace(source)['output'],'[  bcd] 7')
 def test_negative_dynamic_precision_is_omitted(self):
  self.assertEqual(trace('int main(){printf("%.*s",-1,"tree");}')['output'],'tree')
 def test_dynamic_precision_bounded_read_and_errors(self):
  self.assertEqual(trace('int main(){char a[2]={97,98};printf("%.*s",2,a);}')['output'],'ab')
  for source in ['int main(){printf("%.*s",1.5,"x");}','int main(){printf("%.*s",1001,"x");}','int main(){printf("%.*s","x");}']:
   with self.subTest(source=source),self.assertRaises(CError):trace(source)

 def test_dynamic_numeric_width_precision_order(self):
  self.assertEqual(trace('int main(){printf("[%*.*d][%*.*f]",6,3,7,7,2,1.25);}')['output'],'[   007][   1.25]')
 def test_negative_width_and_precision(self):
  self.assertEqual(trace('int main(){printf("[%*s][%.*d]",-5,"ab",-1,7);}')['output'],'[ab   ][7]')
 def test_dynamic_width_errors(self):
  for source in ['int main(){printf("%*d",1.5,7);}','int main(){printf("%*d",1001,7);}','int main(){printf("%*.*d",2,3);}']:
   with self.subTest(source=source),self.assertRaises(CError):trace(source)

 def test_character_width_and_dynamic_alignment(self):
  self.assertEqual(trace('int main(){printf("[%3c][%*c][%-*c]",65,-3,66,-3,67);}')['output'],'[  A][B  ][C  ]')
 def test_character_width_limit(self):
  with self.assertRaises(CError):trace('int main(){printf("%*c",1001,65);}')

import unittest
from backend.engine import trace

class FloatingValues(unittest.TestCase):
 def test_scalar_arithmetic_and_conversion(self):
  self.assertEqual(trace('int main(){double weight=1.25;float delta=0.5f;weight+=delta;printf("%d %zu %zu",(int)(weight*100),sizeof(weight),sizeof(delta));}')['output'],'175 8 4')
 def test_float32_storage_rounding_and_ternary(self):
  self.assertEqual(trace('int main(){float a=16777217;double b=1?1.25:2;printf("%d %d",(int)a,(int)(b*4));}')['output'],'16777216 5')
 def test_struct_array_dynamic_and_return(self):
  code='struct Edge{double cost;};double half(double x){return x/2;}int main(){struct Edge e[2]={{1.5},{2.5}};double *data=calloc(2,sizeof(*data));data[1]=half(e[0].cost+e[1].cost);printf("%d %d",(int)data[0],(int)data[1]);free(data);}'
  self.assertEqual(trace(code)['output'],'0 2')
 def test_float_values_not_integer_bit_candidates(self):
  result=trace('int main(){float a[2]={1,2};float *p=a;double value=3;printf("%d",(int)value);}')
  step=next(s for s in result['steps'] if s['variables'].get('value')==3)
  self.assertNotIn('value',step['integers']);self.assertNotIn('a',step['integers']);self.assertNotIn('p',step['integers'])

 def test_basic_floating_output_formats(self):
  self.assertEqual(trace('int main(){double x=1.25;printf("%.2f %+.1f %.2e %.3g",x,-x,125.0,12.345);}')['output'],'1.25 -1.2 1.25e+02 12.3')
 def test_floating_input_and_target_type_check(self):
  source='int main(){float x;double y;scanf("%f %lf",&x,&y);printf("%.2f %.2f",x,y);}'
  self.assertEqual(trace(source,'1.25 -2.5e1')['output'],'1.25 -25.00')
  with self.assertRaises(Exception):trace('int main(){int n;scanf("%f",&n);}','1.25')
  with self.assertRaises(Exception):trace('int main(){float n;scanf("%d",&n);}','1')
 def test_boolean_conversion_and_negative_zero(self):
  self.assertEqual(trace('int main(){_Bool yes=0.5;double zero=-0.0;printf("%d %.1f",yes,zero);}')['output'],'1 -0.0')
 def test_float_copy_and_zero_fill(self):
  source='int main(){float a[2]={1.25f,2.5f};float b[2];memcpy(b,a,sizeof(a));memset(a,0,sizeof(a));printf("%.2f %.1f",b[1],a[1]);}'
  self.assertEqual(trace(source)['output'],'2.50 0.0')
 def test_finite_model_and_invalid_operators(self):
  for expression in ['1.0/0.0','1e309','1.0%2.0']:
   with self.subTest(expression=expression),self.assertRaises(Exception):trace('int main(){double x='+expression+';}')

 def test_mixed_expression_width_and_rounding(self):
  self.assertEqual(trace('int main(){float x=16777216.0f;printf("%.0f %zu %zu",x+1,sizeof(x+1),sizeof(x+1.0));}')['output'],'16777216 4 8')
 def test_integer_constant_cast_and_invalid_enum(self):
  self.assertEqual(trace('enum {N=(int)1.75};int main(){printf("%d",N);}')['output'],'1')
  with self.assertRaises(Exception):trace('enum {N=1.5};int main(){}')
 def test_float_memory_reinterpretation_rejected(self):
  with self.assertRaises(Exception):trace('int main(){float f=1.0f;int n;memcpy(&n,&f,sizeof(n));}')
  with self.assertRaises(Exception):trace('int main(){double f;memset(&f,1,sizeof(f));}')
 def test_float_callback_sort(self):
  source='int compare(const void *a,const void *b){double x=*(const double *)a;double y=*(const double *)b;return (x>y)-(x<y);}int main(){double values[3]={1.5,0.25,0.5};qsort(values,3,sizeof(values[0]),compare);printf("%.2f %.2f %.2f",values[0],values[1],values[2]);}'
  self.assertEqual(trace(source)['output'],'0.25 0.50 1.50')

 def test_integer_only_contexts_reject_float(self):
  for source in ['int main(){int a[2];a[1.0]=7;}','int main(){double n=2;int a[n];}','int main(){switch(1.0){case 1:break;}}','int main(){double n=2;printf("%zu",sizeof(int[n]));}']:
   with self.subTest(source=source),self.assertRaises(Exception):trace(source)

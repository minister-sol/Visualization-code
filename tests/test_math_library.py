import unittest
from backend.engine import trace, CError

class MathLibrary(unittest.TestCase):
 def test_geometry_trace(self):
  result=trace('#include <math.h>\nint main(){double points[3][2]={{0,0},{3,4},{6,8}};double length=0;for(int i=1;i<3;i++){double dx=points[i][0]-points[i-1][0];double dy=points[i][1]-points[i-1][1];length+=hypot(dx,dy);}printf("%.2f %.2f",length,sqrt(81));}')
  self.assertEqual(result['output'],'10.00 9.00')
  self.assertTrue(any(s['event']=='return' and s.get('result')==5 for s in result['steps']))
 def test_float_parameter_conversion_and_return_type(self):
  self.assertEqual(trace('#include <math.h>\nint main(){printf("%.0f %zu %zu",sqrtf(16777217),sizeof(sqrtf(1)),sizeof(sqrt(1)));}')['output'],'4096 4 8')
 def test_rounding_and_negative_zero(self):
  source='int main(){printf("%.0f %.0f %.0f %.0f %.0f %.0f",round(2.5),round(-2.5),round(0.49999999999999994),trunc(-0.5),ceil(-0.5),floor(-0.0));}'
  self.assertEqual(trace(source)['output'],'3 -3 0 -0 -0 -0')
 def test_binary_and_transcendental_functions(self):
  self.assertEqual(trace('int main(){printf("%.2f %.2f %.2f %.2f %.2f %.2f",pow(2,3),fmod(-7,2),fmin(3,4),fmax(3,4),sin(0),log(exp(1)));}')['output'],'8.00 -1.00 3.00 4.00 0.00 1.00')
 def test_domain_and_argument_errors_preserve_trace(self):
  for expression in ['sqrt(-1)','log(0)','exp(10000)','pow(-1,0.5)','fmod(1,0)','sqrt()','hypot(1)','sqrt("x")']:
   with self.subTest(expression=expression):
    with self.assertRaises(CError) as caught:trace('int main(){double x='+expression+';}')
    self.assertTrue(caught.exception.steps)
    self.assertEqual(caught.exception.steps[-1]['event'],'error')

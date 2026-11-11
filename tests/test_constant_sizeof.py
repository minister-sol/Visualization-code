import unittest
from backend.engine import trace, CError

class ConstantSizeof(unittest.TestCase):
 def test_enum_capacity_from_fixed_size(self):
  self.assertEqual(trace('enum{N=sizeof(int)*2};int main(){int a[N]={0};printf("%d %zu",N,sizeof(a));}')['output'],'8 32')
 def test_fixed_array_object_size(self):
  self.assertEqual(trace('int main(){int a[3];enum{N=sizeof(a)/sizeof(a[0])};printf("%d",N);}')['output'],'3')
 def test_variable_array_not_a_constant_expression(self):
  with self.assertRaises(CError):trace('int main(){int n=3;int a[n];enum{N=sizeof(a)};}')

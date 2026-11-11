import unittest
from backend.engine import trace

class FloatingLimits(unittest.TestCase):
 def test_model_bounds_and_precision_constants(self):
  source='#include <float.h>\nint main(){float f=FLT_MAX;double d=DBL_MAX;printf("%d %d %d %d %d",f>1e30,d>1e300,FLT_MIN>0,DBL_MIN>0,FLT_MANT_DIG==24&&DBL_MANT_DIG==53);}'
  self.assertEqual(trace(source)['output'],'1 1 1 1 1')
 def test_epsilon_and_constant_types(self):
  source='#include <float.h>\nint main(){printf("%d %d %zu %zu",1.0+DBL_EPSILON>1.0,1.0f+FLT_EPSILON>1.0f,sizeof(FLT_MAX),sizeof(DBL_MAX));}'
  self.assertEqual(trace(source)['output'],'1 1 4 8')
 def test_maximum_as_unreachable_distance(self):
  source='#include <float.h>\nint main(){double distance[3]={0,DBL_MAX,DBL_MAX};double weight[2]={1.25,2.5};for(int i=0;i<2;i++)if(distance[i]!=DBL_MAX&&distance[i]+weight[i]<distance[i+1])distance[i+1]=distance[i]+weight[i];printf("%.2f",distance[2]);}'
  self.assertEqual(trace(source)['output'],'3.75')

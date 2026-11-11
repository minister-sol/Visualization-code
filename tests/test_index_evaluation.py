import unittest
from backend.engine import trace

class IndexEvaluation(unittest.TestCase):
 def test_nested_index_inputs(self):
  result=trace('int main(){int a[4]={10,20,30,40};int b[2]={1,2};int i=0;printf("%d",a[b[i]+1]);}')
  access=next(s['reads'][0] for s in result['steps'] if s['event']=='read' and s['expression']=='a[b[i] + 1]')
  self.assertEqual(access['index_expression'],'b[i] + 1')
  self.assertEqual(access['logical_index'],2)
  self.assertTrue(any(x['name']=='b' and x['value']==1 for x in access['index_reads']))
 def test_alias_logical_and_physical_index(self):
  result=trace('int main(){int a[3]={1,2,3};int *p=&a[1];printf("%d",p[0]);}')
  access=next(s['reads'][0] for s in result['steps'] if s['event']=='read' and s['expression']=='p[0]')
  self.assertEqual((access['logical_index'],access['index']),(0,1))

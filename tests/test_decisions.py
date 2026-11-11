import unittest
from backend.engine import trace

class DecisionEvents(unittest.TestCase):
 def test_short_circuit_skips_side_effects_and_null_access(self):
  r=trace('int main(){int *p=0;int count=0;int a=p&&*p;int b=1||count++;printf("%d %d %d",a,b,count);}')
  self.assertEqual(r['output'],'0 1 0')
  choices=[s['decision'] for s in r['steps'] if s.get('decision',{}).get('operator')]
  self.assertEqual(len(choices),2);self.assertTrue(all(not x['right_evaluated'] for x in choices))
 def test_executed_right_side(self):
  r=trace('int main(){int n=0;int ok=1&&++n;printf("%d",n);}')
  self.assertEqual(r['output'],'1')
  self.assertTrue(any(s.get('decision',{}).get('right_evaluated') for s in r['steps']))
 def test_ternary_reports_selected_branch(self):
  r=trace('int main(){int x=0;int y=1?7:++x;printf("%d %d",x,y);}')
  self.assertEqual(r['output'],'0 7')
  self.assertTrue(any(s.get('decision',{}).get('selected')=='7' and s['decision']['skipped']=='++x' for s in r['steps']))

 def test_ternary_common_integer_type(self):
  self.assertEqual(trace('int main(){printf("%u %d",0?1u:-1,(0?1u:-1)<0);}')['output'],'4294967295 0')
 def test_sizeof_arithmetic_is_unevaluated(self):
  self.assertEqual(trace('int main(){int i=3;char c=1;printf("%zu %zu %d",sizeof(i+++c),sizeof(0?1u:-1),i);}')['output'],'4 4 3')
 def test_ternary_string_and_null_pointer(self):
  self.assertEqual(trace('int main(){char *p=1?"tree":0;printf("%s",p);}')['output'],'tree')

 def test_void_branches_and_allocator_branch(self):
  self.assertEqual(trace('void show(){printf("ok");}int main(){int *p=1?malloc(sizeof(int)):0;p[0]=3;1?show():(void)0;free(p);}')['output'],'ok')

class ComparisonContext(unittest.TestCase):
 def test_comparisons_distinct_from_control_flow_checks(self):
  result=trace('int main(){int n=1;int flag=n<3;if(n<3){n=2;}}')
  comparisons=[s for s in result['steps'] if s.get('decision',{}).get('comparison')]
  self.assertEqual(len(comparisons),2)
  self.assertTrue(all(s['decision']['operator']=='<' for s in comparisons))
  branches=[s for s in result['steps'] if s['event']=='condition' and not s.get('decision')]
  self.assertEqual(len(branches),1)

class CompletionDecisionCleanup(unittest.TestCase):
 def test_final_snapshot_drops_prior_expression_decisions(self):
  for expression in ['1?2:3','1||0','1<2']:
   with self.subTest(expression=expression):
    result=trace('int main(){'+expression+';}')
    self.assertTrue(any(step.get('decision') for step in result['steps'][:-1]))
    final=result['steps'][-1]
    self.assertEqual(final['event'],'complete')
    self.assertNotIn('decision',final)
    self.assertNotIn('result',final)
    self.assertEqual(final['expression'],'')

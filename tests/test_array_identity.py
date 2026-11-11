import unittest
from backend.engine import trace

class ArrayIdentity(unittest.TestCase):
 def test_aliases_share_identity_and_offset(self):
  r=trace('int main(){int a[3]={1,2,3};int *alias=&a[1];alias[0]=8;}')
  step=next(s for s in r['steps'] if s['event']=='write')
  self.assertEqual(step['arrays']['a']['id'],step['arrays']['alias']['id'])
  self.assertEqual(step['arrays']['alias']['offset'],1)
  self.assertEqual(step['writes'][0]['array'],step['arrays']['a']['id'])
  self.assertEqual(step['writes'][0]['index'],1)
 def test_member_and_function_parameter_share_identity(self):
  r=trace('struct Q {int items[3];};void fill(int *p){p[1]=7;}int main(){struct Q q;fill(q.items);}')
  write=next(s for s in r['steps'] if s['event']=='write')
  declaration=next(s for s in r['steps'] if 'q.items' in s['arrays'])
  self.assertEqual(write['arrays']['p']['id'],declaration['arrays']['q.items']['id'])

 def test_empty_pointer_array_and_alias_type(self):
  result=trace('void show(int **slots){printf("%d",slots[0]==0);}int main(){int *slots[3]={0};show(slots);}')
  main=next(s for s in result['steps'] if 'slots' in s['arrays'])
  self.assertEqual(main['arrays']['slots']['element_kind'],'reference')
  callee=next(s for s in result['steps'] if s['stack']==['main','show'])
  self.assertEqual(callee['arrays']['slots']['element_kind'],'reference')
 def test_numeric_zero_array_keeps_numeric_type(self):
  result=trace('int main(){int zeros[3]={0};printf("%d",zeros[0]);}')
  self.assertTrue(all(s['arrays'].get('zeros',{}).get('element_kind')!='reference' for s in result['steps']))

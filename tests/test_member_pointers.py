import unittest
from backend.engine import trace

class MemberPointers(unittest.TestCase):
 def test_reference_identifies_owner_and_member(self):
  result=trace('struct N{int value;int other;};struct R{int *selected;};int main(){struct N n={7,9};struct R r={&n.value};*r.selected=12;r.selected=&n.other;printf("%d %d",n.value,*r.selected);}')
  self.assertEqual(result['output'],'12 9')
  refs=[value for step in result['steps'] for obj in step['objects'] for value in obj['fields'].values() if isinstance(value,dict) and value.get('kind')=='reference']
  self.assertTrue(any(v.get('member')=='value' and v.get('target') for v in refs))
  self.assertTrue(any(v.get('member')=='other' and v.get('target') for v in refs))
 def test_released_member_stays_identifiable(self):
  result=trace('struct N{int value;};struct R{int *selected;};int main(){struct N *n=calloc(1,sizeof(*n));struct R r={&n->value};free(n);}')
  ref=next(obj['fields']['selected'] for obj in result['steps'][-1]['objects'] if 'selected' in obj['fields'])
  self.assertTrue(ref['dangling'])
  self.assertEqual(ref['member'],'value')

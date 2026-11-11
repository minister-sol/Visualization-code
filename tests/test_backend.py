import unittest
from backend.engine import trace
from backend.examples import EXAMPLES
class Tests(unittest.TestCase):
 def test_examples(self):
  for example in EXAMPLES:
   with self.subTest(example=example['id']):
    r=trace(example['code'],example.get('stdin',''));self.assertTrue(r['steps'])
    if example['category']=='排序':
     arrays=[s['variables']['a'] for s in r['steps'] if 'a' in s['variables']];self.assertEqual(arrays[-1],sorted(arrays[-1]))
 def test_recursion(self):self.assertEqual(trace(EXAMPLES[3]['code'])['output'],'120')
 def test_bounds(self):
  with self.assertRaises(Exception):trace('int main(){int a[2];a[3]=1;}')
 def test_limit(self):
  with self.assertRaises(Exception):trace('int main(){while(1){}}')
 def test_unsupported(self):
  with self.assertRaises(Exception):trace('int main(){union X {int n;};}')
class ReferenceTests(unittest.TestCase):
 def test_new_linked_structure(self):
  code='struct Item {int data; struct Item *link;}; int main(){struct Item a;struct Item b;a.data=4;b.data=9;a.link=&b;b.link=0;struct Item *cursor=&a;printf("%d",cursor->link->data);}'
  r=trace(code);self.assertEqual(r['output'],'9')
  state=next(s for s in reversed(r['steps']) if len(s['objects'])==2)
  self.assertEqual(state['objects'][0]['fields']['link']['target'],state['objects'][1]['id'])
 def test_scalar_alias(self):
  self.assertEqual(trace('int main(){int x=2;int *p=&x;*p=7;printf("%d",x);}')['output'],'7')
 def test_null_deref(self):
  with self.assertRaises(Exception):trace('int main(){int *p=0;*p=2;}')

if __name__=='__main__' :unittest.main()

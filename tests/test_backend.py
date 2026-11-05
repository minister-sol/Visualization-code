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
  with self.assertRaises(Exception):trace('int main(){int *p;}')
if __name__=='__main__':unittest.main()

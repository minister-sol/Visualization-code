import unittest
from backend.engine import trace
from tests.test_qsort import CMP

class BsearchCallbacks(unittest.TestCase):
 def test_found_missing_and_writable_result(self):
  source=CMP+'int main(){int a[5]={1,3,5,7,9};int key=7;int *found=bsearch(&key,a,5,sizeof(a[0]),compare);printf("%d %lld ",*found,found-a);*found=8;key=6;printf("%d %d",a[3],bsearch(&key,a,5,sizeof(a[0]),compare)==0);}'
  result=trace(source)
  self.assertEqual(result['output'],'7 3 8 1')
  self.assertTrue(any(s['description'].startswith('bsearch 读取候选') and s['reads'] for s in result['steps']))
 def test_struct_key_and_readonly_array(self):
  source='struct R{int key;int value;};int compare(const void *key,const void *item){int x=*(const int *)key;const struct R *r=item;return (x>r->key)-(x<r->key);}int main(){const struct R a[3]={{2,20},{4,40},{6,60}};int key=4;const struct R *found=bsearch(&key,a,3,sizeof(a[0]),compare);printf("%d",found->value);}'
  self.assertEqual(trace(source)['output'],'40')
 def test_empty_and_invalid_ranges(self):
  self.assertEqual(trace(CMP+'int main(){printf("%d",bsearch(0,0,0,sizeof(int),compare)==0);}')['output'],'1')
  with self.assertRaises(Exception):trace(CMP+'int main(){int key=1;int a[2]={1,2};bsearch(&key,a,3,sizeof(int),compare);}')

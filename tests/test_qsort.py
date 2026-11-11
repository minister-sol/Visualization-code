import unittest
from backend.engine import trace

CMP='int compare(const void *a,const void *b){int x=*(const int *)a;int y=*(const int *)b;return (x>y)-(x<y);}'
class QsortCallbacks(unittest.TestCase):
 def test_integer_sort_and_callback_trace(self):
  result=trace(CMP+'int main(){int a[4]={7,2,9,3};qsort(a,4,sizeof(a[0]),compare);for(int i=0;i<4;i++)printf("%d ",a[i]);}')
  self.assertEqual(result['output'],'2 3 7 9 ')
  self.assertTrue(any('compare' in s['stack'] for s in result['steps']))
  self.assertTrue(any(s['event']=='write' and len(s['writes'])==2 for s in result['steps']))
 def test_struct_sort_keeps_storage_addresses(self):
  source='struct R{int key;int data[2];};int compare(const void *a,const void *b){const struct R *x=a;const struct R *y=b;return (x->key>y->key)-(x->key<y->key);}int main(){struct R a[3]={{3,{30,31}},{1,{10,11}},{2,{20,21}}};int *slot=&a[0].key;qsort(a,3,sizeof(a[0]),compare);printf("%d %d %d",*slot,a[1].key,a[2].data[1]);}'
  self.assertEqual(trace(source)['output'],'1 2 31')
 def test_invalid_size_and_range(self):
  for call in ['qsort(a,3,sizeof(int),compare)','qsort(a,2,1,compare)']:
   with self.subTest(call=call),self.assertRaises(Exception):trace(CMP+'int main(){int a[2]={2,1};'+call+';}')

 def test_readonly_and_uninitialized_rejected(self):
  for declaration in ['const int a[2]={2,1};','int a[2];']:
   with self.subTest(declaration=declaration),self.assertRaises(Exception):trace(CMP+'int main(){'+declaration+'qsort(a,2,sizeof(a[0]),compare);}')
 def test_empty_null_range(self):
  self.assertEqual(trace(CMP+'int main(){qsort(0,0,sizeof(int),compare);printf("ok");}')['output'],'ok')

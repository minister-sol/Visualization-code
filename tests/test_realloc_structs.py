import unittest
from backend.engine import trace

SOURCE = 'struct Node {int value;int data[2];struct Node *next;};int main(){struct Node *external=calloc(1,sizeof(*external));external->value=42;struct Node *a=calloc(2,sizeof(*a));a[0].value=7;a[0].data[1]=9;a[0].next=external;a[1].value=11;a=realloc(a,4*sizeof(*a));a[2].value=13;printf("%d %d %d %d ",a[0].value,a[0].data[1],a[0].next->value,a[1].value);a=realloc(a,1*sizeof(*a));printf("%d %d",a[0].value,a[0].next->value);free(a);printf(" %d",external->value);free(external);}'

class StructReallocation(unittest.TestCase):
 def test_growth_shrink_and_independent_pointee(self):
  result=trace(SOURCE)
  self.assertEqual(result['output'],'7 9 42 11 7 42 42')
  self.assertTrue(any(obj.get('freed') for step in result['steps'] for obj in step['objects']))
 def test_old_member_pointer_invalidated(self):
  with self.assertRaisesRegex(Exception,'释放后访问'):
   trace('struct N {int a[2];};int main(){struct N *p=calloc(1,sizeof(*p));int *old=&p[0].a[0];p=realloc(p,2*sizeof(*p));printf("%d",*old);}')
 def test_added_members_uninitialized(self):
  with self.assertRaisesRegex(Exception,'未初始化'):
   trace('struct N {int value;};int main(){struct N *p=calloc(1,sizeof(*p));p=realloc(p,2*sizeof(*p));printf("%d",p[1].value);}')

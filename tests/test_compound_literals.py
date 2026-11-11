import unittest
from backend.engine import trace

class CompoundLiterals(unittest.TestCase):
 def test_struct_assignment_and_argument(self):
  self.assertEqual(trace('struct P {int x;int y;};int sum(struct P p){return p.x+p.y;}int main(){struct P p={0};p=(struct P){.y=7,.x=3};printf("%d %d",p.y,sum((struct P){4,5}));}')['output'],'7 9')
 def test_array_and_scalar_addresses(self):
  self.assertEqual(trace('int main(){int *a=(int[]){2,4,6};int *p=&(int){7};a[1]=9;*p=8;printf("%d %d",a[1],*p);}')['output'],'9 8')
 def test_literal_lifetime(self):
  with self.assertRaisesRegex(Exception,'作用域'):
   trace('int main(){int *p;{p=(int[]){1,2};}printf("%d",p[0]);}')
 def test_sizeof_does_not_evaluate(self):
  self.assertEqual(trace('int main(){int i=1;printf("%zu %d",sizeof((int[2]){i++,2}),i);}')['output'],'8 1')

 def test_pointer_literal_and_address(self):
  self.assertEqual(trace('int main(){int x=7;int *p=(int *){&x};int **slot=&(int *){p};**slot=9;*slot=0;printf("%d %d",x,*slot==0);}')['output'],'9 1')
 def test_const_literal_storage(self):
  for source in ['int main(){int *p=(const int[]){1,2};p[0]=3;}', 'struct P{int x;};int main(){struct P *p=&(const struct P){3};p->x=4;}', 'int main(){int x=1;int **p=&(int *const){&x};*p=0;}']:
   with self.subTest(source=source),self.assertRaisesRegex(Exception,'只读|const'):
    trace(source)
 def test_pointer_literal_rejects_integer(self):
  with self.assertRaisesRegex(Exception,'引用或空指针'):
   trace('int main(){int *p=(int *){123};}')
 def test_same_literal_keeps_address(self):
  self.assertEqual(trace('int main(){int i=0;int *previous=0;int *current=0;while(i<2)previous=current,current=&(int){i++};printf("%d %d",previous==current,*current);}')['output'],'1 1')

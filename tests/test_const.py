import unittest
from backend.engine import trace

class ConstData(unittest.TestCase):
 def test_readonly_parameters_and_capacity(self):
  code='int sum(const int *p){return p[0]+p[1];}void show(const char *p){printf("%s",p);}int main(){const int capacity=2;int a[capacity]={3,4};printf("%d ",sum(a));a[0]=8;show("tree");}'
  self.assertEqual(trace(code)['output'],'7 tree')
 def test_const_pointer_variable_does_not_freeze_target(self):
  self.assertEqual(trace('int main(){int a[2]={3,4};int * const p=a;p[0]=9;printf("%d",a[0]);}')['output'],'9')
 def test_const_writes_rejected(self):
  programs=['int main(){const int x=3;int *p=&x;*p=7;}','int main(){const int a[2]={3,4};int *p=a;p[0]=7;}','void f(const int *p){p[0]=7;}int main(){int a[2]={1,2};f(a);}','int main(){int a[2]={1,2};int * const p=a;p++;}','void f(const char *p){strcpy(p,"a");}int main(){char a[3]="b";f(a);}']
  for code in programs:
   with self.subTest(code=code),self.assertRaises(Exception):trace(code)
 def test_const_struct_view_and_member_alias(self):
  programs=['struct S {int x;};void f(const struct S *p){p->x=7;}int main(){struct S s={3};f(&s);}','struct S {const int x;};int main(){struct S s={3};int *p=&s.x;*p=7;}']
  for code in programs:
   with self.subTest(code=code),self.assertRaises(Exception):trace(code)

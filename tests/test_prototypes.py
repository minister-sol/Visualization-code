import unittest
from backend.engine import trace

class Prototypes(unittest.TestCase):
 def test_forward_declaration_array_and_pointer(self):
  code='int find(int *data,int n);int main(){int a[3]={3,7,9};printf("%d",find(a,3));}int find(int data[],int n){return data[n-1];}'
  self.assertEqual(trace(code)['output'],'9')
 def test_void_parameter_and_unspecified_parameters(self):
  self.assertEqual(trace('int value();int value(void);int main(){printf("%d",value());}int value(void){return 7;}')['output'],'7')
 def test_mutual_recursion_prototypes(self):
  code='int odd(int);int even(int);int odd(int n){if(!n)return 0;return even(n-1);}int even(int n){if(!n)return 1;return odd(n-1);}int main(){printf("%d",even(4));}'
  self.assertEqual(trace(code)['output'],'1')
 def test_conflicting_prototypes_and_duplicate_definitions(self):
  for code in ['int f(int);int f(long long x){return 0;}int main(){}','int f(int);long long f(int);int main(){}','int f(){return 1;}int f(){return 2;}int main(){}']:
   with self.subTest(code=code),self.assertRaises(Exception):trace(code)

 def test_parameter_top_const_does_not_change_signature(self):
  source='int f(const int);int f(int x){return x+1;}int g(int *const);int g(int *p){return *p;}int main(){int x=7;printf("%d %d",f(x),g(&x));}'
  self.assertEqual(trace(source)['output'],'8 7')
 def test_pointee_const_changes_signature(self):
  with self.assertRaisesRegex(Exception,'类型冲突'):trace('int f(const int *);int f(int *p){return *p;}int main(){}')
 def test_callback_pointee_const_checked(self):
  with self.assertRaisesRegex(Exception,'签名'):trace('int f(int *p){return *p;}int main(){int (*operation)(const int *)=f;}')
 def test_array_parameter_const_matches_pointer(self):
  self.assertEqual(trace('int f(const int *);int f(const int a[]){return a[0];}int main(){int a[1]={7};printf("%d",f(a));}')['output'],'7')
 def test_ternary_combines_pointee_const(self):
  self.assertEqual(trace('int main(){int x=7;int *p=&x;const int *q=&x;const int *r=1?p:q;printf("%d",*r);}')['output'],'7')

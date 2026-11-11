import unittest
from backend.engine import trace

class EnumData(unittest.TestCase):
 def test_explicit_and_implicit_constants(self):
  self.assertEqual(trace('enum Color {WHITE,GRAY=4,BLACK};int main(){enum Color c=GRAY;switch(c){case WHITE:break;case GRAY:printf("%d %d",c,BLACK);break;}}')['output'],'4 5')
 def test_typedef_enum_and_member(self):
  self.assertEqual(trace('typedef enum State {NEW,DONE=NEW+2} State;struct N {State status;};int main(){struct N n={DONE};State s=n.status;printf("%d",s);}')['output'],'2')
 def test_anonymous_enum_array_capacity(self):
  self.assertEqual(trace('enum {CAP=3};int main(){int values[CAP]={1,2,3};printf("%d",values[CAP-1]);}')['output'],'3')
 def test_enum_constant_case(self):
  self.assertEqual(trace('enum Op {PUSH=1,POP};int main(){int n=0;switch(POP){case PUSH:n=3;break;case POP:n=7;}printf("%d",n);}')['output'],'7')

 def test_enum_constants_are_readonly(self):
  with self.assertRaises(Exception):trace('enum {VALUE=3};int main(){VALUE=7;}')

 def test_local_enum_and_shadowed_variable(self):
  source='enum {LIMIT=3};int main(){long long LIMIT=9007199254740993LL;{enum State {READY=7,DONE};enum State s=DONE;printf("%d ",s);}printf("%lld %zu",LIMIT,sizeof(LIMIT));}'
  self.assertEqual(trace(source)['output'],'8 9007199254740993 8')
 def test_local_typedef_enum_across_calls(self):
  source='int f(int n){typedef enum {PUSH=1,POP} Op;Op op=n;switch(op){case PUSH:return 7;case POP:return 9;}return 0;}int main(){printf("%d %d",f(1),f(2));}'
  self.assertEqual(trace(source)['output'],'7 9')
 def test_local_constants_do_not_escape(self):
  with self.assertRaises(Exception):trace('void f(){enum {LOCAL=3};}int main(){f();return LOCAL;}')
 def test_enum_size(self):
  self.assertEqual(trace('int main(){enum State {A,B};printf("%zu",sizeof(enum State));}')['output'],'4')

 def test_constant_short_circuit(self):
  self.assertEqual(trace('enum {A=0&&(1/0),B=1||(1/0),C=1?7:1/0};int main(){printf("%d %d %d",A,B,C);}')['output'],'0 1 7')
 def test_constant_unsigned_unary_and_conditional_type(self):
  self.assertEqual(trace('enum {A=(~0u)>0,B=(0?1u:-1)>0,C=(!0u)+1};int main(){printf("%d %d %d",A,B,C);}')['output'],'1 1 2')
 def test_integer_cast_constant(self):
  self.assertEqual(trace('enum {N=(unsigned char)259};int main(){int a[N]={1,2,3};switch(3){case (unsigned char)259:printf("%d",a[2]);}}')['output'],'3')

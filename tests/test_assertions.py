import unittest
from backend.engine import trace, CError

class Assertions(unittest.TestCase):
 def test_success_and_single_evaluation(self):
  result=trace('#include <assert.h>\nint main(){int n=1;assert(n++);printf("%d",n);}')
  self.assertEqual(result['output'],'2')
  checks=[s for s in result['steps'] if s.get('decision',{}).get('assertion')]
  self.assertEqual(len(checks),1);self.assertTrue(checks[0]['decision']['passed'])
  self.assertEqual(checks[0]['expression'],'assert(n++)')
 def test_failure_preserves_line_array_and_output(self):
  source='#include <assert.h>\nint main(){\nint queue[3]={7,8,9};\nint count=3;printf("ready");\nassert(count<3);\nqueue[0]=0;\n}'
  with self.assertRaises(CError) as caught:trace(source)
  error=caught.exception
  self.assertEqual(error.line,5);self.assertEqual(error.output,'ready')
  self.assertEqual(error.steps[-1]['variables']['queue'],[7,8,9])
  self.assertFalse(error.steps[-2]['decision']['passed'])
  self.assertIn('count < 3',str(error))
 def test_ndebug_suppresses_expression_and_undefined_names(self):
  source='#define NDEBUG\n#include <assert.h>\nint main(){int n=1;assert(n++);assert(unknown_function());printf("%d",n);}'
  result=trace(source);self.assertEqual(result['output'],'1')
  self.assertFalse(any(s.get('decision',{}).get('assertion') for s in result['steps']))
 def test_reinclude_updates_ndebug_state(self):
  source='#define NDEBUG\n#include <assert.h>\n#undef NDEBUG\n#include <assert.h>\nint main(){assert(0);}'
  with self.assertRaises(CError):trace(source)
 def test_pointer_float_and_void_type(self):
  self.assertEqual(trace('#include <assert.h>\nint main(){int n=1;assert(&n);assert(0.25);assert("yes");printf("%d",n);}')['output'],'1')
 def test_struct_argument_rejected(self):
  with self.assertRaises(CError):trace('#include <assert.h>\nstruct S{int n;};int main(){struct S s={1};assert(s);}')

import unittest
from backend.engine import trace, CError

class ProgramTermination(unittest.TestCase):
 def test_main_status_and_implicit_success(self):
  self.assertEqual(trace('int main(){return 7;}')['exit_code'],7)
  self.assertEqual(trace('int main(){}')['exit_code'],0)
 def test_exit_unwinds_nested_calls_and_stops_later_writes(self):
  source='#include <stdlib.h>\nint visited=0;void search(int depth){visited++;if(depth==2){printf("found");exit(EXIT_SUCCESS);}search(depth+1);visited=99;}int main(){search(0);visited=100;}'
  result=trace(source)
  self.assertEqual(result['output'],'found');self.assertEqual(result['exit_code'],0)
  self.assertEqual(result['termination'],'exit');self.assertEqual(result['status'],'completed')
  final=result['steps'][-1]
  self.assertEqual(final['variables']['visited'],3)
  self.assertEqual(final['stack'],[]);self.assertEqual(final['frames'],[])
  self.assertEqual(final['event'],'complete');self.assertEqual(final['exit_code'],0)
  self.assertTrue(any(s['event']=='terminate' and s['stack']==['main','search','search','search'] for s in result['steps']))
 def test_nonzero_exit_is_termination_not_interpreter_error(self):
  result=trace('#include <stdlib.h>\nint main(){int data[2]={3,4};exit(EXIT_FAILURE);data[0]=99;}')
  self.assertEqual(result['exit_code'],1);self.assertEqual(result['status'],'completed')
  self.assertEqual(result['steps'][-1]['variables']['data'],[3,4])
  self.assertIn('退出码 1',result['steps'][-1]['description'])
 def test_status_expression_evaluated_once_and_converted(self):
  result=trace('int main(){int n=3;exit(n++);}')
  self.assertEqual(result['exit_code'],3);self.assertEqual(result['steps'][-1]['variables']['n'],4)
  self.assertEqual(trace('int main(){exit(2.9);}')['exit_code'],2)
 def test_exit_retains_input_and_heap(self):
  result=trace('int main(){int *data=calloc(2,sizeof(int));data[1]=8;exit(0);free(data);}')
  self.assertTrue(any(s['event']=='allocate' for s in result['steps']))
  self.assertFalse(any(s['event']=='free' for s in result['steps']))
  self.assertTrue(any(not o.get('freed') for o in result['steps'][-1]['objects']))
 def test_invalid_arguments_remain_replayable_errors(self):
  for expression in ['exit()','exit(1,2)','exit("x")']:
   with self.subTest(expression=expression),self.assertRaises(CError) as caught:trace('int main(){'+expression+';}')
   self.assertEqual(caught.exception.steps[-1]['event'],'error')

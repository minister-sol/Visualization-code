import unittest
from backend.engine import trace

class FrameState(unittest.TestCase):
 def test_recursive_parameters_are_independent(self):
  result=trace('int sum(int n){int saved=n;if(n==0)return 0;return saved+sum(n-1);}int main(){int seed=3;printf("%d",sum(seed));}')
  deepest=next(s for s in result['steps'] if len(s['frames'])==5 and any('saved' in scope['variables'] for scope in s['frames'][-1]['scopes']))
  parameters=[frame['scopes'][0]['variables']['n'] for frame in deepest['frames'][1:]]
  self.assertEqual(parameters,[3,2,1,0])
  self.assertEqual(deepest['frames'][0]['scopes'][0]['variables']['seed'],3)
  self.assertEqual(result['steps'][-1]['frames'],[])
 def test_shadowed_blocks_remain_distinct(self):
  result=trace('int main(){int x=1;{int x=2;printf("%d",x);}}')
  step=next(s for s in result['steps'] if s['event']=='output')
  self.assertEqual([scope['variables']['x'] for scope in step['frames'][0]['scopes'] if 'x' in scope['variables']],[1,2])

 def test_repeated_calls_have_distinct_identity(self):
  result=trace('int f(int n){printf("%d",n);return n;}int main(){f(1);f(2);}')
  calls=[s for s in result['steps'] if s['event']=='output']
  self.assertNotEqual(calls[0]['frames'][-1]['id'],calls[1]['frames'][-1]['id'])
  self.assertEqual(calls[0]['frames'][0]['id'],calls[1]['frames'][0]['id'])

 def test_bindings_distinguish_shadow_and_preserve_global(self):
  result=trace('int shared=1;void show(){printf("%d",shared);}int main(){int x=1;printf("%d",x);{int x=2;printf("%d",x);}printf("%d",x);show();}')
  outputs=[s for s in result['steps'] if s['event']=='output']
  self.assertNotEqual(outputs[0]['bindings']['x'],outputs[1]['bindings']['x'])
  self.assertEqual(outputs[0]['bindings']['x'],outputs[2]['bindings']['x'])
  self.assertEqual(outputs[0]['bindings']['shared'],outputs[3]['bindings']['shared'])
 def test_static_binding_survives_repeated_calls(self):
  result=trace('void f(){static int counter=0;counter++;printf("%d",counter);}int main(){f();f();}')
  outputs=[s for s in result['steps'] if s['event']=='output']
  self.assertEqual(outputs[0]['bindings']['counter'],outputs[1]['bindings']['counter'])

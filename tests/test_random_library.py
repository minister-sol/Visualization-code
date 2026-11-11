import unittest
from backend.engine import trace, CError

class RandomLibrary(unittest.TestCase):
 def test_seed_restarts_sequence(self):
  source='#include <stdlib.h>\nint main(){srand(7);int a=rand();int b=rand();srand(7);printf("%d %d",a==rand(),b==rand());}'
  self.assertEqual(trace(source)['output'],'1 1')
 def test_default_seed_and_range(self):
  source='#include <stdlib.h>\nint main(){for(int i=0;i<8;i++){int value=rand();printf("%d ",value>=0&&value<=RAND_MAX);}}'
  self.assertEqual(trace(source)['output'],'1 '*8)
  self.assertEqual(trace(source)['output'],trace(source)['output'])
 def test_shuffle_preserves_sum_and_is_repeatable(self):
  source='int main(){int data[5]={1,2,3,4,5};srand(9);for(int i=4;i>0;i--){int j=rand()%(i+1);int saved=data[i];data[i]=data[j];data[j]=saved;}int sum=0;for(int i=0;i<5;i++)sum+=data[i];printf("%d",sum);}'
  result=trace(source);self.assertEqual(result['output'],'15')
  self.assertEqual(result['steps'][-1]['variables']['data'],trace(source)['steps'][-1]['variables']['data'])
 def test_arguments_rejected(self):
  for expression in ['rand(1)','srand()','srand("x")']:
   with self.subTest(expression=expression),self.assertRaises(CError):trace('int main(){'+expression+';}')

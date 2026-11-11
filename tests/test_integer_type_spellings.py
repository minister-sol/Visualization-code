import itertools
import unittest
from backend.engine import trace

class IntegerTypeSpellings(unittest.TestCase):
 def test_valid_specifier_permutations(self):
  for words,bits,unsigned in [(('signed','int'),32,False),(('unsigned','long','int'),64,True),(('long','long','unsigned','int'),64,True),(('short','signed','int'),16,False),(('char','unsigned'),8,True)]:
   for order in sorted(set(itertools.permutations(words))):
    with self.subTest(order=order):
     result=trace('int main(){'+' '.join(order)+' value=3;printf("%zu",sizeof(value));}')
     self.assertEqual(result['output'],str(bits//8))
     typed=next(s['integers']['value'] for s in result['steps'] if 'value' in s['integers'])
     self.assertEqual(typed,{'bits':bits,'unsigned':unsigned})
 def test_equivalent_prototypes_and_callbacks(self):
  source='signed int f(signed int);int f(int x){return x+1;}int main(){signed int (*operation)(signed int)=f;printf("%d",operation(7));}'
  self.assertEqual(trace(source)['output'],'8')
 def test_signed_char_stays_distinct_from_plain_char(self):
  with self.assertRaises(Exception):trace('int f(char);int f(signed char x){return x;}int main(){}')
 def test_invalid_combinations(self):
  for spelling in ['unsigned signed int','short long int','long long long','char int','unsigned unsigned int']:
   with self.subTest(spelling=spelling),self.assertRaises(Exception):trace('int main(){'+spelling+' n=1;}')

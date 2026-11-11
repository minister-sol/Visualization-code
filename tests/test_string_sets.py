import unittest
from backend.engine import trace, CError

class StringSets(unittest.TestCase):
 def test_spans_and_size_type(self):
  source='int main(){printf("%zu %zu %zu %d",strspn("123abc","0123456789"),strcspn("name=value","="),sizeof(strspn("a","a")),-1<strcspn("abc","x"));}'
  self.assertEqual(trace(source)['output'],'3 4 8 0')
 def test_search_result_alias(self):
  source='int main(){char text[]="key=value";char *p=strpbrk(text,"=:");*p=58;printf("%s %td",text,p-text);}'
  self.assertEqual(trace(source)['output'],'key:value 3')
 def test_empty_sets_missing_and_readonly(self):
  self.assertEqual(trace('int main(){printf("%zu %zu %d",strspn("abc",""),strcspn("abc",""),strpbrk("abc","x")==0);}')['output'],'0 3 1')
  with self.assertRaises(CError):trace('int main(){char *p=strpbrk("abc","b");*p=120;}')

 def test_source_reads_stop_at_first_relevant_character(self):
  for function,characters in [('strspn','a'),('strcspn','b'),('strpbrk','b')]:
   with self.subTest(function=function):
    result=trace('int main(){char text[]="abTAIL";'+function+'(text,"'+characters+'");}')
    reads=[a for step in result['steps'] if step['event']=='read' and step['expression'].startswith(function+'(') for a in step['reads'] if a['name']=='text']
    self.assertEqual([a['index'] for a in reads],[0,1])

import unittest
from backend.engine import trace, CError

class StringSearch(unittest.TestCase):
 def test_first_last_and_substring(self):
  source='#include <string.h>\nint main(){char text[]="bananas";char *first=strchr(text,97);char *last=strrchr(text,97);char *part=strstr(text,"ana");printf("%ld %ld %ld %s",first-text,last-text,part-text,part);}'
  self.assertEqual(trace(source)['output'],'1 5 1 ananas')
 def test_empty_needle_terminator_and_missing(self):
  self.assertEqual(trace('int main(){char text[]="abc";printf("%d %d %d %d %d",strstr(text,"")==text,strchr(text,0)==text+3,strrchr(text,0)==text+3,strchr(text,120)==0,strstr(text,"abcd")==0);}')['output'],'1 1 1 1 1')
 def test_alias_write_and_offsets(self):
  result=trace('int main(){char text[]="bananas";char *p=strchr(text+2,97);*p=111;printf("%s",text);}')
  self.assertEqual(result['output'],'banonas')
  write=next(s for s in result['steps'] if s['event']=='write' and s['result']==111)
  self.assertEqual(write['writes'][0]['index'],3)
  self.assertTrue(any(s['reads'] for s in result['steps']))
 def test_literal_result_is_readonly(self):
  self.assertEqual(trace('int main(){char *p=strstr("abcdef","cd");printf("%s",p);}')['output'],'cdef')
  with self.assertRaises(CError):trace('int main(){char *p=strchr("abc",98);*p=120;}')
 def test_invalid_arguments_and_lifetimes(self):
  for source in ['int main(){strchr(0,1);}','int main(){strstr("abc",0);}','int main(){strchr("abc",1.5);}','int main(){strstr("abc");}','int main(){char *p=malloc(4*sizeof(char));free(p);strchr(p,1);}']:
   with self.subTest(source=source),self.assertRaises(CError):trace(source)
 def test_character_conversion_and_empty_string(self):
  self.assertEqual(trace('int main(){char s[]="a";printf("%d %d %d",strchr(s,353)==s,strrchr("",0)!=0,strstr("","x")==0);}')['output'],'1 1 1')

 def test_strlen_result_uses_size_type(self):
  self.assertEqual(trace('int main(){char s[]="abc";printf("%d %zu",-1<strlen(s),sizeof(strlen(s)));}')['output'],'0 8')

 def test_first_character_search_stops_source_reads(self):
  result=trace('int main(){char text[]="abTAIL";char *p=strchr(text,98);}')
  reads=[a for step in result['steps'] if step['event']=='read' and step['expression'].startswith('strchr(') for a in step['reads'] if a['name']=='text']
  self.assertEqual([a['index'] for a in reads],[0,1])

 def test_strcmp_stops_at_first_difference(self):
  result=trace('int main(){char a[]="abTAIL";char b[]="acOTHER";int order=strcmp(a,b);}')
  comparisons=[s for s in result['steps'] if s['event']=='compare']
  self.assertEqual(len(comparisons),2)
  self.assertTrue(all(len(step['reads'])==2 for step in comparisons))
  self.assertEqual([a['index'] for a in comparisons[-1]['reads']],[1,1])
 def test_strcmp_unsigned_character_order(self):
  self.assertEqual(trace('int main(){signed char a[2]={-1,0};char b[2]={1,0};printf("%d",strcmp(a,b)>0);}')['output'],'1')
 def test_strcmp_prefix_and_empty_values(self):
  self.assertEqual(trace('int main(){printf("%d %d %d",strcmp("ab","abc")<0,strcmp("","")==0,strcmp("z","")>0);}')['output'],'1 1 1')

 def test_strstr_comparisons_show_restart_and_stop(self):
  source='int main(){char text[]="abacTAIL";char needle[]="ac";char *p=strstr(text,needle);printf("%td",p-text);}'
  result=trace(source);self.assertEqual(result['output'],'2')
  comparisons=[s for s in result['steps'] if s['event']=='compare']
  self.assertEqual(len(comparisons),5)
  self.assertTrue(all(len(s['reads'])==2 for s in comparisons))
  source_reads=[a['index'] for s in comparisons for a in s['reads'] if a['name']=='text']
  self.assertEqual(source_reads,[0,1,1,2,3])
 def test_strstr_empty_pattern_and_short_source(self):
  self.assertEqual(trace('int main(){char a[]="ab";printf("%d %d",strstr(a,"")==a,strstr(a,"abc")==0);}')['output'],'1 1')

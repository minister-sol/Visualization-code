import unittest
from backend.engine import trace

class CharacterData(unittest.TestCase):
 def test_char_array_and_output(self):
  self.assertEqual(trace('int main(){char a[3]={\'A\',\'B\',\'C\'};char c=a[1];printf("%c %d",c,c);}')['output'],'B 66')
 def test_string_initializer(self):
  self.assertEqual(trace('int main(){char word[]="cat";for(int i=0;word[i];i++)printf("%c",word[i]);}')['output'],'cat')
 def test_char_integer_promotion(self):
  self.assertEqual(trace('int main(){char a=100;char b=100;int sum=a+b;printf("%d",sum);}')['output'],'200')
 def test_char_parameter_and_member(self):
  self.assertEqual(trace('struct N {char label;};void show(char x){printf("%c",x);}int main(){struct N n={\'Z\'};show(n.label);}')['output'],'Z')
 def test_char_range(self):
  with self.assertRaises(Exception):trace('int main(){char x=128;}')

 def test_string_functions(self):
  self.assertEqual(trace('#include <string.h>\nint main(){char word[]="graph";printf("%s %d %d",word,strlen(word),strcmp(word,"graph"));}')['output'],'graph 5 0')
 def test_string_offset(self):
  self.assertEqual(trace('int main(){char word[]="tree";puts(word+1);}')['output'],'ree\n')
 def test_bad_strings(self):
  for code in ['int main(){char a[2]={65,66};printf("%s",a);}','int main(){char *a=calloc(3,sizeof(*a));free(a);puts(a);}','int main(){char a[2];strlen(a);}']:
   with self.subTest(code=code),self.assertRaises(Exception):trace(code)

 def test_character_metadata_uses_actual_types(self):
  r=trace('struct S {char text[3];};void show(char *p){printf("%s",p);}int main(){char letter=65;char word[]="hi";int ordinary[2]={65,66};struct S s={"ok"};show(word);}')
  main=next(s for s in reversed(r['steps']) if 's' in s['variables'])
  self.assertTrue({'letter','word','s.text'}<=set(main['characters']))
  self.assertNotIn('ordinary',main['characters'])
  self.assertTrue(any('p' in s['characters'] for s in r['steps']))

 def test_string_literal_pointer_and_parameter(self):
  self.assertEqual(trace('void show(char *word){printf("%c %s",word[0],word+1);}int main(){show("tree");}')['output'],'t ree')
 def test_array_of_string_pointers(self):
  self.assertEqual(trace('int main(){char *words[2]={"cat","dog"};printf("%s",words[1]);}')['output'],'dog')
 def test_string_pointer_return(self):
  self.assertEqual(trace('char *word(){return "graph";}int main(){printf("%c",word()[2]);}')['output'],'a')
 def test_literal_readonly_and_nonheap(self):
  for code in ['int main(){char *p="cat";p[0]=65;}','int main(){char *p="cat";free(p);}']:
   with self.subTest(code=code),self.assertRaises(Exception):trace(code)

 def test_scan_string_and_character(self):
  self.assertEqual(trace('int main(){char word[5];char c;int count=scanf("%4s %c",word,&c);printf("%s %c %d",word,c,count);}','tree Z')['output'],'tree Z 2')
 def test_scan_character_keeps_whitespace(self):
  self.assertEqual(trace('int main(){char c;scanf("%c",&c);printf("%d",c);}',' A')['output'],'32')
 def test_scan_width_leaves_remaining_input(self):
  self.assertEqual(trace('int main(){char a[3];char b[4];scanf("%2s%3s",a,b);printf("%s-%s",a,b);}','abcde')['output'],'ab-cde')
 def test_scan_string_overflow(self):
  with self.assertRaises(Exception):trace('int main(){char a[3];scanf("%s",a);}','long')

 def test_copy_and_concatenate(self):
  r=trace('int main(){char result[16];char *p=strcpy(result,"data");strcat(p,"-tree");printf("%s",result);}')
  self.assertEqual(r['output'],'data-tree')
  self.assertTrue(any(s['event']=='write' and s['writes'][0].get('array') for s in r['steps']))
 def test_copy_capacity_overlap_and_readonly(self):
  programs=['int main(){char b[3];strcpy(b,"long");}','int main(){char b[8]="cat";strcpy(b+1,b);}','int main(){char *p="cat";strcpy(p,"dog");}']
  for code in programs:
   with self.subTest(code=code),self.assertRaises(Exception):trace(code)
 def test_copy_leaves_independent_storage(self):
  self.assertEqual(trace('int main(){char a[5]="tree";char b[5];strcpy(b,a);a[0]=70;printf("%s %s",a,b);}')['output'],'Free tree')

 def test_braced_string_infers_character_capacity(self):
  self.assertEqual(trace('int main(){char text[]={"abc"};printf("%zu %s",sizeof(text),text);}')['output'],'4 abc')
 def test_braced_string_exact_capacity_without_terminator(self):
  self.assertEqual(trace('int main(){char text[3]={"abc"};printf("%zu %c",sizeof(text),text[2]);}')['output'],'3 c')
 def test_braced_member_string_and_override(self):
  source='struct R{char text[4];};int main(){struct R r={.text={"cat"},.text[0]=98};printf("%s",r.text);}'
  self.assertEqual(trace(source)['output'],'bat')
 def test_braced_character_rows_and_compound_literal(self):
  self.assertEqual(trace('int main(){char words[][4]={{"cat"},{"dog"}};char *temporary=(char[]){"hi"};printf("%zu %s %s",sizeof(words),words[1],temporary);}')['output'],'8 dog hi')
 def test_braced_empty_string_and_too_small_array(self):
  self.assertEqual(trace('int main(){unsigned char empty[]={""};printf("%zu %d",sizeof(empty),empty[0]);}')['output'],'1 0')
  with self.assertRaises(Exception):trace('int main(){char text[2]={"abc"};}')

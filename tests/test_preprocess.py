import unittest
from backend.engine import trace, CError
from backend.preprocess import preprocess

class MacroTests(unittest.TestCase):
 def test_capacity_and_nested_alias(self):
  r=trace('#define CAP 3\n#define LIMIT CAP\nint main(){int a[LIMIT]={1,2,3};printf("%d",a[CAP-1]);}')
  self.assertEqual(r['output'],'3')
  self.assertTrue(any(s['line']==3 for s in r['steps']))
 def test_strings_untouched(self):
  self.assertEqual(trace('#define X 4\nint main(){printf("X=%d",X);}')['output'],'X=4')
 def test_redefinition_is_ordered(self):
  self.assertEqual(trace('#define X 2\nint f(){return X;}\n#undef X\n#define X 7\nint main(){printf("%d %d",f(),X);}')['output'],'2 7')
 def test_rejects_cycles_and_function_macros(self):
  for code in ['#define A B\n#define B A\nint main(){return A;}','#define F(x) F(x)\nint main(){return F(1);}']:
   with self.subTest(code=code),self.assertRaises(CError):trace(code)
 def test_number_tokens_not_identifiers(self):
  self.assertIn('0xFF',preprocess('#define xFF 3\nint main(){return 0xFF;}',CError))
 def test_expansion_is_bounded(self):
  source='#define A '+('1 '*30000)+'\nint main(){return A;}'
  with self.assertRaises(CError):preprocess(source,CError)

 def test_builtin_header_null(self):
  code='#include <stdlib.h>\nstruct N {int n;struct N *next;};int main(){struct N *head=NULL;struct N *p=calloc(1,sizeof(*p));p->next=head;printf("%d",p->next==NULL);free(head);free(p);}'
  self.assertEqual(trace(code)['output'],'1')
 def test_eof_macro_with_scan(self):
  self.assertEqual(trace('#include <stdio.h>\nint main(){int n;printf("%d",scanf("%d",&n)==EOF);}')['output'],'1')
 def test_undef_null_restores_undefined_name(self):
  with self.assertRaises(Exception):trace('#include <stdlib.h>\n#undef NULL\nint main(){int *p=NULL;}')
 def test_invalid_header_delimiters(self):
  with self.assertRaises(Exception):preprocess('#include <stdio.h"\nint main(){}',CError)

 def test_function_macros_nested_arguments_and_strings(self):
  source='#define PICK(a,b) ((a)>(b)?(a):(b))\n#define TWICE(x) ((x)+(x))\nint main(){int data[4]={0};data[PICK(1,2)]=TWICE(PICK(2,3));printf("PICK %d",data[2]);}'
  self.assertEqual(trace(source)['output'],'PICK 6')
 def test_empty_function_macro_and_noncall(self):
  self.assertEqual(trace('#define VALUE() 7\nint main(){int VALUE=2;printf("%d %d",VALUE,VALUE());}')['output'],'2 7')
 def test_function_macro_argument_errors(self):
  for definition,call in [('F(x,x) x','F(1,2)'),('F(x) x','F(1,2)'),('F(...) 1','F(2)')]:
   with self.subTest(definition=definition),self.assertRaises(CError):trace('#define '+definition+'\nint main(){return '+call+';}')

 def test_include_guard_and_inactive_source(self):
  source='#ifndef TABLE_H\n#define TABLE_H\nstruct N {int value;};\n#endif\n#ifndef TABLE_H\nthis is not C\n#define BAD 9\n#endif\nint main(){struct N n={7};printf("%d",n.value);}'
  result=trace(source)
  self.assertEqual(result['output'],'7')
  self.assertTrue(any(s['line']==9 for s in result['steps']))
 def test_nested_conditions_and_macro_state(self):
  source='#define ACTIVE\n#ifdef ACTIVE\n#ifndef OTHER\n#define VALUE 7\n#else\n#define VALUE 9\n#endif\n#else\n#include <missing.h>\n#endif\n#if !defined(OTHER)\nint main(){printf("%d",VALUE);}\n#endif'
  self.assertEqual(trace(source)['output'],'7')
 def test_disabled_define_does_not_escape(self):
  self.assertEqual(trace('#if 0\n#define X 7\n#endif\n#ifdef X\nint main(){printf("bad");}\n#else\nint main(){printf("ok");}\n#endif')['output'],'ok')
 def test_unbalanced_conditions(self):
  for source in ['#else\n','#endif\n','#ifdef X\n','#if 1\n#else\n#else\n#endif\n']:
   with self.subTest(source=source),self.assertRaises(CError):preprocess(source,CError)

 def test_elif_first_matching_branch(self):
  source='#define MODE 0x2u\n#if 0\n#define VALUE 1\n#elif MODE\n#define VALUE 7\n#elif unsupported + expression\n#define VALUE 9\n#else\n#define VALUE 11\n#endif\nint main(){printf("%d",VALUE);}'
  self.assertEqual(trace(source)['output'],'7')
 def test_undefined_switch_and_defined_elif(self):
  self.assertEqual(trace('#define ON\n#if MISSING\n#define V 1\n#elif defined ON\n#define V 2\n#else\n#define V 3\n#endif\nint main(){printf("%d",V);}')['output'],'2')
 def test_numeric_macro_switch_and_inactive_elif(self):
  self.assertEqual(trace('#define MODE (00)\n#if MODE\n#if 1\n#elif unsupported expression\n#endif\n#else\nint main(){printf("ok");}\n#endif')['output'],'ok')
 def test_misplaced_elif(self):
  for source in ['#elif 1\n','#if 1\n#else\n#elif 1\n#endif\n']:
   with self.subTest(source=source),self.assertRaises(CError):preprocess(source,CError)

 def test_compound_condition_and_preprocessor_width(self):
  source='#define CAP 8\n#define ACTIVE\n#if defined(ACTIVE) && (CAP*2 == 16) && ((1<<3)==CAP) && (~0u > 0) && (0xffffffff == 4294967295LL)\nint main(){printf("ok");}\n#else\nint main(){printf("bad");}\n#endif'
  self.assertEqual(trace(source)['output'],'ok')
 def test_condition_short_circuit_and_ternary(self):
  self.assertEqual(trace('#if (1 || (1/0)) && (1 ? 7 : 1/0) && !(0 && 1/0) && ((-7%3)==-1)\nint main(){printf("ok");}\n#endif')['output'],'ok')
 def test_condition_invalid_calls_and_overflow(self):
  for expression in ['f()','1/0','1<<64','9223372036854775807LL+1','sizeof(int)']:
   with self.subTest(expression=expression),self.assertRaises(CError):preprocess('#if '+expression+'\n#endif',CError)

 def test_multiline_macro_and_call_line(self):
  source='\n'.join(['#define SWAP(a,b) do { '+chr(92),'int temporary=(a); '+chr(92),'(a)=(b); (b)=temporary; '+chr(92),'} while(0)','int main(){int x=3;int y=7;','SWAP(x,y);','printf("%d %d",x,y);}',''])
  result=trace(source)
  self.assertEqual(result['output'],'7 3')
  self.assertTrue(any(s['line']==6 and s['writes'] for s in result['steps']))
 def test_splicing_precedes_line_comments(self):
  source='\n'.join(['int main(){int x=1;','// ignored '+chr(92),'x=99;','printf("%d",x);}',''])
  self.assertEqual(trace(source)['output'],'1')
 def test_multiline_macro_crlf(self):
  source='#define ADD(a,b) ((a) + '+chr(92)+'\r\n(b))\r\nint main(){printf("%d",ADD(3,4));}'
  self.assertEqual(trace(source)['output'],'7')

 def test_limits_header_integer_boundaries(self):
  source='#include <limits.h>\nint main(){printf("%d %d %u %d %d %d",INT_MAX,INT_MIN,UINT_MAX,CHAR_BIT,SHRT_MIN,UCHAR_MAX);}'
  self.assertEqual(trace(source)['output'],'2147483647 -2147483648 4294967295 8 -32768 255')
 def test_limits_long_model_and_condition(self):
  source='#include <limits.h>\n#if CHAR_BIT==8 && INT_MAX==2147483647\nint main(){printf("%lld %lld %llu",LONG_MAX,LLONG_MIN,ULLONG_MAX);}\n#endif'
  self.assertEqual(trace(source)['output'],'9223372036854775807 -9223372036854775808 18446744073709551615')

 def test_function_macro_alias_chain(self):
  self.assertEqual(trace('#define ADD(a,b) ((a)+(b))\n#define LINK ADD\n#define OP LINK\nint main(){printf("%d",OP(3,4));}')['output'],'7')
 def test_alias_noncall_preserves_function_identifier(self):
  self.assertIn('int value=ADD;',preprocess('#define ADD(x) x\n#define ALIAS ADD\nint value=ALIAS;',CError))
 def test_nested_function_macro_depth_is_bounded(self):
  with self.assertRaisesRegex(CError,'深度'):
   preprocess('#define F(x) (x)\nint value='+('F('*40)+'1'+(')'*40)+';',CError)
 def test_function_alias_recursive_expansion_rejected(self):
  with self.assertRaisesRegex(CError,'递归|深度'):
   preprocess('#define F(x) ALIAS(x)\n#define ALIAS F\nint value=ALIAS(1);',CError)

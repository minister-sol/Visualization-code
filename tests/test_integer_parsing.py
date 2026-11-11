import unittest
from backend.engine import trace, CError

class IntegerParsing(unittest.TestCase):
 def test_prefix_sign_whitespace_and_no_digits(self):
  source='int main(){printf("%d %d %d %d",atoi("  -12tail"),atoi("+7"),atoi("x12"),atoi("0x10"));}'
  self.assertEqual(trace(source)['output'],'-12 7 0 0')
 def test_width_and_pointer_offsets(self):
  source='int main(){char text[]="x3000000000";printf("%ld %lld %zu %zu",atol(text+1),atoll(text+1),sizeof(atoi(text)),sizeof(atoll(text)));}'
  self.assertEqual(trace(source)['output'],'3000000000 3000000000 4 8')
 def test_string_reads_are_recorded(self):
  result=trace('int main(){char text[]="12";int value=atoi(text);}')
  self.assertTrue(any(s['event']=='read' and s['expression']=='atoi(text)' and s['reads'] for s in result['steps']))
  self.assertEqual(result['steps'][-1]['variables']['value'],12)
 def test_overflow_and_bad_memory_rejected(self):
  for source in ['int main(){atoi("2147483648");}','int main(){atoll("9223372036854775808");}','int main(){atoi(0);}','int main(){atoi();}']:
   with self.subTest(source=source),self.assertRaises(CError) as caught:trace(source)
   self.assertEqual(caught.exception.steps[-1]['event'],'error')

 def test_base_detection_and_end_pointer(self):
  source='int main(){char text[]="  -0x2a,rest";char *end;long value=strtol(text,&end,0);printf("%ld %td %c",value,end-text,*end);}'
  self.assertEqual(trace(source)['output'],'-42 7 ,')
 def test_no_digits_resets_end_to_start(self):
  source='int main(){char text[]="  +x";char *end;long value=strtol(text,&end,10);printf("%ld %d",value,end==text);}'
  self.assertEqual(trace(source)['output'],'0 1')
 def test_arbitrary_base_and_unsigned_sign(self):
  source='int main(){printf("%lld %llu",strtoll("z!",0,36),strtoull("-1",0,10));}'
  self.assertEqual(trace(source)['output'],'35 18446744073709551615')

 def test_incompatible_end_pointer_rejected(self):
  for declaration in ['int *end','void *end','const char *end']:
   with self.subTest(declaration=declaration),self.assertRaisesRegex(CError,'char'):
    trace('int main(){'+declaration+';strtol("12",&end,10);}')
 def test_prefix_parser_rejects_excessive_magnitude(self):
  from backend.integer_parsing import parse
  with self.assertRaisesRegex(CError,'64位'):parse('9'*10000,10,CError)
 def test_unsigned_negative_maximum_wraps(self):
  self.assertEqual(trace('int main(){printf("%llu",strtoull("-18446744073709551615",0,10));}')['output'],'1')

 def test_atoi_excessive_digits_produce_replayable_error(self):
  for function in ['atoi','atol','atoll']:
   with self.subTest(function=function),self.assertRaises(CError) as caught:
    trace('int main(){'+function+'("'+'9'*5000+'");}')
   self.assertEqual(caught.exception.steps[-1]['event'],'error')

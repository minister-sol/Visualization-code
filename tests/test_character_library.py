import unittest
from backend.engine import trace
from backend.character_library import FUNCTIONS, apply

class CharacterLibrary(unittest.TestCase):
 def test_classification_and_conversion(self):
  source='#include <ctype.h>\nint main(){printf("%d %d %d %d %c %c",!!isalpha(65),!!isdigit(57),!!isspace(9),!!isxdigit(70),tolower(65),toupper(122));}'
  self.assertEqual(trace(source)['output'],'1 1 1 1 a Z')
 def test_eof_and_character_domain(self):
  for name in FUNCTIONS:
   with self.subTest(name=name):
    self.assertEqual(apply(name,[-1],Exception),-1 if name in ('tolower','toupper') else 0)
    with self.assertRaises(Exception):apply(name,[-2],Exception)
    with self.assertRaises(Exception):apply(name,[256],Exception)
 def test_ascii_boundaries(self):
  for c in range(128):
   self.assertEqual(bool(apply('isalnum',[c],Exception)),chr(c).isalnum())
   self.assertEqual(apply('tolower',[c],Exception),ord(chr(c).lower()))
   self.assertEqual(apply('toupper',[c],Exception),ord(chr(c).upper()))
 def test_sizeof_does_not_read_stream(self):
  self.assertEqual(trace('#include <ctype.h>\nint main(){printf("%zu %c",sizeof(isdigit(getchar())),getchar());}','7')['output'],'4 7')

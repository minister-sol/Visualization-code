import unittest
from backend.engine import trace, CError

class BitfieldRejectionTests(unittest.TestCase):
    def test_all_bitfields_are_rejected_with_line(self):
        for declaration in ('int a:3;', 'int :3;', 'int :0;', 'struct { unsigned x:1; } inner;'):
            with self.subTest(declaration=declaration):
                with self.assertRaises(CError) as caught:
                    trace('struct S {\n' + declaration + '\n}; int main(){return sizeof(struct S);}')
                self.assertIn('位域', str(caught.exception))
                self.assertEqual(caught.exception.line, 2)

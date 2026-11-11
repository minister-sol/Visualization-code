import unittest
from backend.engine import trace

class MemoryLibrary(unittest.TestCase):
 def test_zero_matrix_and_negative_one_fill(self):
  source='int main(){int matrix[2][3];memset(matrix,0,sizeof(matrix));int a[2];memset(a,-1,sizeof(a));printf("%d %d",matrix[1][2],a[1]);}'
  self.assertEqual(trace(source)['output'],'0 -1')
 def test_copy_array(self):
  self.assertEqual(trace('int main(){int source[3]={2,4,6};int target[3];memcpy(target,source,sizeof(source));printf("%d",target[2]);}')['output'],'6')
 def test_overlapping_move(self):
  self.assertEqual(trace('int main(){int a[4]={1,2,3,4};memmove(a+1,a,3*sizeof(int));printf("%d %d %d %d",a[0],a[1],a[2],a[3]);}')['output'],'1 1 2 3')
 def test_struct_copy_preserves_references(self):
  source='struct N {char label;int value;struct N *next;};int main(){struct N a={65,7,0};struct N b;memcpy(&b,&a,sizeof(a));printf("%c %d %d",b.label,b.value,b.next==0);}'
  self.assertEqual(trace(source)['output'],'A 7 1')
 def test_bounds_overlap_partial_and_const_rejected(self):
  programs=['int main(){int a[2];memset(a,0,99);}','int main(){int a[3]={1,2,3};memcpy(a+1,a,2*sizeof(int));}','int main(){int a[2];memset(a,0,1);}','int main(){const int a[2]={1,2};memset(a,0,sizeof(a));}']
  for code in programs:
   with self.subTest(code=code),self.assertRaises(Exception):trace(code)

 def test_pointer_zeroing_and_boolean_fill(self):
  source='int main(){int x=3;int *p=&x;memset(&p,0,sizeof(p));_Bool flags[2];memset(flags,1,sizeof(flags));printf("%d %d",p==0,flags[1]);}'
  self.assertEqual(trace(source)['output'],'1 1')
 def test_uninitialized_source_rejected(self):
  with self.assertRaises(Exception):trace('int main(){int source[2];int target[2];memcpy(target,source,sizeof(source));}')

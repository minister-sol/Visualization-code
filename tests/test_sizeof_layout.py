import unittest
from backend.engine import trace

class SizeofLayout(unittest.TestCase):
 def test_numeric_array_length(self):
  self.assertEqual(trace('int main(){int values[5];int n=sizeof(values)/sizeof(values[0]);printf("%d %zu",n,sizeof(values));}')['output'],'5 20')
 def test_struct_padding_and_pointer(self):
  self.assertEqual(trace('struct N {char x;int n;struct N *next;};int main(){printf("%zu %zu",sizeof(struct N),sizeof(int *));}')['output'],'16 8')
 def test_vla_extent_stays_with_object(self):
  self.assertEqual(trace('int main(){int n=3;int values[n];n=8;printf("%zu",sizeof(values));}')['output'],'12')
 def test_array_type_allocation(self):
  self.assertEqual(trace('int main(){int *p=malloc(sizeof(int[4]));p[3]=9;printf("%d",p[3]);free(p);}')['output'],'9')
 def test_string_literal_size(self):
  self.assertEqual(trace('int main(){printf("%zu",sizeof("tree"));}')['output'],'5')

 def test_sizeof_increment_is_unevaluated(self):
  self.assertEqual(trace('int main(){int i=3;printf("%zu %d",sizeof(i++),i);}')['output'],'4 3')
 def test_vla_subarray_extent(self):
  self.assertEqual(trace('int main(){int n=3;int a[2][n];n=8;printf("%zu",sizeof(a[0]));}')['output'],'12')
 def test_size_t_alias(self):
  self.assertEqual(trace('#include <stddef.h>\nint main(){size_t n=sizeof(long long);printf("%zu %zu",n,sizeof(7));}')['output'],'8 4')

 def test_stored_size_allocates_array(self):
  source='#include <stddef.h>\nint main(){int *p=0;size_t bytes=4*sizeof(*p);p=malloc(bytes);p[3]=19;printf("%zu %d",bytes,p[3]);free(p);}'
  self.assertEqual(trace(source)['output'],'16 19')
 def test_stored_structure_size_and_function_return(self):
  source='#include <stddef.h>\nstruct N {int x;struct N *next;};size_t bytes(){return sizeof(struct N);}int main(){size_t count=bytes();struct N *p=malloc(count);p->x=7;p->next=0;printf("%zu %d",count,p->x);free(p);}'
  self.assertEqual(trace(source)['output'],'16 7')
 def test_size_metadata_survives_snapshot_copy(self):
  source='int main(){int sizes[2]={sizeof(int),2*sizeof(int)};int *p=malloc(sizes[1]);p[1]=8;printf("%d",p[1]);free(p);}'
  self.assertEqual(trace(source)['output'],'8')

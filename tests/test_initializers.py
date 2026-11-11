import unittest
from backend.engine import trace

class DesignatedInitializers(unittest.TestCase):
 def test_struct_field_order(self):
  self.assertEqual(trace('struct N {int value;struct N *next;};int main(){struct N n={.next=0,.value=3};printf("%d %d",n.value,n.next==0);}')['output'],'3 1')
 def test_sparse_array_with_inferred_size(self):
  r=trace('int main(){int a[]={[3]=7,9};printf("%d %d %d",a[0],a[3],a[4]);}')
  self.assertEqual(r['output'],'0 7 9')
  self.assertTrue(any(s['variables'].get('a')==[0,0,0,7,9] for s in r['steps']))
 def test_nested_designated_values(self):
  self.assertEqual(trace('struct N {int a[3];int x;};int main(){struct N n={.a={[2]=5},.x=7};printf("%d %d",n.a[2],n.x);}')['output'],'5 7')
 def test_invalid_designators(self):
  for source in ['int main(){int a[2]={[3]=1};}','struct N {int x;};int main(){struct N a={.other=1};}']:
   with self.subTest(source=source),self.assertRaises(Exception):trace(source)

 def test_zero_multidimensional_array(self):
  self.assertEqual(trace('int main(){int a[3][4]={0};printf("%d",a[2][3]);}')['output'],'0')
 def test_flat_multidimensional_inferred_size(self):
  self.assertEqual(trace('int main(){int a[][2]={1,2,3,4};printf("%d %zu",a[1][1],sizeof(a));}')['output'],'4 16')
 def test_mixed_braces(self):
  self.assertEqual(trace('int main(){int a[2][3]={{1},2,3,4};printf("%d %d %d",a[0][1],a[1][0],a[1][2]);}')['output'],'0 2 4')
 def test_flat_struct_and_character_rows(self):
  self.assertEqual(trace('struct P {int x;int y;};int main(){struct P a[2]={1,2,3,4};char words[2][5]={"tree","node"};printf("%d %s",a[1].y,words[1]);}')['output'],'4 node')

 def test_scalar_braces_and_single_evaluation(self):
  self.assertEqual(trace('int main(){int i={1};int a[2][2]={i++,i++,i++,i++};printf("%d %d",i,a[1][1]);}')['output'],'5 4')

 def test_enum_and_arithmetic_designators(self):
  result=trace('enum {LEFT=1,RIGHT=LEFT+2};int main(){int a[]={[LEFT]=5,[RIGHT+1]=9,11};printf("%d %d %d %zu",a[0],a[LEFT],a[RIGHT+2],sizeof(a));}')
  self.assertEqual(result['output'],'0 5 11 24')
  self.assertTrue(any(step['variables'].get('a')==[0,5,0,0,9,11] for step in result['steps']))
 def test_expression_designators_nested_in_struct(self):
  self.assertEqual(trace('struct N {int bucket[8];};int main(){enum {BIT=2};struct N n={.bucket={[1<<BIT]=7}};printf("%d %d",n.bucket[4],n.bucket[3]);}')['output'],'7 0')
 def test_nonconstant_designator_rejected(self):
  for expression in ['i','i++','-1','2+2']:
   with self.subTest(expression=expression),self.assertRaises(Exception):
    trace('int main(){int i=1;int a[4]={['+expression+']=7};}')

 def test_chained_member_and_array_paths(self):
  source='struct P{int x;int y;};struct N{struct P point;int data[3];};int main(){struct N n={.point.x=3,.point.y=7,.data[0]=4,.data[2]=9};printf("%d %d %d %d",n.point.x,n.point.y,n.data[1],n.data[2]);}'
  self.assertEqual(trace(source)['output'],'3 7 0 9')
 def test_chained_struct_array_inferred_size(self):
  source='struct R{int key;int data[2];};int main(){struct R rows[]={[2].key=7,[2].data[1]=9,[0].key=3};printf("%zu %d %d %d",sizeof(rows),rows[0].key,rows[1].key,rows[2].data[1]);}'
  self.assertEqual(trace(source)['output'],'36 3 0 9')
 def test_chained_matrix_and_single_evaluation(self):
  self.assertEqual(trace('int main(){int n=1;int values[2][3]={[1][2]=n++,[0][1]=n++};printf("%d %d",n,values[1][2]+values[0][1]);}')['output'],'3 3')
 def test_chained_invalid_paths_and_duplicate_leaf(self):
  for source in ['struct R{int data[2];};int main(){struct R r={.data[2]=7};}','struct R{int data[2];};int main(){struct R r={.other[0]=7};}']:
   with self.subTest(source=source),self.assertRaises(Exception):trace(source)

 def test_nested_designator_positional_continuation(self):
  self.assertEqual(trace('int main(){int values[2][3]={[1][0]=3,4,5};printf("%d %d %d",values[1][0],values[1][1],values[1][2]);}')['output'],'3 4 5')
 def test_designator_continuation_crosses_row_and_infers_size(self):
  self.assertEqual(trace('int main(){int values[][2]={[1][1]=3,4,5};printf("%zu %d %d %d",sizeof(values),values[1][1],values[2][0],values[2][1]);}')['output'],'24 3 4 5')
 def test_designator_continuation_crosses_nested_struct(self):
  source='struct P{int x;int y;};struct R{struct P point;int values[2];};int main(){struct R r={.point.y=7,8,9};printf("%d %d %d %d",r.point.x,r.point.y,r.values[0],r.values[1]);}'
  self.assertEqual(trace(source)['output'],'0 7 8 9')
 def test_braced_designator_skips_whole_subaggregate(self):
  self.assertEqual(trace('int main(){int a[3][2]={[1]={7},8,9};printf("%d %d %d %d",a[1][0],a[1][1],a[2][0],a[2][1]);}')['output'],'7 0 8 9')

 def test_duplicate_leaf_last_initializer_wins(self):
  self.assertEqual(trace('int main(){int a[3]={[1]=2,[1]=7};printf("%d %d",a[0],a[1]);}')['output'],'0 7')
 def test_partial_override_preserves_braced_siblings(self):
  source='struct P{int x,y;};struct R{struct P point;int data[3];};int main(){struct R r={.point={1,2},.point.x=7,.data={3,4,5},.data[1]=9};printf("%d %d %d %d %d",r.point.x,r.point.y,r.data[0],r.data[1],r.data[2]);}'
  self.assertEqual(trace(source)['output'],'7 2 3 9 5')
 def test_whole_override_discards_older_descendants(self):
  self.assertEqual(trace('int main(){int a[2][2]={[1][1]=9,[1]={7}};printf("%d %d",a[1][0],a[1][1]);}')['output'],'7 0')
 def test_partial_string_override(self):
  self.assertEqual(trace('struct R{char text[4];};int main(){struct R r={.text="abc",.text[0]=120};printf("%s",r.text);}')['output'],'xbc')
 def test_overwritten_struct_expression_is_omitted(self):
  source='struct P{int x,y;};struct R{struct P point;};int calls=0;struct P make(){calls++;return (struct P){1,2};}int main(){struct R r={.point=make(),.point.x=7};printf("%d %d %d",calls,r.point.x,r.point.y);}'
  self.assertEqual(trace(source)['output'],'0 7 0')

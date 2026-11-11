import unittest
from backend.engine import trace

class StructCopy(unittest.TestCase):
 def test_record_array_swap(self):
  code='struct Edge {int weight;int ends[2];};int main(){struct Edge edges[2]={{8,{0,1}},{3,{1,2}}};struct Edge temp=edges[0];edges[0]=edges[1];edges[1]=temp;temp.ends[0]=9;printf("%d %d %d",edges[0].weight,edges[1].weight,edges[1].ends[0]);}'
  self.assertEqual(trace(code)['output'],'3 8 0')
 def test_value_parameter_and_shared_pointer(self):
  code='struct Box {int data[2];int *shared;};void edit(struct Box b){b.data[0]=99;*b.shared=7;}int main(){int x=1;struct Box a={{3,4},&x};edit(a);printf("%d %d",a.data[0],x);}'
  self.assertEqual(trace(code)['output'],'3 7')
 def test_assignment_preserves_destination_address(self):
  self.assertEqual(trace('struct P {int x;};int main(){struct P a={3};struct P b={8};int *alias=&a.x;a=b;printf("%d",*alias);}')['output'],'8')
 def test_different_struct_tags_rejected(self):
  with self.assertRaises(Exception):trace('struct A {int x;};struct B {int x;};int main(){struct A a={1};struct B b={2};a=b;}')

 def test_struct_factory_value(self):
  code='struct Pair {int x;int values[2];};struct Pair make(int x){struct Pair local={x,{x+1,x+2}};return local;}int main(){struct Pair p=make(4);p.values[0]=11;struct Pair q=make(7);printf("%d %d %d",p.x,p.values[0],q.values[0]);}'
  result=trace(code)
  self.assertEqual(result['output'],'4 11 8')
  calls=[s for s in result['steps'] if s['event']=='return' and s['stack'][-1:] == ['make']]
  self.assertTrue(calls)
  self.assertTrue(any(len(s['objects'])>=2 for s in calls))
 def test_recursive_struct_result(self):
  code='struct Result {int sum;int count;};struct Result total(int n){if(n==0){struct Result zero={0,0};return zero;}struct Result r=total(n-1);r.sum+=n;r.count++;return r;}int main(){struct Result value=total(4);printf("%d %d",value.sum,value.count);}'
  self.assertEqual(trace(code)['output'],'10 4')
 def test_returned_pointer_member_can_still_dangle(self):
  with self.assertRaisesRegex(Exception,'悬空指针'):
   trace('struct Box {int *p;};struct Box bad(){int local=3;struct Box b={&local};return b;}int main(){struct Box x=bad();printf("%d",*x.p);}')
 def test_return_wrong_struct_tag(self):
  with self.assertRaises(Exception):trace('struct A {int x;};struct B {int x;};struct A bad(){struct B b={1};return b;}int main(){struct A a=bad();}')

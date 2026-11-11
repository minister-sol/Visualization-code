import unittest
from backend.engine import trace, CError, Engine

class AllocationBudget(unittest.TestCase):
 def test_nested_aggregate_allocation_is_bounded(self):
  source='struct Row{int values[1000];};struct Table{struct Row rows[1000];};int main(){struct Table table;}'
  with self.assertRaisesRegex(CError,'执行操作超过限制') as caught:trace(source)
  self.assertEqual(caught.exception.steps[-1]['event'],'error')
 def test_normal_nested_storage_and_self_reference_still_work(self):
  source='struct N{int values[2];struct N *next;};int main(){struct N nodes[2]={{{3,4},&nodes[1]},{{5,6},nodes}};printf("%d %d",nodes[0].next->values[1],nodes[1].next==nodes);}'
  self.assertEqual(trace(source)['output'],'6 1')

 def test_aggregate_copy_consumes_budget_per_owned_cell(self):
  engine=Engine();engine.ops=29998
  with self.assertRaisesRegex(CError,'执行操作超过限制'):
   engine.copy_aggregate([0]*10,list(range(10)))
  self.assertEqual(engine.ops,30001)
 def test_record_copy_preserves_member_pointer_targets(self):
  source='struct R{int data[2];int *link;};int main(){int target=7;struct R a={{1,2},&target};struct R b=a;b.data[1]=9;*b.link=8;printf("%d %d %d",a.data[1],b.data[1],target);}'
  self.assertEqual(trace(source)['output'],'2 9 8')

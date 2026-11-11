import unittest
from backend.engine import trace, CError

class SelfInitialization(unittest.TestCase):
 def test_static_linked_pool(self):
  source='struct N{int n;struct N *next;};struct N nodes[3]={{1,&nodes[1]},{2,&nodes[2]},{3,0}};int main(){struct N *p=nodes;int sum=0;while(p){sum+=p->n;p=p->next;}printf("%d",sum);}'
  self.assertEqual(trace(source)['output'],'6')
 def test_local_ring_and_future_member_address(self):
  source='struct N{int n;int *value;struct N *next;};int main(){struct N nodes[2]={{1,&nodes[1].n,&nodes[1]},{2,&nodes[0].n,&nodes[0]}};*nodes[0].value=9;printf("%d %d",nodes[1].n,nodes[1].next==nodes);}'
  self.assertEqual(trace(source)['output'],'9 1')
 def test_previous_initialized_elements_and_unknown_length(self):
  self.assertEqual(trace('int main(){int a[]={1,a[0]+1,a[1]+1};printf("%d %d %d",a[0],a[1],a[2]);}')['output'],'1 2 3')
 def test_matrix_and_struct_member_addresses(self):
  source='struct S{int values[2];int *p;};int main(){struct S s={{3,4},&s.values[1]};*s.p=8;printf("%d",s.values[1]);}'
  self.assertEqual(trace(source)['output'],'8')
 def test_vla_bound_still_evaluated_once(self):
  self.assertEqual(trace('int main(){int n=2;int a[n++];a[0]=7;printf("%d %zu",n,sizeof(a));}')['output'],'3 8')
 def test_uninitialized_future_read_remains_an_error(self):
  with self.assertRaises(CError):trace('int main(){int a[2]={a[1],2};}')
 def test_static_pool_reuses_storage_across_calls(self):
  source='struct N{int n;struct N *next;};int touch(){static struct N a[2]={{1,&a[1]},{2,a}};a[0].next->n++;return a[1].n;}int main(){int first=touch();int second=touch();printf("%d %d",first,second);}'
  self.assertEqual(trace(source)['output'],'3 4')

 def test_generated_renamed_rings_preserve_real_topology(self):
  for size in range(2,10):
   with self.subTest(size=size):
    tag='Cell'+str(size);pool='storage'+str(size)
    items=','.join('{'+str(i+1)+',&'+pool+'['+str((i+1)%size)+']}' for i in range(size))
    source='struct '+tag+'{int payload;struct '+tag+' *route;};int main(){struct '+tag+' '+pool+'['+str(size)+']={'+items+'};struct '+tag+' *cursor='+pool+';int total=0;for(int i=0;i<'+str(size)+';i++){total+=cursor->payload;cursor=cursor->route;}printf("%d %d",total,cursor=='+pool+');}'
    result=trace(source)
    self.assertEqual(result['output'],str(size*(size+1)//2)+' 1')
    snapshot=next(step for step in result['steps'] if step['event']=='output')
    objects=sorted(snapshot['objects'],key=lambda obj:obj['fields']['payload'])
    self.assertEqual(len(objects),size)
    for index,obj in enumerate(objects):
     self.assertEqual(obj['fields']['route']['target'],objects[(index+1)%size]['id'])
     self.assertFalse(obj['fields']['route']['dangling'])

 def test_unlink_updates_both_real_edges_without_deleting_storage(self):
  from tests.test_algorithm_corpus import RELINK_SOURCE
  result=trace(RELINK_SOURCE)
  self.assertEqual(result['output'],'3 1')
  snapshot=next(step for step in result['steps'] if step['event']=='output')
  objects=sorted(snapshot['objects'],key=lambda obj:obj['fields']['payload'])
  self.assertEqual(len(objects),3)
  self.assertEqual(objects[0]['fields']['forward']['target'],objects[2]['id'])
  self.assertEqual(objects[2]['fields']['back']['target'],objects[0]['id'])
  self.assertFalse(objects[1].get('freed',False))

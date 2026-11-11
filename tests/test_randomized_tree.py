import unittest
from backend.engine import trace

SOURCE = r"""
struct Entry {int key;int priority;struct Entry *low;struct Entry *high;};
struct Entry *insert(struct Entry *root,struct Entry *node){
 if(!root)return node;
 if(node->key<root->key){
  root->low=insert(root->low,node);
  if(root->low->priority<root->priority){struct Entry *pivot=root->low;root->low=pivot->high;pivot->high=root;root=pivot;}
 }else{
  root->high=insert(root->high,node);
  if(root->high->priority<root->priority){struct Entry *pivot=root->high;root->high=pivot->low;pivot->low=root;root=pivot;}
 }
 return root;
}
void show(struct Entry *root){if(root){show(root->low);printf("%d ",root->key);show(root->high);}}
int main(){struct Entry pool[5]={0};int keys[5]={4,1,5,2,3};struct Entry *root=0;srand(7);for(int i=0;i<5;i++){pool[i].key=keys[i];pool[i].priority=rand();root=insert(root,&pool[i]);}show(root);}
"""

class RandomizedTree(unittest.TestCase):
 def test_unseen_treap_code_obeys_search_and_heap_invariants(self):
  self.check_tree(SOURCE)
 def check_tree(self,source):
  result=trace(source)
  self.assertEqual(result['output'],'1 2 3 4 5 ')
  snapshot=next(s for s in reversed(result['steps']) if s['event']=='output')
  objects={obj['id']:obj['fields'] for obj in snapshot['objects']}
  self.assertEqual(len(objects),5)
  # Main's root remains available while recursive show executes.
  frame=next(frame for frame in snapshot['frames'] if frame['function']=='main')
  root=next(scope['variables']['root']['target'] for scope in frame['scopes'] if 'root' in scope['variables'])
  seen=set()
  def visit(identity,minimum,maximum):
   self.assertNotIn(identity,seen);seen.add(identity)
   node=objects[identity];self.assertLess(minimum,node['key']);self.assertLess(node['key'],maximum)
   for field,bounds in [('low',(minimum,node['key'])),('high',(node['key'],maximum))]:
    child=node[field]
    if child:
     self.assertFalse(child['dangling']);target=child['target']
     self.assertLessEqual(node['priority'],objects[target]['priority'])
     visit(target,*bounds)
  visit(root,0,6)
  self.assertEqual(len(seen),5)

  return tuple(sorted((node['key'],field,objects[node[field]['target']]['key']) for node in objects.values() for field in ('low','high') if node[field]))
 def test_different_seeds_produce_valid_distinct_topologies(self):
  shapes=set()
  for seed in [1,2,3,9,42,123]:
   with self.subTest(seed=seed):
    shapes.add(self.check_tree(SOURCE.replace('srand(7)','srand('+str(seed)+')')))
  self.assertGreater(len(shapes),1)

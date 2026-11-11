import unittest
from backend.engine import trace
from tests.avl_program import program

class AVLExecution(unittest.TestCase):
 def test_rotations_and_runtime_topology(self):
  for keys in ([3,2,1],[1,2,3],[3,1,2],[1,3,2],[7,3,9,1,5,4],[2,5,1,4,3,6]):
   with self.subTest(keys=keys):
    result=trace(program(keys))
    self.assertEqual(result['output'],''.join(str(k)+' ' for k in sorted(keys)))
    objects={o['id']:o['fields'] for o in result['steps'][-1]['objects'] if 'key' in o['fields']}
    self.assertEqual(len(objects),len(keys))
    targets={v['target'] for fields in objects.values() for v in fields.values() if isinstance(v,dict) and v.get('target') in objects}
    roots=set(objects)-targets
    self.assertEqual(len(roots),1)
    seen=set()
    def walk(identity,low,high):
     self.assertNotIn(identity,seen);seen.add(identity)
     node=objects[identity];self.assertTrue(low<node['key']<high)
     def child(field,lower,upper):
      value=node[field]
      return walk(value['target'],lower,upper) if isinstance(value,dict) else 0
     left=child('left',low,node['key']);right=child('right',node['key'],high)
     self.assertLessEqual(abs(left-right),1)
     self.assertEqual(node['height'],max(left,right)+1)
     return node['height']
    walk(roots.pop(),-100,100)
    self.assertEqual(len(seen),len(keys))
    self.assertTrue(any(s['event']=='call' and 'rotate' in s['expression'] for s in result['steps']))

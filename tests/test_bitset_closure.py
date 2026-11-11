import unittest
from backend.engine import trace

SOURCE='int main(){unsigned int reachable[4]={2u,4u,1u,0u};for(int via=0;via<4;via++)for(int from=0;from<4;from++)if(reachable[from]&(1u<<via))reachable[from]|=reachable[via];for(int i=0;i<4;i++)printf("%u ",reachable[i]);}'

class BitsetClosure(unittest.TestCase):
 def test_unseen_bitset_graph_algorithm_and_write_identity(self):
  result=trace(SOURCE)
  self.assertEqual(result['output'],'7 7 7 0 ')
  final=result['steps'][-1]
  self.assertEqual(final['variables']['reachable'],[7,7,7,0])
  self.assertEqual(final['integers']['reachable'],{'bits':32,'unsigned':True})
  writes=[a for step in result['steps'] if step['event']=='write' for a in step['writes'] if a.get('array')]
  self.assertTrue(writes)
  self.assertTrue(all(a['array']==final['arrays']['reachable']['id'] for a in writes))
  self.assertTrue(all(0<=a['index']<3 for a in writes))

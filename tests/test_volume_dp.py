import unittest
from backend.engine import trace

SOURCE='int main(){int paths[2][3][3]={0};for(int z=0;z<2;z++)for(int y=0;y<3;y++)for(int x=0;x<3;x++){if(z==0&&y==0&&x==0)paths[z][y][x]=1;else paths[z][y][x]=(z?paths[z-1][y][x]:0)+(y?paths[z][y-1][x]:0)+(x?paths[z][y][x-1]:0);}printf("%d",paths[1][2][2]);}'

class VolumeDynamicProgramming(unittest.TestCase):
 def test_slices_and_physical_write_identity(self):
  result=trace(SOURCE);self.assertEqual(result['output'],'30')
  final=result['steps'][-1]
  self.assertEqual(final['variables']['paths'][1][2][2],30)
  row_ids=[meta['id'] for name,meta in final['arrays'].items() if name.count('[')==2]
  self.assertEqual(len(row_ids),6);self.assertEqual(len(set(row_ids)),6)
  writes=[a for s in result['steps'] if s['event']=='write' for a in s['writes'] if a.get('value')==30 and a.get('array')]
  self.assertEqual(writes[-1]['array'],final['arrays']['paths[1][2]']['id'])
  self.assertEqual(writes[-1]['index'],2)

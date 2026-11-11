import unittest
from backend.engine import trace

class AggregatePointerViews(unittest.TestCase):
 def test_matrix_parameter_has_rows_and_identity(self):
  source='void edit(int columns,int (*rows)[columns]){rows[1][1]=7;printf("%d",rows[1][1]);}int main(){int matrix[2][2]={0};edit(2,matrix);}'
  result=trace(source)
  step=next(s for s in result['steps'] if s['event']=='write')
  self.assertEqual(result['output'],'7')
  self.assertEqual(step['variables']['rows']['elements'],[[0,0],[0,7]])
  self.assertIn('rows[1]',step['arrays'])
  self.assertEqual(step['arrays']['rows[1]']['id'],step['writes'][0]['array'])
  self.assertEqual(step['integers']['rows[1]']['bits'],32)
 def test_struct_array_parameter_has_nested_arrays(self):
  result=trace('struct R{unsigned int flags[2];};void edit(struct R *rows){rows[1].flags[0]=9;}int main(){struct R rows[2]={0};edit(rows);}')
  step=next(s for s in result['steps'] if s['event']=='write')
  self.assertEqual(step['variables']['rows']['elements'][1]['flags'],[9,0])
  self.assertIn('rows[1].flags',step['arrays'])

 def test_character_matrix_parameter_keeps_row_type(self):
  result=trace('void show(char (*words)[4]){printf("%s",words[0]);}int main(){char words[2][4]={"cat","dog"};show(words);}')
  step=next(s for s in result['steps'] if s['stack']==['main','show'])
  self.assertEqual(result['output'],'cat')
  self.assertIn('words[0]',step['characters'])
  self.assertIn('words[1]',step['characters'])

 def test_matrix_pointer_reassignment_changes_root_identity(self):
  result=trace('int main(){int a[1][2]={{1,2}};int b[1][2]={{3,4}};int (*rows)[2]=a;rows=b;printf("%d",rows[0][0]);}')
  identities={s['arrays']['rows']['id'] for s in result['steps'] if isinstance(s['variables'].get('rows'),dict)}
  self.assertEqual(result['output'],'3')
  self.assertEqual(len(identities),2)

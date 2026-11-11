import random
import unittest
from backend.engine import trace

class GeneratedPrograms(unittest.TestCase):
 def test_new_sort_inputs_and_every_array_access(self):
  rng=random.Random(173)
  for case in range(12):
   values=[rng.randrange(-8,9) for _ in range(rng.randrange(2,7))]
   name='data_'+str(case)
   code='int main(){int '+name+'['+str(len(values))+']={'+','.join(map(str,values))+'};for(int outer=0;outer<'+str(len(values))+';outer++)for(int inner=outer+1;inner<'+str(len(values))+';inner++)if('+name+'[inner]<'+name+'[outer]){int carry='+name+'[outer];'+name+'[outer]='+name+'[inner];'+name+'[inner]=carry;}}'
   with self.subTest(case=case,values=values):
    result=trace(code)
    self.assertEqual(result['steps'][-1]['variables'][name],sorted(values))
    for step in result['steps']:
     for access in step['reads']+step['writes']:
      if access.get('name')==name and 'index' in access:
       self.assertEqual(access['value'],step['variables'][name][access['index']])
       self.assertEqual(access['array'],step['arrays'][name]['id'])
 def test_all_object_references_resolve_in_each_snapshot(self):
  result=trace('struct UnnamedPattern {int payload;struct UnnamedPattern *forward;struct UnnamedPattern *back;};int main(){struct UnnamedPattern *pool=calloc(4,sizeof(*pool));for(int i=0;i<4;i++){pool[i].payload=i;pool[i].forward=&pool[(i+1)%4];pool[i].back=&pool[(i+3)%4];}free(pool);}')
  def references(value):
   if isinstance(value,dict):
    if value.get('kind')=='reference':
     if value.get('target'):yield value['target']
    else:
     for child in value.values():yield from references(child)
   elif isinstance(value,list):
    for child in value:yield from references(child)
  for step in result['steps']:
   ids={obj['id'] for obj in step['objects']}
   for target in references([step['variables'],step['objects']]):self.assertIn(target,ids)

 def test_reference_flags_stay_boolean_through_completion(self):
  r=trace('struct N {struct N *next;};int main(){struct N *a=calloc(1,sizeof(*a));struct N *b=calloc(1,sizeof(*b));a->next=b;}')
  for step in r['steps']:
   for obj in step['objects']:
    self.assertIsInstance(obj['expired'],bool)
    self.assertIsInstance(obj['freed'],bool)
    for value in obj['fields'].values():
     if isinstance(value,dict) and value.get('kind')=='reference':self.assertIsInstance(value['dangling'],bool)
  self.assertEqual(r['steps'][-1]['objects'],r['steps'][-2]['objects'])

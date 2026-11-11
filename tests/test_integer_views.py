import unittest
from backend.engine import trace

class IntegerViews(unittest.TestCase):
 def test_declared_width_and_signedness(self):
  result=trace('int main(){signed char small=-1;unsigned long long mask=18446744073709551615ULL;int *pointer=0;printf("%d",small);}')
  step=next(s for s in result['steps'] if 'mask' in s['variables'] and 'pointer' in s['variables'])
  self.assertEqual(step['integers']['small'],{'bits':8,'unsigned':False})
  self.assertEqual(step['integers']['mask'],{'bits':64,'unsigned':True})
  self.assertNotIn('pointer',step['integers'])
 def test_local_shadow_type(self):
  result=trace('int main(){int n=1;{unsigned short n=7;printf("%u",n);}printf("%d",n);}')
  outputs=[s for s in result['steps'] if s['event']=='output']
  self.assertEqual(outputs[0]['integers']['n'],{'bits':16,'unsigned':True})
  self.assertEqual(outputs[1]['integers']['n'],{'bits':32,'unsigned':False})

 def test_nested_arrays_and_fields(self):
  result=trace('struct N{unsigned short flags;unsigned int masks[2];int *next;};int main(){struct N node={3,{7,9},0};unsigned int *alias=node.masks+1;printf("%u",alias[0]);}')
  step=next(s for s in result['steps'] if isinstance(s['variables'].get('alias'),dict))
  self.assertEqual(step['integers']['node.flags'],{'bits':16,'unsigned':True})
  self.assertEqual(step['integers']['node.masks'],{'bits':32,'unsigned':True})
  self.assertEqual(step['integers']['alias'],{'bits':32,'unsigned':True})
  self.assertNotIn('node.next',step['integers'])

 def test_dynamic_node_integer_metadata(self):
  result=trace('struct N{unsigned long long flags;struct N *next;};int main(){struct N *n=calloc(1,sizeof(*n));n->flags=1ULL<<63;printf("%llu",n->flags);free(n);}')
  live=next(obj for s in result['steps'] for obj in s['objects'] if obj['fields'].get('flags')=='9223372036854775808')
  self.assertEqual(live['integers'][live['id']+'.flags'],{'bits':64,'unsigned':True})
  self.assertNotIn(live['id']+'.next',live['integers'])

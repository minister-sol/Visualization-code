import unittest
from backend.engine import trace

PROGRAM = r"""
#include <stdlib.h>
#include <stdio.h>
typedef struct {int key;int payload[2];} Record;
typedef struct {Record rows[3];int size;} Table;
Record make(int key){Record record={key,{key*10,key*10+1}};return record;}
int compare(const void *left,const void *right){const Record *a=left;const Record *b=right;return (a->key>b->key)-(a->key<b->key);}
int main(){Table table={0};int keys[3]={3,1,2};for(int cursor=0;cursor<3;cursor++)table.rows[cursor]=make(keys[cursor]);table.size=3;qsort(table.rows,table.size,sizeof(table.rows[0]),compare);printf("%d %d %d",table.rows[0].payload[1],table.rows[1].key,table.rows[2].payload[0]);}
"""

class AnonymousRecords(unittest.TestCase):
 def test_nested_typedef_factory_and_sort(self):
  result=trace(PROGRAM)
  self.assertEqual(result['output'],'11 2 30')
  state=result['steps'][-1]['variables']['table']
  self.assertEqual([row['key'] for row in state['rows']],[1,2,3])
  self.assertEqual([row['payload'] for row in state['rows']],[[10,11],[20,21],[30,31]])
  self.assertFalse(any('__scope_' in s['expression'] for s in result['steps']))
 def test_identical_anonymous_layouts_are_distinct(self):
  with self.assertRaisesRegex(Exception,'类型不匹配'):
   trace('typedef struct {int value;} A;typedef struct {int value;} B;int main(){A a={1};B b={2};a=b;}')
 def test_shared_definition_in_one_declaration(self):
  self.assertEqual(trace('int main(){struct {int value;} a={3},b={7};a=b;printf("%d",a.value);}')['output'],'7')
 def test_distinct_typedef_widths(self):
  source='typedef struct {int value;} A;typedef struct {long long value;} B;int main(){A a={7};B b={9007199254740993LL};printf("%zu %zu %lld",sizeof(a),sizeof(b),b.value);}'
  self.assertEqual(trace(source)['output'],'4 8 9007199254740993')

 def test_record_exchange_identifies_affected_objects(self):
  result=trace(PROGRAM)
  swap=next(s for s in result['steps'] if s['description']=='qsort 交换相邻元素')
  affected={identity for access in swap['writes'] for identity in access.get('objects',[])}
  self.assertEqual(len(affected),2)
  self.assertTrue(affected.issubset({o['id'] for o in swap['objects']}))

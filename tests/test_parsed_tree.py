import unittest
from backend.engine import trace

SOURCE=r"""
struct Item{int key;struct Item *low;struct Item *high;};
void show(struct Item *node){if(node){show(node->low);printf("%d ",node->key);show(node->high);}}
int main(){char text[]="3,1,4";char *cursor=text;char *end;struct Item pool[3]={0};struct Item *root=0;int used=0;
while(*cursor){struct Item *node=&pool[used++];node->key=(int)strtol(cursor,&end,10);struct Item **slot=&root;while(*slot){if(node->key<(*slot)->key)slot=&(*slot)->low;else slot=&(*slot)->high;}*slot=node;cursor=*end?end+1:end;}show(root);}
"""

class ParsedSearchTree(unittest.TestCase):
 def test_parser_to_pointer_slot_tree(self):
  result=trace(SOURCE)
  self.assertEqual(result['output'],'1 3 4 ')
  snapshot=next(s for s in reversed(result['steps']) if s['event']=='output')
  objects={o['fields']['key']:o for o in snapshot['objects']}
  self.assertEqual(len(objects),3)
  self.assertEqual(objects[3]['fields']['low']['target'],objects[1]['id'])
  self.assertEqual(objects[3]['fields']['high']['target'],objects[4]['id'])
  writes=[s for s in result['steps'] if s['description']=='记录整数解析结束位置']
  self.assertEqual([s['result']['offset'] for s in writes],[1,3,5])

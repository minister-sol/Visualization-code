import unittest
from backend.engine import trace

class StructurePrograms(unittest.TestCase):
 def test_recursive_tree_with_custom_field_names(self):
  code="""struct Branch {int score; struct Branch *west; struct Branch *east;};
int sum(struct Branch *p){if(p==0)return 0;return p->score+sum(p->west)+sum(p->east);}
int main(){struct Branch root;struct Branch leaf;root.score=8;leaf.score=3;
root.west=&leaf;root.east=0;leaf.west=0;leaf.east=0;printf("%d",sum(&root));}"""
  result=trace(code)
  self.assertEqual(result['output'],'11')
  self.assertTrue(any(s['stack'].count('sum')>=3 for s in result['steps']))

 def test_reverse_arbitrary_linked_nodes(self):
  code="""struct Cell {int value;struct Cell *following;};
struct Cell *reverse(struct Cell *p){struct Cell *previous=0;
while(p!=0){struct Cell *saved=p->following;p->following=previous;previous=p;p=saved;}return previous;}
int main(){struct Cell a;struct Cell b;struct Cell c;a.value=1;b.value=2;c.value=3;
a.following=&b;b.following=&c;c.following=0;struct Cell *head=reverse(&a);
while(head){printf("%d",head->value);head=head->following;}}"""
  result=trace(code)
  self.assertEqual(result['output'],'321')
  before=next(s for s in result['steps'] if s['objects'] and s['objects'][0]['fields'].get('following',{}).__class__ is dict)
  self.assertEqual(before['objects'][0]['fields']['following']['target'],'object-2')

 def test_shared_reference_and_cycle_serialization(self):
  result=trace('struct N {int x;struct N *edge;};int main(){struct N a;struct N b;a.x=1;b.x=2;a.edge=&b;b.edge=&a;struct N *p=&a;struct N *q=&a;printf("%d",p==q);}')
  self.assertEqual(result['output'],'1')
  state=result['steps'][-1]['objects']
  self.assertEqual(state[0]['fields']['edge']['target'],state[1]['id'])
  self.assertEqual(state[1]['fields']['edge']['target'],state[0]['id'])

 def test_pointer_parameter_updates_callers_scalar(self):
  self.assertEqual(trace('void update(int *p){*p=19;}int main(){int x=3;update(&x);printf("%d",x);}')['output'],'19')

 def test_pointer_to_expired_local_is_rejected(self):
  with self.assertRaisesRegex(Exception,'悬空指针'):
   trace('int *bad(){int local=3;return &local;}int main(){int *p=bad();printf("%d",*p);}')
 def test_pointer_to_expired_struct_is_rejected(self):
  with self.assertRaisesRegex(Exception,'悬空指针'):
   trace('struct N {int x;};struct N *bad(){struct N a;a.x=3;return &a;}int main(){struct N *p=bad();printf("%d",p->x);}')

 def test_dynamic_nodes_survive_factory(self):
  code="""struct Node {int v;struct Node *next;};
struct Node *make(int n,struct Node *tail){struct Node *p=(struct Node *)malloc(sizeof(struct Node));p->v=n;p->next=tail;return p;}
int main(){struct Node *head=make(7,make(2,0));printf("%d",head->v+head->next->v);
struct Node *tail=head->next;free(head);free(tail);}"""
  result=trace(code)
  self.assertEqual(result['output'],'9')
  self.assertEqual(sum(s['event']=='allocate' for s in result['steps']),2)
  self.assertTrue(all(o['freed'] for o in result['steps'][-1]['objects']))
 def test_dynamic_memory_errors(self):
  prefix='struct N {int x;};int main(){struct N *p=malloc(sizeof(struct N));p->x=1;'
  for suffix in ['free(p);printf("%d",p->x);}','free(p);free(p);}','struct N local;free(&local);}']:
   with self.subTest(suffix=suffix),self.assertRaises(Exception):trace(prefix+suffix)
 def test_uninitialized_heap_field(self):
  with self.assertRaisesRegex(Exception,'未初始化'):
   trace('struct N {int x;};int main(){struct N *p=malloc(sizeof(struct N));printf("%d",p->x);}')

 def test_typedef_tree_factory(self):
  result=trace("""typedef struct Vertex {int value;struct Vertex *left;struct Vertex *right;} Vertex;
typedef Vertex Tree;
typedef long long Number;
Tree *make(int value){Tree *p=(Tree *)malloc(sizeof(Tree));p->value=value;p->left=0;p->right=0;return p;}
Number total(Tree *p){if(!p)return 0;return p->value+total(p->left)+total(p->right);}
int main(){Tree *root=make(5);root->left=make(3);root->right=make(8);printf("%lld",total(root));}
""")
  self.assertEqual(result['output'],'16')
  self.assertEqual(len(result['steps'][-1]['objects']),3)
 def test_integer_typedef_array(self):
  self.assertEqual(trace('typedef int Count;int main(){Count a[2]={3,4};Count n=a[0]+a[1];printf("%d",n);}')['output'],'7')

 def test_struct_contained_stack(self):
  r=trace('struct Stack {int items[4];int top;};void push(struct Stack *s,int v){s->items[s->top++]=v;}int main(){struct Stack s;s.top=0;push(&s,5);push(&s,8);printf("%d",s.items[--s.top]);}')
  self.assertEqual(r['output'],'8')
  self.assertTrue(any(s['variables'].get('s',{}).get('items')==[5,8,None,None] for s in r['steps']))
 def test_struct_array_with_pointer_buckets(self):
  r=trace('struct Entry {int value;struct Entry *next;};int main(){struct Entry entries[2];struct Entry *buckets[3]={0};entries[0].value=17;entries[0].next=0;buckets[2]=&entries[0];printf("%d",buckets[2]->value);}')
  self.assertEqual(r['output'],'17')
  self.assertEqual(len(r['steps'][-1]['objects']),2)
 def test_nested_struct_members(self):
  self.assertEqual(trace('struct Inner {int n;};struct Outer {struct Inner part;int slots[2];};int main(){struct Outer v;v.part.n=4;v.slots[1]=7;printf("%d",v.part.n+v.slots[1]);}')['output'],'11')
 def test_expired_array_element_pointer(self):
  with self.assertRaisesRegex(Exception,'悬空指针'):
   trace('int main(){int *p=0;{int a[2]={1,2};p=&a[0];}printf("%d",*p);}')

 def test_custom_array_sort_function(self):
  code='void sort(int data[],int n){for(int i=0;i<n;i++){for(int j=i+1;j<n;j++){if(data[j]<data[i]){int t=data[i];data[i]=data[j];data[j]=t;}}}}int main(){int nums[4]={9,-1,4,2};sort(nums,4);for(int i=0;i<4;i++)printf("%d ",nums[i]);}'
  self.assertEqual(trace(code)['output'],'-1 2 4 9 ')
 def test_pointer_offset_array_argument(self):
  self.assertEqual(trace('void update(int *p){p[1]=21;}int main(){int a[4]={1,2,3,4};update(&a[1]);printf("%d",a[2]);}')['output'],'21')
 def test_array_pointer_variable(self):
  self.assertEqual(trace('int main(){int a[2]={3,4};int *p=a;p[0]=8;printf("%d",a[0]);}')['output'],'8')
 def test_array_pointer_bounds(self):
  with self.assertRaisesRegex(Exception,'越界'):
   trace('int main(){int a[2]={3,4};int *p=&a[1];p[1]=8;}')

 def test_dynamic_integer_array(self):
  result=trace('void fill(int a[],int n){for(int i=0;i<n;i++)a[i]=i*i;}int main(){int n=4;int *a=malloc(n*sizeof(int));fill(a,n);printf("%d",a[3]);free(a);}')
  self.assertEqual(result['output'],'9')
  self.assertEqual(result['steps'][-1]['objects'][0]['fields'],{'0':0,'1':1,'2':4,'3':9})
 def test_dynamic_array_after_free(self):
  with self.assertRaisesRegex(Exception,'释放后'):
   trace('int main(){int *a=malloc(2*sizeof(int));free(a);a[0]=3;}')
 def test_dynamic_array_budget(self):
  with self.assertRaises(Exception):trace('int main(){int *a=malloc(1001*sizeof(int));}')

 def test_pointer_typedef_and_double_pointer(self):
  code='typedef struct N {int x;struct N *next;} N;typedef N *Link;void prepend(Link *head,Link n){n->next=*head;*head=n;}int main(){N a={4,0};N b={7,0};Link head=&a;prepend(&head,&b);printf("%d %d",head->x,head->next->x);}'
  self.assertEqual(trace(code)['output'],'7 4')
 def test_nested_struct_initializer(self):
  self.assertEqual(trace('struct A {int x;int y;};struct B {struct A a;int values[3];};int main(){struct B b={{2,5},{8}};printf("%d %d %d",b.a.y,b.values[0],b.values[2]);}')['output'],'5 8 0')
 def test_array_struct_initializer(self):
  self.assertEqual(trace('struct P {int x;int y;};int main(){struct P a[2]={{1,2},{3}};printf("%d %d",a[0].y,a[1].y);}')['output'],'2 0')
 def test_initializer_rejects_excess_members(self):
  with self.assertRaises(Exception):trace('struct P {int x;};int main(){struct P a={1,2};}')

 def test_pointer_range_iteration(self):
  r=trace('int main(){int a[4]={2,4,6,8};int *p=a;int *end=a+4;int sum=0;while(p<end){sum+=*p++;}printf("%d %d",sum,end-a);}')
  self.assertEqual(r['output'],'20 4')
 def test_one_past_negative_index(self):
  self.assertEqual(trace('int main(){int a[2]={7,9};int *p=a+2;printf("%d",p[-1]);}')['output'],'9')
 def test_invalid_pointer_arithmetic(self):
  for source in ['int main(){int a[2];int *p=a+3;}','int main(){int a[2];int *p=a+2;printf("%d",*p);}','int main(){int a[2];int b[2];printf("%d",a-b);}']:
   with self.subTest(source=source),self.assertRaises(Exception):trace(source)

 def test_sizeof_dereference_in_own_initializer(self):
  r=trace('int main(){int *data=malloc(3*sizeof(*data));data[2]=17;printf("%d",data[2]);free(data);}')
  self.assertEqual(r['output'],'17')
 def test_sizeof_struct_pointer(self):
  self.assertEqual(trace('typedef struct N {int x;struct N *next;} N;int main(){N *p=malloc(sizeof(*p));p->x=6;p->next=0;printf("%d",p->x);free(p);}')['output'],'6')
 def test_sizeof_subscript_does_not_execute(self):
  self.assertEqual(trace('int main(){int a[2];int i=0;int *p=malloc(2*sizeof(a[i++]));printf("%d",i);free(p);}')['output'],'0')

 def test_dynamic_pointer_buckets(self):
  code='typedef struct N {int x;struct N *next;} N;int main(){int count=3;N **table=malloc(count*sizeof(*table));for(int i=0;i<count;i++)table[i]=0;N *item=malloc(sizeof(*item));item->x=8;item->next=table[2];table[2]=item;printf("%d",table[2]->x);free(item);free(table);}'
  self.assertEqual(trace(code)['output'],'8')

 def test_calloc_and_realloc_vector(self):
  code='int main(){int *a=calloc(2,sizeof(*a));printf("%d ",a[1]);a[0]=6;a[1]=9;a=realloc(a,4*sizeof(*a));a[2]=12;a[3]=15;a=realloc(a,3*sizeof(*a));printf("%d %d",a[0],a[2]);free(a);}'
  self.assertEqual(trace(code)['output'],'0 6 12')
 def test_realloc_invalidates_old_alias(self):
  with self.assertRaisesRegex(Exception,'释放后'):
   trace('int main(){int *a=malloc(2*sizeof(*a));int *alias=a;a=realloc(a,4*sizeof(*a));alias[0]=3;}')
 def test_realloc_growth_uninitialized(self):
  with self.assertRaisesRegex(Exception,'未初始化'):
   trace('int main(){int *a=calloc(2,sizeof(*a));a=realloc(a,3*sizeof(*a));printf("%d",a[2]);}')
 def test_calloc_struct(self):
  self.assertEqual(trace('struct N {int x;struct N *next;};int main(){struct N *p=calloc(1,sizeof(*p));printf("%d %d",p->x,p->next==0);free(p);}')['output'],'0 1')

 def test_dynamic_struct_array_node_pool(self):
  code='typedef struct Node {int value;struct Node *next;} Node;int main(){int n=3;Node *pool=calloc(n,sizeof(*pool));for(int i=0;i<n;i++){pool[i].value=i+5;if(i+1<n)pool[i].next=&pool[i+1];}Node *p=pool;while(p){printf("%d ",p->value);p=p->next;}free(pool);}'
  result=trace(code)
  self.assertEqual(result['output'],'5 6 7 ')
  self.assertEqual(len(result['steps'][-1]['objects']),3)
  self.assertTrue(all(o['freed'] for o in result['steps'][-1]['objects']))
 def test_free_pool_invalidates_element_alias(self):
  with self.assertRaisesRegex(Exception,'释放后'):
   trace('struct N {int n;};int main(){struct N *pool=calloc(3,sizeof(*pool));struct N *alias=&pool[2];free(pool);printf("%d",alias->n);}')
 def test_free_owned_member_array(self):
  with self.assertRaisesRegex(Exception,'释放后'):
   trace('struct N {int values[2];};int main(){struct N *p=calloc(1,sizeof(*p));int *alias=p->values;free(p);printf("%d",*alias);}')
 def test_free_does_not_release_pointer_target(self):
  code='struct N {int x;struct N *next;};int main(){struct N *a=calloc(1,sizeof(*a));struct N *b=calloc(1,sizeof(*b));b->x=7;a->next=b;free(a);printf("%d",b->x);free(b);}'
  self.assertEqual(trace(code)['output'],'7')

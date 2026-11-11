"""Unseen source programs: no algorithm IDs are passed to the execution engine."""
import unittest
from backend.engine import trace

PROGRAMS = {
 'fractional_weight_relaxation': ('struct Edge{int from;int to;double weight;};int main(){struct Edge edges[3]={{0,1,1.25},{1,2,2.5},{0,3,4.75}};double distance[4]={0,1e9,1e9,1e9};for(int pass=0;pass<3;pass++)for(int e=0;e<3;e++){int from=edges[e].from;int to=edges[e].to;if(distance[from]+edges[e].weight<distance[to])distance[to]=distance[from]+edges[e].weight;}printf("%.2f %.2f %.2f",distance[1],distance[2],distance[3]);}','1.25 3.75 4.75'),
 'float_storage_rounding': ('int main(){float value=0.1f;value+=0.0f;printf("%.9g",(double)value);}','0.100000001'),
 'braced_record_label': ('struct Entry{char label[4];int value;};int main(){struct Entry item={.label={"cat"},.label[0]=98,.value=3};item.value++;printf("%zu %s %d",sizeof(item.label),item.label,item.value);}','4 bat 4'),
 'overridden_record_initializers': ('struct R{int data[3];char text[4];};int main(){struct R r={.data={3,4,5},.data[1]=9,.text="abc",.text[0]=120};r.data[2]++;printf("%d %d %d %s",r.data[0],r.data[1],r.data[2],r.text);}','3 9 6 xbc'),
 'designator_cursor_matrix': ('struct P{int x;int y;};struct R{struct P point;int values[2];};int main(){int a[][2]={[1][1]=3,4,5};struct R r={.point.y=7,8,9};a[0][0]=1;printf("%zu %d %d %d %d",sizeof(a),a[2][1],r.point.x,r.values[0],r.values[1]);}','24 5 0 8 9'),
 'nested_designated_records': ('struct R{int key;int data[2];};int main(){struct R rows[]={[2].key=7,[2].data[1]=9,[0].key=3};rows[0].data[0]=4;printf("%zu %d %d %d",sizeof(rows),rows[0].key,rows[0].data[0],rows[2].data[1]);}','36 3 4 9'),
 'runtime_matrix_typedef': ('int main(){int columns=2;typedef int Row[columns];int rows=3;typedef Row Matrix[rows];columns=7;Matrix values;for(int r=0;r<rows;r++)for(int c=0;c<2;c++)values[r][c]=r*10+c;printf("%zu %d",sizeof(Matrix),values[2][1]);}','24 21'),
 'qualified_parameter_compatibility': ('int f(const int);int f(int x){return x+1;}int g(int *const);int g(int *p){return *p;}int main(){int x=7;x+=1;printf("%d %d",f(x),g(&x));}','9 8'),
 'canonical_integer_callbacks': ('signed int add(signed int);int add(int value){return value+1;}int main(){long unsigned int flags=7;short signed int count=2;signed int (*operation)(signed int)=add;flags|=8UL;printf("%lu %d",flags,operation(count));}','15 3'),
 'callback_factory_choice': ('typedef int (*Operation)(int);int plus(int x){return x+1;}int minus(int x){return x-1;}Operation factory(int mode){return mode?plus:minus;}int main(){Operation p=factory(1);int result=p(7);printf("%d %d",result,factory(0)(7));}','8 6'),
 'callback_dispatch_table': ('int add(int a,int b){return a+b;}int sub(int a,int b){return a-b;}int invoke(int operation(int,int),int x,int y){return operation(x,y);}int main(){int (*ops[2])(int,int)={add,sub};int value=invoke(ops[0],7,3);value=ops[1](value,4);printf("%d",value);}','6'),
 'callback_ordered_array': ('int less(int a,int b){return a<b;}void order(int a[],int n,int (*cmp)(int,int)){for(int i=0;i<n;i++)for(int j=i+1;j<n;j++)if(cmp(a[j],a[i])){int tmp=a[i];a[i]=a[j];a[j]=tmp;}}int main(){int a[4]={7,2,9,3};order(a,4,less);for(int i=0;i<4;i++)printf("%d ",a[i]);}','2 3 7 9 '),
 'formatted_bitmap_report': ('int main(){unsigned int words[2]={42u,7u};words[1]|=1u<<4;printf("[%#08x][%04u][%+6d][%-4d][%.0d][%hhu]",words[0],words[1],-3,5,0,257);}','[0x00002a][0023][    -3][5   ][][1]'),
 'aliased_array_operation': ('#define SET(a,i,v) ((a)[(i)]=(v))\n#define STORE SET\n#define UPDATE STORE\nint main(){int values[3]={0};UPDATE(values,1,7);printf("%d",values[1]);}','7'),
 'limits_shortest_paths': ('#include <limits.h>\nint main(){int distance[4]={0,INT_MAX,INT_MAX,INT_MAX};int edges[3][3]={{0,1,3},{1,2,4},{0,3,9}};for(int pass=0;pass<3;pass++){for(int e=0;e<3;e++){int from=edges[e][0];int to=edges[e][1];int weight=edges[e][2];if(distance[from]!=INT_MAX && distance[from]+weight<distance[to])distance[to]=distance[from]+weight;}}printf("%d %d %d",distance[1],distance[2],distance[3]);}','3 7 9'),
 'multiline_exchange': ('#define EXCHANGE(a,b) do { \\\nint t=(a); (a)=(b); (b)=t; \\\n} while(0)\nint main(){int a[3]={8,3,5};EXCHANGE(a[0],a[1]);printf("%d %d %d",a[0],a[1],a[2]);}', '3 8 5'),
 'expression_selected_capacity': ('#define HEIGHT 3\n#define USE_TREE\n#if defined(USE_TREE) && ((1<<HEIGHT)==8)\n#define CAP 8\n#elif 0 && (1/0)\n#define CAP 2\n#else\n#define CAP 4\n#endif\nint main(){int tree[CAP]={0};tree[CAP-1]=17;printf("%zu %d",sizeof(tree),tree[7]);}','32 17'),
 'configured_record_layout': ('#define ARRAY_MODE 1\n#if UNSET_MODE\nstruct R {int unused;};\n#elif ARRAY_MODE\nstruct R {int items[3];};\n#else\nstruct R {int other;};\n#endif\nint main(){struct R r={{2,4,6}};r.items[1]+=3;printf("%d",r.items[1]);}','7'),
 'guarded_node_definition': ('#ifndef NODE_H\n#define NODE_H\nstruct N {int value;struct N *next;};\n#endif\n#ifndef NODE_H\n#error duplicate definition\n#endif\n#ifdef NODE_H\nint main(){struct N tail={0,0};tail.value=4;struct N head={3,&tail};printf("%d",head.value+head.next->value);}\n#endif','7'),
 'macro_indexed_heap': ('#define PARENT(i) (((i)-1)/2)\n#define LESS(a,b) ((a)<(b))\nint main(){int heap[7]={1,3,2,8,5,7,4};int valid=1;for(int cursor=1;cursor<7;cursor++){if(LESS(heap[cursor],heap[PARENT(cursor)]))valid=0;}printf("%d",valid);}','1'),
 'pointer_compound_slot': ('int main(){int x=7;int *p=(int *){&x};int **slot=&(int *){p};**slot=9;*slot=0;printf("%d %d",x,*slot==0);}','9 1'),
 'compound_record_update': ('struct P {int x;int y;};int sum(struct P p){return p.x+p.y;}int main(){struct P p={0};p=(struct P){.y=7,.x=3};int *a=(int[]){2,4,6};printf("%d %d %d",p.y,sum((struct P){4,5}),a[2]);}','7 9 6'),
 'constant_state_configuration': ('enum {OFF=0&&(1/0),ON=1||(1/0),CAP=(unsigned char)259,FLAG=(~0u)>0,CHOICE=(0?1u:-1)>0};int main(){int a[CAP]={4,5,6};printf("%d %d %d %d %d",OFF,ON,a[CAP-1],FLAG,CHOICE);}','0 1 6 1 1'),
 'enum_indexed_table': ('enum {EMPTY,OPEN,CLOSED,CAPACITY=8};struct Table {int counts[CAPACITY];};int main(){struct Table t={.counts={[OPEN]=2,[CLOSED+1]=7,[1<<2]=9}};for(int i=0;i<CAPACITY;i++)printf("%d ",t.counts[i]);}','0 2 0 7 9 0 0 0 '),
 'local_enum_state': ('int operate(int n){typedef enum {PUSH=1,POP} Op;Op op=n;switch(op){case PUSH:return 7;case POP:return 9;}return 0;}int main(){int first=operate(1);int second=operate(2);printf("%d %d",first,second);}','7 9'),
 'static_sentinel': ('struct Node {int visits;struct Node *next;};struct Node *root(){static struct Node sentinel={0,&sentinel};sentinel.visits++;return &sentinel;}int main(){struct Node *p=root();root();printf("%d %d",p->visits,p->next==p);}','2 1'),
 'memory_work_arrays': ('#include <string.h>\nint main(){int matrix[2][3];memset(matrix,0,sizeof(matrix));int values[4]={2,4,6,8};int copied[4];memcpy(copied,values,sizeof(values));memmove(copied+1,copied,3*sizeof(int));printf("%d %d %d",matrix[1][2],copied[1],copied[3]);}','0 2 6'),
 'brace_elided_matrix': ('struct Pair {int x;int y;};int main(){int zero[3][4]={0};int a[][2]={1,2,3,4};struct Pair pairs[2]={5,6,7,8};printf("%d %d %d %zu",zero[2][3],a[1][1],pairs[1].y,sizeof(a));}','0 4 8 16'),
 'conditional_common_type': ('int main(){int i=3;printf("%u %d %zu %d",0?1u:-1,(0?1u:-1)<0,sizeof(i+++1),i);}','4294967295 0 4 3'),
 'short_circuit_guards': ('int main(){int *head=0;int count=0;int safe=head&&*head;int value=head?99:7;int ok=1||count++;printf("%d %d %d",safe,value,count);}','0 7 0'),
 'stored_allocation_size': ('#include <stddef.h>\nint main(){int *values=0;size_t bytes=3*sizeof(*values);values=malloc(bytes);for(int i=0;i<3;i++)values[i]=i+5;printf("%zu %d",bytes,values[2]);free(values);}','12 7'),
 'sizeof_array_length': ('#include <stddef.h>\nstruct Record {char label;int count;struct Record *next;};int main(){int values[5];size_t n=sizeof(values)/sizeof(values[0]);printf("%zu %zu",n,sizeof(struct Record));}','5 16'),
 'local_node_type': ('int main(){typedef struct Node {int key;struct Node *next;} Node;Node first={3,0};Node last={8,&first};Node *p=&last;while(p){printf("%d ",p->key);p=p->next;}}','8 3 '),
 'fixed_bitmap': ('#include <stdint.h>\nint main(){uint32_t bits=0;int positions[3]={3,7,31};for(int i=0;i<3;i++)bits|=1u<<positions[i];printf("%u %d",bits,(bits&(1u<<7))!=0);}','2147483784 1'),
 'unsigned_hash': ('unsigned int mix(unsigned int key){key^=key>>16;key*=2654435761u;return key;}int main(){unsigned int hash=mix(123456789u);printf("%u",hash);}','332905966'),
 'boolean_marks': ('#include <stdbool.h>\nint main(){bool seen[4]={false};seen[1]=true;seen[3]=7;int count=0;for(int i=0;i<4;i++)if(seen[i])count++;printf("%d",count);}','2'),
 'header_null_list': ('#include <stdlib.h>\ntypedef struct Node {int key;struct Node *next;} Node;int main(){Node *head=NULL;Node *item=calloc(1,sizeof(*item));item->key=7;item->next=head;head=item;while(head!=NULL){printf("%d",head->key);Node *next=head->next;free(head);head=next;}}','7'),
 'const_parameters': ('int sum(const int *a,int n){int total=0;for(int i=0;i<n;i++)total+=a[i];return total;}int main(){const int capacity=3;int data[capacity];for(int i=0;i<capacity;i++)data[i]=i+2;printf("%d",sum(data,capacity));}','9'),
 'forward_search': ('int last(int *,int);int main(){int values[3]={5,8,13};printf("%d",last(values,3));}int last(int values[],int n){return values[n-1];}','13'),
 'local_alias_scope': ('typedef int Value;int main(){Value total=3;{typedef long long Value;Value product=10000000000LL;printf("%lld ",product);}Value x=4;printf("%d",total+x);}','10000000000 7'),
 'explicit_width': ('int main(){int x=100000;long long product=(long long)x*x;char code=(char)65;printf("%lld %c",product,code);}','10000000000 A'),
 'runtime_string_key': ('#include <string.h>\nstruct Entry {char key[16];int value;};int main(){struct Entry item;strcpy(item.key,"node");strcat(item.key,"-7");item.value=23;printf("%s %d",item.key,item.value);}','node-7 23'),
 'enum_operations': ('typedef enum Command {PUSH=1,POP,COUNT} Command;int main(){int stack[4];int size=0;Command operations[4]={PUSH,PUSH,POP,COUNT};for(int i=0;i<4;i++){switch(operations[i]){case PUSH:stack[size++]=i+4;break;case POP:printf("%d ",stack[--size]);break;case COUNT:printf("%d",size);break;}}}','5 1'),
 'binary_search_tree': ('typedef struct T {int key;struct T *a;struct T *b;} T;\nT *insert(T *root,int key){if(!root){T *n=calloc(1,sizeof(*n));n->key=key;return n;}if(key<root->key)root->a=insert(root->a,key);else root->b=insert(root->b,key);return root;}\nvoid visit(T *p){if(!p)return;visit(p->a);printf("%d ",p->key);visit(p->b);}\nint main(){T *root=0;int keys[5]={5,2,8,1,3};for(int i=0;i<5;i++)root=insert(root,keys[i]);visit(root);}','1 2 3 5 8 '),
 'doubly_linked_delete': ('struct Link {int value;struct Link *prev;struct Link *next;};int main(){struct Link nodes[3]={{1,0,0},{2,0,0},{3,0,0}};nodes[0].next=&nodes[1];nodes[1].prev=&nodes[0];nodes[1].next=&nodes[2];nodes[2].prev=&nodes[1];struct Link *victim=&nodes[1];victim->prev->next=victim->next;victim->next->prev=victim->prev;struct Link *cursor=&nodes[2];while(cursor){printf("%d ",cursor->value);cursor=cursor->prev;}}','3 1 '),
 'character_trie': ('typedef struct Trie {int terminal;struct Trie *child[26];} Trie;\nvoid insert(Trie *root,char *word){for(int i=0;word[i];i++){int k=word[i]-\'a\';if(!root->child[k])root->child[k]=calloc(1,sizeof(Trie));root=root->child[k];}root->terminal=1;}\nint find(Trie *root,char *word){for(int i=0;word[i];i++){root=root->child[word[i]-\'a\'];if(!root)return 0;}return root->terminal;}\nint main(){Trie *root=calloc(1,sizeof(*root));char a[]="cat";char b[]="car";char prefix[]="ca";insert(root,"cat");insert(root,"car");printf("%d %d %d",find(root,a),find(root,b),find(root,prefix));}','1 1 0'),
 'segment_tree': ('int tree[32];void build(int data[],int p,int l,int r){if(l==r){tree[p]=data[l];return;}int m=(l+r)/2;build(data,p*2,l,m);build(data,p*2+1,m+1,r);tree[p]=tree[p*2]+tree[p*2+1];}\nint query(int p,int l,int r,int a,int b){if(a<=l&&r<=b)return tree[p];int m=(l+r)/2;int sum=0;if(a<=m)sum+=query(p*2,l,m,a,b);if(b>m)sum+=query(p*2+1,m+1,r,a,b);return sum;}\nint main(){int a[4]={2,4,6,8};build(a,1,0,3);printf("%d",query(1,0,3,1,2));}','10'),
 'stack_commands': ('int main(){int stack[4];int top=0;int commands[5]={1,1,2,1,2};for(int i=0;i<5;i++){switch(commands[i]){case 1:stack[top++]=i+10;break;case 2:if(top>0)printf("%d ",stack[--top]);break;default:break;}}printf("%d",top);}','11 13 1'),
 'string_dictionary': ('#include <string.h>\nstruct Entry {char key[8];int value;};int main(){struct Entry table[2]={{"cat",3},{"dog",5}};char query[]="dog";int length=strlen(query);for(int i=0;i<2;i++)if(strcmp(table[i].key,query)==0)printf("%s %d %d",table[i].key,table[i].value,length);}','dog 5 3'),
 'character_stack': ('int main(){char text[]="stack";char data[8];int top=0;for(int i=0;text[i];i++)data[top++]=text[i];while(top)printf("%c",data[--top]);}','kcats'),
 'recursive_record_return': ('struct Stats {int sum;int count;};struct Stats scan(int n){if(n==0){struct Stats z={0,0};return z;}struct Stats s=scan(n-1);s.sum+=n;s.count++;return s;}int main(){struct Stats result=scan(5);printf("%d %d",result.sum,result.count);}','15 5'),
 'edge_records': ('struct Edge {int weight;int ends[2];};int main(){struct Edge edges[3]={{9,{0,1}},{2,{1,2}},{5,{0,2}}};for(int i=0;i<3;i++)for(int j=i+1;j<3;j++)if(edges[j].weight<edges[i].weight){struct Edge temporary=edges[i];edges[i]=edges[j];edges[j]=temporary;}printf("%d:%d-%d %d",edges[0].weight,edges[0].ends[0],edges[0].ends[1],edges[2].weight);}','2:1-2 9'),
 'designated_tree': ('struct Node {int value;struct Node *left;struct Node *right;};int main(){struct Node leaf={.value=7};struct Node root={.right=&leaf,.value=3,.left=0};int lookup[]={[3]=11,[6]=17};printf("%d %d",root.right->value,lookup[6]);}','7 17'),
 'macro_capacity': ('#define CAP 4\n#define NIL 0\ntypedef struct Node {int value;struct Node *next;} Node;int main(){Node nodes[CAP];for(int i=0;i<CAP;i++){nodes[i].value=i;nodes[i].next=NIL;}printf("%d",nodes[CAP-1].value);}','3'),
 'pooled_graph_dfs': ('typedef struct Vertex {int visited;int value;struct Vertex *out[2];} Vertex;void dfs(Vertex *v){if(!v||v->visited)return;v->visited=1;printf("%d ",v->value);for(int i=0;i<2;i++)dfs(v->out[i]);}int main(){Vertex *pool=calloc(4,sizeof(*pool));for(int i=0;i<4;i++)pool[i].value=i;pool[0].out[0]=&pool[1];pool[0].out[1]=&pool[2];pool[1].out[0]=&pool[3];pool[2].out[0]=&pool[3];pool[3].out[0]=&pool[0];dfs(pool);free(pool);}','0 1 3 2 '),
 'growing_vector': ('struct Vector {int *items;int count;int capacity;};void push(struct Vector *v,int x){if(v->count==v->capacity){v->capacity*=2;v->items=realloc(v->items,v->capacity*sizeof(*v->items));}v->items[v->count++]=x;}int main(){struct Vector v;v.count=0;v.capacity=2;v.items=calloc(v.capacity,sizeof(*v.items));for(int i=0;i<7;i++)push(&v,i*3);printf("%d %d %d",v.count,v.capacity,v.items[6]);free(v.items);}','7 8 18'),
 'typed_allocation': ('typedef struct Cell {int value;struct Cell *next;} Cell;int main(){Cell **buckets=malloc(3*sizeof(*buckets));for(int i=0;i<3;i++)buckets[i]=0;Cell *p=malloc(sizeof(*p));p->value=23;p->next=0;buckets[1]=p;printf("%d",buckets[1]->value);free(p);free(buckets);}','23'),
 'pointer_scan': ('int main(){int values[5]={1,3,5,7,9};int *cursor=values;int *limit=values+5;int sum=0;while(cursor<limit)sum+=*cursor++;printf("%d %d",sum,limit-values);}','25 5'),
 'pointer_alias_list': ('typedef struct Node {int value;struct Node *next;} Node;typedef Node *List;void add(List *head,List item){item->next=*head;*head=item;}int main(){Node a={2,0};Node b={9,0};List root=&a;add(&root,&b);printf("%d %d",root->value,root->next->value);}','9 2'),
 'circular_queue': ("""struct Ring {int buffer[4];int head;int tail;};
void put(struct Ring *q,int x){q->buffer[q->tail]=x;q->tail=(q->tail+1)%4;}
int take(struct Ring *q){int x=q->buffer[q->head];q->head=(q->head+1)%4;return x;}
int main(){struct Ring q;q.head=0;q.tail=0;put(&q,8);put(&q,5);printf("%d ",take(&q));put(&q,3);put(&q,1);int first=take(&q);int second=take(&q);printf("%d %d",first,second);}""",'8 5 3'),
 'binary_heap': ("""void insert(int h[],int n,int x){h[n]=x;while(n>0){int p=(n-1)/2;if(h[p]<=h[n])break;int t=h[p];h[p]=h[n];h[n]=t;n=p;}}
int main(){int h[6];int input[6]={9,4,7,1,8,2};for(int i=0;i<6;i++)insert(h,i,input[i]);printf("%d",h[0]);}""",'1'),
 'hash_chains': ("""typedef struct Pair {int key;int value;struct Pair *more;} Pair;
int main(){Pair *table[3]={0};int keys[3]={2,5,8};for(int i=0;i<3;i++){int bucket=keys[i]%3;Pair *p=malloc(sizeof(Pair));p->key=keys[i];p->value=i+10;p->more=table[bucket];table[bucket]=p;}
Pair *cursor=table[2];while(cursor){printf("%d:%d ",cursor->key,cursor->value);Pair *next=cursor->more;free(cursor);cursor=next;}}""",'8:12 5:11 2:10 '),
 'union_find': ("""int root(int parent[],int x){if(parent[x]!=x)parent[x]=root(parent,parent[x]);return parent[x];}
void join(int parent[],int a,int b){parent[root(parent,a)]=root(parent,b);}
int main(){int p[5]={0,1,2,3,4};join(p,0,1);join(p,2,3);join(p,1,3);printf("%d %d",root(p,0)==root(p,2),root(p,4)==root(p,0));}""",'1 0'),
 'graph_bfs': ("""int main(){int edges[4][4]={{0,1,1,0},{1,0,0,1},{1,0,0,1},{0,1,1,0}};int seen[4]={0};int queue[4];int start=0;int end=1;queue[0]=0;seen[0]=1;
while(start<end){int v=queue[start++];printf("%d ",v);for(int w=0;w<4;w++){if(edges[v][w]&&!seen[w]){seen[w]=1;queue[end++]=w;}}}}""",'0 1 2 3 '),
}

INPUT_PROGRAMS={
 'unsigned_input': ('int main(){unsigned int value;unsigned long long large;scanf("%u %llu",&value,&large);printf("%u %llu",value,large);}','4294967295 18446744073709551615','4294967295 18446744073709551615'),
 'input_word': ('int main(){char word[8];char label;int n=scanf("%7s %c",word,&label);printf("%s %c %d",word,label,n);}','graph Z','graph Z 2'),
}

from tests.test_realloc_structs import SOURCE as STRUCT_REALLOC_SOURCE
PROGRAMS['growing_struct_pool'] = (STRUCT_REALLOC_SOURCE, '7 9 42 11 7 42 42')

from tests.avl_program import program as avl_program
PROGRAMS['avl_dynamic_rotations'] = (avl_program([7,3,9,1,5,4]), '1 3 4 5 7 9 ')

INPUT_PROGRAMS['long_weight_input'] = ('int main(){long weights[3];unsigned long count;scanf("%ld %li %ld %lu",&weights[0],&weights[1],&weights[2],&count);weights[2]+=weights[0]+weights[1];printf("%ld %lu",weights[2],count);}', '7 010 9 3', '24 3')

INPUT_PROGRAMS['hex_bitmap_input'] = ('int main(){unsigned int mask;scanf("%x",&mask);mask|=1u<<3;mask&=~(1u<<1);printf("%x %X %o",mask,mask,mask);}', '0xa2', 'a8 A8 250')

INPUT_PROGRAMS['character_stream_bracket_stack'] = ('#include <stdio.h>\nint main(){char stack[16];int top=0;int c;int valid=1;while((c=getchar())!=EOF){if(c==40||c==91)stack[top++]=c;else if(c==41||c==93){if(!top){valid=0;break;}int open=stack[--top];if((c==41&&open!=40)||(c==93&&open!=91)){valid=0;break;}}}putchar(valid&&top==0?49:48);putchar(10);}', '(a + [b])', '1\n')

INPUT_PROGRAMS['ctype_token_scan'] = ('#include <stdio.h>\n#include <ctype.h>\nint main(){int c;int sum=0;int number=0;while((c=getchar())!=EOF){if(isdigit(c))number=number*10+c-48;else{sum+=number;number=0;if(isalpha(c))putchar(tolower(c));}}sum+=number;printf(" %d",sum);}', 'A12 b3 Z', 'abz 15')

from tests.test_qsort import CMP as QSORT_COMPARATOR
PROGRAMS['qsort_callback_records'] = (QSORT_COMPARATOR+'int main(){int a[4]={7,2,9,3};qsort(a,4,sizeof(a[0]),compare);for(int i=0;i<4;i++)printf("%d ",a[i]);}', '2 3 7 9 ')

PROGRAMS['bsearch_callback_lookup'] = (QSORT_COMPARATOR+'int main(){int a[5]={1,3,5,7,9};int key=7;int *found=bsearch(&key,a,5,sizeof(a[0]),compare);printf("%d ",*found);key=6;printf("%d",bsearch(&key,a,5,sizeof(a[0]),compare)==0);}', '7 1')

from tests.test_anonymous_records import PROGRAM as ANONYMOUS_RECORD_PROGRAM
PROGRAMS['anonymous_record_table_sort'] = (ANONYMOUS_RECORD_PROGRAM, '11 2 30')

INPUT_PROGRAMS['floating_input_pair'] = ('int main(){float x;double y;scanf("%f %lf",&x,&y);double sum=x+y;printf("%.3f %d %zu %zu",sum,(int)sum,sizeof(x),sizeof(y));}', '1.25 -2.5e0', '-1.250 -1 4 8')

PROGRAMS['geometry_polyline_math'] = ('#include <math.h>\nint main(){double p[3][2]={{0,0},{3,4},{6,8}};double distance=0;for(int i=1;i<3;i++)distance+=hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);printf("%.2f %.2f",distance,sqrt(81));}', '10.00 9.00')

PROGRAMS['manhattan_nearest_point'] = ('#include <stdlib.h>\nint main(){int points[4][2]={{4,-2},{-1,3},{2,1},{8,5}};int query[2]={1,2};int best=-1;int distance=1000;for(int i=0;i<4;i++){int candidate=abs(points[i][0]-query[0])+abs(points[i][1]-query[1]);if(candidate<distance){distance=candidate;best=i;}}printf("%d %d %lld",best,distance,llabs(-3000000000LL));}', '2 2 3000000000')

PROGRAMS['substring_alias_rewrite'] = ('#include <string.h>\nint main(){char text[]="key=tree;next=leaf";char *value=strchr(text,61)+1;char *end=strchr(value,59);*end=0;char *match=strstr(value,"ree");*match=82;printf("%s %s %d",text,value,strrchr(value,101)==value+3);}', 'key=tRee tRee 1')

PROGRAMS['bounded_record_labels'] = ('#include <string.h>\nstruct Record{char label[5];int value;};int main(){struct Record rows[3]={{{0},7},{{0},2},{{0},9}};strncpy(rows[0].label,"alpha",4);strncpy(rows[1].label,"alps",4);strncpy(rows[2].label,"beta",4);int sum=0;for(int i=0;i<3;i++)if(strncmp(rows[i].label,"alp",3)==0)sum+=rows[i].value;printf("%d %s %s",sum,rows[0].label,rows[2].label);}', '9 alph beta')

PROGRAMS['assert_queue_invariants'] = ('#include <assert.h>\nint main(){int queue[4]={0};int head=0;int tail=0;int count=0;for(int i=0;i<3;i++){assert(count<4);queue[tail]=i+7;tail=(tail+1)%4;count++;}int sum=0;while(count){assert(head>=0&&head<4);sum+=queue[head];head=(head+1)%4;count--;}assert(count==0);printf("%d",sum);}', '24')
PROGRAMS['disabled_assert_side_effect'] = ('#define NDEBUG\n#include <assert.h>\nint main(){int n=1;assert(n++);printf("%d",n);}', '1')

PROGRAMS['binary_key_deduplication'] = ('#include <string.h>\nint main(){unsigned char keys[3][3]={{1,0,255},{1,0,255},{1,0,128}};int duplicate[3]={0};for(int i=1;i<3;i++)for(int j=0;j<i;j++)if(memcmp(keys[i],keys[j],3)==0){duplicate[i]=1;break;}printf("%d %d %d",duplicate[0],duplicate[1],duplicate[2]);}', '0 1 0')

PROGRAMS['recursive_search_early_exit'] = ('#include <stdlib.h>\nint visits=0;void find(int depth){visits++;if(depth==3){printf("%d %d",depth,visits);exit(7);}find(depth+1);visits=99;}int main(){find(0);printf("unreachable");}', '3 4')

PROGRAMS['external_global_queue'] = ('extern int queue[];extern int count;extern void push(int);void push(int value){extern int queue[];extern int count;queue[count++]=value;}int queue[4]={0};int count=0;int main(){push(7);push(9);printf("%d %d %d",count,queue[0],queue[1]);}', '2 7 9')

PROGRAMS['merged_global_storage'] = ('int values[];extern int values[3];int *cursor=values;int values[3]={3,5,7};int values[];int count=3;int count;int main(){cursor[1]=9;printf("%d %d %d %d",count,values[0],values[1],values[2]);}', '3 3 9 7')

PROGRAMS['self_linked_node_pool'] = ('struct N{int value;struct N *next;};struct N nodes[3]={{1,&nodes[1]},{2,&nodes[2]},{3,0}};int main(){int sum=0;struct N *p=nodes;while(p){sum+=p->value;p=p->next;}printf("%d",sum);}', '6')

INPUT_PROGRAMS['pointer_interval_sum'] = ('#include <stddef.h>\nint main(){int data[5]={2,4,6,8,10};ptrdiff_t begin,end;if(scanf("%td %td",&begin,&end)!=2)return 1;if(begin<0||end>5||begin>end)return 2;int sum=0;int *cursor=data+begin;int *stop=data+end;while(cursor!=stop){sum+=*cursor;cursor++;}printf("%d %td",sum,stop-(data+begin));}', '1 4', '18 3')

PROGRAMS['runtime_record_report'] = ('struct R{char label[5];double cost;};int main(){struct R rows[2]={{"tree",1.25},{"heap",2.5}};for(int i=0;i<2;i++)printf("%*c %*.*s %*.*f\\n",2,65+i,-5,3,rows[i].label,6,2,rows[i].cost);}', ' A tre     1.25\n B hea     2.50\n')

RELINK_SOURCE='struct Cell{int payload;struct Cell *forward;struct Cell *back;};int main(){struct Cell pool[3]={{1,&pool[1],&pool[2]},{2,&pool[2],&pool[0]},{3,&pool[0],&pool[1]}};struct Cell *removed=&pool[1];removed->back->forward=removed->forward;removed->forward->back=removed->back;printf("%d %d",pool[0].forward->payload,pool[2].back->payload);}'
PROGRAMS['doubly_linked_ring_unlink'] = (RELINK_SOURCE,'3 1')

from tests.test_randomized_tree import SOURCE as TREAP_SOURCE
PROGRAMS['randomized_priority_tree'] = (TREAP_SOURCE,'1 2 3 4 5 ')

from tests.test_bitset_closure import SOURCE as BITSET_CLOSURE_SOURCE
PROGRAMS['bitset_graph_closure'] = (BITSET_CLOSURE_SOURCE,'7 7 7 0 ')

INPUT_PROGRAMS['fixed_record_parser'] = ('#include <inttypes.h>\nint main(){char label[3];int64_t value;int used;int count=scanf("%3c:%" SCNd64 "%%%n",label,&value,&used);printf("%.*s %" PRId64 " %d %d",3,label,value,used,count);}', 'abc:12345%', 'abc 12345 10 2')

from tests.test_parsed_tree import SOURCE as PARSED_TREE_SOURCE
PROGRAMS['parsed_search_tree'] = (PARSED_TREE_SOURCE,'1 3 4 ')

from tests.test_volume_dp import SOURCE as VOLUME_DP_SOURCE
PROGRAMS['volume_path_dynamic_programming'] = (VOLUME_DP_SOURCE,'30')

class AlgorithmCorpus(unittest.TestCase):
 def test_input_programs(self):
  for name,(source,stdin,expected) in INPUT_PROGRAMS.items():
   with self.subTest(program=name):self.assertEqual(trace(source,stdin)['output'],expected)

 def test_fresh_programs(self):
  for name,(source,expected) in PROGRAMS.items():
   with self.subTest(program=name):
    result=trace(source)
    self.assertEqual(result['output'],expected)
    self.assertEqual(result['status'],'completed')
    self.assertTrue(any(s['writes'] for s in result['steps']))
    self.assertTrue(all('line' in s and 'variables' in s for s in result['steps']))

 def test_completion_has_no_stale_expression_or_stack(self):
  final=trace('int main(){int n=3;printf("%d",n);}')['steps'][-1]
  self.assertEqual(final['stack'],[])
  self.assertEqual(final['expression'],'')
  self.assertEqual(final['reads'],[])

import unittest
from backend.engine import trace

class StaticStorage(unittest.TestCase):
 def test_counter_retains_value(self):
  self.assertEqual(trace('int next(){static int count;return ++count;}int main(){int a=next();int b=next();printf("%d %d",a,b);}')['output'],'1 2')
 def test_static_array_reference_survives_return(self):
  source='int *pool(){static int data[3];data[1]++;return data;}int main(){int *a=pool();pool();printf("%d %d",a[0],a[1]);}'
  self.assertEqual(trace(source)['output'],'0 2')
 def test_recursive_static_instance(self):
  self.assertEqual(trace('int visit(int n){static int count=0;count++;if(n)visit(n-1);return count;}int main(){printf("%d",visit(3));}')['output'],'4')
 def test_same_name_in_distinct_blocks(self):
  source='int f(int b){if(b){static int n=3;return ++n;}else{static int n=7;return ++n;}}int main(){int a=f(1);int b=f(0);int c=f(1);printf("%d %d %d",a,b,c);}'
  self.assertEqual(trace(source)['output'],'4 8 5')
 def test_global_static_and_static_function(self):
  self.assertEqual(trace('static int value=7;static int read(){return value;}int main(){printf("%d",read());}')['output'],'7')

 def test_static_circular_sentinel(self):
  source='struct N {int value;struct N *next;};struct N *head(){static struct N sentinel={0,&sentinel};sentinel.value++;return &sentinel;}int main(){struct N *p=head();head();printf("%d %d",p->value,p->next==p);}'
  self.assertEqual(trace(source)['output'],'2 1')
 def test_global_and_local_self_reference(self):
  source='struct N {struct N *next;};struct N global={&global};int main(){struct N local={&local};printf("%d %d",global.next==&global,local.next==&local);}'
  self.assertEqual(trace(source)['output'],'1 1')
 def test_static_const_remains_readonly(self):
  with self.assertRaises(Exception):trace('int *value(){static const int n=3;return &n;}int main(){int *p=value();*p=7;}')

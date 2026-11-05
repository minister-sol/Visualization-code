EXAMPLES=[]
def add(id,title,code,category='基础'):EXAMPLES.append(dict(id=id,title=title,description=title+' 的逐步执行',code=code,category=category))
add('bubble','冒泡排序','''#include <stdio.h>
int main() {
 int a[6]={6,3,8,2,5,1};
 for(int i=0;i<5;i++) {
  for(int j=0;j<5-i;j++) {
   if(a[j]>a[j+1]) {
    int t=a[j];
    a[j]=a[j+1];
    a[j+1]=t;
   }
  }
 }
 for(int k=0;k<6;k++) printf("%d ",a[k]);
 return 0;
}''','排序')
add('selection','选择排序','''int main(){
 int a[6]={9,4,7,1,6,2};
 for(int i=0;i<5;i++) {
  int min=i;
  for(int j=i+1;j<6;j++) if(a[j]<a[min]) min=j;
  int t=a[i];
  a[i]=a[min];
  a[min]=t;
 }
 return 0;
}''','排序')
add('insertion','插入排序','''int main(){
 int a[5]={5,2,4,1,3};
 for(int i=1;i<5;i++) {
  int key=a[i];
  int j=i-1;
  while(j>=0 && a[j]>key) {
   a[j+1]=a[j];
   j--;
  }
  a[j+1]=key;
 }
 return 0;
}''','排序')
add('recursion','递归阶乘','''#include <stdio.h>
int fact(int n){
 if(n<=1) return 1;
 int result=n*fact(n-1);
 return result;
}
int main(){
 int n=5;
 int result=fact(n);
 printf("%d",result);
 return 0;
}''','函数')
add('array','数组遍历','''int main(){
 int a[5]={1,2,3,4,5};
 int sum=0;
 for(int i=0;i<5;i++) sum+=a[i];
 return 0;
}''')

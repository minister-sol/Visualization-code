EXAMPLES=[]
def add(id,title,code,category='基础',stdin=''):EXAMPLES.append(dict(id=id,title=title,description=title+' 的逐步执行',code=code,category=category,stdin=stdin))
add('bubble','冒泡排序','''#include <stdio.h>
int main()
{
    int a[6]={6,3,8,2,5,1};
    for(int i=0;i<5;i++)
    {
        for(int j=0;j<5-i;j++)
        {
            if(a[j]>a[j+1])
            {
                int t=a[j];
                a[j]=a[j+1];
                a[j+1]=t;
            }
        }
    }
    for(int k=0;k<6;k++)
        printf("%d ",a[k]);
    return 0;
}''','排序')
add('selection','选择排序','''int main()
{
    int a[6]={9,4,7,1,6,2};
    for(int i=0;i<5;i++)
    {
        int min=i;
        for(int j=i+1;j<6;j++)
            if(a[j]<a[min])
                min=j;
        int t=a[i];
        a[i]=a[min];
        a[min]=t;
    }
    return 0;
}''','排序')
add('insertion','插入排序','''int main()
{
    int a[5]={5,2,4,1,3};
    for(int i=1;i<5;i++)
    {
        int key=a[i];
        int j=i-1;
        while(j>=0 && a[j]>key)
        {
            a[j+1]=a[j];
            j--;
        }
        a[j+1]=key;
    }
    return 0;
}''','排序')
add('recursion','递归阶乘','''#include <stdio.h>
int fact(int n)
{
    if(n<=1)
        return 1;
    int result=n*fact(n-1);
    return result;
}
int main()
{
    int n=5;
    int result=fact(n);
    printf("%d",result);
    return 0;
}''','函数')
add('array','数组遍历','''int main()
{
    int a[5]={1,2,3,4,5};
    int sum=0;
    for(int i=0;i<5;i++)
        sum+=a[i];
    return 0;
}''')

add('prefix','前缀和区间查询',r'''#include<stdio.h>
int main()
{
    long long int n,a,m,x,y,sum=0;
    scanf("%lld\n",&n);
    long long int arr[n+1];
    long long int total[n+1];
    total[0]=0;
    for(int i=1;i<=n;i++)
    {
        scanf("%lld",&arr[i]);
        total[i] = arr[i]+total[i-1];
    }
    scanf("\n%lld\n",&m);
    for(int q=1;q<=m;q++)
    {
        scanf("%lld %lld\n",&x,&y);
        sum=total[y]-total[x-1];
        printf("%lld\n",sum);
        sum=0;
    }
    return 0;
}''','数组','5\n1 2 3 4 5\n3\n1 3\n2 5\n1 5\n')
add('prime','素数判断',r'''#include <stdio.h>
int main()
{
    int n,x=0;
    scanf("%d",&n);
    for(int i=2;i<n;i++)
    {
        if(n%i!=0)
            continue;
        else
        {
            x=1;
            break;
        }
    }
    if(x==0&&n>=2)
        printf("1");
    else
        printf("0");
    return 0;
}''','基础','17\n')

add('linked-reverse','自定义链表反转','''struct Cell { int value; struct Cell *following; };
struct Cell *reverse(struct Cell *p) {
    struct Cell *previous=0;
    while(p!=0) {
        struct Cell *saved=p->following;
        p->following=previous;
        previous=p;
        p=saved;
    }
    return previous;
}
int main() {
    struct Cell a; struct Cell b; struct Cell c;
    a.value=1; b.value=2; c.value=3;
    a.following=&b; b.following=&c; c.following=0;
    struct Cell *head=reverse(&a);
    while(head) {
        printf("%d ",head->value);
        head=head->following;
    }
}''','数据结构')

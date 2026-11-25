#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* 读取示例数据，调用 getchar，输出可观察的结果。 */
int main(void)
{
    int value = getchar(); /* @call 调用 */
    if (value == EOF)
    {
        puts("EOF");
    }
    else
    {
        printf("%d\n", value);
    }
    return 0;
}

#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* 读取示例数据，调用 printf，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "hello";
    int count = printf("%s", text); /* @call 调用 */
    printf("\n%d\n", count);
    return 0;
}

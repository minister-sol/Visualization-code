#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* 读取示例数据，调用 atoi，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "-42";
    int value = atoi(text); /* @call 调用 */
    printf("%d\n", value);
    return 0;
}

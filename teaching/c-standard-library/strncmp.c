#include <stdio.h>
#include <string.h>

/* 读取示例数据，调用 strncmp，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *a = argc > 1 ? argv[1] : "cat";
    const char *b = argc > 2 ? argv[2] : "car";
    int result = strncmp(a, b, 3);
    printf("%d\n", (result > 0) - (result < 0));
    return 0;
}

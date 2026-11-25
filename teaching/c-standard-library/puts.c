#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* 读取示例数据，调用 puts，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "hello";
    int result = puts(text); /* @call 调用 */
    printf("%d\n", result >= 0);
    return 0;
}

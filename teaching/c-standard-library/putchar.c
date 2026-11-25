#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* 读取示例数据，调用 putchar，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "A";
    if (strlen(text) != 1)
    {
        return 1;
    }
    int result = putchar((unsigned char)text[0]); /* @call 调用 */
    printf("\n%d\n", result);
    return 0;
}

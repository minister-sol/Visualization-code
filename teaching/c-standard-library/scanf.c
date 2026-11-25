#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* 读取示例数据，调用 scanf，输出可观察的结果。 */
int main(void)
{
    char token[8];
    int count = scanf("%7s", token); /* @call 调用 */
    if (count == 1)
    {
        printf("%s\n", token);
    }
    printf("%s\n", count == EOF ? "EOF" : count == 1 ? "1" : "0");
    return 0;
}

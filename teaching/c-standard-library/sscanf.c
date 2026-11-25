#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* 读取示例数据，调用 sscanf，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "42 items";
    char digits[8];
    int count = sscanf(text, "%7[0123456789]", digits); /* @call 调用 */
    if (count == 1)
    {
        printf("1\n%s\n", digits);
    }
    else puts(count == EOF ? "EOF" : "0"); /* @no_assignment */
    return 0;
}

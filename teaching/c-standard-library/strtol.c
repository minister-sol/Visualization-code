#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* 读取示例数据，调用 strtol，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "42xyz";
    char *end;
    long value = strtol(text, &end, 10); /* @call 调用 */
    printf("%ld\n%td\n", value, end - text);
    return 0;
}

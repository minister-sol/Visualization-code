#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* 读取示例数据，调用 snprintf，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "hello";
    const char *capacity = argc > 2 ? argv[2] : "4";
    char buffer[33] = "";
    size_t n = (size_t)strtoul(capacity, NULL, 10);
    if (n > sizeof buffer)
    {
        return 1;
    }
    int result = snprintf(n ? buffer : NULL, n, "%s", text); /* @call 调用 */
    printf("%s\n%d\n", buffer, result);
    return 0;
}

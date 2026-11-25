#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* 读取示例数据，调用 free，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *count = argc > 1 ? argv[1] : "3";
    size_t n = (size_t)strtoul(count, NULL, 10);
    if (n < 1 || n > 64)
    {
        return 1;
    }
    int *p = malloc(n * sizeof *p);
    if (p == NULL)
    {
        return 1;
    }
    free(p); /* @call 调用 */
    p = NULL;
    printf("%d\n", p == NULL);
    return 0;
}

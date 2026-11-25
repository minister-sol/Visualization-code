#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* 读取示例数据，调用 realloc，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *count = argc > 1 ? argv[1] : "3";
    const char *scenario = argc > 2 ? argv[2] : "success";
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
    p[0] = 7;
    int mock_failure = strcmp(scenario, "failure") == 0;
    int *grown = mock_failure ? NULL : realloc(p, (n + 1) * sizeof *p); /* @call 调用 */
    if (grown == NULL)
    {
        printf("NULL\n%d\n", p[0]); /* @failure_output */
        free(p);
        return 0;
    }
    p = grown;
    printf("%d\n", p[0]);
    free(p);
    return 0;
}

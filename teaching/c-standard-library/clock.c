#include <stdio.h>
#include <string.h>
#include <time.h>
#include <stdlib.h>

/* 读取示例数据，调用 clock，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *count = argc > 1 ? argv[1] : "1000";
    long n = strtol(count,NULL,10);
    if (n < 0 || n > 1000000)
    {
        return 1;
    }
    clock_t start = clock(); /* @call 调用 */
    volatile unsigned long total = 0;
    for (long i = 0; i < n; ++i) total += (unsigned long)i;
    (void)total;
    clock_t end = clock();
    if (start == (clock_t)-1 || end == (clock_t)-1)
    {
        return 1;
    }
    printf("%d\n", ((double)end - (double)start)/CLOCKS_PER_SEC >= 0);
    return 0;
}

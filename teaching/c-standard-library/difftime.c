#include <stdio.h>
#include <string.h>
#include <time.h>
#include <stdlib.h>

/* 读取示例数据，调用 difftime，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *start = argc > 1 ? argv[1] : "10";
    const char *end = argc > 2 ? argv[2] : "70";
    time_t first = (time_t)strtol(start,NULL,10);
    time_t last = (time_t)strtol(end,NULL,10);
    double seconds = difftime(last,first); /* @call 调用 */
    printf("%.0f\n", seconds);
    return 0;
}

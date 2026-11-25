#include <stdio.h>
#include <string.h>
#include <time.h>
#include <stdlib.h>

/* 读取示例数据，调用 time，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *shift = argc > 1 ? argv[1] : "60";
    long seconds = strtol(shift,NULL,10);
    time_t now = time(NULL); /* @call 调用 */
    if (now == (time_t)-1)
    {
        return 1;
    }
    printf("%s\n%ld\n", ctime(&now) ? "available" : "unavailable", seconds);
    return 0;
}

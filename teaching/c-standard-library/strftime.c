#include <stdio.h>
#include <string.h>
#include <time.h>
#include <stdlib.h>

/* 读取示例数据，调用 strftime，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *year = argc > 1 ? argv[1] : "2026";
    const char *month = argc > 2 ? argv[2] : "11";
    const char *day = argc > 3 ? argv[3] : "25";
    const char *capacity = argc > 4 ? argv[4] : "16";
    struct tm date = {0};
    long y = strtol(year, NULL, 10), m = strtol(month, NULL, 10), d = strtol(day, NULL, 10);
    long n = strtol(capacity, NULL, 10);
    char buffer[33];
    if (y < 2000 || y > 2099 || m < 1 || m > 12 || d < 1 || d > 31 || n < 1 || n > (long)sizeof buffer)
    {
        return 1;
    }
    const int days[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    if (d > days[m - 1] + (m == 2 && y % 4 == 0))
    {
        return 1;
    }
    date.tm_year = y - 1900;
    date.tm_mon = m - 1;
    date.tm_mday = d;
    size_t length = strftime(buffer, n, "%Y-%m-%d", &date); /* @call 调用 */
    if (length != 0)
    {
        puts(buffer);
    }
    printf("%zu\n", length); /* @time_length */
    return 0;
}

#include <stdio.h>
#include <string.h>
#include <stdlib.h>

static int compare_ints(const void *a, const void *b)
{
    int x = *(const int *)a, y = *(const int *)b;
    return (x > y) - (x < y);
}

/* 读取示例数据，调用 bsearch，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *first = argc > 1 ? argv[1] : "3";
    const char *second = argc > 2 ? argv[2] : "1";
    const char *third = argc > 3 ? argv[3] : "2";
    const char *key = argc > 4 ? argv[4] : "2";
    int values[] = {atoi(first), atoi(second), atoi(third)};
    qsort(values, 3, sizeof values[0], compare_ints);
    int target = atoi(key);
    const int *hit = bsearch(&target, values, 3, sizeof values[0], compare_ints); /* @call 调用 */
    puts(hit ? "found" : "NULL");
    return 0;
}

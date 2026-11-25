#include <stdio.h>
#include <string.h>
#include <math.h>
#include <stdlib.h>

/* 读取示例数据，调用 hypot，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *a = argc > 1 ? argv[1] : "3";
    const char *b = argc > 2 ? argv[2] : "4";
    double x = strtod(a, NULL);
    double y = strtod(b, NULL);
    double result = hypot(x, y); /* @call 调用 */
    printf("%.8g\n", result);
    return 0;
}

#include <stdio.h>
#include <string.h>
#include <math.h>
#include <stdlib.h>

/* 读取示例数据，调用 pow，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "2.5";
    const char *exponent = argc > 2 ? argv[2] : "2";
    double x = strtod(text,NULL);
    double y = strtod(exponent,NULL);
    double result = pow(x, y); /* @call 调用 */
    printf("%.8g\n", result);
    return 0;
}

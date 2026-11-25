#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* 读取示例数据，调用 strtod，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "2.5ms";
    char *end;
    double value = strtod(text, &end); /* @call 调用 */
    printf("%.8g\n%td\n", value, end - text);
    return 0;
}

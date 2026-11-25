#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* 读取示例数据，调用 fprintf，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "hello";
    FILE *file = tmpfile();
    if (file == NULL)
    {
        return 1;
    }
    int count = fprintf(file, "%s", text); /* @call 调用 */
    printf("%d\n", count);
    fclose(file);
    return 0;
}

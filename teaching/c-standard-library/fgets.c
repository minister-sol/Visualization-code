#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* 读取示例数据，调用 fgets，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "hello";
    const char *capacity = argc > 2 ? argv[2] : "4";
    FILE *file = tmpfile();
    if (file == NULL)
    {
        return 1;
    }
    fputs(text, file);
    rewind(file);
    char buffer[33];
    int n = atoi(capacity);
    if (n < 2 || n > 33)
    {
        return 1;
    }
    char *result = fgets(buffer, n, file); /* @call 调用 */
    printf("%s\n", result ? buffer : "NULL");
    fclose(file);
    return 0;
}

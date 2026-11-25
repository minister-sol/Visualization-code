#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* 读取示例数据，调用 fseek，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "abcdef";
    const char *offset = argc > 2 ? argv[2] : "2";
    FILE *file = tmpfile();
    if (file == NULL)
    {
        return 1;
    }
    fputs(text, file);
    rewind(file);
    long n = strtol(offset,NULL,10);
    if (n < 0 || (unsigned long)n > strlen(text))
    {
        return 1;
    }
    int status = fseek(file, n, SEEK_SET); /* @call 调用 */
    if (status != 0)
    {
        return 1;
    }
    printf("%d %ld\n", status, ftell(file));
    fclose(file);
    return 0;
}

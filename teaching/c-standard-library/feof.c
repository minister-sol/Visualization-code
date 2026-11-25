#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* 读取示例数据，调用 feof，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "abc";
    const char *count = argc > 2 ? argv[2] : "5";
    FILE *file = tmpfile();
    if (file == NULL)
    {
        return 1;
    }
    if (fputs(text, file) == EOF || fseek(file, 0, SEEK_SET) != 0)
    {
        fclose(file);
        return 1;
    }
    char buffer[33];
    size_t n = (size_t)strtoul(count, NULL, 10);
    if (n > sizeof buffer)
    {
        return 1;
    }
    size_t got = fread(buffer, 1, n, file);
    int flag = feof(file); /* @call 调用 */
    printf("%zu\n%d\n", got, flag != 0);
    fclose(file);
    return 0;
}

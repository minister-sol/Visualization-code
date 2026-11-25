#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* 读取示例数据，调用 fread，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "abc";
    const char *count = argc > 2 ? argv[2] : "5";
    FILE *file = tmpfile();
    if (file == NULL)
    {
        return 1;
    }
    fputs(text, file);
    rewind(file);
    char buffer[33] = "";
    size_t n = (size_t)strtoul(count,NULL,10);
    if (n >= sizeof buffer)
    {
        return 1;
    }
    size_t read = fread(buffer, 1, n, file); /* @call 调用 */
    printf("%s\n%zu\n",buffer,read);
    fclose(file);
    return 0;
}

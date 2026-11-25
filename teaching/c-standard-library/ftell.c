#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* 读取示例数据，调用 ftell，输出可观察的结果。 */
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
    if (fseek(file,n,SEEK_SET) != 0)
    {
        return 1;
    }
    long position = ftell(file); /* @call 调用 */
    printf("%ld\n",position);
    fclose(file);
    return 0;
}

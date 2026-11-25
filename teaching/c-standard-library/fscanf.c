#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* 读取示例数据，调用 fscanf，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "hello";
    FILE *file = tmpfile();
    if (file == NULL)
    {
        return 1;
    }
    fputs(text, file);
    rewind(file);
    char token[8];
    int count = fscanf(file,"%7s",token); /* @call 调用 */
    if (count == 1)
    {
        printf("%s\n", token);
    }
    printf("%s\n", count == EOF ? "EOF" : "1");
    fclose(file);
    return 0;
}

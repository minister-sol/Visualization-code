#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* 读取示例数据，调用 fopen，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *mode = argc > 1 ? argv[1] : "wb";
    if (strcmp(mode,"wb") && strcmp(mode,"rb"))
    {
        return 1;
    }
    FILE *file = fopen("demo.bin", mode); /* @call 调用 */
    puts(file ? "opened" : "NULL");
    if (file)
    {
        fclose(file);
    }
    return 0;
}

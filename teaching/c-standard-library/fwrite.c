#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* 读取示例数据，调用 fwrite，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "hello";
    FILE *file = tmpfile();
    if (file == NULL)
    {
        return 1;
    }
    size_t count = fwrite(text, 1, strlen(text), file); /* @call 调用 */
    printf("%zu\n",count);
    fclose(file);
    return 0;
}

#include <stdio.h>
#include <string.h>

/* 读取示例数据，调用 memset，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "hello";
    char dest[32];
    if (strlen(text) >= sizeof dest)
    {
        return 1;
    }
    strcpy(dest, text);
    memset(dest, 42, strlen(dest));
    puts(dest);
    return 0;
}

#include <stdio.h>
#include <string.h>

/* 读取示例数据，调用 memmove，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "abcd";
    char dest[32];
    if (strlen(text) + 2 > sizeof dest)
    {
        return 1;
    }
    strcpy(dest, text);
    memmove(dest + 1, dest, strlen(dest) + 1);
    puts(dest);
    return 0;
}

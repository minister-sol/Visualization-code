#include <stdio.h>
#include <string.h>

/* 读取示例数据，调用 strchr，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "banana";
    const char *key = argc > 2 ? argv[2] : "a";
    if (key[0] && key[1])
    {
        return 1;
    }
    const char *found = strchr(text, key[0]);
    if (found)
    {
        printf("%td\n", found - text);
    }
    else
    {
        puts("NULL");
    }
    return 0;
}

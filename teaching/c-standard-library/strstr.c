#include <stdio.h>
#include <string.h>

/* 读取示例数据，调用 strstr，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "banana";
    const char *key = argc > 2 ? argv[2] : "ana";
    const char *found = strstr(text, key);
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

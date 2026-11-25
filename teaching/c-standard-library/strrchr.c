#include <stdio.h>
#include <string.h>

/* 读取示例数据，调用 strrchr，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "notes.v1.c";
    const char *key = argc > 2 ? argv[2] : ".";
    if (key[0] && key[1])
    {
        return 1;
    }
    const char *hit = strrchr(text, (unsigned char)key[0]); /* @call 调用 */
    if (hit == NULL) puts("NULL"); /* @no_match */
    else printf("%td\n", hit - text); /* @matched */
    return 0;
}

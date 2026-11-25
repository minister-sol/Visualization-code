#include <stdio.h>
#include <string.h>
#include <ctype.h>

/* 读取示例数据，调用 tolower，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "a";
    if (strlen(text) != 1)
    {
        return 1;
    }
    int result = tolower((unsigned char)text[0]);
    printf("%c\n", result);
    return 0;
}

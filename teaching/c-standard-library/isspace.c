#include <stdio.h>
#include <string.h>
#include <ctype.h>

/* 读取示例数据，调用 isspace，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : " ";
    if (strlen(text) != 1)
    {
        return 1;
    }
    int result = isspace((unsigned char)text[0]);
    printf("%d\n", result != 0);
    return 0;
}

#include <stdio.h>
#include <string.h>

/* 命令行传入一个字符串。省略参数时使用默认示例。 */
int main(int argc, char *argv[])
{
    if (argc > 2)
    {
        fputs("Expected one string argument.\n", stderr);
        return 1;
    }

    const char *text = argc == 2 ? argv[1] : "cat";
    /* 从首字节数到终止符之前。 */
    size_t length = strlen(text);
    printf("%zu\n", length);
    return 0;
}

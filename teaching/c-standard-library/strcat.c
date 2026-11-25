#include <stdio.h>
#include <string.h>

/* 读取示例数据，调用 strcat，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "cat";
    char dest[16] = "Hi ";
    if (strlen(text) >= sizeof dest - strlen(dest))
    {
        return 1;
    }
    strcat(dest, text);
    puts(dest);
    return 0;
}

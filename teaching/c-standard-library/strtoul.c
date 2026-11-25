#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#include <errno.h>

/* 读取示例数据，调用 strtoul，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "0x2a!";
    const char *base = argc > 2 ? argv[2] : "16";
    if (strcmp(base, "10") && strcmp(base, "16"))
    {
        return 1;
    }
    int radix = strcmp(base, "10") == 0 ? 10 : 16;
    if (text[strspn(text, " \t\n\r\v\f")] == '-')
    {
        return 1;
    }
    char *end;
    errno = 0;
    unsigned long value = strtoul(text, &end, radix); /* @call 调用 */
    if (errno == ERANGE || value > 65535UL)
    {
        return 1;
    }
    printf("%lu\n%td\n", value, end - text);
    return 0;
}

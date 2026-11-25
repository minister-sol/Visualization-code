#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#include <errno.h>

/* 读取示例数据，调用 perror，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "math";
    /* 用 C99 保证存在的错误码模拟失败，避免依赖系统文件路径。 */
    errno = EDOM;
    perror(text); /* @call 调用 */
    puts("stderr");
    return 0;
}

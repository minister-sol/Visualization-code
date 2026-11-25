#include <stdio.h>
#include <string.h>

/* 读取示例数据，调用 strcspn，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "hello,world";
    const char *key = argc > 2 ? argv[2] : ",;";
    size_t length = strcspn(text, key); /* @call 调用 */
    printf("%zu\n", length);
    return 0;
}

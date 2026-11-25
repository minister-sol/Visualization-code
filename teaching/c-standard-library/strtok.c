#include <stdio.h>
#include <string.h>

/* 读取示例数据，调用 strtok，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *text = argc > 1 ? argv[1] : "red,,green;blue";
    const char *key = argc > 2 ? argv[2] : ",;";
    char buffer[129];
    if (strlen(text) >= sizeof buffer)
    {
        return 1;
    }
    strcpy(buffer, text);
    char *token = strtok(buffer, key); /* @call 调用 */
    while (token != NULL)
    {
        puts(token);
        token = strtok(NULL, key);
    }
    puts("end"); /* @end_tokens */
    return 0;
}

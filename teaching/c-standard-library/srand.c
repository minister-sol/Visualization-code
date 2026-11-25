#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* 读取示例数据，调用 srand，输出可观察的结果。 */
int main(int argc, char *argv[])
{
    const char *seed = argc > 1 ? argv[1] : "1";
    unsigned int value = (unsigned int)strtoul(seed,NULL,10);
    srand(value); /* @call 调用 */
    int first = rand();
    srand(value);
    int again = rand();
    printf("%d\n", first == again && first >= 0 && first <= RAND_MAX);
    return 0;
}

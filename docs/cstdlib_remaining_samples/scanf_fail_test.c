/* scanf_fail_test.c -- C11 scanf matching-failure semantics (group C, part 3)
 * Build: gcc -std=c11 -Wall -Wextra -pedantic -o scanf_fail_test scanf_fail_test.c
 * Run with this exact stdin:
 *   abc
 *    x
 */
#include <stdio.h>
#include <string.h>

static int g_checks = 0;
static int g_fails = 0;

#define CHECK(cond, label)                              \
    do {                                                \
        ++g_checks;                                     \
        if (cond) {                                     \
            printf("PASS  %s\n", label);                \
        } else {                                        \
            ++g_fails;                                  \
            printf("FAIL  %s\n", label);                \
        }                                               \
    } while (0)

int main(void)
{
    int n = 123;
    char w[8];
    char ch = 0;

    CHECK(scanf("%d", &n) == 0, "scanf: matching failure returns 0, not EOF");
    CHECK(n == 123, "scanf: no assignment happens on matching failure");

    CHECK(scanf("%3s", w) == 1, "scanf: the mismatching characters remain in the stream");
    CHECK(strcmp(w, "abc") == 0, "scanf: %3s then reads 'abc'");

    CHECK(scanf("%c", &ch) == 1, "scanf: %c does not skip leading whitespace");
    CHECK(ch == '\n', "scanf: %c read the line break");

    CHECK(scanf(" %c", &ch) == 1, "scanf: leading space in format skips whitespace");
    CHECK(ch == 'x', "scanf: %c now reads 'x'");

    printf("\nSUMMARY scanf_fail: %d checks, %d failed\n", g_checks, g_fails);
    return g_fails == 0 ? 0 : 1;
}

/* io_stdout_test.c -- C11 <stdio.h> output semantics (group C, part 1)
 * Build: gcc -std=c11 -Wall -Wextra -pedantic -o io_stdout_test io_stdout_test.c
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
    int r;
    char b1[6];
    char b2[4];
    char b3[5];
    char src[8] = "hello";
    volatile int cap2 = 4; /* volatile keeps the bound unknown to the diagnostic */
    volatile int cap3 = 5;
    size_t n2 = (size_t)cap2;
    size_t n3 = (size_t)cap3;

    /* ---------------- printf ---------------- */
    r = printf("abc");
    CHECK(r == 3, "printf: returns the number of characters transmitted");
    r = printf("%d|%s\n", 42, "x");
    CHECK(r == 5, "printf: return counts converted output, not the format");
    r = printf("%5.2f\n", 3.14159);
    CHECK(r == 6, "printf: width/precision change the transmitted count");

    /* ---------------- putchar ---------------- */
    CHECK(putchar('X') == 'X', "putchar: returns the character written");
    CHECK(putchar('7') == '7', "putchar: digit returns its code 55");
    CHECK(putchar('\n') == '\n', "putchar: returns 10 for a newline");

    /* ---------------- puts ---------------- */
    r = puts("hi");
    CHECK(r >= 0, "puts: returns a nonnegative value on success");
    CHECK(puts("") >= 0, "puts: an empty string still emits one newline");

    /* ---------------- snprintf ---------------- */
    CHECK(snprintf(b1, sizeof b1, "%s", "hello") == 5,
          "snprintf: exact fit n=6 returns 5");
    CHECK(strcmp(b1, "hello") == 0, "snprintf: exact fit writes text and NUL");

    CHECK(snprintf(b2, n2, "%s", src) == 5,
          "snprintf: truncation still reports would-be length 5");
    CHECK(strcmp(b2, "hel") == 0, "snprintf: n=4 keeps 3 characters plus NUL");

    CHECK(snprintf(NULL, 0, "%s", "hello") == 5,
          "snprintf: n=0 allows a null buffer and returns 5");

    memset(b3, '#', sizeof b3);
    CHECK(snprintf(b3, n3, "%d", 12345) == 5,
          "snprintf: returns 5 although only 4 digits fit");
    CHECK(strcmp(b3, "1234") == 0, "snprintf: n=5 truncates to '1234'");
    printf("INFO  snprintf truncation keeps the terminator at b[n-1]\n");

    printf("\nSUMMARY io_stdout: %d checks, %d failed\n", g_checks, g_fails);
    return g_fails == 0 ? 0 : 1;
}

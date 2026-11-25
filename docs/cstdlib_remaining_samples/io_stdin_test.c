/* io_stdin_test.c -- C11 scanf/getchar/fgets semantics (group C, part 2)
 * Build: gcc -std=c11 -Wall -Wextra -pedantic -o io_stdin_test io_stdin_test.c
 * Run with this exact stdin (4 lines):
 *   42 hello world
 *   A
 *   line1
 *   line2
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
    int n = 0;
    char ch = 0;
    char word[16];
    char buf[32];

    /* ---------------- scanf ---------------- */
    CHECK(scanf("%d", &n) == 1, "scanf: %d assigns 1 item");
    CHECK(n == 42, "scanf: %d reads 42");
    CHECK(scanf("%9s", word) == 1, "scanf: width-limited %9s assigns 1 item");
    CHECK(strcmp(word, "hello") == 0, "scanf: %s stops at whitespace and keeps it in the stream");

    /* ---------------- getchar ---------------- */
    CHECK(getchar() == ' ', "getchar: the separator space is still there");
    CHECK(getchar() == 'w', "getchar: reads the next byte 'w'");

    /* ---------------- fgets ---------------- */
    CHECK(fgets(buf, 8, stdin) != NULL, "fgets: returns the buffer when input is available");
    CHECK(strcmp(buf, "orld\n") == 0, "fgets: keeps the newline when it fits in n-1 characters");
    CHECK(scanf(" %c", &ch) == 1, "scanf: a space in the format skips whitespace");
    CHECK(ch == 'A', "scanf: %c with leading space reads 'A'");
    CHECK(getchar() == '\n', "getchar: consumes the line break after 'A'");
    CHECK(fgets(buf, sizeof buf, stdin) != NULL && strcmp(buf, "line1\n") == 0,
          "fgets: reads a whole line including '\\n'");
    CHECK(fgets(buf, sizeof buf, stdin) != NULL && strcmp(buf, "line2\n") == 0,
          "fgets: second line also keeps '\\n'");

    /* ---------------- end of file ---------------- */
    CHECK(fgets(buf, sizeof buf, stdin) == NULL, "fgets: NULL at EOF with no characters read");
    CHECK(getchar() == EOF, "getchar: returns EOF at end of file");
    CHECK(scanf("%d", &n) == EOF, "scanf: returns EOF when input fails before any conversion");

    printf("\nSUMMARY io_stdin: %d checks, %d failed\n", g_checks, g_fails);
    return g_fails == 0 ? 0 : 1;
}

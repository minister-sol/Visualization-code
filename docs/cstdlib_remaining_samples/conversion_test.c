/* conversion_test.c -- C11 atoi/strtol/strtod semantics (group C, part 4)
 * Build: gcc -std=c11 -Wall -Wextra -pedantic -o conversion_test conversion_test.c
 */
#include <errno.h>
#include <limits.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
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
    char *end = NULL;
    long v;
    double d;

    /* ---------------- atoi ---------------- */
    CHECK(atoi("42") == 42, "atoi: \"42\" -> 42");
    CHECK(atoi("  -17xyz") == -17, "atoi: skips space, keeps sign, ignores trailing junk");
    CHECK(atoi("abc") == 0, "atoi: no digits -> 0");
    CHECK(atoi("") == 0, "atoi: empty string -> 0");
    CHECK(atoi("+0") == 0, "atoi: explicit plus sign, zero value");

    /* ---------------- strtol ---------------- */
    errno = 0;
    v = strtol("42", &end, 10);
    CHECK(v == 42 && *end == '\0', "strtol: decimal 42, end points at the terminator");

    v = strtol("  -17xyz", &end, 10);
    CHECK(v == -17 && *end == 'x', "strtol: stops at the first unparsable byte");

    v = strtol("0x1F", &end, 0);
    CHECK(v == 31 && *end == '\0', "strtol: base 0 accepts a 0x prefix -> 31");

    v = strtol("077", &end, 0);
    CHECK(v == 63, "strtol: base 0 treats a leading 0 as octal -> 63");

    v = strtol("z", &end, 36);
    CHECK(v == 35, "strtol: base 36 maps 'z' to 35");

    v = strtol("1010", &end, 2);
    CHECK(v == 10, "strtol: base 2 binary 1010 -> 10");

    v = strtol("abc", &end, 10);
    CHECK(v == 0 && end != NULL && *end == 'a', "strtol: no conversion -> 0, end at the start");

    errno = 0;
    v = strtol("999999999999999999999999", &end, 10);
    CHECK(errno == ERANGE && v == LONG_MAX, "strtol: overflow sets ERANGE and returns LONG_MAX");

    errno = 0;
    v = strtol("-999999999999999999999999", &end, 10);
    CHECK(errno == ERANGE && v == LONG_MIN, "strtol: underflow sets ERANGE and returns LONG_MIN");

    /* ---------------- strtod ---------------- */
    d = strtod("3.5", &end);
    CHECK(d == 3.5 && *end == '\0', "strtod: \"3.5\" -> 3.5");

    d = strtod("1e3", &end);
    CHECK(d == 1000.0, "strtod: exponent form 1e3 -> 1000.0");

    d = strtod("0x1p3", &end);
    CHECK(d == 8.0, "strtod: hexadecimal form 0x1p3 -> 8.0");

    d = strtod("-inf", &end);
    CHECK(isinf(d) && d < 0, "strtod: accepts -inf");

    d = strtod("nan", &end);
    CHECK(isnan(d), "strtod: accepts nan");

    d = strtod("abc", &end);
    CHECK(d == 0.0 && *end == 'a', "strtod: no conversion -> 0.0, end at the start");

    errno = 0;
    d = strtod("1e400", &end);
    CHECK(errno == ERANGE && isinf(d) && d > 0, "strtod: overflow -> ERANGE and HUGE_VAL");
    printf("INFO  strtol(\"z\",36)=%ld  strtod(\"0x1p3\")=%g\n", strtol("z", NULL, 36),
           strtod("0x1p3", NULL));

    printf("\nSUMMARY conversion: %d checks, %d failed\n", g_checks, g_fails);
    return g_fails == 0 ? 0 : 1;
}

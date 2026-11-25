/* rand_time_test.c -- C11 rand/srand/time/difftime/clock semantics (group F, part 2)
 * Build: gcc -std=c11 -Wall -Wextra -pedantic -o rand_time_test rand_time_test.c
 */
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

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
    int a, b, a2, b2, other;
    time_t t0, t1;
    clock_t c0, c1;
    volatile unsigned long spin = 0;
    unsigned long i;

    /* ---------------- rand / srand ---------------- */
    CHECK(RAND_MAX >= 32767, "RAND_MAX: at least 32767");
    srand(1);
    a = rand();
    b = rand();
    CHECK(a >= 0 && a <= RAND_MAX, "rand: first value inside [0, RAND_MAX]");
    CHECK(b >= 0 && b <= RAND_MAX, "rand: second value inside [0, RAND_MAX]");

    srand(1);
    a2 = rand();
    b2 = rand();
    CHECK(a2 == a && b2 == b, "srand: the same seed repeats the same sequence");

    srand(2);
    other = rand();
    printf("INFO  srand(1) first=%d, srand(2) first=%d (values are implementation-defined)\n",
           a, other);

    /* ---------------- time ---------------- */
    t0 = time(NULL);
    CHECK(t0 > (time_t)1600000000, "time: returns a plausible calendar time");
    t1 = 0;
    CHECK(time(&t1) == t1, "time: stores through the pointer and returns the same value");
    CHECK(t1 >= t0 - 2 && t1 <= t0 + 2, "time: two calls agree within 2 seconds");

    /* ---------------- difftime ---------------- */
    CHECK(difftime(t1 + 3600, t1) == 3600.0, "difftime: one hour is 3600.0 seconds");
    CHECK(difftime(t1, t1) == 0.0, "difftime: identical times -> 0.0");
    CHECK(difftime(t1, t1 + 60) == -60.0, "difftime: reversed order -> negative seconds");

    /* ---------------- clock ---------------- */
    c0 = clock();
    for (i = 0; i < 20000000UL; ++i) {
        spin += i;
    }
    c1 = clock();
    CHECK(CLOCKS_PER_SEC > 0, "clock: CLOCKS_PER_SEC is positive");
    CHECK(c1 >= c0, "clock: processor time does not go backwards over a short run");
    printf("INFO  clock delta = %ld ticks, CLOCKS_PER_SEC = %ld, spin = %lu\n",
           (long)(c1 - c0), (long)CLOCKS_PER_SEC, spin);

    printf("\nSUMMARY rand_time: %d checks, %d failed\n", g_checks, g_fails);
    return g_fails == 0 ? 0 : 1;
}

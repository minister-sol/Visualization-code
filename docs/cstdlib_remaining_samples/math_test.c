/* math_test.c -- C11 <math.h> semantics (group F, part 1)
 * Build: gcc -std=c11 -Wall -Wextra -pedantic -o math_test math_test.c -lm
 */
#include <math.h>
#include <stdio.h>

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

#define PI 3.14159265358979323846

static int near(double a, double b, double tol)
{
    return fabs(a - b) <= tol;
}

int main(void)
{
    /* ---------------- sqrt ---------------- */
    CHECK(sqrt(9.0) == 3.0, "sqrt: 9.0 -> 3.0 exactly");
    CHECK(near(sqrt(2.0), 1.4142135623730951, 1e-15), "sqrt: 2.0 -> 1.41421356...");
    CHECK(sqrt(0.0) == 0.0, "sqrt: 0.0 -> 0.0");
    CHECK(isnan(sqrt(-1.0)), "sqrt: negative argument -> NaN (domain error)");
    CHECK(signbit(sqrt(-0.0)), "sqrt: -0.0 -> -0.0");

    /* ---------------- pow ---------------- */
    CHECK(pow(2.0, 10.0) == 1024.0, "pow: 2^10 -> 1024");
    CHECK(near(pow(2.0, 0.5), sqrt(2.0), 1e-15), "pow: 2^0.5 equals sqrt(2)");
    CHECK(pow(0.0, 0.0) == 1.0, "pow: 0^0 -> 1 (standard special case)");
    CHECK(pow(-1.0, 3.0) == -1.0, "pow: negative base with integral exponent");
    CHECK(pow(-5.0, 2.0) == 25.0, "pow: negative base, even exponent");
    CHECK(pow(-1.0, HUGE_VAL) == 1.0, "pow: (-1)^inf -> 1 (standard special case)");

    /* ---------------- fabs ---------------- */
    CHECK(fabs(-3.5) == 3.5, "fabs: -3.5 -> 3.5");
    CHECK(fabs(-0.0) == 0.0 && !signbit(fabs(-0.0)), "fabs: -0.0 -> +0.0");

    /* ---------------- floor ---------------- */
    CHECK(floor(2.7) == 2.0, "floor: 2.7 -> 2.0");
    CHECK(floor(-2.1) == -3.0, "floor: -2.1 -> -3.0 (toward minus infinity)");
    CHECK(floor(-0.0) == 0.0 && signbit(floor(-0.0)), "floor: -0.0 keeps its sign");

    /* ---------------- ceil ---------------- */
    CHECK(ceil(2.1) == 3.0, "ceil: 2.1 -> 3.0");
    CHECK(ceil(-2.9) == -2.0, "ceil: -2.9 -> -2.0");
    CHECK(ceil(-0.5) == 0.0 && signbit(ceil(-0.5)), "ceil: -0.5 -> -0.0");

    /* ---------------- round ---------------- */
    CHECK(round(2.5) == 3.0, "round: 2.5 -> 3.0 (half away from zero)");
    CHECK(round(-2.5) == -3.0, "round: -2.5 -> -3.0 (half away from zero)");
    CHECK(round(2.4) == 2.0, "round: 2.4 -> 2.0");
    CHECK(round(-0.4) == 0.0, "round: -0.4 -> -0.0 (compares equal to 0.0)");

    /* ---------------- sin / cos ---------------- */
    CHECK(sin(0.0) == 0.0, "sin: 0.0 -> 0.0");
    CHECK(near(sin(PI / 2.0), 1.0, 1e-15), "sin: pi/2 -> 1.0");
    CHECK(near(sin(PI / 6.0), 0.5, 1e-15), "sin: pi/6 -> 0.5");
    CHECK(near(sin(PI), 0.0, 1e-15), "sin: pi -> 0 within tolerance");
    CHECK(cos(0.0) == 1.0, "cos: 0.0 -> 1.0");
    CHECK(near(cos(PI), -1.0, 1e-15), "cos: pi -> -1.0");

    printf("\nSUMMARY math: %d checks, %d failed\n", g_checks, g_fails);
    return g_fails == 0 ? 0 : 1;
}

/* memory_test.c -- C11 <string.h> byte-operation semantics checks (batch 1, part 2)
 * Build: gcc -std=c11 -Wall -Wextra -pedantic -o memory_test memory_test.c
 * Only defined behaviour is exercised; memcpy overlap UB is documented, not run.
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
    /* ---------------- memcpy ---------------- */
    char src[6] = "abcde";
    char dst[6] = { 0 };
    char part[6] = "ZZZZZ";
    char keep[4] = "xyz";
    int isrc[3] = { 1, 2, 3 };
    int idst[3] = { 0, 0, 0 };

    CHECK(memcpy(dst, src, 6) == dst, "memcpy: returns s1");
    CHECK(strcmp(dst, "abcde") == 0, "memcpy: n=6 copies text and NUL");
    memcpy(part, src, 3);
    CHECK(part[0] == 'a' && part[1] == 'b' && part[2] == 'c' &&
          part[3] == 'Z' && part[4] == 'Z',
          "memcpy: n=3 copies exactly 3 bytes, tail untouched");
    CHECK(memcpy(keep, src, 0) == keep, "memcpy: n=0 returns s1");
    CHECK(strcmp(keep, "xyz") == 0, "memcpy: n=0 copies nothing");
    memcpy(idst, isrc, sizeof isrc);
    CHECK(idst[0] == 1 && idst[1] == 2 && idst[2] == 3,
          "memcpy: sizeof-based count copies whole int array");

    /* ---------------- memmove ---------------- */
    char mv1[10] = "abcdef";
    char mv2[10] = "abcdef";

    CHECK(memmove(mv1 + 2, mv1, 4) == mv1 + 2, "memmove: returns s1");
    CHECK(strcmp(mv1, "ababcd") == 0, "memmove: overlapping shift right -> ababcd");
    memmove(mv2, mv2 + 2, 4);
    CHECK(strcmp(mv2, "cdefef") == 0, "memmove: overlapping shift left -> cdefef");
    CHECK(memmove(mv2, mv2, 0) == mv2, "memmove: n=0 returns s1, no copy");

    /* ---------------- memset ---------------- */
    char m1[6];
    char m2[4] = "abc";
    int x = 12345;

    CHECK(memset(m1, 'A', 5) == m1, "memset: returns s");
    m1[5] = '\0';
    CHECK(strcmp(m1, "AAAAA") == 0, "memset: 5 bytes set to 'A'");
    memset(&x, 0, sizeof x);
    CHECK(x == 0, "memset: zero-fill an object by sizeof");
    {
        size_t zero = 0; /* variable form avoids GCC's transposed-args heuristic */
        memset(m2, 'Z', zero);
    }
    CHECK(strcmp(m2, "abc") == 0, "memset: n=0 changes nothing");
    CHECK(memset(m1, 0x141, 1) == m1 && m1[0] == 'A',
          "memset: c is converted to unsigned char (0x141 -> 0x41)");

    /* ---------------- memcmp ---------------- */
    char b1[3] = { (char)0xFF, 0, 0 };
    char b2[3] = { 0x01, 0, 0 };
    char e1[3] = { 'a', 0, 'b' };
    char e2[3] = { 'a', 0, 'c' };

    CHECK(memcmp("abc", "abd", 2) == 0, "memcmp: first 2 bytes equal -> 0");
    CHECK(memcmp("abc", "abd", 3) < 0, "memcmp: 3 bytes -> negative");
    CHECK(memcmp("abc", "abd", 0) == 0, "memcmp: n=0 -> 0");
    CHECK(memcmp(b1, b2, 1) > 0, "memcmp: bytes compared as unsigned char (0xFF > 0x01)");
    CHECK(memcmp(e1, e2, 3) < 0, "memcmp: keeps comparing past a NUL byte");
    printf("INFO  memcmp(\"abc\",\"abd\",3) = %d (only the sign is portable)\n",
           memcmp("abc", "abd", 3));

    printf("\nSUMMARY memory: %d checks, %d failed\n", g_checks, g_fails);
    return g_fails == 0 ? 0 : 1;
}

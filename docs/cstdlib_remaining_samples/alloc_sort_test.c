/* alloc_sort_test.c -- C11 malloc/calloc/realloc/free/qsort/bsearch semantics (group D)
 * Build: gcc -std=c11 -Wall -Wextra -pedantic -o alloc_sort_test alloc_sort_test.c
 */
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

static int cmp_int(const void *a, const void *b)
{
    int x = *(const int *)a;
    int y = *(const int *)b;
    return (x > y) - (x < y);
}

/* Kept in a separate function so the compiler's use-after-realloc heuristic
 * does not fire: the standard guarantees the old block survives a failed realloc. */
static void *realloc_impossible(void *p)
{
    return realloc(p, ((size_t)1 << 62));
}

int main(void)
{
    int i;
    int *p;
    int *q;
    int *r;
    int *r2;
    int *r3;
    int *r4;
    void *z;

    /* ---------------- malloc ---------------- */
    p = malloc(10 * sizeof *p);
    CHECK(p != NULL, "malloc: returns a usable pointer for a modest request");
    for (i = 0; i < 10; ++i) {
        p[i] = i + 1;
    }
    CHECK(p[0] == 1 && p[9] == 10, "malloc: all 10 ints readable and writable");
    free(p);

    z = malloc(0);
    printf("INFO  malloc(0) = %p (size 0 is implementation-defined)\n", z);
    free(z);

    /* ---------------- calloc ---------------- */
    q = calloc(8, sizeof *q);
    CHECK(q != NULL, "calloc: returns a usable pointer");
    CHECK(q[0] == 0 && q[7] == 0, "calloc: first and last elements start at zero");
    free(q);

    /* ---------------- realloc ---------------- */
    r = malloc(4 * sizeof *r);
    CHECK(r != NULL, "malloc: block used for realloc");
    for (i = 0; i < 4; ++i) {
        r[i] = i + 1;
    }
    r2 = realloc(r, 8 * sizeof *r2);
    CHECK(r2 != NULL, "realloc: growth succeeds");
    CHECK(r2[0] == 1 && r2[3] == 4, "realloc: contents survive growth");
    r3 = realloc(r2, 2 * sizeof *r3);
    CHECK(r3 != NULL, "realloc: shrink succeeds");
    CHECK(r3[0] == 1 && r3[1] == 2, "realloc: leading contents survive shrink");

    r4 = realloc_impossible(r3);
    CHECK(r4 == NULL, "realloc: an impossible size returns NULL");
    CHECK(r3[0] == 1 && r3[1] == 2, "realloc: old block stays valid after failure");
    free(r3);

    /* ---------------- free ---------------- */
    free(NULL);
    CHECK(1, "free: free(NULL) is a no-op");

    /* ---------------- qsort ---------------- */
    int a[8] = { 5, 2, 9, 1, 5, 6, 0, 3 };
    qsort(a, 8, sizeof a[0], cmp_int);
    CHECK(a[0] == 0 && a[7] == 9, "qsort: smallest and largest end up at the ends");
    int ordered = 1;
    for (i = 1; i < 8; ++i) {
        if (a[i - 1] > a[i]) {
            ordered = 0;
        }
    }
    CHECK(ordered, "qsort: ascending order, duplicate 5 allowed either side");
    qsort(a, 0, sizeof a[0], cmp_int);
    CHECK(a[0] == 0, "qsort: nmemb=0 leaves the array unchanged");

    /* ---------------- bsearch ---------------- */
    int key = 9;
    int *hit = bsearch(&key, a, 8, sizeof a[0], cmp_int);
    CHECK(hit != NULL && *hit == 9, "bsearch: present key found");

    key = 4;
    CHECK(bsearch(&key, a, 8, sizeof a[0], cmp_int) == NULL, "bsearch: absent key -> NULL");
    CHECK(bsearch(&key, a, 0, sizeof a[0], cmp_int) == NULL, "bsearch: nmemb=0 -> NULL");

    key = 5;
    hit = bsearch(&key, a, 8, sizeof a[0], cmp_int);
    printf("INFO  bsearch for duplicate 5 hit offset %ld (which duplicate is unspecified)\n",
           hit != NULL ? (long)(hit - a) : -1L);

    printf("\nSUMMARY alloc_sort: %d checks, %d failed\n", g_checks, g_fails);
    return g_fails == 0 ? 0 : 1;
}

/* ctype_test.c -- C11 <ctype.h> semantics checks (batch 1, part 3)
 * Build: gcc -std=c11 -Wall -Wextra -pedantic -o ctype_test ctype_test.c
 * Only defined behaviour is exercised. Passing a negative char (e.g. a byte
 * >= 0x80 held in a signed char) is UB and is documented, not compiled.
 */
#include <ctype.h>
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

int main(void)
{
    /* ---------------- isdigit ---------------- */
    CHECK(isdigit('0') != 0, "isdigit: '0' true");
    CHECK(isdigit('9') != 0, "isdigit: '9' true");
    CHECK(isdigit('a') == 0, "isdigit: 'a' false");
    CHECK(isdigit('/') == 0, "isdigit: '/' false");
    CHECK(isdigit(EOF) == 0, "isdigit: EOF is a legal argument -> false");
    printf("INFO  isdigit('7') raw value = %d (nonzero, not necessarily 1)\n",
           isdigit('7'));

    /* ---------------- isalpha ---------------- */
    CHECK(isalpha('a') != 0 && isalpha('Z') != 0, "isalpha: letters true");
    CHECK(isalpha('1') == 0, "isalpha: digit false");
    CHECK(isalpha('_') == 0, "isalpha: underscore false");

    /* ---------------- isalnum ---------------- */
    CHECK(isalnum('a') != 0 && isalnum('9') != 0, "isalnum: letter and digit true");
    CHECK(isalnum(' ') == 0, "isalnum: space false");
    CHECK(isalnum('-') == 0, "isalnum: '-' false");

    /* ---------------- isspace ---------------- */
    const char ws[] = { ' ', '\f', '\n', '\r', '\t', '\v' };
    int all_ws = 1;
    size_t k;

    for (k = 0; k < sizeof ws; ++k) {
        if (!isspace((unsigned char)ws[k])) {
            all_ws = 0;
        }
    }
    CHECK(all_ws, "isspace: 6 standard white-space characters true");
    CHECK(isspace('a') == 0, "isspace: 'a' false");
    CHECK(isspace('\0') == 0, "isspace: NUL false");

    /* ---------------- toupper / tolower ---------------- */
    CHECK(toupper('a') == 'A', "toupper: 'a' -> 'A'");
    CHECK(toupper('A') == 'A', "toupper: 'A' unchanged");
    CHECK(toupper('1') == '1', "toupper: digit unchanged");
    CHECK(toupper(EOF) == EOF, "toupper: EOF returned unchanged");
    CHECK(tolower('A') == 'a', "tolower: 'A' -> 'a'");
    CHECK(tolower('a') == 'a', "tolower: 'a' unchanged");
    CHECK(tolower('0') == '0', "tolower: digit unchanged");

    /* ---------------- canonical idempotent usage ---------------- */
    const char *txt = "Hello, C11!";
    const char *p;
    int letters = 0;

    for (p = txt; *p != '\0'; ++p) {
        if (isalpha((unsigned char)*p)) {
            ++letters;
        }
    }
    CHECK(letters == 6, "pattern: isalpha((unsigned char)*p) counts 6 letters");

    printf("\nSUMMARY ctype: %d checks, %d failed\n", g_checks, g_fails);
    return g_fails == 0 ? 0 : 1;
}

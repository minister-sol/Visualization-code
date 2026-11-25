/* strings_test.c -- C11 <string.h> semantics checks (batch 1, part 1)
 * Build: gcc -std=c11 -Wall -Wextra -pedantic -o strings_test strings_test.c
 * Only defined behaviour is exercised here; UB triggers are documented in
 * docs/C_STDLIB_SEMANTICS_REVIEW.md instead of being compiled.
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
    /* ---------------- strlen ---------------- */
    char s_hello[] = "hello";
    char s_empty[] = "";
    char s_cjk[] = "\xE4\xB8\xAD\xE6\x96\x87" "abc"; /* 中文abc = 6 + 3 bytes */
    char s_255[256];
    char s_embed[] = { 'a', '\0', 'b', '\0' };
    int i;

    CHECK(sizeof(strlen("x")) == sizeof(size_t), "strlen: returns size_t");
    CHECK(strlen(s_hello) == 5, "strlen: \"hello\" -> 5 bytes");
    CHECK(strlen(s_empty) == 0, "strlen: \"\" -> 0");
    CHECK(strlen(s_cjk) == 9, "strlen: UTF-8 \"中文abc\" -> 9 bytes");
    CHECK(strlen(s_embed) == 1, "strlen: stops at first NUL, later bytes ignored");
    for (i = 0; i < 255; ++i) {
        s_255[i] = 'A';
    }
    s_255[255] = '\0';
    CHECK(strlen(s_255) == 255, "strlen: 255-byte boundary -> 255");

    /* ---------------- strcmp ---------------- */
    char s_ff[2] = { (char)0xFF, '\0' };

    CHECK(strcmp("abc", "abc") == 0, "strcmp: equal -> 0");
    CHECK(strcmp("abc", "abd") < 0, "strcmp: \"abc\" vs \"abd\" -> negative");
    CHECK(strcmp("abd", "abc") > 0, "strcmp: mirrored -> positive");
    CHECK(strcmp("abc", "ab") > 0, "strcmp: equal prefix, longer wins -> positive");
    CHECK(strcmp("", "") == 0, "strcmp: both empty -> 0");
    CHECK(strcmp(s_ff, "a") > 0, "strcmp: 0xFF compared as unsigned char (> 'a')");
    printf("INFO  strcmp(\"abc\",\"abd\") = %d (only the sign is portable)\n",
           strcmp("abc", "abd"));
    printf("INFO  strcmp(\"\",\"abc\")  = %d\n", strcmp("", "abc"));

    /* ---------------- strncmp ---------------- */
    CHECK(strncmp("abc", "abd", 2) == 0, "strncmp: n=2 covers equal prefix -> 0");
    CHECK(strncmp("abc", "abd", 3) < 0, "strncmp: n=3 exposes the difference -> negative");
    CHECK(strncmp("abc", "xyz", 0) == 0, "strncmp: n=0 -> 0");
    CHECK(strncmp("ab", "abc", 3) < 0, "strncmp: shorter string stops at NUL -> negative");
    CHECK(strncmp("abc", "ab", 3) > 0, "strncmp: mirrored -> positive");

    /* ---------------- strcpy ---------------- */
    char c_dst[6];
    char c_dst2[5];

    CHECK(strcpy(c_dst, "hello") == c_dst, "strcpy: returns destination");
    CHECK(strcmp(c_dst, "hello") == 0, "strcpy: content copied including NUL");
    CHECK(c_dst[5] == '\0', "strcpy: terminator written inside capacity");
    memset(c_dst2, '#', sizeof c_dst2);
    strcpy(c_dst2, "abcd");
    CHECK(c_dst2[4] == '\0' && strcmp(c_dst2, "abcd") == 0,
          "strcpy: 4 characters need 5-byte capacity");

    /* ---------------- strcat ---------------- */
    char a_buf[11] = "abc";
    char a_buf2[6] = "abc";

    CHECK(strcat(a_buf, "de") == a_buf, "strcat: returns destination");
    CHECK(strcmp(a_buf, "abcde") == 0, "strcat: appends and keeps one NUL");
    CHECK(strcat(a_buf2, "de") == a_buf2 && strcmp(a_buf2, "abcde") == 0,
          "strcat: capacity 3 + 2 + 1 = 6 is exact");
    CHECK(strcat(a_buf, "") == a_buf && strcmp(a_buf, "abcde") == 0,
          "strcat: empty source leaves buffer unchanged");

    /* ---------------- strchr ---------------- */
    const char *h = "hello";

    CHECK(strchr(h, 'l') == h + 2, "strchr: first 'l' at offset 2");
    CHECK(strchr(h, 'z') == NULL, "strchr: absent character -> NULL");
    CHECK(strchr(h, '\0') == h + 5, "strchr: searching NUL finds the terminator");
    CHECK(strchr("", 'a') == NULL, "strchr: empty string, no match");

    /* ---------------- strstr ---------------- */
    const char *hs = "hello world";
    char t_aaa[] = "aaa";

    CHECK(strstr(hs, "world") == hs + 6, "strstr: first occurrence at offset 6");
    CHECK(strstr(hs, "") == hs, "strstr: empty needle returns haystack");
    CHECK(strstr(hs, "xyz") == NULL, "strstr: absent needle -> NULL");
    CHECK(strstr("ab", "abc") == NULL, "strstr: needle longer than haystack -> NULL");
    CHECK(strstr(t_aaa, "aa") == t_aaa, "strstr: overlapping match allowed, leftmost");

    printf("\nSUMMARY strings: %d checks, %d failed\n", g_checks, g_fails);
    return g_fails == 0 ? 0 : 1;
}

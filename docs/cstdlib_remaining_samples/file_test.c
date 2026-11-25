/* file_test.c -- C11 stdio file semantics (group E)
 * Build: gcc -std=c11 -Wall -Wextra -pedantic -o file_test file_test.c
 * Creates two temporary files in the current directory and removes them at the end.
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

int main(void)
{
    const char *text_path = "cstdlib_text.tmp";
    const char *bin_path = "cstdlib_bin.tmp";
    FILE *f;
    int n = 0;
    char word[16];
    long pos;
    int w[5] = { 10, 20, 30, 40, 50 };
    int rd[5] = { 0 };

    /* ---------------- fopen failure ---------------- */
    f = fopen("cstdlib_no_such_file_9f3a.txt", "r");
    CHECK(f == NULL, "fopen: a missing file in \"r\" mode returns NULL");

    /* ---------------- text file: fprintf, fscanf, ftell, fseek, fclose ---------------- */
    f = fopen(text_path, "w");
    CHECK(f != NULL, "fopen: \"w\" creates a new file");
    CHECK(fprintf(f, "%d %s\n", 7, "seven") == 8,
          "fprintf: \"7 seven\\n\" is 8 characters");
    CHECK(fprintf(f, "%s", "") == 0, "fprintf: an empty string transmits 0 characters");
    CHECK(fclose(f) == 0, "fclose: returns 0 on success and flushes");

    f = fopen(text_path, "r");
    CHECK(f != NULL, "fopen: \"r\" reopens the text file");
    CHECK(fscanf(f, "%d %15s", &n, word) == 2, "fscanf: assigns 2 items");
    CHECK(n == 7 && strcmp(word, "seven") == 0, "fscanf: reads int and word");
    pos = ftell(f);
    CHECK(pos > 0, "ftell: position has advanced past the parsed line");
    CHECK(fseek(f, 0L, SEEK_SET) == 0, "fseek: SEEK_SET 0 succeeds");
    CHECK(ftell(f) == 0, "ftell: 0 right after seeking to the start");
    memset(word, 0, sizeof word);
    CHECK(fscanf(f, "%d %15s", &n, word) == 2 && n == 7,
          "fscanf: parsing again after fseek yields the same record");
    CHECK(fscanf(f, "%d", &n) == EOF, "fscanf: returns EOF at end of file");
    CHECK(fclose(f) == 0, "fclose: second close returns 0");

    /* ---------------- binary file: fwrite, fread, fseek, ftell ---------------- */
    f = fopen(bin_path, "wb");
    CHECK(f != NULL, "fopen: \"wb\" creates a binary file");
    CHECK(fwrite(w, sizeof w[0], 0, f) == 0, "fwrite: nmemb=0 writes nothing and returns 0");
    CHECK(fwrite(w, sizeof w[0], 5, f) == 5, "fwrite: reports 5 elements written");
    CHECK(fclose(f) == 0, "fclose: binary close returns 0");

    f = fopen(bin_path, "rb");
    CHECK(f != NULL, "fopen: \"rb\" reopens the binary file");
    CHECK(fread(rd, sizeof rd[0], 0, f) == 0, "fread: nmemb=0 reads nothing and returns 0");
    CHECK(fread(rd, sizeof rd[0], 5, f) == 5, "fread: reports 5 elements read");
    CHECK(rd[0] == 10 && rd[4] == 50, "fread: element values round-trip");
    CHECK(fread(rd, sizeof rd[0], 3, f) == 0, "fread: 0 at end of file (short read)");
    CHECK(fclose(f) == 0, "fclose: close after reading returns 0");

    f = fopen(bin_path, "rb");
    CHECK(fseek(f, 0L, SEEK_END) == 0, "fseek: SEEK_END succeeds");
    CHECK(ftell(f) == (long)(5 * sizeof(int)), "ftell: SEEK_END position equals the file size");
    CHECK(fseek(f, 0L, SEEK_SET) == 0, "fseek: back to the start");
    CHECK(fread(rd, sizeof rd[0], 2, f) == 2, "fread: 2 of 5 elements");
    CHECK(fread(rd, sizeof rd[0], 5, f) == 3, "fread: asks 5, gets 3 (short count at EOF)");
    CHECK(fclose(f) == 0, "fclose: final close returns 0");

    CHECK(remove(text_path) == 0, "cleanup: text file removed");
    CHECK(remove(bin_path) == 0, "cleanup: binary file removed");

    printf("\nSUMMARY file: %d checks, %d failed\n", g_checks, g_fails);
    return g_fails == 0 ? 0 : 1;
}

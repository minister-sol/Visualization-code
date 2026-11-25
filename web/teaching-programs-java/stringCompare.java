import java.io.*;

/* 朴素匹配与 KMP 对照：输出两者的匹配下标和比较次数（不含前缀表构造）。 */
class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String text = br.readLine(); // @start
        String pat = br.readLine();
        int n = text.length(), m = pat.length(), j = 0, cmp = 0;
        int[] pi = new int[m];
        for (int i = 1; i < m; i++) {
            while (j > 0 && pat.charAt(i) != pat.charAt(j)) j = pi[j - 1]; // @prefix_fail
            if (pat.charAt(i) == pat.charAt(j)) j++; // @prefix_match
            pi[i] = j; // @pi_write
        }
        StringBuilder a = new StringBuilder(), b = new StringBuilder();
        int naiveCount = 0, naiveCmp = 0;
        for (int i = 0; i + m <= n; i++) {
            int k = 0;
            while (k < m) {
                naiveCmp++; // @naive_compare
                if (text.charAt(i + k) != pat.charAt(k)) break;
                k++;
            }
            if (k == m) { a.append(i).append(' '); naiveCount++; } // @naive_match
        }
        j = 0;
        int kmpCount = 0;
        for (int i = 0; i < n; i++) {
            while (true) {
                cmp++; // @kmp_compare
                if (text.charAt(i) == pat.charAt(j)) { j++; break; } // @kmp_match
                if (j == 0) break; // @kmp_no_prefix
                j = pi[j - 1]; // @kmp_fail
            }
            if (j == m) { b.append(i - m + 1).append(' '); kmpCount++; j = pi[j - 1]; } // @kmp_found
        }
        System.out.println(a);
        System.out.println(b);
        System.out.println(naiveCmp); // @done
        System.out.println(cmp);
    }
}

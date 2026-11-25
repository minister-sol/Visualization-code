import java.io.*;

/* KMP：先构造前缀表，再在文本中按失配链接回退，输出所有重叠匹配。 */
class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String text = br.readLine(); // @start
        String pat = br.readLine();
        int m = pat.length(), j = 0;
        int[] pi = new int[m];
        for (int i = 1; i < m; i++) { // @prefix_match
            while (j > 0 && pat.charAt(i) != pat.charAt(j)) j = pi[j - 1]; // @prefix_fail
            if (pat.charAt(i) == pat.charAt(j)) j++; // @prefix_match
            pi[i] = j; // @pi_write
        }
        j = 0;
        for (int i = 0; i < text.length(); i++) {
            while (j > 0 && text.charAt(i) != pat.charAt(j)) j = pi[j - 1]; // @text_fail
            if (text.charAt(i) == pat.charAt(j)) j++; // @text_match
            if (j == m) { System.out.print((i - m + 1) + " "); j = pi[j - 1]; } // @match
        }
        System.out.println(); // @done
    }
}

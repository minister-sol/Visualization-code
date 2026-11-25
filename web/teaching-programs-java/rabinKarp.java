import java.io.*;

/* Rabin–Karp：滚动哈希比较窗口，哈希相等后再逐字符核对，输出所有重叠匹配。 */
class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String text = br.readLine(); // @start
        String pat = br.readLine();
        int n = text.length(), m = pat.length();
        long base = 257, mod = 1000000007L;
        long power = 1; // @power
        for (int i = 1; i < m; i++) power = power * base % mod;
        long ph = 0, wh = 0;
        for (int i = 0; i < m; i++) {
            ph = (ph * base + pat.charAt(i)) % mod; // @pattern_hash
            if (i < n) wh = (wh * base + text.charAt(i)) % mod; // @window_hash
        }
        for (int i = 0; i + m <= n; i++) {
            if (i > 0) { // @remove
                wh = (wh - text.charAt(i - 1) * power % mod + mod) % mod; // @remove
                wh = (wh * base + text.charAt(i + m - 1)) % mod; // @add
            }
            if (wh == ph) { // @check
                boolean ok = true;
                for (int k = 0; k < m; k++) if (text.charAt(i + k) != pat.charAt(k)) { ok = false; break; }
                if (ok) System.out.print(i + " "); // @long
            }
        }
        System.out.println(); // @done
    }
}

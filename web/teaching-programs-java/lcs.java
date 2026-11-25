import java.util.*;

/* 最长公共子序列：二维 DP；回溯时优先向上，得到一条最优序列。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String a = in.nextLine().replaceFirst("^text\\s*", ""); // @init
        String b = in.nextLine().replaceFirst("^text\\s*", "");
        int n = a.length(), m = b.length();
        int[][] dp = new int[n + 1][m + 1];
        for (int i = 1; i <= n; i++) for (int j = 1; j <= m; j++) {
            if (a.charAt(i - 1) == b.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1] + 1; // @match
            else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]); // @differ
        }
        StringBuilder out = new StringBuilder();
        int i = n, j = m;
        while (i > 0 && j > 0) { // @backtrack
            if (a.charAt(i - 1) == b.charAt(j - 1)) { out.append(a.charAt(i - 1)); i--; j--; } // @collect
            else if (dp[i - 1][j] >= dp[i][j - 1]) i--; // @up
            else j--; // @left
        }
        System.out.println("result " + dp[n][m]); // @result
        System.out.println("sequence " + out.reverse());
    }
}

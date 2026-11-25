import java.util.*;

/* 编辑距离：插入、删除、替换代价均为 1；首行初始化边界。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String a = in.nextLine().replaceFirst("^text\\s*", ""); // @init
        String b = in.nextLine().replaceFirst("^text\\s*", "");
        int n = a.length(), m = b.length();
        int[][] dp = new int[n + 1][m + 1];
        for (int i = 0; i <= n; i++) dp[i][0] = i; // @initRow
        for (int j = 0; j <= m; j++) dp[0][j] = j; // @initCol
        for (int i = 1; i <= n; i++) for (int j = 1; j <= m; j++) {
            if (a.charAt(i - 1) == b.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1]; // @same
            else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1])); // @differ
        }
        System.out.println("result " + dp[n][m]); // @result
    }
}

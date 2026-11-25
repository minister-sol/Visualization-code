import java.util.*;

/* 矩阵链乘法：区间长度递增，枚举切分点，代价取最小并记录 split。 */
class Main {
    static int[] d;
    static int[][] dp, split;
    static String order(int i, int j) {
        if (i == j) return "A" + (i + 1);
        int k = split[i][j];
        return "(" + order(i, k) + "×" + order(k + 1, j) + ")";
    }
    public static void main(String[] args) throws Exception {
        System.setOut(new java.io.PrintStream(System.out, true, "UTF-8"));
        Scanner in = new Scanner(System.in);
        String line = in.hasNextLine() ? in.nextLine().trim() : "";
        if (line.isEmpty()) { System.out.println("cost 0"); System.out.println("order"); return; } // @empty
        String[] parts = line.split("[,，\\s]+");
        d = new int[parts.length];
        for (int i = 0; i < d.length; i++) d[i] = Integer.parseInt(parts[i]); // @init
        int m = d.length - 1;
        dp = new int[m][m]; split = new int[m][m];
        for (int len = 2; len <= m; len++) { // @interval
            for (int i = 0; i + len <= m; i++) {
                int j = i + len - 1;
                dp[i][j] = Integer.MAX_VALUE;
                for (int k = i; k < j; k++) { // @split
                    int cost = dp[i][k] + dp[k + 1][j] + d[i] * d[k + 1] * d[j + 1]; // @update
                    if (cost < dp[i][j]) { dp[i][j] = cost; split[i][j] = k; }
                }
            }
        }
        System.out.println("cost " + dp[0][m - 1]); // @result
        System.out.println("order " + order(0, m - 1));
    }
}

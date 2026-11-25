import java.util.*;

/* 0/1 背包：dp[w] 为容量 w 的最大价值，容量逆序保证每件物品最多取一次。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        in.next();
        int cap = in.nextInt(); // @init
        int[] w = new int[12], v = new int[12];
        int n = 0;
        while (in.hasNext()) {
            if (!in.next().equals("item")) break;
            w[n] = in.nextInt(); v[n++] = in.nextInt(); // @noItem
        }
        int[] dp = new int[cap + 1];
        for (int i = 0; i < n; i++) { // @compare
            for (int c = cap; c >= w[i]; c--) dp[c] = Math.max(dp[c], dp[c - w[i]] + v[i]);
        }
        System.out.println("result " + dp[cap]); // @result
    }
}

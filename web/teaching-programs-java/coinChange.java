import java.util.*;

/* 硬币找零：dp[0]=0，其余为 INF；按面额对每个金额做完全背包松弛。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        in.next();
        int amount = in.nextInt(); // @init
        List<Integer> coins = new ArrayList<>();
        while (in.hasNext()) {
            String s = in.next();
            if (s.equals("coin")) coins.add(in.nextInt());
            else break;
        }
        int INF = 1000000;
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, INF); // @base
        dp[0] = 0;
        for (int coin : coins) for (int x = coin; x <= amount; x++) { // @check
            if (dp[x - coin] + 1 < dp[x]) dp[x] = dp[x - coin] + 1; // @relax
        }
        System.out.println(dp[amount] >= INF ? "result unreachable" : "result " + dp[amount]); // @result
    }
}

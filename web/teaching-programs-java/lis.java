import java.util.*;

/* 最长严格递增子序列：O(n²)，相等值不延长；pre 记录前驱并回溯一条序列。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String line = in.hasNextLine() ? in.nextLine().trim() : "";
        String[] parts = line.isEmpty() ? new String[0] : line.split("[,，\\s]+"); // @init
        int n = parts.length;
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = Integer.parseInt(parts[i]);
        int[] dp = new int[n], pre = new int[n];
        Arrays.fill(pre, -1);
        int best = 0;
        if (n == 0) { System.out.println("result 0"); System.out.println("sequence "); return; }
        for (int i = 0; i < n; i++) {
            dp[i] = 1;
            for (int j = 0; j < i; j++) if (a[j] < a[i] && dp[j] + 1 > dp[i]) { // @compare
                dp[i] = dp[j] + 1; pre[i] = j; // @endpoint
            }
            if (dp[i] > dp[best]) best = i;
        }
        List<Integer> seq = new ArrayList<>();
        for (int x = best; x != -1; x = pre[x]) seq.add(a[x]); // @backtrack
        Collections.reverse(seq);
        System.out.println("result " + (n == 0 ? 0 : dp[best])); // @result
        StringBuilder sb = new StringBuilder("sequence ");
        for (int i = 0; i < seq.size(); i++) { if (i > 0) sb.append(", "); sb.append(seq.get(i)); }
        System.out.println(sb);
    }
}

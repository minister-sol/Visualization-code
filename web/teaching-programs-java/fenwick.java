import java.io.*;
import java.util.*;

/* 树状数组：下标从 1 开始，更新沿 p+=lowbit 向上，前缀和沿 p-=lowbit 向左。 */
class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String first = br.readLine();
        String[] parts = first.trim().isEmpty() ? new String[0] : first.trim().split("[,，\\s]+");
        int n = parts.length;
        int[] a = new int[n + 1], bit = new int[n + 1];
        for (int i = 1; i <= n; i++) a[i] = Integer.parseInt(parts[i - 1]); // @init
        for (int i = 1; i <= n; i++) for (int p = i; p <= n; p += p & -p) bit[p] += a[i]; // @add
        List<Integer> results = new ArrayList<>();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] q = line.split("\\s+");
            if (q[0].equals("set")) { // @set
                int idx = Integer.parseInt(q[1]) + 1, val = Integer.parseInt(q[2]);
                int delta = val - a[idx]; a[idx] = val;
                for (int p = idx; p <= n; p += p & -p) bit[p] += delta; // @add
            } else { // @query
                int idx = Integer.parseInt(q[1]) + 1, sum = 0;
                for (int p = idx; p > 0; p -= p & -p) sum += bit[p]; // @accumulate
                results.add(sum); // @result
            }
        }
        StringBuilder sb = new StringBuilder("array");
        for (int i = 1; i <= n; i++) sb.append(' ').append(a[i]);
        System.out.println(sb);
        sb = new StringBuilder("results");
        for (int x : results) sb.append(' ').append(x);
        System.out.println(sb); // @done
    }
}

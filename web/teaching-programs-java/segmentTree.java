import java.io.*;
import java.util.*;

/* 线段树：叶在 tree[n+i]，父为两子之和；单点修改向上更新，区间查询拆分节点。 */
class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String first = br.readLine();
        String[] parts = first.trim().isEmpty() ? new String[0] : first.trim().split("[,，\\s]+");
        int n = parts.length;
        int[] a = new int[n], tree = new int[2 * Math.max(1, n)];
        for (int i = 0; i < n; i++) a[i] = Integer.parseInt(parts[i]); // @init
        for (int i = 0; i < n; i++) tree[n + i] = a[i]; // @leaf
        for (int i = n - 1; i > 0; i--) tree[i] = tree[2 * i] + tree[2 * i + 1]; // @build
        List<Integer> results = new ArrayList<>();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            if (p[0].equals("set")) { // @set
                int idx = Integer.parseInt(p[1]), val = Integer.parseInt(p[2]);
                a[idx] = val; tree[n + idx] = val; // @update
                for (int i = (n + idx) / 2; i > 0; i /= 2) tree[i] = tree[2 * i] + tree[2 * i + 1]; // @moveUp
            } else { // @query
                int l = Integer.parseInt(p[1]) + n, r = Integer.parseInt(p[2]) + n + 1, sum = 0;
                while (l < r) {
                    if ((l & 1) == 1) sum += tree[l++]; // @leftAdd
                    if ((r & 1) == 1) sum += tree[--r]; // @rightAdd
                    l /= 2; r /= 2;
                }
                results.add(sum); // @result
            }
        }
        StringBuilder sb = new StringBuilder("array");
        for (int x : a) sb.append(' ').append(x);
        System.out.println(sb);
        sb = new StringBuilder("results");
        for (int x : results) sb.append(' ').append(x);
        System.out.println(sb); // @done
    }
}

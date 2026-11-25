import java.io.*;
import java.util.*;

/* 割点与桥：Tarjan 记录发现时间与低链值；根孩子数也决定割点。 */
class Main {
    static List<List<Integer>> adj = new ArrayList<>();
    static int[] tin, low; static boolean[] cut; static List<int[]> bridges = new ArrayList<>(); static int timer;
    static void dfs(int u, int parent, int root) {
        tin[u] = low[u] = timer++; // @discover
        int children = 0;
        for (int v : adj.get(u)) {
            if (v == parent) continue;
            if (tin[v] != -1) { low[u] = Math.min(low[u], tin[v]); continue; } // @backLow
            children++; dfs(v, u, root);
            low[u] = Math.min(low[u], low[v]); // @lowUp
            if (low[v] > tin[u]) bridges.add(new int[]{u, v}); // @bridge
            if (root != u && low[v] >= tin[u]) cut[u] = true; // @cut
        }
        if (root == u && children > 1) cut[u] = true; // @rootCut
    }
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        List<String> names = new ArrayList<>(); List<String[]> es = new ArrayList<>(); String line;
        while ((line = br.readLine()) != null) {
            line = line.trim(); if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            if (p[0].equals("vertices")) for (int i = 1; i < p.length; i++) names.add(p[i]);
            else if (p[0].equals("edge")) es.add(new String[]{p[1], p[2]});
        }
        int n = names.size(); Map<String,Integer> id = new HashMap<>(); for (int i = 0; i < n; i++) id.put(names.get(i), i);
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (String[] e : es) { int u = id.get(e[0]), v = id.get(e[1]); adj.get(u).add(v); adj.get(v).add(u); } // @init
        tin = new int[n]; low = new int[n]; cut = new boolean[n]; Arrays.fill(tin, -1); // @init
        for (int i = 0; i < n; i++) if (tin[i] == -1) dfs(i, -1, i);
        StringBuilder sb = new StringBuilder("cuts");
        for (int i = 0; i < n; i++) if (cut[i]) sb.append(' ').append(names.get(i)); // @check
        System.out.println(sb);
        sb = new StringBuilder("bridges");
        for (int[] b : bridges) sb.append(' ').append(names.get(b[0]) + "-" + names.get(b[1])); // @done
        System.out.println(sb);
    }
}

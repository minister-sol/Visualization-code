import java.io.*;
import java.util.*;

/* 最大流：Edmonds–Karp BFS 找增广路，累加瓶颈并更新残量；最后从源可达集给出最小割。 */
class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        List<String> names = new ArrayList<>(); List<String[]> es = new ArrayList<>(); String line, source = null, sink = null;
        while ((line = br.readLine()) != null) {
            line = line.trim(); if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            if (p[0].equals("vertices")) for (int i = 1; i < p.length; i++) names.add(p[i]);
            else if (p[0].equals("source")) source = p[1];
            else if (p[0].equals("sink")) sink = p[1];
            else if (p[0].equals("edge")) es.add(new String[]{p[1], p[2], p.length > 3 ? p[3] : "1"});
        }
        int n = names.size(); if (source == null || sink == null || n == 0) { System.out.println("flow 0\nsourceSide\ncut 0"); return; } // @empty
        Map<String,Integer> id = new HashMap<>(); for (int i = 0; i < n; i++) id.put(names.get(i), i);
        int[][] cap = new int[n][n]; List<Integer>[] adj = new List[n]; for (int i = 0; i < n; i++) adj[i] = new ArrayList<>(); // @init
        for (String[] e : es) { int u = id.get(e[0]), v = id.get(e[1]); cap[u][v] += Integer.parseInt(e[2]); if (!adj[u].contains(v)) adj[u].add(v); if (!adj[v].contains(u)) adj[v].add(u); }
        int s = id.get(source), t = id.get(sink), flow = 0;
        while (true) {
            int[] par = new int[n]; Arrays.fill(par, -1); par[s] = s; Queue<Integer> q = new ArrayDeque<>(); q.add(s); // @search
            while (!q.isEmpty() && par[t] < 0) { // @pop
                int u = q.poll();
                for (int v : adj[u]) if (par[v] < 0 && cap[u][v] > 0) { par[v] = u; q.add(v); } // @enqueue
            }
            if (par[t] < 0) break; // @noPath
            int add = Integer.MAX_VALUE; for (int v = t; v != s; v = par[v]) add = Math.min(add, cap[par[v]][v]); // @bottleneck
            for (int v = t; v != s; v = par[v]) { cap[par[v]][v] -= add; cap[v][par[v]] += add; } // @residual
            flow += add; // @flow
        }
        boolean[] reach = new boolean[n]; Queue<Integer> q = new ArrayDeque<>(); q.add(s); reach[s] = true; // @done
        while (!q.isEmpty()) { int u = q.poll(); for (int v : adj[u]) if (!reach[v] && cap[u][v] > 0) { reach[v] = true; q.add(v); } }
        System.out.println("flow " + flow);
        StringBuilder sb = new StringBuilder("sourceSide");
        for (int i = 0; i < n; i++) if (reach[i]) sb.append(' ').append(names.get(i));
        System.out.println(sb);
        int cut = 0; for (int u = 0; u < n; u++) if (reach[u]) for (int v = 0; v < n; v++) if (!reach[v] && cap[u][v] > 0) cut += cap[u][v];
        // 最小割容量应为原始容量；残量中已饱和边为 0，改用原图容量
        for (int i = 0; i < es.size(); i++) {}
        System.out.println("cut " + flow);
    }
}

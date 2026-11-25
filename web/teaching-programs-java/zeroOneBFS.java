import java.io.*;
import java.util.*;

/* 0–1 BFS：权重 0 的边入队首，权重 1 的边入队尾，保证最短路单调。 */
class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        List<String> names = new ArrayList<>(); List<String[]> es = new ArrayList<>(); String start = null; String line;
        boolean directed = true;
        while ((line = br.readLine()) != null) {
            line = line.trim(); if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            if (p[0].equals("vertices")) for (int i = 1; i < p.length; i++) names.add(p[i]);
            else if (p[0].equals("mode")) directed = p[1].equals("directed");
            else if (p[0].equals("start")) start = p[1];
            else if (p[0].equals("edge")) es.add(new String[]{p[1], p[2], p.length > 3 ? p[3] : "1"});
        }
        int n = names.size(); Map<String,Integer> id = new HashMap<>(); for (int i = 0; i < n; i++) id.put(names.get(i), i);
        List<int[]>[] adj = new List[n]; for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (String[] e : es) { int u = id.get(e[0]), v = id.get(e[1]), w = Integer.parseInt(e[2]); adj[u].add(new int[]{v, w}); if (!directed) adj[v].add(new int[]{u, w}); }
        int INF = 1 << 29; int[] d = new int[n], par = new int[n]; Arrays.fill(d, INF); Arrays.fill(par, -1); // @init
        if (start == null) return;
        int s = id.get(start); d[s] = 0; Deque<Integer> q = new ArrayDeque<>(); q.add(s); // @init
        while (!q.isEmpty()) { // @pop
            int u = q.poll();
            for (int[] e : adj[u]) if (d[u] + e[1] < d[e[0]]) { d[e[0]] = d[u] + e[1]; par[e[0]] = u; if (e[1] == 0) q.addFirst(e[0]); else q.addLast(e[0]); } // @relax
        }
        for (int i = 0; i < n; i++) System.out.println("dist " + names.get(i) + " " + (d[i] >= INF ? -1 : d[i]) + " " + (par[i] < 0 ? "-" : names.get(par[i]))); // @done
    }
}

import java.io.*;
import java.util.*;

/* Dijkstra：每轮选未定型距离最小的顶点，松弛非负权出边。 */
class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        List<String> names = new ArrayList<>(); List<String[]> raw = new ArrayList<>();
        boolean directed = true; String start = null; String line;
        while ((line = br.readLine()) != null) {
            line = line.trim(); if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            if (p[0].equals("vertices")) for (int i = 1; i < p.length; i++) names.add(p[i]);
            else if (p[0].equals("mode")) directed = p[1].equals("directed");
            else if (p[0].equals("start")) start = p[1];
            else if (p[0].equals("edge")) raw.add(new String[]{p[1], p[2], p.length > 3 ? p[3] : "1"});
        }
        int n = names.size(); Map<String,Integer> id = new HashMap<>(); for (int i = 0; i < n; i++) id.put(names.get(i), i);
        int[][] w = new int[n][n]; for (int[] row : w) Arrays.fill(row, -1);
        for (String[] e : raw) { int u = id.get(e[0]), v = id.get(e[1]), c = Integer.parseInt(e[2]); w[u][v] = c; if (!directed) w[v][u] = c; }
        int INF = 1 << 29; int[] dist = new int[n], parent = new int[n]; boolean[] used = new boolean[n]; Arrays.fill(dist, INF); Arrays.fill(parent, -1); // @init
        if (start != null) dist[id.get(start)] = 0; // @start
        for (int round = 0; round < n; round++) {
            int u = -1;
            for (int i = 0; i < n; i++) if (!used[i] && dist[i] < INF && (u < 0 || dist[i] < dist[u])) u = i; // @select
            if (u < 0) break; used[u] = true; // @settle
            for (int v = 0; v < n; v++) if (w[u][v] >= 0 && dist[u] + w[u][v] < dist[v]) { // @check
                dist[v] = dist[u] + w[u][v]; parent[v] = u; // @relax
            }
        }
        for (int i = 0; i < n; i++) System.out.println(names.get(i) + " " + (dist[i] >= INF ? "-" : dist[i]) + " " + (parent[i] < 0 ? "-" : names.get(parent[i]))); // @done
    }
}

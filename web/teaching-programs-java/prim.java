import java.io.*;
import java.util.*;

/* Prim 最小生成树：按选择顺序输出边；不连通时输出森林。 */
class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        List<String> names = new ArrayList<>(); List<String[]> raw = new ArrayList<>(); String start = null; String line;
        while ((line = br.readLine()) != null) {
            line = line.trim(); if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            if (p[0].equals("vertices")) for (int i = 1; i < p.length; i++) names.add(p[i]);
            else if (p[0].equals("start")) start = p[1];
            else if (p[0].equals("edge")) raw.add(new String[]{p[1], p[2], p.length > 3 ? p[3] : "1"});
        }
        int n = names.size(); Map<String,Integer> id = new HashMap<>(); for (int i = 0; i < n; i++) id.put(names.get(i), i);
        int[][] w = new int[n][n]; for (int[] r : w) Arrays.fill(r, -1);
        for (String[] e : raw) { int u = id.get(e[0]), v = id.get(e[1]), c = Integer.parseInt(e[2]); w[u][v] = c; w[v][u] = c; }
        boolean[] in = new boolean[n]; int[] dist = new int[n], from = new int[n]; Arrays.fill(dist, Integer.MAX_VALUE); Arrays.fill(from, -1); // @init
        int s = start == null ? (n > 0 ? 0 : -1) : id.get(start); // @root
        if (s >= 0) dist[s] = 0;
        int total = 0, used = 0;
        for (int k = 0; k < n; k++) {
            int u = -1; for (int i = 0; i < n; i++) if (!in[i] && dist[i] < Integer.MAX_VALUE && (u < 0 || dist[i] < dist[u])) u = i; // @candidate
            if (u < 0) { // disconnected: start a new component
                for (int i = 0; i < n; i++) if (!in[i]) { u = i; dist[u] = 0; break; }
                if (u < 0) break;
            }
            in[u] = true; used++; // @pick
            if (from[u] >= 0) { System.out.println("edge " + names.get(from[u]) + " " + names.get(u) + " " + dist[u]); total += dist[u]; } // @join
            for (int v = 0; v < n; v++) if (!in[v] && w[u][v] >= 0 && w[u][v] < dist[v]) { dist[v] = w[u][v]; from[v] = u; } // @join
        }
        System.out.println("total " + total); // @done
        System.out.println("connected " + (used == n ? 1 : 0));
    }
}

import java.io.*;
import java.util.*;

/* Bellman–Ford：进行 V-1 轮全体边松弛，再检测可达负环。 */
class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        List<String> names = new ArrayList<>(); List<String[]> es = new ArrayList<>();
        boolean directed = true; String start = null; String line;
        while ((line = br.readLine()) != null) {
            line = line.trim(); if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            if (p[0].equals("vertices")) for (int i = 1; i < p.length; i++) names.add(p[i]);
            else if (p[0].equals("mode")) directed = p[1].equals("directed");
            else if (p[0].equals("start")) start = p[1];
            else if (p[0].equals("edge")) es.add(new String[]{p[1], p[2], p.length > 3 ? p[3] : "1"});
        }
        int n = names.size(); Map<String,Integer> id = new HashMap<>(); for (int i = 0; i < n; i++) id.put(names.get(i), i);
        List<int[]> edges = new ArrayList<>();
        for (String[] e : es) { int u = id.get(e[0]), v = id.get(e[1]), c = Integer.parseInt(e[2]); edges.add(new int[]{u, v, c}); if (!directed) edges.add(new int[]{v, u, c}); }
        int INF = 1 << 29; int[] d = new int[n]; Arrays.fill(d, INF); // @init
        if (start != null) d[id.get(start)] = 0; // @start
        for (int it = 0; it < n - 1; it++) for (int[] e : edges) if (d[e[0]] < INF && d[e[0]] + e[2] < d[e[1]]) d[e[1]] = d[e[0]] + e[2]; // @relax
        boolean[] bad = new boolean[n];
        for (int[] e : edges) if (d[e[0]] < INF && d[e[0]] + e[2] < d[e[1]]) { bad[e[1]] = true; d[e[1]] = -1000000; } // @affected
        for (int i = 0; i < n; i++) if (bad[i]) d[i] = -1000000; // @mark
        for (int i = 0; i < n; i++) System.out.println(names.get(i) + " " + (d[i] >= INF ? -1000000 : d[i])); // @done
    }
}

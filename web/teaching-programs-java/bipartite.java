import java.io.*;
import java.util.*;

/* 二分图判定与最大匹配：先染色，非二分图直接 valid 0；否则按左侧顺序增广。 */
class Main {
    static List<List<Integer>> adj = new ArrayList<>();
    static int[] color, match;
    static boolean[] seen;
    static boolean augment(int u) {
        for (int v : adj.get(u)) if (!seen[v]) { // @augmentTry
            seen[v] = true;
            if (match[v] < 0 || augment(match[v])) { match[v] = u; return true; } // @match
        }
        return false;
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
        for (String[] e : es) { int u = id.get(e[0]), v = id.get(e[1]); adj.get(u).add(v); adj.get(v).add(u); }
        color = new int[n]; Arrays.fill(color, -1); boolean ok = true; // @init
        for (int s = 0; s < n && ok; s++) if (color[s] < 0) {
            color[s] = 0; Queue<Integer> q = new ArrayDeque<>(); q.add(s); // @root
            while (!q.isEmpty()) {
                int u = q.poll(); // @pop
                for (int v : adj.get(u)) {
                    if (color[v] < 0) { color[v] = color[u] ^ 1; q.add(v); } // @color
                    else if (color[v] == color[u]) { ok = false; break; } // @conflict
                }
            }
        }
        if (!ok) { System.out.println("valid 0"); return; } // @done
        match = new int[n]; Arrays.fill(match, -1);
        for (int u = 0; u < n; u++) if (color[u] == 0) { seen = new boolean[n]; augment(u); }
        System.out.println("valid 1");
        for (int v = 0; v < n; v++) if (color[v] == 1 && match[v] >= 0) System.out.println("match " + names.get(v) + " " + names.get(match[v])); // @done
    }
}

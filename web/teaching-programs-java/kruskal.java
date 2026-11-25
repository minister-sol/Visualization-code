import java.io.*;
import java.util.*;

/* Kruskal：边按权重、输入顺序排序，用并查集跳过成环边。 */
class Main {
    static int[] parent;
    static int find(int x) { while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        List<String> names = new ArrayList<>(); List<int[]> edges = new ArrayList<>(); List<String> eu = new ArrayList<>(), ev = new ArrayList<>(); int order = 0; String line;
        while ((line = br.readLine()) != null) {
            line = line.trim(); if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            if (p[0].equals("vertices")) for (int i = 1; i < p.length; i++) names.add(p[i]);
            else if (p[0].equals("edge")) {
                eu.add(p[1]); ev.add(p[2]); edges.add(new int[]{Integer.parseInt(p.length > 3 ? p[3] : "1"), order++});
            }
        }
        int n = names.size(); Map<String,Integer> id = new HashMap<>(); for (int i = 0; i < n; i++) id.put(names.get(i), i);
        edges.sort((a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]); // @init
        parent = new int[n]; for (int i = 0; i < n; i++) parent[i] = i; // @start
        int total = 0, taken = 0;
        for (int[] e : edges) { // @check
            int idx = e[1], u = id.get(eu.get(idx)), v = id.get(ev.get(idx));
            int a = find(u), b = find(v);
            if (a == b) continue; // @skip
            parent[a] = b; // @merge
            System.out.println("edge " + eu.get(idx) + " " + ev.get(idx) + " " + e[0]); // @pick
            total += e[0]; taken++;
        }
        System.out.println("total " + total); // @done
        System.out.println("connected " + (taken == n - 1 && n > 0 ? 1 : 0));
    }
}

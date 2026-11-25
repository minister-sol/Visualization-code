import java.io.*;
import java.util.*;

/* 强连通分量：第一遍原图记录完成序，第二遍转置图按完成序逆序收集。 */
class Main {
    static List<List<Integer>> adj = new ArrayList<>(), rev = new ArrayList<>();
    static boolean[] seen; static List<Integer> finish = new ArrayList<>(); static List<List<Integer>> comps = new ArrayList<>();
    static void dfs(int u) {
        seen[u] = true; // @visit
        for (int v : adj.get(u)) if (!seen[v]) dfs(v);
        finish.add(u); // @finish
    }
    static void rdfs(int u, List<Integer> c) {
        seen[u] = true; c.add(u); // @add
        for (int v : rev.get(u)) if (!seen[v]) rdfs(v, c);
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
        for (int i = 0; i < n; i++) { adj.add(new ArrayList<>()); rev.add(new ArrayList<>()); } // @init
        for (String[] e : es) { int u = id.get(e[0]), v = id.get(e[1]); adj.get(u).add(v); rev.get(v).add(u); }
        seen = new boolean[n]; for (int i = 0; i < n; i++) if (!seen[i]) dfs(i);
        seen = new boolean[n]; // @reverseStart
        for (int i = finish.size() - 1; i >= 0; i--) { int u = finish.get(i); if (!seen[u]) { List<Integer> c = new ArrayList<>(); rdfs(u, c); comps.add(c); } } // @component
        for (List<Integer> c : comps) { StringBuilder sb = new StringBuilder("comp"); for (int u : c) sb.append(' ').append(names.get(u)); System.out.println(sb); } // @done
    }
}

import java.io.*;
import java.util.*;

/* 深度优先搜索：从 start 出发，按顶点声明顺序访问邻接点。 */
class Main {
    static List<List<Integer>> adj = new ArrayList<>();
    static boolean[] seen;
    static List<String> names = new ArrayList<>();
    static void dfs(int u) {
        seen[u] = true; System.out.print(names.get(u) + " "); // @visit
        for (int v : adj.get(u)) if (!seen[v]) { // @check
            dfs(v);
        }
    }
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        List<String[]> raw = new ArrayList<>(); boolean directed = true; String start = null; String line;
        while ((line = br.readLine()) != null) {
            line = line.trim(); if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            if (p[0].equals("vertices")) for (int i = 1; i < p.length; i++) names.add(p[i]);
            else if (p[0].equals("mode")) directed = p[1].equals("directed");
            else if (p[0].equals("start")) start = p[1];
            else if (p[0].equals("edge")) raw.add(new String[]{p[1], p[2]});
        }
        Map<String,Integer> id = new HashMap<>(); for (int i = 0; i < names.size(); i++) id.put(names.get(i), i);
        for (int i = 0; i < names.size(); i++) adj.add(new ArrayList<>());
        for (String[] e : raw) { int u = id.get(e[0]), v = id.get(e[1]); adj.get(u).add(v); if (!directed) adj.get(v).add(u); }
        if (start == null) return; // @start
        seen = new boolean[names.size()]; dfs(id.get(start));
        System.out.println(); // @done
    }
}

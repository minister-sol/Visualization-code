import java.io.*;
import java.util.*;

/* 拓扑排序：按声明顺序把零入度顶点入队，出队后邻接点入度减一。 */
class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        List<String> names = new ArrayList<>(); List<String[]> raw = new ArrayList<>(); String line;
        while ((line = br.readLine()) != null) {
            line = line.trim(); if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            if (p[0].equals("vertices")) for (int i = 1; i < p.length; i++) names.add(p[i]);
            else if (p[0].equals("edge")) raw.add(new String[]{p[1], p[2]});
        }
        int n = names.size(); Map<String,Integer> id = new HashMap<>(); for (int i = 0; i < n; i++) id.put(names.get(i), i);
        List<List<Integer>> adj = new ArrayList<>(); int[] indeg = new int[n];
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (String[] e : raw) { int u = id.get(e[0]), v = id.get(e[1]); adj.get(u).add(v); indeg[v]++; } // @indeg
        Queue<Integer> q = new ArrayDeque<>(); for (int i = 0; i < n; i++) if (indeg[i] == 0) q.add(i); // @seed
        int done = 0;
        while (!q.isEmpty()) {
            int u = q.poll(); System.out.print(names.get(u) + " "); done++; // @pop
            for (int v : adj.get(u)) if (--indeg[v] == 0) q.add(v); // @decr
        }
        System.out.println();
        System.out.println("cycle " + (done == n ? 0 : 1)); // @done
    }
}

import java.io.*;
import java.util.*;

/* 无权最短路径：BFS 首次到达即最短，dist 与 parent 同时记录。 */
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
            else if (p[0].equals("edge")) raw.add(new String[]{p[1], p[2]});
        }
        Map<String,Integer> id = new HashMap<>(); for (int i = 0; i < names.size(); i++) id.put(names.get(i), i);
        List<List<Integer>> adj = new ArrayList<>(); for (int i = 0; i < names.size(); i++) adj.add(new ArrayList<>());
        for (String[] e : raw) { int u = id.get(e[0]), v = id.get(e[1]); adj.get(u).add(v); if (!directed) adj.get(v).add(u); }
        int n = names.size(); int[] dist = new int[n], parent = new int[n]; Arrays.fill(dist, -1); Arrays.fill(parent, -1);
        if (start != null) {
            int s = id.get(start); dist[s] = 0; Queue<Integer> q = new ArrayDeque<>(); q.add(s); // @init
            while (!q.isEmpty()) { // @visit
                int u = q.poll();
                for (int v : adj.get(u)) if (dist[v] < 0) { // @check
                    dist[v] = dist[u] + 1; parent[v] = u; q.add(v); // @distance
                }
            }
        }
        for (int i = 0; i < n; i++) System.out.println(names.get(i) + " " + (dist[i] < 0 ? "-" : dist[i]) + " " + (parent[i] < 0 ? "-" : names.get(parent[i]))); // @done
    }
}

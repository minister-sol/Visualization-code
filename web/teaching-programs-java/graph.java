import java.io.*;
import java.util.*;

/* 图邻接表：按顶点声明顺序输出每条邻接边；有向边只加单向。 */
class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        List<String> names = new ArrayList<>();
        List<String[]> raw = new ArrayList<>();
        boolean directed = true;
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim(); if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            if (p[0].equals("vertices")) for (int i = 1; i < p.length; i++) names.add(p[i]);
            else if (p[0].equals("mode")) directed = p[1].equals("directed");
            else if (p[0].equals("edge")) raw.add(new String[]{p[1], p[2]});
        }
        Map<String,Integer> id = new HashMap<>();
        for (int i = 0; i < names.size(); i++) id.put(names.get(i), i);
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < names.size(); i++) adj.add(new ArrayList<>());
        for (String[] e : raw) { // @start
            int u = id.get(e[0]), v = id.get(e[1]);
            adj.get(u).add(v);
            if (!directed) adj.get(v).add(u);
        }
        for (int i = 0; i < names.size(); i++) {
            StringBuilder sb = new StringBuilder(names.get(i) + ":"); // @list
            for (int v : adj.get(i)) sb.append(' ').append(names.get(v));
            System.out.println(sb);
        }
    }
}

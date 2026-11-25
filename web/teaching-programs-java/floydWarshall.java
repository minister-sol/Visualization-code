import java.io.*;

/* Floyd–Warshall：三重循环枚举中转点，输出全源最短路矩阵。 */
class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        java.util.List<String> names = new java.util.ArrayList<>();
        java.util.List<String[]> es = new java.util.ArrayList<>();
        boolean directed = true; String line;
        while ((line = br.readLine()) != null) {
            line = line.trim(); if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            if (p[0].equals("vertices")) for (int i = 1; i < p.length; i++) names.add(p[i]);
            else if (p[0].equals("mode")) directed = p[1].equals("directed");
            else if (p[0].equals("edge")) es.add(new String[]{p[1], p[2], p.length > 3 ? p[3] : "1"});
        }
        int n = names.size(); java.util.Map<String,Integer> id = new java.util.HashMap<>(); for (int i = 0; i < n; i++) id.put(names.get(i), i);
        int INF = 1 << 29; int[][] d = new int[n][n]; for (int i = 0; i < n; i++) { java.util.Arrays.fill(d[i], INF); d[i][i] = 0; } // @init
        for (String[] e : es) { int u = id.get(e[0]), v = id.get(e[1]), w = Integer.parseInt(e[2]); d[u][v] = Math.min(d[u][v], w); if (!directed) d[v][u] = Math.min(d[v][u], w); } // @relax
        for (int k = 0; k < n; k++) for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) if (d[i][k] < INF && d[k][j] < INF && d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j]; // @relax
        for (int k = 0; k < n; k++) if (d[k][k] < 0) for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) if (d[i][k] < INF && d[k][j] < INF) d[i][j] = -1000000; // @negative
        for (int i = 0; i < n; i++) {
            StringBuilder sb = new StringBuilder();
            for (int j = 0; j < n; j++) { if (j > 0) sb.append(' '); sb.append(d[i][j] >= INF ? -1000000 : d[i][j]); }
            System.out.println(sb); // @done
        }
    }
}

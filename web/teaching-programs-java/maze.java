import java.io.*;
import java.util.*;

/* 0/1 迷宫：BFS 按上右下左扩展，parent 回溯一条最短路径。 */
class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        List<String> rows = new ArrayList<>(); String line; int sr = -1, sc = -1, er = -1, ec = -1; boolean reading = false;
        while ((line = br.readLine()) != null) {
            line = line.trim(); if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            if (p[0].equals("grid")) { reading = true; continue; } // @init
            if (p[0].equals("start")) { sr = Integer.parseInt(p[1]); sc = Integer.parseInt(p[2]); reading = false; continue; }
            if (p[0].equals("end")) { er = Integer.parseInt(p[1]); ec = Integer.parseInt(p[2]); reading = false; continue; }
            if (reading) rows.add(line);
        }
        int n = rows.size(); int m = n == 0 ? 0 : rows.get(0).length();
        if (n == 0 || sr < 0) { System.out.println("path null"); return; }
        int[][] par = new int[n][m]; for (int[] r : par) Arrays.fill(r, -2); par[sr][sc] = -1; // @init
        Queue<int[]> q = new ArrayDeque<>(); q.add(new int[]{sr, sc}); // @enqueue
        int[] dr = {-1, 0, 1, 0}, dc = {0, 1, 0, -1}; boolean found = false;
        while (!q.isEmpty()) { // @pop
            int[] cur = q.poll(); int r = cur[0], c = cur[1];
            if (r == er && c == ec) { found = true; break; } // @arrive
            for (int d = 0; d < 4; d++) { int nr = r + dr[d], nc = c + dc[d]; if (nr >= 0 && nr < n && nc >= 0 && nc < m && rows.get(nr).charAt(nc) == '0' && par[nr][nc] == -2) { par[nr][nc] = r * m + c; q.add(new int[]{nr, nc}); } } // @enqueue
        }
        if (!found) { System.out.println("path null"); return; } // @unreachable
        List<int[]> path = new ArrayList<>(); int r = er, c = ec;
        while (r != -1) { path.add(new int[]{r, c}); int p = par[r][c]; if (p < 0) break; r = p / m; c = p % m; } // @backtrack
        Collections.reverse(path);
        StringBuilder sb = new StringBuilder("path");
        for (int[] x : path) sb.append(' ').append(x[0]).append(',').append(x[1]);
        System.out.println(sb); // @done
    }
}

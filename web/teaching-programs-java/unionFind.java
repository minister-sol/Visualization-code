import java.io.*;
import java.util.*;

/* 并查集：find 沿父指针走并压缩，union 合并两个根。 */
class Main {
    static int[] p, rank;
    static int find(int x) {
        if (p[x] != x) p[x] = find(p[x]); // @follow
        return p[x];
    }
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String first = br.readLine().trim(); // @init
        List<String> names = new ArrayList<>();
        for (int i = 1; i < first.split("\\s+").length; i++) names.add(first.split("\\s+")[i]);
        int n = names.size(); Map<String,Integer> id = new HashMap<>(); for (int i = 0; i < n; i++) id.put(names.get(i), i);
        p = new int[n]; rank = new int[n]; for (int i = 0; i < n; i++) p[i] = i; // @roots
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim(); if (line.isEmpty()) continue;
            String[] q = line.split("\\s+"); int a = id.get(q[1]), b = id.get(q[2]);
            if (q[0].equals("union")) { // @merge
                int x = find(a), y = find(b); if (x != y) { if (rank[x] < rank[y]) p[x] = y; else { p[y] = x; if (rank[x] == rank[y]) rank[x]++; } }
            } else System.out.println(find(a) == find(b) ? 1 : 0); // @result
        } // @done
    }
}

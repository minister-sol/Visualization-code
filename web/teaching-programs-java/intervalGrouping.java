import java.io.*;
import java.util.*;

/* 区间分组：按开始排序，复用结束不晚于当前开始的最小编号资源。 */
class Main {
    static class I { int s, e, id; I(int s, int e, int id) { this.s = s; this.e = e; this.id = id; } }
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        List<I> list = new ArrayList<>();
        String line;
        int id = 0;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            if (p[0].equals("interval")) list.add(new I(Integer.parseInt(p[1]), Integer.parseInt(p[2]), id++));
        }
        list.sort((x, y) -> x.s != y.s ? x.s - y.s : x.e != y.e ? x.e - y.e : x.id - y.id); // @sort
        List<Integer> ends = new ArrayList<>(); // @init
        List<List<Integer>> groups = new ArrayList<>();
        for (I it : list) {
            int pick = -1;
            for (int r = 0; r < ends.size(); r++) if (ends.get(r) <= it.s) { pick = r; break; } // @find
            if (pick < 0) { pick = ends.size(); ends.add(it.e); groups.add(new ArrayList<>()); } // @create
            ends.set(pick, it.e);
            groups.get(pick).add(it.id); // @assign
        }
        System.out.println("resources " + groups.size()); // @result
        for (int r = 0; r < groups.size(); r++) {
            StringBuilder sb = new StringBuilder("R" + r + ":");
            for (int x : groups.get(r)) sb.append(' ').append(x);
            System.out.println(sb);
        }
    }
}

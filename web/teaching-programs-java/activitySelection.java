import java.util.*;

/* 活动选择：按结束时间、开始时间、编号排序，每次选结束不早于上次结束的最早活动。 */
class Main {
    static class A { int s, e, id; A(int s, int e, int id) { this.s = s; this.e = e; this.id = id; } }
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<A> list = new ArrayList<>();
        for (int i = 0; i < n; i++) list.add(new A(in.nextInt(), in.nextInt(), i)); // @sort
        list.sort((x, y) -> x.e != y.e ? x.e - y.e : x.s != y.s ? x.s - y.s : x.id - y.id); // @sort_end
        int last = Integer.MIN_VALUE;
        StringBuilder out = new StringBuilder();
        for (A a : list) { // @compare
            if (a.s >= last) { // @select / @end
                out.append(a.id).append(' ');
                last = a.e;
            }
        }
        System.out.println(out.toString().trim()); // @output
    }
}

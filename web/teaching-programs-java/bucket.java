import java.util.*;

/* 桶排序：按十位放入 0..9 号桶，桶内插入排序，再按桶号收集。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        List<Integer>[] buckets = new List[10]; // @init
        for (int i = 0; i < 10; i++) buckets[i] = new ArrayList<>();
        for (int x : a) buckets[Math.min(9, Math.max(0, x / 10))].add(x); // @place
        for (List<Integer> b : buckets) Collections.sort(b); // @sort
        int k = 0;
        for (List<Integer> b : buckets) for (int x : b) a[k++] = x; // @merge
        for (int x : a) System.out.print(x + " ");
        System.out.println(); // @done
    }
}

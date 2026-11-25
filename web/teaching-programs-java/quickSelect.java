import java.util.*;

/* 快速选择：按升序分区寻找第 n-k 个位置，即第 k 大；只继续包含目标的一侧。 */
class Main {
    static int select(int[] a, int lo, int hi, int target) { // @init
        while (lo <= hi) {
            int pivot = a[hi]; // @pivot
            int i = lo;
            for (int j = lo; j < hi; j++) { // @compare
                if (a[j] <= pivot) {
                    int t = a[i]; a[i] = a[j]; a[j] = t; // @place
                    i++;
                }
            }
            int t = a[i]; a[i] = a[hi]; a[hi] = t;
            if (i == target) return a[i]; // @result
            if (target < i) hi = i - 1; else lo = i + 1; // @shrink
        }
        return a[lo];
    }
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt(), k = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        System.out.println(select(a, 0, n - 1, n - k));
    }
}

import java.util.*;

/* 快速排序：Lomuto 分区，末位枢轴，小于等于枢轴的元素放左侧。 */
class Main {
    static void sort(int[] a, int lo, int hi) { // @range
        if (lo >= hi) return;
        int pivot = a[hi]; // @pivot
        int i = lo;
        for (int j = lo; j < hi; j++) { // @compare
            if (a[j] <= pivot) {
                int t = a[i]; a[i] = a[j]; a[j] = t; // @swap
                i++;
            }
        }
        int t = a[i]; a[i] = a[hi]; a[hi] = t; // @boundary
        sort(a, lo, i - 1); // @partition
        sort(a, i + 1, hi);
    }
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        sort(a, 0, n - 1);
        for (int x : a) System.out.print(x + " "); // @output
        System.out.println();
    }
}

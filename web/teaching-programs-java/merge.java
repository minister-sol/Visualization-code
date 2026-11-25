import java.util.Scanner;

/* 归并排序：递归分段，辅助区复制后按原顺序写回；稳定，O(n log n)。
   输入：n、n 个整数；输出升序。 */
class Main {
    static void sort(int[] a, int lo, int hi) { // @range
        if (hi - lo <= 1) {
            return;
        }
        int mid = lo + (hi - lo) / 2;
        sort(a, lo, mid);
        sort(a, mid, hi);
        int[] auxiliary = new int[20];
        int i = lo;
        int j = mid;
        int size = 0; // @aux
        while (i < mid && j < hi) {
            if (a[i] <= a[j]) {            // @compare
                auxiliary[size++] = a[i++]; // @left
            } else {
                auxiliary[size++] = a[j++]; // @right
            }
        }
        while (i < mid) {
            auxiliary[size++] = a[i++];     // @leftover
        }
        while (j < hi) {
            auxiliary[size++] = a[j++];     // @rightover
        }
        for (int k = 0; k < size; k++) {
            a[lo + k] = auxiliary[k];        // @write
        }
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int[] a = new int[20];
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            a[i] = in.nextInt();
        }
        sort(a, 0, n);
        for (int i = 0; i < n; i++) {
            System.out.print(a[i] + " "); // @output
        }
        System.out.println();
    }
}

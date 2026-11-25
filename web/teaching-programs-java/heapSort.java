import java.util.*;

/* 堆排序：先建大顶堆，再反复把堆顶换到末尾并下沉。输入 n 与 n 个整数。 */
class Main {
    static void sift(int[] a, int start, int end) { // @down
        int root = start;
        while (2 * root + 1 <= end) { // @compare
            int child = 2 * root + 1;
            if (child + 1 <= end && a[child] < a[child + 1]) child++;
            if (a[root] < a[child]) {
                int t = a[root]; a[root] = a[child]; a[child] = t;
                root = child;
            } else return;
        }
    }
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        for (int i = n / 2 - 1; i >= 0; i--) sift(a, i, n - 1); // @build
        for (int end = n - 1; end > 0; end--) { // @extract
            int t = a[0]; a[0] = a[end]; a[end] = t;
            sift(a, 0, end - 1);
        }
        for (int x : a) System.out.print(x + " "); // @output
        System.out.println();
    }
}

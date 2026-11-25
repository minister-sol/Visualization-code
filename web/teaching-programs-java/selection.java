import java.util.Scanner;

/* 选择排序：每轮扫描最小值，只交换一次，O(n²)，不稳定。
   输入：n、n 个整数；输出升序。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int[] a = new int[20];
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            a[i] = in.nextInt();
        }

        for (int end = 0; end < n - 1; end++) {
            int minimum = end;                       // @minimum
            for (int j = end + 1; j < n; j++) {      // @compare
                if (a[j] < a[minimum]) {
                    minimum = j;                     // @newmin
                }
            }
            if (minimum != end) {
                int tmp = a[end]; a[end] = a[minimum]; a[minimum] = tmp; // @swap
            }
        }

        for (int i = 0; i < n; i++) {
            System.out.print(a[i] + " "); // @output
        }
        System.out.println();
    }
}

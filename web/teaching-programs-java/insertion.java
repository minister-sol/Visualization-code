import java.util.Scanner;

/* 插入排序：暂存 key，向右传播空位，再把 key 放回；稳定，最坏 O(n²)。
   输入：n、n 个整数；输出升序。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int[] a = new int[20];
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            a[i] = in.nextInt();
        }

        for (int i = 1; i < n; i++) {
            int key = a[i];                 // @hold
            int j = i - 1;
            while (j >= 0 && a[j] > key) {  // @compare
                a[j + 1] = a[j];            // @shift
                j--;
            }
            a[j + 1] = key;                 // @place
        }

        for (int i = 0; i < n; i++) {
            System.out.print(a[i] + " "); // @output
        }
        System.out.println();
    }
}

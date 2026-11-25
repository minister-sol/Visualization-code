import java.util.Scanner;

/* 二分查找：在非递减数组上取第一个等于 target 的原下标；找不到返回 -1。
   输入：n、n 个非递减整数、target。 */
class Main {
    static int search(int[] a, int n, int target) {
        int left = 0;
        int right = n; // @range
        while (left < right) {
            int mid = left + (right - left) / 2; // @mid
            if (a[mid] < target) { // @compare
                left = mid + 1;    // @left
            } else {
                right = mid;       // @right
            }
        }
        return left < n && a[left] == target ? left : -1; // @result
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int[] a = new int[20];
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            a[i] = in.nextInt();
        }
        int target = in.nextInt();
        System.out.print(search(a, n, target)); // @output
    }
}

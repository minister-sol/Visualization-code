import java.util.*;

/* 线性查找：从下标 0 起逐个比较，返回首个命中位置或 -1。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt(); // @2
        int target = in.nextInt();
        for (int i = 0; i < n; i++) if (a[i] == target) { System.out.println(i); return; } // @4
        System.out.println(-1);
    }
}

import java.util.*;

/* 双指针：升序数组两端向中间收拢，找不同索引且和为目标的一对。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt(); // @1
        int target = in.nextInt(); // @3
        int l = 0, r = n - 1; // @4
        while (l < r) { // @5
            int sum = a[l] + a[r]; // @6
            if (sum == target) { System.out.println(l + " " + r); return; } // @8
            if (sum < target) l++; else r--;
        }
        System.out.println("-1");
    }
}

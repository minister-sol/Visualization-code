import java.util.*;

/* 滑动窗口：先累加首个窗口，再逐格移入右端、移出左端，记录最大和。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt(); // @1
        int size = in.nextInt(); // @3
        int sum = 0;
        for (int i = 0; i < size; i++) sum += a[i]; // @4
        int best = sum; // @5
        for (int r = size; r < n; r++) { // @7
            sum += a[r] - a[r - size];
            best = Math.max(best, sum);
        }
        System.out.println(best);
    }
}

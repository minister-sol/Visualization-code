import java.util.*;

/* 前缀和：prefix[i] 保存前 i 个元素之和，区间 [l,r] 用差值 O(1) 得到。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n], prefix = new int[n + 1];
        for (int i = 0; i < n; i++) a[i] = in.nextInt(); // @1
        for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + a[i]; // @3
        int l = in.nextInt(), r = in.nextInt(); // @5
        System.out.println(prefix[r + 1] - prefix[l]);
    }
}

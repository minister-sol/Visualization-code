import java.util.*;

/* 基数排序：按个位、十位、百位依次做稳定分配与收集；输入 0..999。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        for (int exp = 1; exp <= 100; exp *= 10) { // @init
            int[] out = new int[n];
            int[] cnt = new int[10];
            for (int x : a) cnt[(x / exp) % 10]++; // @distribute
            for (int i = 1; i < 10; i++) cnt[i] += cnt[i - 1];
            for (int i = n - 1; i >= 0; i--) out[--cnt[(a[i] / exp) % 10]] = a[i]; // @collect
            a = out;
        }
        for (int x : a) System.out.print(x + " "); // @done
        System.out.println();
    }
}

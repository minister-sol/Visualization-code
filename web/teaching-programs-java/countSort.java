import java.util.*;

/* 计数排序：统计 -20..20 的出现次数，再按值从小到大输出。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] count = new int[41]; // @init
        for (int i = 0; i < n; i++) count[in.nextInt() + 20]++; // @count
        for (int v = -20; v <= 20; v++) {
            while (count[v + 20] > 0) { // @decrement
                System.out.print(v + " "); // @emit
                count[v + 20]--;
            }
        }
        System.out.println(); // @done
    }
}

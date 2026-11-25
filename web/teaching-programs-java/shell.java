import java.util.*;

/* 希尔排序：间隔从 n/2 依次减半，组内做插入排序。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        for (int gap = n / 2; gap > 0; gap /= 2) { // @gap
            for (int i = gap; i < n; i++) {
                int saved = a[i]; // @save
                int j = i;
                while (j >= gap && a[j - gap] > saved) { // @compare
                    a[j] = a[j - gap]; // @shift
                    j -= gap;
                }
                a[j] = saved; // @place
            }
        }
        for (int x : a) System.out.print(x + " ");
        System.out.println(); // @done
    }
}

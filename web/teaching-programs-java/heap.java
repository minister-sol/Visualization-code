import java.util.*;

/* 大顶堆：操作码 1 插入（后随值）、2 删除堆顶；输出最终数组。 */
class Main {
    static int[] h = new int[20];
    static int size = 0;
    static void up(int i) { // @up
        while (i > 0) {
            int p = (i - 1) / 2;
            if (h[p] >= h[i]) break; // @compare
            int t = h[p]; h[p] = h[i]; h[i] = t;
            i = p;
        }
    }
    static void down(int i) { // @down
        while (true) {
            int l = 2 * i + 1, r = l + 1, big = i;
            if (l < size && h[l] > h[big]) big = l; // @check
            if (r < size && h[r] > h[big]) big = r;
            if (big == i) break;
            int t = h[i]; h[i] = h[big]; h[big] = t;
            i = big;
        }
    }
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int count = in.hasNextInt() ? in.nextInt() : 0;
        for (int op = 0; op < count; op++) {
            int type = in.nextInt();
            if (type == 1) { // @insert
                h[size++] = in.nextInt(); // @full
                up(size - 1);
            } else if (type == 2) {
                if (size == 0) continue; // @empty
                h[0] = h[--size]; // @remove
                down(0);
            }
        }
        for (int i = 0; i < size; i++) System.out.print(h[i] + " "); // @output
        System.out.println();
    }
}

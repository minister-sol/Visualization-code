import java.util.Scanner;

/* 数组插入与删除：槽位固定，对象身份不变。
   输入：n、n 个整数、操作数，随后每条 type index value（1 插入，2 删除）。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int[] a = new int[21]; // @start
        int n = in.nextInt();

        for (int i = 0; i < n; i++) {
            a[i] = in.nextInt();
        }

        int count = in.nextInt();
        for (int op = 0; op < count; op++) {
            int type = in.nextInt();
            int index = in.nextInt();
            int value = in.nextInt();

            if (type == 1 && n < 20 && index >= 0 && index <= n) {
                // 从右向左搬移，避免覆盖尚未移动的数据。
                for (int i = n; i > index; i--) {
                    a[i] = a[i - 1]; // @move
                }
                a[index] = value; // @insert
                n++;              // @size
            } else if (type == 2 && index >= 0 && index < n) {
                for (int i = index; i < n - 1; i++) {
                    a[i] = a[i + 1]; // @shift
                }
                n--;                 // @remove
            } else {
                System.exit(1);
            }
        }

        for (int i = 0; i < n; i++) {
            System.out.print(a[i] + " "); // @output
        }
        System.out.println();
    }
}

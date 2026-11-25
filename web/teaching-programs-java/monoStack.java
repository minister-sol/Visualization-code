import java.util.Scanner;

/* 单调栈：求每个位置右侧第一个严格更大的值。
   栈里只保留还没有找到答案的下标；当前值更大时弹出栈顶并立即记录答案。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[20];
        for (int i = 0; i < n; i++) {
            a[i] = in.nextInt();
        }

        int[] stack = new int[20];
        int count = 0;
        int[] result = new int[20]; // @1

        for (int i = 0; i < n; i++) { // @3
            // 栈顶值比当前值小，它的右侧首个更大值就是当前 a[i]。
            while (count > 0 && a[stack[count - 1]] < a[i]) {
                int j = stack[--count]; // @4
                result[j] = i + 1;      // @5
            }
            stack[count++] = i;         // @7
        }

        for (int i = 0; i < n; i++) { // @9
            if (result[i] != 0) {
                System.out.print(a[result[i] - 1] + " ");
            } else {
                System.out.print("_ ");
            }
        }
        System.out.println();
    }
}

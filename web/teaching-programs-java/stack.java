import java.util.Scanner;

/* 栈：后进先出；只移动栈顶指针 size，对象本身不搬移。
   输入：操作数，随后每条 type value（1 入栈，2 出栈）。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int[] stack = new int[50];
        int size = 0;
        int count = in.nextInt();

        for (int op = 0; op < count; op++) {
            int type = in.nextInt();
            int value = in.nextInt();
            if (type == 1 && size < 50) {
                stack[size] = value; // @push
                size++;              // @grow
            } else if (type == 2 && size > 0) {
                size--;              // @pop
            } else if (type == 1 || type == 2) {
                System.err.println("stack full or empty: operation ignored"); // @noop
            } else {
                System.exit(1);
            }
        }

        for (int i = 0; i < size; i++) {
            System.out.print(stack[i] + " "); // @output
        }
        System.out.println();
    }
}

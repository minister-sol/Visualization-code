import java.util.*;

/* 冒泡排序：相邻逆序交换，每轮末尾沉淀一个最大值。命令行参数为若干整数。 */
class Main {
    public static void main(String[] args) {
        int[] a = new int[args.length];
        for (int i = 0; i < args.length; i++) a[i] = Integer.parseInt(args[i]);
        for (int end = a.length - 1; end > 0; end--) { // @s1
            for (int j = 0; j < end; j++) { // @s2
                if (a[j] > a[j + 1]) { // @s3
                    int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; // @s4
                }
            } // @s5
        } // @s6
        for (int x : a) System.out.print(x + " "); // @s7
        System.out.println(); // @s8
    }
}

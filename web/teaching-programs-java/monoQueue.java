import java.util.*;

/* 单调队列：存下标，队首最大；窗口右移时移除过期下标和更小值。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt(); // @1
        int[] a = new int[n]; for (int i = 0; i < n; i++) a[i] = in.nextInt(); // @3
        int size = in.nextInt(); // @4
        Deque<Integer> q = new ArrayDeque<>(); // @5
        for (int i = 0; i < n; i++) { // @6
            while (!q.isEmpty() && q.peekFirst() <= i - size) q.pollFirst();
            while (!q.isEmpty() && a[q.peekLast()] <= a[i]) q.pollLast();
            q.addLast(i);
            if (i >= size - 1) System.out.print(a[q.peekFirst()] + (i + 1 < n ? " " : "")); // @8
        }
        System.out.println();
    }
}

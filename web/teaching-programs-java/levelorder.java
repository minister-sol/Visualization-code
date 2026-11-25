import java.util.*;

/* 层序遍历：FIFO 队列先入根，出队访问并把左右孩子入队。 */
class Main {
    static class Node { int val; Node left, right; Node(int v) { val = v; } }
    static Node[] nodes;
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt(); // @start
        nodes = new Node[n + 1];
        for (int i = 1; i <= n; i++) {
            String s = in.next();
            if (!s.equals("null") && !s.equals("#")) nodes[i] = new Node(Integer.parseInt(s));
        }
        for (int i = 1; i <= n; i++) if (nodes[i] != null) {
            nodes[i].left = 2 * i <= n ? nodes[2 * i] : null;
            nodes[i].right = 2 * i + 1 <= n ? nodes[2 * i + 1] : null;
        }
        if (n == 0) { System.out.println(); return; }
        if (nodes[1] == null) { System.out.println(); return; } // @root_check
        Queue<Node> q = new ArrayDeque<>();
        q.add(nodes[1]); // @enqueue_root
        while (!q.isEmpty()) { // @loop
            Node x = q.poll(); // @dequeue
            System.out.print(x.val + " "); // @output
            if (x.left != null) q.add(x.left); // @enqueue_left
            if (x.right != null) q.add(x.right); // @enqueue_right
        }
        System.out.println(); // @done
    }
}

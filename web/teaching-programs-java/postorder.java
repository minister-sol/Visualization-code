import java.util.*;

/* 后序遍历：左、右、根；适合先处理子树再汇总。 */
class Main {
    static class Node { int val; Node left, right; Node(int v) { val = v; } }
    static Node[] nodes;
    static void visit(Node n) {
        if (n == null) return; // @guard
        visit(n.left); // @left
        visit(n.right); // @right
        System.out.print(n.val + " "); // @output
    }
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
        visit(nodes[1]); // @enter
        System.out.println(); // @done
    }
}

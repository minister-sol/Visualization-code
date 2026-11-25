import java.util.*;

/* 二叉搜索树：插入、查找、删除；删除双子节点时用右子树最小值替换。 */
class Main {
    static class Node { int val; Node left, right; Node(int v) { val = v; } }
    static Node root;
    static Node insert(Node n, int v) {
        if (n == null) return new Node(v); // @create
        if (v < n.val) n.left = insert(n.left, v); // @compare_left
        else if (v > n.val) n.right = insert(n.right, v); // @compare_right
        else return n; // @duplicate
        return n;
    }
    static boolean find(Node n, int v) {
        if (n == null) return false; // @missing
        if (v == n.val) return true; // @find
        return v < n.val ? find(n.left, v) : find(n.right, v);
    }
    static Node delete(Node n, int v) {
        if (n == null) return null;
        if (v < n.val) n.left = delete(n.left, v); // @delete_compare_left
        else if (v > n.val) n.right = delete(n.right, v); // @delete_compare_right
        else {
            if (n.left == null) return n.right; // @return_right
            if (n.right == null) return n.left; // @return_left
            Node s = n.right; // @successor
            while (s.left != null) s = s.left; // @successor_left
            n.val = s.val; // @copy
            n.right = delete(n.right, s.val); // @unlink
        }
        return n;
    }
    static void output(Node n) {
        if (n == null) return;
        output(n.left);
        System.out.print(n.val + " "); // @output
        output(n.right);
    }
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int count = in.nextInt();
        for (int i = 0; i < count; i++) {
            int type = in.nextInt(), v = in.nextInt();
            if (type == 1) root = insert(root, v); // @insert_root
            else if (type == 2) System.out.println("F" + (find(root, v) ? 1 : 0)); // @find_result
            else root = delete(root, v); // @delete_root
        }
        output(root); // @done
        System.out.println();
    }
}

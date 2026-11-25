import java.util.*;

/* AVL 树：插入后按高度差做 LL/RR/LR/RL 旋转，节点编号按创建顺序保留。 */
class Main {
    static class Node { int id, key, h = 1; Node left, right; Node(int id, int key) { this.id = id; this.key = key; } }
    static int nextId = 1;
    static int h(Node n) { return n == null ? 0 : n.h; }
    static void fix(Node n) { n.h = 1 + Math.max(h(n.left), h(n.right)); }
    static Node rotateRight(Node y) { // @rotateRightLink
        Node x = y.left; y.left = x.right; x.right = y;
        fix(y); fix(x); // @rotateRightHeight
        return x;
    }
    static Node rotateLeft(Node x) { // @rotateLeftLink
        Node y = x.right; x.right = y.left; y.left = x;
        fix(x); fix(y); // @rotateLeftHeight
        return y;
    }
    static Node balance(Node n) { // @balance
        fix(n);
        int b = h(n.left) - h(n.right);
        if (b > 1) { // @ll
            if (h(n.left.left) >= h(n.left.right)) return rotateRight(n);
            n.left = rotateLeft(n.left); // @leftRight
            return rotateRight(n);
        }
        if (b < -1) { // @rr
            if (h(n.right.right) >= h(n.right.left)) return rotateLeft(n);
            n.right = rotateRight(n.right); // @rightLeft
            return rotateLeft(n);
        }
        return n;
    }
    static Node insert(Node n, int key) {
        if (n == null) return new Node(nextId++, key); // @create
        if (key < n.key) n.left = insert(n.left, key); // @goLeft
        else if (key > n.key) n.right = insert(n.right, key); // @goRight
        else return n; // @duplicate
        return balance(n);
    }
    static void inorder(Node n, List<Integer> out) { if (n == null) return; inorder(n.left, out); out.add(n.key); inorder(n.right, out); }
    static List<Node> all = new ArrayList<>();
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String s = in.hasNextLine() ? in.nextLine().trim() : ""; // @init
        Node root = null;
        if (!s.isEmpty()) for (String p : s.split("[,，\\s]+")) root = insert(root, Integer.parseInt(p)); // @rootUpdate
        List<Integer> order = new ArrayList<>(); inorder(root, order);
        StringBuilder sb = new StringBuilder("order");
        for (int x : order) sb.append(' ').append(x);
        System.out.println(sb);
        System.out.println("height " + h(root));
        System.out.println("root " + (root == null ? 0 : root.id));
        collect(root);
        all.sort(Comparator.comparingInt(n -> n.id)); // @done
        for (Node n : all) System.out.println("node " + n.id + " " + n.key + " " + n.h + " " + (n.left == null ? 0 : n.left.id) + " " + (n.right == null ? 0 : n.right.id));
    }
    static void collect(Node n) { if (n == null) return; all.add(n); collect(n.left); collect(n.right); }
}

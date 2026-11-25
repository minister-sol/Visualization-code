import java.util.*;

/* 左倾红黑树：红链接左倾，插入后旋转与颜色翻转修复，根恒黑。 */
class Main {
    static class Node { int id, key, left, right; boolean red; Node(int id, int key) { this.id = id; this.key = key; this.red = true; } }
    static Node[] pool = new Node[64];
    static int nextId = 1, root;
    static boolean red(int i) { return i != 0 && pool[i - 1].red; }
    static Node get(int i) { return i == 0 ? null : pool[i - 1]; }
    static int rotateLeft(int h) { // @leftRot
        Node x = pool[h - 1], y = get(x.right);
        x.right = y.left; y.left = h;
        y.red = x.red; x.red = true;
        pool[y.id - 1] = y; pool[x.id - 1] = x;
        return y.id;
    }
    static int rotateRight(int h) { // @rightRot
        Node x = pool[h - 1], y = get(x.left);
        x.left = y.right; y.right = h;
        y.red = x.red; x.red = true;
        pool[y.id - 1] = y; pool[x.id - 1] = x;
        return y.id;
    }
    static void flip(int h) { // @flip
        Node x = pool[h - 1];
        x.red = !x.red;
        if (x.left != 0) pool[x.left - 1].red = !pool[x.left - 1].red;
        if (x.right != 0) pool[x.right - 1].red = !pool[x.right - 1].red;
    }
    static int insert(int h, int key) {
        if (h == 0) { Node n = new Node(nextId, key); pool[nextId - 1] = n; return nextId++; } // @create
        Node x = pool[h - 1];
        if (key < x.key) x.left = insert(x.left, key); // @goLeft
        else if (key > x.key) x.right = insert(x.right, key); // @goRight
        else return h; // @duplicate
        if (red(x.right) && !red(x.left)) h = rotateLeft(h);
        if (red(x.left) && red(get(x.left).left)) h = rotateRight(h);
        if (red(x.left) && red(x.right)) flip(h);
        return h;
    }
    static void inorder(int i, List<Integer> out) { if (i == 0) return; Node n = pool[i - 1]; inorder(n.left, out); out.add(n.key); inorder(n.right, out); }
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String s = in.hasNextLine() ? in.nextLine().trim() : ""; // @init
        if (!s.isEmpty()) for (String p : s.split("[,，\\s]+")) root = insert(root, Integer.parseInt(p));
        if (root != 0) pool[root - 1].red = false; // @rootBlack
        List<Integer> order = new ArrayList<>(); inorder(root, order);
        StringBuilder sb = new StringBuilder("order");
        for (int x : order) sb.append(' ').append(x);
        System.out.println(sb);
        System.out.println("root " + (root == 0 ? 0 : pool[root - 1].key)); // @done
        for (int i = 1; i < nextId; i++) {
            Node n = pool[i - 1];
            System.out.println("node " + n.id + " " + n.key + " " + n.left + " " + n.right + " " + (n.red ? "red" : "black"));
        }
    }
}

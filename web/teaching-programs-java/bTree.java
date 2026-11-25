import java.util.*;

/* B 树（t=2，每个节点最多 3 键）：根满时长新根，满孩子先分裂并把中间键提升。 */
class Main {
    static class N { int id; List<Integer> keys = new ArrayList<>(); List<Integer> kids = new ArrayList<>(); N(int i) { id = i; } }
    static List<N> pool = new ArrayList<>();
    static int nextId = 1;
    static N node(int id) { return pool.get(id - 1); }
    static int newId() { N n = new N(nextId++); pool.add(n); return n.id; }
    static boolean contains(int id, int v) {
        N n = node(id);
        int i = 0;
        while (i < n.keys.size() && v > n.keys.get(i)) i++;
        if (i < n.keys.size() && n.keys.get(i) == v) return true; // @duplicate
        return n.kids.isEmpty() ? false : contains(n.kids.get(i), v);
    }
    static void split(int parentId, int idx) {
        N p = node(parentId), f = node(p.kids.get(idx));
        int right = newId(); N r = node(right);
        int j = 2; // @splitRight
        while (j < f.keys.size()) r.keys.add(f.keys.remove(j++));
        int oldKids = f.kids.size();
        j = 2;
        while (j < oldKids) r.kids.add(f.kids.remove(j++)); // @splitRight
        int middle = f.keys.remove(f.keys.size() - 1); // @splitMiddle
        p.keys.add(idx, middle);
        p.kids.add(idx + 1, right); // @splitPromote
    }
    static void insertNonFull(int id, int v) {
        N n = node(id);
        int i = n.keys.size() - 1; // @locate
        if (n.kids.isEmpty()) {
            while (i >= 0 && v < n.keys.get(i)) i--;
            n.keys.add(i + 1, v); // @leafInsert
            return;
        }
        while (i >= 0 && v < n.keys.get(i)) i--;
        i++; // @chooseChild
        if (node(n.kids.get(i)).keys.size() == 3) {
            split(id, i);
            if (v > n.keys.get(i)) i++; // @afterSplit
        }
        insertNonFull(n.kids.get(i), v);
    }
    static void inorder(int id, List<Integer> out) {
        N n = node(id);
        for (int i = 0; i < n.keys.size(); i++) {
            if (!n.kids.isEmpty()) inorder(n.kids.get(i), out);
            out.add(n.keys.get(i));
        }
        if (!n.kids.isEmpty()) inorder(n.kids.get(n.kids.size() - 1), out);
    }
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String s = in.hasNextLine() ? in.nextLine().trim() : "";
        int root = newId(); // @init
        if (!s.isEmpty()) for (String t : s.split("[,，\\s]+")) {
            int v = Integer.parseInt(t);
            if (contains(root, v)) continue;
            if (node(root).keys.size() == 3) {
                int old = root;
                root = newId(); // @newRoot
                node(root).kids.add(old);
                split(root, 0);
            }
            insertNonFull(root, v); // @inserted
        }
        List<Integer> order = new ArrayList<>(); inorder(root, order);
        StringBuilder sb = new StringBuilder("order");
        for (int x : order) sb.append(' ').append(x);
        System.out.println(sb);
        System.out.println("root " + root);
        for (int id = 1; id < nextId; id++) { // @done
            N n = node(id);
            sb = new StringBuilder("node " + id + " keys");
            for (int x : n.keys) sb.append(' ').append(x);
            sb.append(" children");
            for (int c : n.kids) sb.append(' ').append(c);
            System.out.println(sb);
        }
    }
}

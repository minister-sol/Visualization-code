import java.util.*;

/* 哈夫曼编码：按频率取两个最小节点合并，同频按创建编号；左 0 右 1。 */
class Main {
    static class Node {
        int freq, id; char ch; Node left, right;
        Node(int f, int i, char c) { freq = f; id = i; ch = c; }
    }
    static Map<Character, String> codes = new TreeMap<>();
    static void encode(Node n, String path) {
        if (n.left == null && n.right == null) { codes.put(n.ch, path); return; } // @codeLeaf
        encode(n.left, path + "0");
        encode(n.right, path + "1");
    }
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String text = in.hasNextLine() ? in.nextLine() : ""; // @init
        Map<Character, Integer> freq = new LinkedHashMap<>();
        for (char c : text.toCharArray()) freq.put(c, freq.getOrDefault(c, 0) + 1);
        PriorityQueue<Node> pq = new PriorityQueue<>((x, y) -> x.freq != y.freq ? x.freq - y.freq : x.id - y.id); // @sort
        int id = 0;
        for (Map.Entry<Character, Integer> e : freq.entrySet()) pq.add(new Node(e.getValue(), id++, e.getKey()));
        while (pq.size() > 1) { // @take
            Node a = pq.poll(), b = pq.poll();
            Node p = new Node(a.freq + b.freq, id++, '\0'); // @merge
            p.left = a; p.right = b; pq.add(p);
        }
        if (!pq.isEmpty()) encode(pq.poll(), "");
        for (Map.Entry<Character, String> e : codes.entrySet()) if (e.getValue().isEmpty()) e.setValue("0");
        StringBuilder enc = new StringBuilder("encoded");
        for (char c : text.toCharArray()) enc.append(' ').append(codes.get(c)); // @result
        System.out.println(enc);
        for (Map.Entry<Character, String> e : codes.entrySet()) System.out.println("code " + (int) e.getKey() + " " + e.getValue());
    }
}

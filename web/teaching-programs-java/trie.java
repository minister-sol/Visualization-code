import java.io.*;
import java.util.*;

/* Trie：插入沿字符建节点，search 要求词尾标记，prefix 只要求路径存在。 */
class Main {
    static class Node { Map<Character,Node> next = new HashMap<>(); boolean end; }
    static Node root = new Node();
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim(); if (line.isEmpty()) continue;
            String[] p = line.split("\\s+"); // @operation
            if (p[0].equals("insert")) { // @create
                Node n = root;
                for (char c : p[1].toCharArray()) { // @advance
                    n.next.putIfAbsent(c, new Node()); // @create
                    n = n.next.get(c);
                }
                n.end = true; // @mark
            } else {
                Node n = root; boolean ok = true;
                for (char c : p[1].toCharArray()) { // @advance
                    if (!n.next.containsKey(c)) { ok = false; break; } // @miss
                    n = n.next.get(c);
                }
                if (p[0].equals("search")) ok &= n.end; // @mark
                System.out.println(ok ? 1 : 0); // @result
            }
        } // @done
    }
}

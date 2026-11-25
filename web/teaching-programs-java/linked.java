import java.util.Scanner;

/* 单链表：虚拟头 dummy 统一插删；反转只改 next，不交换节点值。
   输入：n、n 个初值、操作数，随后每条 type index value（1 插入，2 删除，3 反转）。 */
class Main {
    static class Node {
        int value;
        Node next;
        Node(int value) { this.value = value; }
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        Node dummy = new Node(0);
        Node tail = dummy;
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            Node node = new Node(in.nextInt());
            tail.next = node;
            tail = node;
        }
        int count = in.nextInt();

        for (int op = 0; op < count; op++) {
            int type = in.nextInt();
            int index = in.nextInt();
            int value = in.nextInt();

            if (type == 3) {
                Node prev = null;
                Node curr = dummy.next; // @reverse_start
                while (curr != null) {
                    Node next = curr.next;  // @save
                    curr.next = prev;       // @reverse_link
                    prev = curr;            // 前驱前移，保持已反转前缀
                    curr = next;            // @reverse_move
                }
                dummy.next = prev;          // @head
            } else if ((type == 1 && n < 20 && index >= 0 && index <= n)
                    || (type == 2 && index >= 0 && index < n)) {
                Node prev = dummy;          // @predecessor
                for (int i = 0; i < index; i++) {
                    prev = prev.next;       // @walk
                }
                if (type == 1) {
                    Node node = new Node(value);
                    node.next = prev.next;  // @allocate
                    prev.next = node;       // @insert
                    n++;
                } else {
                    Node removed = prev.next;
                    prev.next = removed.next; // @detach
                    removed.next = null;      // @release
                    n--;
                }
            } else {
                System.exit(1);
            }
        }

        for (Node node = dummy.next; node != null; node = node.next) {
            System.out.print(node.value + " "); // @output
        }
        System.out.println();
    }
}

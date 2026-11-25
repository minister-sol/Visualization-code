import java.util.Scanner;

/* 循环队列：用固定槽位保存数据，head 与 size 决定逻辑队首和队尾。
   输入：capacity、操作数，随后每条 type value（1 入队，2 出队）。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int[] slots = new int[20];
        int capacity = in.nextInt();
        int count = in.nextInt();

        int head = 0;
        int size = 0;
        for (int op = 0; op < count; op++) {
            int type = in.nextInt();
            int value = in.nextInt();

            if (type == 1 && size < capacity) {
                int tail = (head + size) % capacity; // @tail
                slots[tail] = value;                 // @enqueue
                size++;                              // @grow
            } else if (type == 2 && size > 0) {
                slots[head] = 0;                            // 清空队头，便于观察空槽
                head = (head + 1) % capacity;               // @advance
                size--;                                     // @dequeue
            } else if (type == 1 || type == 2) {
                System.err.println("queue full or empty: operation ignored"); // @noop
            } else {
                System.exit(1);
            }
        }

        // 逻辑队列按 FIFO 输出；物理槽位不会整体搬移。
        for (int i = 0; i < size; i++) {
            System.out.print(slots[(head + i) % capacity] + " "); // @output
        }
        System.out.println();
    }
}

import java.util.Scanner;

/* 链地址哈希：每个桶保存一个键序列；插入不重复，删除保持桶内顺序。
   输入：首行 capacity，随后每行 action key（insert / find / delete）。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String head = in.next();
        int capacity = in.nextInt(); // capacity 关键字已读取
        int[][] buckets = new int[20][49];
        int[] lengths = new int[20]; // @init

        while (in.hasNext()) {
            String action = in.next();
            int key = in.nextInt();
            int bucket = ((key % capacity) + capacity) % capacity; // @bucket
            int index = -1;

            for (int j = 0; j < lengths[bucket]; j++) {
                if (buckets[bucket][j] == key) { // @compare
                    index = j;
                    break;
                }
            }

            if ("insert".equals(action) && index < 0) {
                buckets[bucket][lengths[bucket]++] = key; // @insert
            } else if ("delete".equals(action) && index >= 0) {
                for (int j = index; j + 1 < lengths[bucket]; j++) {
                    buckets[bucket][j] = buckets[bucket][j + 1];
                }
                lengths[bucket]--; // @delete
            } else if ("find".equals(action)) {
                System.out.println(index >= 0 ? 1 : 0); // @result
            } else if (!"insert".equals(action) && !"delete".equals(action)) {
                System.exit(1);
            }
        }
    }
}

import java.io.*;

/* 线性探测哈希：冲突向右找空槽，删除留墓碑；集合语义不插重复值。 */
class Main {
    static int capacity;
    static int[] table;
    static boolean[] used, tomb;
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String first = br.readLine(); // @init
        capacity = Integer.parseInt(first.trim().split("\\s+")[1]);
        table = new int[capacity]; used = new boolean[capacity]; tomb = new boolean[capacity];
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim(); if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            int key = Integer.parseInt(p[1]), pos = ((key % capacity) + capacity) % capacity;
            if (p[0].equals("insert")) { // @insert
                int start = pos;
                do {
                    if (!used[pos] || tomb[pos]) { // @empty
                        if (tomb[pos]) { table[pos] = key; used[pos] = true; tomb[pos] = false; }
                        else { table[pos] = key; used[pos] = true; }
                        break;
                    }
                    if (used[pos] && !tomb[pos] && table[pos] == key) break; // @match
                    pos = (pos + 1) % capacity; // @probe
                } while (pos != start);
            } else if (p[0].equals("delete")) { // @delete
                int start = pos;
                while (used[pos]) { // @start
                    if (!tomb[pos] && table[pos] == key) { tomb[pos] = true; break; } // @tombstone
                    pos = (pos + 1) % capacity; if (pos == start) break;
                }
            } else if (p[0].equals("find")) { // @result
                int start = pos; boolean found = false;
                while (used[pos]) {
                    if (!tomb[pos] && table[pos] == key) { found = true; break; }
                    pos = (pos + 1) % capacity; if (pos == start) break;
                }
                System.out.println(found ? 1 : 0);
            }
        } // @done
    }
}

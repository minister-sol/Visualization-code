import java.util.*;

/* 全排列回溯：重复值先排序，同一层跳过已用过的相同值，避免重复方案。 */
class Main {
    static int[] a;
    static boolean[] used;
    static StringBuilder line;
    static int count;
    static void dfs(int depth) {
        if (depth == a.length) { // @found
            System.out.println("perm " + line.toString().trim()); // @result
            count++;
            return;
        }
        for (int i = 0; i < a.length; i++) { // @choose
            if (used[i]) continue;
            if (i > 0 && a[i] == a[i - 1] && !used[i - 1]) continue;
            used[i] = true; line.append(a[i]).append(' ');
            dfs(depth + 1);
            used[i] = false; line.setLength(line.length() - String.valueOf(a[i]).length() - 1); // @undo
        }
    }
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String s = in.hasNextLine() ? in.nextLine().trim() : ""; // @init
        a = s.isEmpty() ? new int[0] : Arrays.stream(s.split("[,，\\s]+")).mapToInt(Integer::parseInt).toArray();
        Arrays.sort(a);
        used = new boolean[a.length];
        line = new StringBuilder();
        System.out.println("perms " + uniqueCount()); // @init
        dfs(0);
    }
    static int uniqueCount() {
        int total = fact(a.length), denom = 1, run = 1;
        for (int i = 1; i <= a.length; i++) {
            if (i < a.length && a[i] == a[i - 1]) run++;
            else { denom *= fact(run); run = 1; }
        }
        return total / denom;
    }
    static int fact(int n) { int r = 1; for (int i = 2; i <= n; i++) r *= i; return r; }
}

import java.util.*;

/* N 皇后：逐行放置，检查列与两条斜线；0 行棋盘有一个空方案。 */
class Main {
    static int n, count;
    static int[] cols;
    static List<int[]> solutions = new ArrayList<>();
    static boolean safe(int row, int col) { // @check
        for (int r = 0; r < row; r++) if (cols[r] == col || Math.abs(cols[r] - col) == row - r) return false;
        return true;
    }
    static void dfs(int row) {
        if (row == n) { count++; solutions.add(cols.clone()); return; } // @found
        for (int c = 0; c < n; c++) if (safe(row, c)) { // @place
            cols[row] = c;
            dfs(row + 1); // @undo
        }
    }
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        n = in.hasNextInt() ? in.nextInt() : 0; // @init
        cols = new int[n];
        dfs(0);
        System.out.println("solutions " + count); // @result
        for (int i = 0; i < solutions.size(); i++) {
            StringBuilder sb = new StringBuilder("queen");
            for (int c : solutions.get(i)) sb.append(' ').append(c);
            System.out.println(sb);
        }
    }
}

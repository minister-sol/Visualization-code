import java.util.*;

/* 二叉树最近公共祖先：按层序数组索引建树，后序递归返回目标节点或空。 */
class Main {
    static int[] val;
    static int p, q, result;
    static int dfs(int i) {
        if (i >= val.length || val[i] == Integer.MIN_VALUE) return -1;
        if (i == p || i == q) return i; // @target
        int l = dfs(2 * i + 1); // @leftReturn
        int r = dfs(2 * i + 2); // @rightReturn
        if (l != -1 && r != -1) { result = i; return i; } // @ancestor
        return l != -1 ? l : r; // @return
    }
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String line = in.nextLine().trim(); // @init
        String[] parts = line.isEmpty() ? new String[0] : line.split("[,，\\s]+");
        val = new int[parts.length];
        for (int i = 0; i < parts.length; i++) val[i] = parts[i].equals("null") || parts[i].equals("#") ? Integer.MIN_VALUE : Integer.parseInt(parts[i]);
        String[] qp = in.nextLine().trim().split("\\s+");
        p = Integer.parseInt(qp[1]); q = Integer.parseInt(qp[2]);
        dfs(0);
        System.out.println("result " + result); // @result
        System.out.println("value " + val[result]);
    }
}

import java.util.*;

/* 回文中心扩展：依次以单字符和双字符为中心向两侧扩展，保留最早发现的最长串。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String s = in.hasNextLine() ? in.nextLine() : ""; // @start
        int bestL = 0, bestR = -1;
        for (int c = 0; c < s.length(); c++) { // @center
            for (int[] p : new int[][]{{c, c}, {c, c + 1}}) { // @equal
                int l = p[0], r = p[1];
                while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { l--; r++; } // @expand
                if (r - l - 1 > bestR - bestL + 1) { bestL = l + 1; bestR = r - 1; } // @update
            }
        }
        System.out.println(s.substring(bestL, bestR + 1)); // @done
    }
}

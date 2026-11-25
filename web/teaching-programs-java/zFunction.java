import java.util.*;

/* Z 函数：Z[0]=0，维护最右匹配区间 [l,r)，复用区间内已知 Z 值再扩展。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String s = in.hasNextLine() ? in.nextLine() : ""; // @start
        int n = s.length();
        int[] z = new int[n];
        int l = 0, r = 0;
        for (int i = 1; i < n; i++) {
            if (i < r) z[i] = Math.min(r - i, z[i - l]); // @reuse
            while (i + z[i] < n && s.charAt(z[i]) == s.charAt(i + z[i])) z[i]++; // @compare
            if (i + z[i] > r) { l = i; r = i + z[i]; } // @interval
        }
        for (int i = 0; i < n; i++) { if (i > 0) System.out.print(' '); System.out.print(z[i]); } // @done
        System.out.println(); // @increment
    }
}

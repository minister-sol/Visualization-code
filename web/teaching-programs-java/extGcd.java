import java.util.*;

/* 扩展欧几里得：递归求 gcd 与贝祖系数 x、y，满足 ax+by=gcd。 */
class Main {
    static long[] egcd(long a, long b) { // @init
        if (b == 0) return new long[]{a, 1, 0};
        long[] t = egcd(b, a % b); // @quotient
        long q = a / b;
        return new long[]{t[0], t[2], t[1] - q * t[2]}; // @updateRemainder
    }
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        long a = in.nextLong(), b = in.nextLong();
        long[] r = egcd(a, b);
        System.out.println("gcd " + r[0]); // @updateX
        System.out.println("x " + r[1]); // @updateY
        System.out.println("y " + r[2]); // @result
    }
}

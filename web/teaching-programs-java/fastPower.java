import java.util.*;

/* 快速幂：指数为奇数时乘入结果，底数平方、指数减半；所有乘法取模。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        long base = in.nextLong(), exp = in.nextLong(), mod = in.nextLong(); // @init
        base = ((base % mod) + mod) % mod;
        long result = 1 % mod;
        while (exp > 0) {
            if ((exp & 1) == 1) result = result * base % mod; // @multiply
            base = base * base % mod; // @square
            exp >>= 1; // @halve
        }
        System.out.println("result " + result); // @result
    }
}

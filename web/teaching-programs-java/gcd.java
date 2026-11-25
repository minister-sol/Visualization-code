import java.util.*;

/* 欧几里得算法：反复取余，余数为 0 时除数即 gcd。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int a = Math.abs(in.nextInt()), b = Math.abs(in.nextInt()); // @init
        while (b != 0) { // @remainder
            int r = a % b;
            a = b; // @updateA
            b = r; // @updateB
        }
        System.out.println("result " + a); // @result
    }
}

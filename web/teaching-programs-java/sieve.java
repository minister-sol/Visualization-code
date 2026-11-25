import java.util.*;

/* 埃氏筛：0/1 先标记非素数，从 2 起把倍数标记为合数。 */
class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.hasNextInt() ? in.nextInt() : 0; // @init
        boolean[] prime = new boolean[Math.max(2, n + 1)];
        Arrays.fill(prime, true); // @checkPrime
        if (n >= 0) prime[0] = false; // @zeroMark
        if (n >= 1) prime[1] = false; // @oneMark
        for (int p = 2; p * p <= n; p++) if (prime[p]) for (int m = p * p; m <= n; m += p) prime[m] = false; // @exclude
        StringBuilder sb = new StringBuilder("primes");
        for (int i = 2; i <= n; i++) if (prime[i]) sb.append(' ').append(i); // @result
        System.out.println(sb);
    }
}

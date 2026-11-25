import java.util.*;

/* 分数背包：按单位价值降序取整件，最后一件按剩余容量取分数；全程用整数分数。 */
class Main {
    static class Item { int w, v, id; Item(int w, int v, int id) { this.w = w; this.v = v; this.id = id; } }
    static int gcd(int a, int b) { while (b != 0) { int t = a % b; a = b; b = t; } return Math.abs(a); }
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        in.next();
        int cap = in.nextInt(); // @init
        List<Item> items = new ArrayList<>();
        int id = 0;
        while (in.hasNext()) {
            if (!in.next().equals("item")) break;
            items.add(new Item(in.nextInt(), in.nextInt(), id++)); // @init
        }
        items.sort((a, b) -> Long.compare((long) b.v * a.w, (long) a.v * b.w)); // @sort
        int rem = cap;
        long num = 0, den = 1;
        for (Item it : items) { // @full
            if (rem <= 0) break;
            if (it.w <= rem) { // @take
                System.out.println("choice " + it.id + " " + it.w); // @record
                num += (long) it.v * den;
                rem -= it.w;
            } else { // @fraction
                System.out.println("choice " + it.id + " " + rem);
                num = num * it.w + (long) it.v * rem * den;
                den *= it.w; // @reduce
                rem = 0;
            }
            int g = gcd((int) Math.abs(num), (int) den);
            if (g > 1) { num /= g; den /= g; }
        }
        System.out.println("value " + num + "/" + den); // @remaining
        System.out.println("remaining " + rem); // @result
    }
}

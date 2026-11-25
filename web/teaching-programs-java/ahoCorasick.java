import java.util.*;

/* Aho–Corasick：建 Trie、按 BFS 建立失败链接、扫描文本；输出“模式编号:起点”，同一终点按模式加入顺序。 */
class Main {
    static final int MAXN = 81, MAXP = 8, MAXO = 8;
    static int[][] next = new int[MAXN][26], chars = new int[MAXN][26];
    static int[] count = new int[MAXN], fail = new int[MAXN], out = new int[MAXN * MAXO], outSize = new int[MAXN];
    static int used = 1, found = 0;
    static int[] hitPattern = new int[400], hitStart = new int[400];

    public static void main(String[] args) {
        if (args.length < 2 || args.length > 10 || args[0].length() > 50) return; // @init
        for (int i = 1; i < args.length; i++) { // @operation
            String p = args[i];
            if (p.isEmpty() || p.length() > 10) return;
            for (int j = 0; j < p.length(); j++) if (p.charAt(j) < 'a' || p.charAt(j) > 'z') return;
            int state = 0;
            for (int j = 0; j < p.length(); j++) { // @advance
                int ch = p.charAt(j) - 'a';
                if (next[state][ch] == 0) { next[state][ch] = used++; chars[state][count[state]++] = ch; }
                state = next[state][ch];
            }
            out[state * MAXO + outSize[state]++] = i - 1; // @mark
        }
        int[] queue = new int[MAXN]; int head = 0, tail = 0; // @result
        for (int k = 0; k < count[0]; k++) queue[tail++] = next[0][chars[0][k]];
        while (head < tail) {
            int v = queue[head++];
            for (int k = 0; k < count[v]; k++) { // @done
                int ch = chars[v][k], u = next[v][ch], f = fail[v];
                while (f != 0 && next[f][ch] == 0) f = fail[f];
                fail[u] = next[f][ch];
                for (int j = 0; j < outSize[fail[u]]; j++) out[u * MAXO + outSize[u]++] = out[fail[u] * MAXO + j];
                queue[tail++] = u;
            }
        }
        int state = 0;
        for (int i = 0; i < args[0].length(); i++) { // @scan
            int ch = args[0].charAt(i) - 'a';
            while (state != 0 && next[state][ch] == 0) state = fail[state];
            state = next[state][ch];
            for (int j = 0; j < outSize[state]; j++) {
                int id = out[state * MAXO + j];
                hitPattern[found] = id; hitStart[found++] = i - args[id + 1].length() + 1;
            }
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < found; i++) { // @output
            if (i > 0) sb.append(' ');
            sb.append(hitPattern[i]).append(':').append(hitStart[i]);
        }
        System.out.println(sb);
    }
}

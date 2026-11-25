"""Build or verify the allowlisted static CodeLens site; never overwrites an existing directory."""
import argparse, hashlib, json, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
FILES = ('index.html','classic.css','classic-advanced.css','c-standard-library.js','c-standard-library-remaining.js','c-standard-library-guide.js','classic-catalog.js','classic-core.js','classic-advanced.js','classic-extra.js','classic-range.js','classic-range-data.js','classic-range-teaching.js','classic-math.js','classic-graph2.js','classic-trees-dp.js','classic-misc.js','classic-flow.js','classic-strings.js','classic-dp-batch.js','classic-greedy.js','classic-advanced-bridge.js','classic-app.js','classic-r1.js','classic-r3-preparation.js','classic-r3-motion.js','classic-r3-integration.js','classic-traversals-preparation.js','classic-traversals-integration.js','classic-bubble-ac-preparation.js','classic-bubble-ac-adapter.js','classic-bubble-ac-integration.js','classic-sort-search-data.js','classic-sort-search.js','classic-sort-search-integration.js','classic-sort-search-teaching.js','classic-scan-data.js','classic-scan.js','classic-trie-data.js','classic-trie-teaching.js','classic-hash-data.js','classic-hash-teaching.js','classic-union-find-data.js','classic-union-find-teaching.js','classic-greedy-data.js','classic-greedy-teaching.js','classic-select-sort-data.js','classic-select-sort-teaching.js','classic-strings-data.js','classic-strings-teaching.js','classic-graph-data.js','classic-graph-teaching.js','classic-wgraph-data.js','classic-wgraph-teaching.js','classic-graph2-data.js','classic-graph2-teaching.js','classic-trees-data.js','classic-trees-teaching.js','classic-dp-data.js','classic-math-data.js','classic-backtrack-data.js','classic-final-data.js','classic-dp-teaching.js','classic-math-teaching.js','classic-backtrack-teaching.js','classic-final-teaching.js','classic-java-data.js','classic-ux17.js','classic-background.js')
def digest(data): return hashlib.sha256(data).hexdigest()
def verify(directory):
    directory = directory.resolve(strict=True)
    if not directory.is_dir(): raise ValueError('目标不是目录')
    names = {p.name for p in directory.iterdir()}
    expected = set(FILES) | {'MANIFEST.json'}
    if names != expected: raise ValueError(f'文件清单不匹配：缺少 {sorted(expected-names)}，多出 {sorted(names-expected)}')
    for name in expected:
        path=directory/name
        if path.is_symlink() or not path.is_file(): raise ValueError(f'不是普通文件：{name}')
    manifest=json.loads((directory/'MANIFEST.json').read_text(encoding='utf-8'))
    if manifest.get('format') != 1 or set(manifest.get('files',{})) != set(FILES): raise ValueError('清单格式或文件项无效')
    for name in FILES:
        if digest((directory/name).read_bytes()) != manifest['files'][name]: raise ValueError(f'哈希不匹配：{name}')
    html=(directory/'index.html').read_text(encoding='utf-8-sig')
    refs=re.findall(r'<script\s+[^>]*src="([^"]+)"|<link\s+[^>]*href="([^"]+)"',html)
    assets=[a or b for a,b in refs]
    if set(assets) != set(FILES)-{'index.html'}: raise ValueError(f'页面资源引用不匹配：{assets}')
    for name in FILES:
        if name.endswith('.js'):
            source=(directory/name).read_text(encoding='utf-8-sig')
            if re.search(r'\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(', source): raise ValueError(f'发现网络调用：{name}')
            if re.search(r'\beval\s*\(|\bnew\s+Function\s*\(', source): raise ValueError(f'发现动态源码执行：{name}')
    print(f'静态产物验证通过：{len(FILES)} 个文件及 MANIFEST.json；无旧服务或网络调用。')
def main():
    parser=argparse.ArgumentParser(); group=parser.add_mutually_exclusive_group(required=True); group.add_argument('--output',type=Path);group.add_argument('--verify',type=Path);args=parser.parse_args()
    try:
        if args.verify: verify(args.verify);return 0
        source=ROOT/'web'; blobs={name:(source/name).read_bytes() for name in FILES}
        target=args.output.resolve();target.mkdir(parents=True,exist_ok=False)
        for name,data in blobs.items():(target/name).write_bytes(data)
        manifest={'format':1,'files':{name:digest(blobs[name]) for name in sorted(FILES)}}
        (target/'MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2,sort_keys=True)+'\n',encoding='utf-8',newline='\n')
        verify(target); print(f'目录：{target}');return 0
    except (OSError,ValueError,json.JSONDecodeError) as error: print(f'静态产物失败：{error}',file=sys.stderr);return 1
if __name__=='__main__':sys.exit(main())

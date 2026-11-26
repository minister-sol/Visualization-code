"""Build or verify the allowlisted static CodeLens site; never overwrites an existing directory."""
import argparse, hashlib, json, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def asset_files(index):
    html = index.read_text(encoding='utf-8-sig')
    refs = re.findall(r'<script\s+[^>]*src="([^"]+)"|<link\s+[^>]*href="([^"]+)"', html)
    assets = [src or href for src, href in refs]
    if not assets or any(not re.fullmatch(r'[a-zA-Z0-9_-]+\.(js|css)', name) for name in assets):
        raise ValueError('页面资源必须为同目录下的 JS 或 CSS 文件')
    return ('index.html', *dict.fromkeys(assets))

def digest(data): return hashlib.sha256(data).hexdigest()
def verify(directory):
    directory = directory.resolve(strict=True)
    if not directory.is_dir(): raise ValueError('目标不是目录')
    files = asset_files(ROOT / 'web' / 'index.html')
    if set(asset_files(directory / 'index.html')) != set(files):
        raise ValueError('页面资源引用与源页面不一致')
    names = {p.name for p in directory.iterdir()}
    expected = set(files) | {'MANIFEST.json'}
    if names != expected: raise ValueError(f'文件清单不匹配：缺少 {sorted(expected-names)}，多出 {sorted(names-expected)}')
    for name in expected:
        path=directory/name
        if path.is_symlink() or not path.is_file(): raise ValueError(f'不是普通文件：{name}')
    manifest=json.loads((directory/'MANIFEST.json').read_text(encoding='utf-8'))
    if manifest.get('format') != 1 or set(manifest.get('files',{})) != set(files): raise ValueError('清单格式或文件项无效')
    for name in files:
        if digest((directory/name).read_bytes()) != manifest['files'][name]: raise ValueError(f'哈希不匹配：{name}')
    for name in files:
        if name.endswith('.js'):
            source=(directory/name).read_text(encoding='utf-8-sig')
            if re.search(r'\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(', source): raise ValueError(f'发现网络调用：{name}')
            if re.search(r'\beval\s*\(|\bnew\s+Function\s*\(', source): raise ValueError(f'发现动态源码执行：{name}')
    print(f'静态产物验证通过：{len(files)} 个文件及 MANIFEST.json；无旧服务或网络调用。')
def main():
    parser=argparse.ArgumentParser(); group=parser.add_mutually_exclusive_group(required=True); group.add_argument('--output',type=Path);group.add_argument('--verify',type=Path);args=parser.parse_args()
    try:
        if args.verify: verify(args.verify);return 0
        source=ROOT/'web'; files=asset_files(source/'index.html'); blobs={name:(source/name).read_bytes() for name in files}
        target=args.output.resolve();target.mkdir(parents=True,exist_ok=False)
        for name,data in blobs.items():(target/name).write_bytes(data)
        manifest={'format':1,'files':{name:digest(blobs[name]) for name in sorted(files)}}
        (target/'MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2,sort_keys=True)+'\n',encoding='utf-8',newline='\n')
        verify(target); print(f'目录：{target}');return 0
    except (OSError,ValueError,json.JSONDecodeError) as error: print(f'静态产物失败：{error}',file=sys.stderr);return 1
if __name__=='__main__':sys.exit(main())

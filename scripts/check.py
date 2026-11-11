"""Run the reproducible local checks; add --gcc for the optional compiler comparison."""
import argparse
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--gcc', action='store_true', help='also require and run GCC comparison')
    args = parser.parse_args()
    node = shutil.which('node')
    if not node:
        parser.error('Node.js is required for the JavaScript checks')
    if args.gcc and not shutil.which('gcc'):
        parser.error('--gcc requires GCC on PATH')
    checks = [
        ('Python unit and HTTP tests', [sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-v']),
        ('Object layout', [node, 'tests/test_object_layout.cjs']),
        ('State view', [node, 'tests/test_state_view.cjs']),
    ]
    if args.gcc:
        checks.append(('GCC comparison', [sys.executable, 'tests/compare_gcc.py']))
    else:
        print('GCC comparison skipped (pass --gcc to run it).', flush=True)
    failed = []
    for name, command in checks:
        print(f'\n=== {name} ===', flush=True)
        result = subprocess.run(command, cwd=ROOT, check=False)
        if result.returncode:
            failed.append((name, result.returncode))
    if failed:
        for name, code in failed:
            print(f'FAILED: {name} (exit {code})', file=sys.stderr)
        return 1
    print('\nAll selected checks passed.')
    return 0


if __name__ == '__main__':
    sys.exit(main())

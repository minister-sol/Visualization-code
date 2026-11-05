"""Optional reference check: python tests/compare_gcc.py (requires GCC)."""
import pathlib
import subprocess
import sys
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from backend.examples import EXAMPLES
from backend.engine import trace


def main():
    with tempfile.TemporaryDirectory(prefix='cvisual-reference-') as directory:
        source = pathlib.Path(directory) / 'example.c'
        binary = pathlib.Path(directory) / 'example.exe'
        for example in EXAMPLES:
            # The first examples omit stdio.h for brevity. Supply declarations
            # for the compiler without changing the traced source lines.
            source.write_text('#include <stdio.h>\n' + example['code'], encoding='utf-8')
            subprocess.run(['gcc', '-std=c11', '-O0', str(source), '-o', str(binary)],
                           check=True, capture_output=True, timeout=20)
            stdin = example.get('stdin', '')
            actual = subprocess.run([str(binary)], input=stdin, text=True,
                                    capture_output=True, check=True, timeout=5).stdout
            recorded = trace(example['code'], stdin)['output']
            if actual != recorded:
                raise AssertionError((example['id'], actual, recorded))
            if example['id'] == 'prefix':
                assert actual == '6\n14\n15\n'
            print(example['id'] + ': GCC output matches trace ' + repr(actual))


if __name__ == '__main__':
    main()

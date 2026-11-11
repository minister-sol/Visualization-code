"""Optional reference check: python tests/compare_gcc.py (requires GCC)."""
import pathlib
import subprocess
import sys
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from backend.examples import EXAMPLES
from backend.engine import trace
from test_algorithm_corpus import PROGRAMS, INPUT_PROGRAMS


def main():
    with tempfile.TemporaryDirectory(prefix='cvisual-reference-') as directory:
        source = pathlib.Path(directory) / 'example.c'
        binary = pathlib.Path(directory) / 'example.exe'
        corpus=[dict(id=name,code=source) for name,(source,expected) in PROGRAMS.items()]
        corpus += [dict(id=name,code=source,stdin=stdin) for name,(source,stdin,expected) in INPUT_PROGRAMS.items()]
        for example in EXAMPLES+corpus:
            # The first examples omit stdio.h for brevity. Supply declarations
            # for the compiler without changing the traced source lines.
            source.write_text('#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <stdint.h>\n' + example['code'], encoding='utf-8')
            subprocess.run(['gcc', '-std=c11', '-O0', str(source), '-lm', '-o', str(binary)],
                           check=True, capture_output=True, timeout=20)
            stdin = example.get('stdin', '')
            process = subprocess.run([str(binary)], input=stdin, text=True,
                                     capture_output=True, check=False, timeout=5)
            actual = process.stdout
            result = trace(example['code'], stdin)
            recorded = result['output']
            if process.returncode != result['exit_code']:
                raise AssertionError((example['id'], 'exit code', process.returncode, result['exit_code']))
            if actual != recorded:
                raise AssertionError((example['id'], actual, recorded))
            if example['id'] == 'prefix':
                assert actual == '6\n14\n15\n'
            print(example['id'] + ': GCC output/status matches trace ' + repr(actual))


if __name__ == '__main__':
    main()

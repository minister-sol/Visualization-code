"""Compile the browser's standard-library samples and compare native output."""
import argparse
import json
import math
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
MODEL = r"""
require('./web/c-standard-library.js');
require('./web/c-standard-library-remaining.js');

const boundary = {
  strlen:[''], strcmp:['',''], strncmp:['ab','abc'], memcmp:['abc','abc'],
  strcpy:[''], strcat:[''], memcpy:[''], strchr:['abc','z'], strstr:['abc',''],
  memmove:[''], memset:[''], isdigit:['/'], isalpha:['_'], isalnum:[' '],
  isspace:['x'], toupper:['7'], tolower:['Z'], printf:['%s'], puts:[''],
  putchar:['0'], snprintf:['hello','0'], scanf:[''], getchar:[''], fgets:['','2'],
  atoi:['-32768'], strtol:['x'], strtod:['0.5e2junk'], malloc:['64'], calloc:['1'],
  realloc:['64','failure'], free:['1'], qsort:['-2','0','-2'], bsearch:['3','1','2','9'],
  fopen:['rb'], fclose:[''], fprintf:[''], fscanf:[''], fread:['abc','5'],
  fwrite:[''], fseek:['abc','3'], ftell:['abc','0'], sqrt:['0'], pow:['-2','3'],
  fabs:['-0'], floor:['-2.1'], ceil:['-0.5'], round:['-2.5'], sin:['0'], cos:['0'],
  rand:['0'], srand:['65535'], time:['0'], difftime:['70','10'], clock:['0']
};
console.log(JSON.stringify(Object.entries(CLibrary.examples).map(([name, example]) => ({
  name, stdin: Boolean(example.stdin), source: example.source,
  cases: [example.args.map(arg => arg[1]), boundary[name]].map(args => {
    const steps = CLibrary.steps(name, args.join('\n'));
    if (!example.source[steps[1].line-1].includes(name+'(')) throw Error(name+' mapping');
    return [args, example.evaluate(...args)];
  })
}))));
"""


def matches(output, expected):
    if output == str(expected):
        return True
    if not isinstance(expected, (int, float)):
        return False
    try:
        return math.isclose(float(output), expected, rel_tol=1e-7)
    except ValueError:
        return False


def main():
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--export-model', type=Path)
    mode.add_argument('--model-json', type=Path)
    args = parser.parse_args()
    if args.model_json:
        data = json.loads(args.model_json.read_text(encoding='utf8'))
    else:
        data = json.loads(subprocess.check_output(['node', '-e', MODEL], cwd=ROOT))
    if args.export_model:
        args.export_model.write_text(json.dumps(data, ensure_ascii=False), encoding='utf8')
        return
    assert len(data) == 54
    compiler = os.environ.get('CC', 'cc' if os.name != 'nt' else 'gcc')
    total = 0
    with tempfile.TemporaryDirectory() as tmp:
        for example in data:
            name = example['name']
            source = ROOT / 'teaching' / 'c-standard-library' / (name + '.c')
            assert source.read_text(encoding='utf8').splitlines() == example['source'], name
            executable = Path(tmp) / (name + ('.exe' if os.name == 'nt' else ''))
            subprocess.run(
                [compiler, '-std=c99', '-Wall', '-Wextra', '-Werror', '-pedantic',
                 str(source), '-o', str(executable), '-lm'], check=True
            )
            for args, expected in example['cases']:
                with tempfile.TemporaryDirectory(dir=tmp) as cwd:
                    command = [str(executable), *([] if example['stdin'] else args)]
                    input_data = args[0].encode() if example['stdin'] else b''
                    raw = subprocess.check_output(command, input=input_data, cwd=cwd)
                output = raw.decode().replace('\r\n', '\n').removesuffix('\n')
                assert matches(output, expected), (name, args, output, expected)
                total += 1
    print(f'{len(data)} C99 samples compiled and {total} output comparisons passed')


if __name__ == '__main__':
    main()

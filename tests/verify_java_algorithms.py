"""Compile each independent Main class and check its default and boundary cases."""
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "web" / "teaching-programs-java"


def verify(item):
    name, cases = item
    with tempfile.TemporaryDirectory() as classes:
        subprocess.run(["javac", "-encoding", "UTF-8", "-d", classes,
                        str(SOURCES / (name + ".java"))], check=True, timeout=60)
        for case in cases:
            run = subprocess.run(["java", "-cp", classes, "Main", *case["args"]],
                                 input=case["stdin"], text=True, encoding="utf-8",
                                 capture_output=True, timeout=15, check=True)
            assert run.stdout.split() == case["output"].split(), (name, run.stdout, case)
    return len(cases)


if __name__ == "__main__":
    cases = json.loads((ROOT / "tests/java_algorithm_cases.json").read_text(encoding="utf-8"))
    assert set(cases) == {p.stem for p in SOURCES.glob("*.java")}
    with ThreadPoolExecutor(max_workers=4) as pool:
        count = sum(pool.map(verify, cases.items()))
    print(f"{len(cases)} Java algorithms compiled; {count} native runs matched C reference output")

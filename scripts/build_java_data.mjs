// 从 teaching-programs-java/*.java 生成可离线加载的 JavaPrograms 数据，并注册到 R1。
// 用法：node scripts/build_java_data.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = join(root, 'web', 'teaching-programs-java');
const outFile = join(root, 'web', 'classic-java-data.js');
const programs = {};
for (const name of readdirSync(sourceDir).filter(f => f.endsWith('.java')).sort()) {
  const topic = name.replace(/\.java$/, '');
  const text = readFileSync(join(sourceDir, name), 'utf8').replace(/\r\n/g, '\n').replace(/\n$/, '');
  programs[topic] = text.split('\n');
}

const body = `/* 由 scripts/build_java_data.mjs 生成，请勿手改。
   每个主题的 Java 源码与 C99 版本使用同一 stdin 契约；// @tag 只用于行映射，展示时会换成中文说明。 */
(function (root) {
  const JavaPrograms = ${JSON.stringify(programs, null, 2)};
  root.JavaPrograms = JavaPrograms;
  const R = root.R1;
  if (R && R.programs && R.mapping) {
    for (const [topic, lines] of Object.entries(JavaPrograms)) {
      R.programs[topic] = R.programs[topic] || {};
      R.programs[topic].java = lines;
      const markers = {};
      lines.forEach((line, index) => {
        const m = line.match(/@(\\w+)/);
        if (m) markers[m[1]] = index + 1;
      });
      R.mapping[topic] = R.mapping[topic] || {};
      R.mapping[topic].java = markers;
    }
  }
})(globalThis);
`;
writeFileSync(outFile, body);
console.log(`wrote ${outFile} with ${Object.keys(programs).length} Java programs`);

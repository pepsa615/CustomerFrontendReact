import { readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';

const gzipAsync = promisify(gzip);
const directory = resolve('dist/assets');
const limits = { '.js': 150_000, '.css': 30_000 };
const failures = [];
for (const file of await readdir(directory)) {
  const extension = Object.keys(limits).find((key) => file.endsWith(key));
  if (!extension) continue;
  const path = resolve(directory, file);
  const raw = await import('node:fs/promises').then(({ readFile }) => readFile(path));
  const bytes = (await gzipAsync(raw)).byteLength;
  if (bytes > limits[extension]) failures.push(`${file}: ${bytes} > ${limits[extension]} gzip bytes`);
  await stat(path);
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log('Bundle budget passed.');

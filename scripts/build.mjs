import { cp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve('src');
const output = resolve('dist');
await rm(output, { recursive: true, force: true });
await cp(source, output, { recursive: true });
console.log('Static site built to dist.');

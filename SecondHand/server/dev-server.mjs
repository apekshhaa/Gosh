import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(new URL('.', import.meta.url));
const compiler = fileURLToPath(new URL('./node_modules/typescript/bin/tsc', import.meta.url));
const initialBuild = spawnSync(process.execPath, [compiler, '-p', 'tsconfig.json'], { cwd: directory, stdio: 'inherit' });
if (initialBuild.status !== 0) process.exit(initialBuild.status ?? 1);

const children = [
  spawn(process.execPath, [compiler, '--watch', '--preserveWatchOutput'], { cwd: directory, stdio: 'inherit' }),
  spawn(process.execPath, ['--watch', 'dist/index.js'], { cwd: directory, stdio: 'inherit' }),
];
let stopping = false;
function stopAll(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (child.exitCode === null) child.kill();
  process.exitCode = code;
}
for (const child of children) {
  child.on('error', (error) => { console.error('Unable to start API development process:', error.message); stopAll(1); });
  child.on('exit', (code) => { if (!stopping) stopAll(code || 0); });
}
process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));

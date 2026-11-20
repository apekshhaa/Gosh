import { spawn } from 'node:child_process';

const processes = [
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port=3000', '--host=0.0.0.0'], { stdio: 'inherit' }),
  spawn(process.execPath, ['dev-server.mjs'], { cwd: 'server', stdio: 'inherit' }),
];

let shuttingDown = false;
function stopAll(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of processes) if (child.exitCode === null) child.kill('SIGTERM');
  process.exitCode = code;
}

for (const child of processes) {
  child.on('error', (error) => { console.error('Unable to start development process:', error.message); stopAll(1); });
  child.on('exit', (code) => { if (!shuttingDown) stopAll(code || 0); });
}
process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));

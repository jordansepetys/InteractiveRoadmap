#!/usr/bin/env node
/**
 * Simple dev script to run backend and frontend concurrently
 * No external dependencies required
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// Colors for output
const colors = {
  backend: '\x1b[36m',  // cyan
  frontend: '\x1b[35m', // magenta
  reset: '\x1b[0m'
};

function runCommand(name, args, cwd, color) {
  const proc = spawn(npmCmd, args, {
    cwd,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: isWindows
  });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${color}[${name}]${colors.reset} ${line}`);
      }
    });
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.error(`${color}[${name}]${colors.reset} ${line}`);
      }
    });
  });

  proc.on('error', (err) => {
    console.error(`${color}[${name}]${colors.reset} Error: ${err.message}`);
  });

  return proc;
}

console.log('Starting development servers...\n');

const backend = runCommand(
  'backend',
  ['run', 'dev'],
  join(rootDir, 'packages', 'backend'),
  colors.backend
);

const frontend = runCommand(
  'frontend',
  ['run', 'dev'],
  join(rootDir, 'packages', 'frontend'),
  colors.frontend
);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  backend.kill();
  frontend.kill();
  process.exit(0);
});

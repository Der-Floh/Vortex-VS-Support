#!/usr/bin/env node
// Resolves the best available PowerShell executable and forwards all CLI args to it.
// Windows: prefers 'powershell' (built-in), falls back to 'pwsh' (PS Core)
// Linux/macOS: prefers 'pwsh' (PS Core), falls back to 'powershell'
// Exits with the same exit code as the PowerShell process.

'use strict';

const { spawnSync } = require('child_process');

const isWindows = process.platform === 'win32';
const candidates = isWindows ? ['powershell', 'pwsh'] : ['pwsh', 'powershell'];
const psArgs = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ...process.argv.slice(2)];

function trySpawn(exe) {
    const result = spawnSync(exe, psArgs, { stdio: 'inherit', windowsHide: false });
    // ENOENT means the executable was not found — try the next candidate
    if (result.error && result.error.code === 'ENOENT') {
        return null;
    }
    return result;
}

let result = null;
for (const exe of candidates) {
    result = trySpawn(exe);
    if (result !== null) {
        break;
    }
}

if (!result) {
    process.stderr.write(`Error: No PowerShell executable found. Tried: ${candidates.join(', ')}\n`);
    process.exit(1);
}

process.exit(result.status ?? 1);

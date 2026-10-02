import { runTests } from '@vscode/test-electron';
import { resolve, join } from 'node:path';
import { existsSync } from 'node:fs';
// VS Code must launch as Electron, even when the parent shell came from a Node-mode helper.
delete process.env.ELECTRON_RUN_AS_NODE;
const installed = process.platform === 'win32' ? join(process.env.LOCALAPPDATA, 'Programs/Microsoft VS Code/Code.exe') : undefined;
await runTests({
  vscodeExecutablePath: process.env.HANUL_VSCODE_EXECUTABLE || (installed && existsSync(installed) ? installed : undefined),
  extensionDevelopmentPath: resolve('.'),
  extensionTestsPath: resolve('tests/vscode.cjs'),
  launchArgs: ['--disable-extensions', '--disable-workspace-trust', '--skip-welcome', '--skip-release-notes', `--user-data-dir=${resolve('.test/vscode-profile')}`, `--extensions-dir=${resolve('.test/extensions')}`, resolve('.')]
});

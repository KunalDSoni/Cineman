// Copies the static site into www/ (Capacitor's webDir). Zero dependencies.
// Run via `npm run build:web` (or `npm run sync`, which also runs `cap sync`).
import { cpSync, rmSync, mkdirSync, readdirSync } from 'node:fs';

const OUT = 'www';
// Everything that is tooling / native / debug — never shipped into the app bundle.
const DENY = new Set([
  OUT, 'node_modules', 'ios', 'android', 'native', 'scripts',
  '.git', '.github', '.claude', '.gitignore', '.DS_Store',
  'package.json', 'package-lock.json', 'capacitor.config.json',
  'CAPACITOR-HAPTICS-SETUP.md', 'README.md', 'haptic-check.html',
]);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

let n = 0;
for (const entry of readdirSync('.')) {
  if (DENY.has(entry) || entry.startsWith('.')) continue;
  cpSync(entry, `${OUT}/${entry}`, { recursive: true });
  n++;
}
console.log(`synced ${n} web entries → ${OUT}/`);

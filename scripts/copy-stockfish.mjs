// Copies the single-threaded "lite" Stockfish WASM build into public/ so Vite
// serves it as a static Web Worker (works on GitHub Pages: no COOP/COEP headers needed).
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', 'stockfish', 'bin');
const dest = join(root, 'public', 'stockfish');
const files = ['stockfish-18-lite-single.js', 'stockfish-18-lite-single.wasm'];

if (!existsSync(src)) {
  console.warn('[copy-stockfish] node_modules/stockfish not found — run npm install first.');
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
for (const f of files) copyFileSync(join(src, f), join(dest, f));
copyFileSync(join(root, 'node_modules', 'stockfish', 'Copying.txt'), join(dest, 'LICENSE-stockfish.txt'));
console.log('[copy-stockfish] Stockfish engine copied to public/stockfish');

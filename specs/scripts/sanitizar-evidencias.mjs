import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { extname } from 'node:path';

const escribir = process.argv.includes('--write');
const archivos = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).split('\0').filter(Boolean);
const extensiones = new Set(['.json', '.md', '.html', '.ts', '.tsx', '.js', '.mjs', '.css', '.txt', '.yml', '.yaml', '.svg', '.ps1']);
let total = 0;

for (const archivo of archivos) {
  if (!extensiones.has(extname(archivo))) continue;
  const contenido = readFileSync(archivo, 'utf8');
  let cantidad = 0;
  const saneado = contenido.replace(/\b(?:sk|pk)\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, () => {
    cantidad++;
    return '[REDACTED_MAPBOX_TOKEN]';
  });
  if (!cantidad) continue;
  total += cantidad;
  if (escribir) {
    if (extname(archivo) === '.json') JSON.parse(saneado);
    writeFileSync(archivo, saneado, 'utf8');
  }
  console.log(`${archivo}: ${cantidad} coincidencias ${escribir ? 'redactadas' : 'detectadas'}`);
}

console.log(`Total: ${total}. No se muestran valores de tokens.`);
if (!escribir && total > 0) process.exitCode = 1;

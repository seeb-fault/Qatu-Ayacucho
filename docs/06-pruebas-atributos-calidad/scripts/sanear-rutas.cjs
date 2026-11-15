// Reemplaza rutas absolutas locales (con el usuario de Windows) por rutas relativas en los resultados guardados.
const fs = require('fs'), path = require('path');
const raiz = process.argv[2], dir = path.join(raiz, 'docs/06-pruebas-atributos-calidad');
const barra = raiz.replace(/\\/g, '/');
const variantes = [raiz, barra, raiz.replace(/\\/g, '\\\\')];
let n = 0;
for (const sub of ['backend', 'playwright', 'lighthouse']) {
  const carpeta = path.join(dir, sub);
  if (!fs.existsSync(carpeta)) continue;
  for (const f of fs.readdirSync(carpeta)) {
    const p = path.join(carpeta, f);
    let t = fs.readFileSync(p, 'utf8'); const original = t;
    for (const v of variantes) t = t.split(v).join('.');
    // Cualquier otra ruta de usuario (temporales, caché de navegadores).
    t = t.replace(/[A-Za-z]:(?:\\\\|\\|\/)+Users(?:\\\\|\\|\/)+[^\\/"'\s<>]+/g, '<usuario>');
    if (t !== original) { fs.writeFileSync(p, t); n++; }
  }
}
console.log('archivos saneados:', n);

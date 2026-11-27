// Reemplaza rutas absolutas locales (con el usuario de Windows) y cookies de sesión de prueba en los resultados guardados.
// Recorre todas las subcarpetas de resultados (backend, playwright, lighthouse, carga, sonarqube, zap...), salvo scripts/.
const fs = require('fs'), path = require('path');
const raiz = process.argv[2], dir = path.join(raiz, 'docs/06-pruebas-atributos-calidad');
const barra = raiz.replace(/\\/g, '/');
const variantes = [raiz, barra, raiz.replace(/\\/g, '\\\\'), barra.replace(/^([A-Za-z]):/, (_, d) => '/' + d.toLowerCase())];
let n = 0;
function sanear(carpeta) {
  for (const e of fs.readdirSync(carpeta, { withFileTypes: true })) {
    const p = path.join(carpeta, e.name);
    if (e.isDirectory()) { if (e.name !== 'scripts' && e.name !== '.tmp') sanear(p); continue; }
    if (!/\.(json|txt|md|html|csv|info|yaml|xml)$/i.test(e.name)) continue;
    let t = fs.readFileSync(p, 'utf8'); const original = t;
    for (const v of variantes) t = t.split(v).join('.');
    // Cualquier otra ruta de usuario (temporales, caché de navegadores), en formato Windows o Git Bash.
    t = t.replace(/[A-Za-z]:(?:\\\\|\\|\/)+Users(?:\\\\|\\|\/)+[^\\/"'\s<>]+/g, '<usuario>');
    t = t.replace(/\/[a-z]\/Users\/[^\\/"'\s<>]+/g, '<usuario>');
    // Cookies de sesión de las cuentas de prueba (Lighthouse con sesión, k6): nunca se guardan.
    t = t.replace(/qatu_sesion=[A-Za-z0-9._-]+/g, 'qatu_sesion=<token-de-prueba>');
    if (t !== original) { fs.writeFileSync(p, t); n++; }
  }
}
sanear(dir);
console.log('archivos saneados:', n);

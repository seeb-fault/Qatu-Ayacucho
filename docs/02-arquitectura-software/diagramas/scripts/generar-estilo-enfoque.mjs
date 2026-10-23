import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argumentsList = process.argv.slice(2);
const option = (name, fallback) => argumentsList.includes(name) ? path.resolve(argumentsList[argumentsList.indexOf(name) + 1]) : fallback;
const graphDirectory = option('--graph-directory', path.join(directory, 'fuentes'));
const imageDirectory = option('--image-directory', path.join(directory, 'png'));
const vectorDirectory = option('--vector-directory', path.join(directory, 'svg'));
const colors = {
  ink: '#18352f', muted: '#52665f', green: '#155c49', blue: '#245b91', purple: '#7956a4',
  line: '#60736c', border: '#a7b9b0', paper: '#ffffff', presentation: '#edf4ff',
  application: '#eef7eb', domain: '#fff7df', infrastructure: '#f4eefb', gray: '#f5f7f6',
};

function graph(slug, title, subtitle, width, height) {
  return { slug, title, subtitle, width, height, backgrounds: [], boxes: [], texts: [], edges: [] };
}

function text(graphic, id, x, y, value, size = 22, settings = {}) {
  graphic.texts.push({ id, x, y, value, size, color: colors.ink, bold: false, width: graphic.width - x - 40, ...settings });
}

function rectangle(graphic, id, x, y, width, height, fill, settings = {}) {
  const { background = false, ...style } = settings;
  graphic[background ? 'backgrounds' : 'boxes'].push({ id, x, y, width, height, fill, stroke: colors.border, radius: 8, ...style });
}

function panel(graphic, id, x, y, width, height, fill, title, settings = {}) {
  rectangle(graphic, id, x, y, width, height, fill, { background: true, ...settings });
  if (title) text(graphic, `${id}-title`, x + 20, y + 33, title, 23, { bold: true, width: width - 40 });
}

function card(graphic, id, x, y, width, height, title, lines = [], settings = {}) {
  const { fill = colors.paper, stroke = colors.border, titleSize = 23, lineSize = 20, lineHeight = 27, ...style } = settings;
  rectangle(graphic, id, x, y, width, height, fill, { stroke, ...style });
  text(graphic, `${id}-title`, x + width / 2, y + 31, title, titleSize, { bold: true, anchor: 'middle', width: width - 24 });
  lines.forEach((line, index) => text(graphic, `${id}-line-${index}`, x + width / 2, y + 60 + index * lineHeight, line, lineSize, { anchor: 'middle', width: width - 24 }));
}

function edge(graphic, id, points, settings = {}) {
  graphic.edges.push({ id, points, color: colors.line, arrow: true, ...settings });
}

function heading(graphic, number, title, subtitle) {
  text(graphic, 'heading', 40, 52, `${number}  ${title}`, 36, { bold: true });
  text(graphic, 'subtitle', 40, 91, subtitle, 23, { color: colors.muted });
}

function styleDiagram() {
  const graphic = graph('estilo-arquitectonico-qatu', 'Qatu Ayacucho — estilo arquitectónico', 'Cliente-servidor + monolito modular en capas', 2160, 1750);
  heading(graphic, '04', 'QATU AYACUCHO · ESTILO ARQUITECTÓNICO', 'Estructura global · arquitectura objetivo con estado de implementación explícito');
  ['Visitante', 'Cliente', 'Proveedor', 'Administrador'].forEach((role, index) => {
    const position = 315 + index * 300;
    card(graphic, `actor-${index}`, position, 125, 230, 58, role, [], { fill: colors.gray });
    edge(graphic, `actor-link-${index}`, [[position + 115, 183], [position + 115, 210]], { arrow: false });
  });
  edge(graphic, 'actor-bus', [[430, 210], [1330, 210]], { arrow: false });
  edge(graphic, 'actors-web', [[880, 210], [880, 245]]);
  card(graphic, 'web', 540, 245, 680, 110, 'Aplicación web · Next.js / React / TypeScript', ['Navegador + servidor Next.js · interfaz y cliente HTTP', 'Descubrimiento actual: datos sintéticos; usuarios y proveedores: API'], { fill: colors.presentation, lineSize: 19 });
  edge(graphic, 'web-api', [[880, 355], [880, 480]]);
  text(graphic, 'http-label', 905, 391, 'HTTP / JSON · /api/v1 · HTTPS en producción', 20, { width: 770 });

  panel(graphic, 'api', 40, 420, 1720, 940, colors.paper, 'API Qatu · NestJS / TypeScript · un proceso y un despliegue backend', { dashed: true, stroke: colors.green });
  card(graphic, 'cross-cutting', 240, 480, 1490, 70, 'Entrada HTTP y controles transversales', ['Sesión JWT / cookie HttpOnly · autorización · validación · errores'], { fill: '#e1eee8', titleSize: 22, lineSize: 19, lineHeight: 23 });
  panel(graphic, 'presentation-band', 60, 575, 1680, 175, colors.presentation, '');
  panel(graphic, 'business-band', 60, 750, 1680, 285, colors.application, '');
  panel(graphic, 'infra-band', 60, 1035, 1680, 295, colors.infrastructure, '');
  const labels = [
    ['presentation', 620, ['1. PRESENTACIÓN', 'HTTP y DTO', 'Controladores']],
    ['business', 805, ['2. NEGOCIO', 'Aplicación', '+ Dominio']],
    ['infra', 1090, ['3. INFRA-', 'ESTRUCTURA', 'Repositorios', 'y adaptadores', 'por puertos']],
  ];
  labels.forEach(([id, top, lines]) => lines.forEach((line, index) => text(graphic, `layer-${id}-${index}`, 76, top + index * 29, line, 16, { bold: index === 0, width: 150 })));

  const modules = [
    { id: 'usuarios', title: 'Usuarios', actual: true, controller: 'UsuariosController', use: ['Registro · login', 'Perfil · administración'], domain: ['Cuenta y roles', 'Sesiones y permisos'], repo: ['PostgresUsuarios', 'scrypt / JWT'] },
    { id: 'proveedores', title: 'Proveedores', actual: true, controller: 'ProveedoresController', use: ['Perfil y zona', 'Verificación documental'], domain: ['Proveedor', 'Reglas de verificación'], repo: ['PostgresProveedores', 'Documentos cifrados'] },
    { id: 'catalogo', title: 'Catálogo', actual: false, controller: 'Publicaciones / filtros', use: ['Publicar y consultar', 'Herramientas / oficios'], domain: ['Publicación / recurso', 'Tarifas y categorías'], repo: ['Repositorio propio', 'Fotos controladas'] },
    { id: 'reservas', title: 'Reservas', actual: false, controller: 'Solicitudes / pagos', use: ['Aceptar / cancelar', 'Iniciar / confirmar pago'], domain: ['Reserva y bloqueo', 'Estados e idempotencia'], repo: ['Repositorio propio', 'Adaptador de pagos'] },
    { id: 'resenas', title: 'Reseñas y confianza', actual: false, controller: 'Reseñas / casos', use: ['Registrar reseña', 'Gestionar evidencias'], domain: ['Confianza y reseñas', 'Garantía documental'], repo: ['Repositorio propio', 'Evidencias privadas'] },
    { id: 'busqueda', title: 'Búsqueda', actual: false, controller: 'Intención / filtros', use: ['Interpretar consulta', 'Validar filtros / fallback'], domain: ['Criterios validados', 'Sin escrituras por IA'], repo: ['Cuotas y métricas', 'Adaptador de IA'] },
  ];
  modules.forEach((module, index) => {
    const position = 240 + index * 245;
    rectangle(graphic, `module-${module.id}`, position, 590, 230, 615, 'none', { background: true, dashed: true, stroke: module.actual ? colors.green : colors.border, radius: 0 });
    text(graphic, `${module.id}-name`, position + 115, 619, module.title, 22, { bold: true, anchor: 'middle', width: 218 });
    text(graphic, `${module.id}-status`, position + 115, 644, module.actual ? 'IMPLEMENTADO' : 'DISEÑADO · PENDIENTE', 16, { bold: true, anchor: 'middle', color: module.actual ? colors.green : colors.muted, width: 218 });
    card(graphic, `${module.id}-controller`, position + 10, 665, 210, 64, module.controller, [], { fill: colors.paper, titleSize: module.actual ? 17 : 18 });
    card(graphic, `${module.id}-application`, position + 10, 800, 210, 100, 'Casos de uso', module.use, { fill: colors.paper, titleSize: 20, lineSize: 17 });
    card(graphic, `${module.id}-domain`, position + 10, 935, 210, 85, 'Reglas y contratos', module.domain, { fill: colors.domain, titleSize: 18, lineSize: 17, lineHeight: 22 });
    card(graphic, `${module.id}-repository`, position + 10, 1090, 210, 100, 'Persistencia / I/O', module.repo, { fill: colors.paper, titleSize: 19, lineSize: 17 });
    edge(graphic, `${module.id}-entry`, [[position + 225, 550], [position + 225, 655], [position + 205, 655], [position + 205, 665]]);
    edge(graphic, `${module.id}-use`, [[position + 115, 729], [position + 115, 800]]);
    edge(graphic, `${module.id}-rules`, [[position + 115, 900], [position + 115, 935]]);
    edge(graphic, `${module.id}-io`, [[position + 115, 1020], [position + 115, 1090]]);
    edge(graphic, `${module.id}-storage`, [[position + 115, 1190], [position + 115, 1235]]);
  });
  card(graphic, 'module-io', 240, 1235, 1490, 85, 'Repositorios PostgreSQL y adaptadores por módulo · driver pg / contratos externos', ['Una misma base de datos; cada módulo es propietario de sus tablas y de sus integraciones.'], { fill: '#e8e0f4', lineSize: 20 });

  panel(graphic, 'scope', 1820, 420, 300, 430, colors.gray, 'Cómo leer esta vista');
  const scopeLines = ['6 módulos de negocio', '2 implementados en API', '4 pendientes de construir', '', 'Pagos pertenece a Reservas.', 'No son microservicios.', 'Comparten proceso y fallos.', '', 'Redis no está implementado.', 'Mapas / IA / pagos externos:', 'integraciones pendientes.'];
  scopeLines.forEach((line, index) => text(graphic, `scope-${index}`, 1840, 490 + index * 30, line, 19, { width: 260 }));
  card(graphic, 'payments', 1840, 925, 280, 110, 'Pasarela de pagos', ['Culqi: candidata', 'HTTPS · módulo Reservas'], { fill: colors.gray, titleSize: 22, lineSize: 19 });
  card(graphic, 'ai', 1840, 1085, 280, 110, 'Proveedor de IA', ['Modelo por seleccionar', 'HTTPS · módulo Búsqueda'], { fill: colors.gray, titleSize: 22, lineSize: 19 });
  card(graphic, 'maps', 1840, 1245, 280, 110, 'Mapas / mensajería', ['Proveedores por definir', 'Zona manual disponible'], { fill: colors.gray, titleSize: 21, lineSize: 19 });
  edge(graphic, 'payments-call', [[1730, 1255], [1780, 1255], [1780, 980], [1840, 980]], { dashed: true });
  edge(graphic, 'ai-call', [[1730, 1280], [1800, 1280], [1800, 1140], [1840, 1140]], { dashed: true });
  edge(graphic, 'maps-call', [[1730, 1305], [1840, 1305]], { dashed: true });
  edge(graphic, 'database-call', [[830, 1320], [830, 1450]]);
  text(graphic, 'sql-label', 855, 1400, 'SQL · repositorios propios', 21, { width: 600 });
  card(graphic, 'database', 420, 1450, 820, 110, 'PostgreSQL 17 + PostGIS 3.5', ['Docker local · volumen persistente · sin exposición pública en producción', 'Actual: cuentas, sesiones, proveedores y documentos cifrados'], { fill: '#e3f0e9', lineSize: 20 });

  panel(graphic, 'legend', 40, 1600, 1040, 115, colors.gray, 'Leyenda y alcance');
  text(graphic, 'legend-1', 60, 1664, 'Flecha continua: ejecución interna / conexión actual; discontinua: integración futura.', 20, { width: 1000 });
  text(graphic, 'legend-2', 60, 1694, 'Los estados de cada columna distinguen implementación actual y arquitectura objetivo.', 20, { width: 1000 });
  panel(graphic, 'rules', 1110, 1600, 1010, 115, colors.gray, 'Límite de esta vista');
  text(graphic, 'rules-1', 1130, 1664, 'Entre módulos: contratos públicos; nunca repositorios ni consultas a tablas ajenas.', 20, { width: 970 });
  text(graphic, 'rules-2', 1130, 1694, 'Negocio = Aplicación + Dominio; los imports se explican en Clean Architecture.', 20, { width: 970 });
  return graphic;
}

function cleanDiagram() {
  const graphic = graph('enfoque-arquitectonico-qatu', 'Qatu Ayacucho — enfoque Clean Architecture', 'Dependencias internas ilustradas con el módulo Usuarios implementado', 2160, 1530);
  heading(graphic, '05', 'QATU AYACUCHO · CLEAN ARCHITECTURE', 'Dependencias de código hacia el núcleo · ejemplo real: backend/src/modules/usuarios');
  panel(graphic, 'api', 40, 130, 1750, 1070, colors.paper, 'API NestJS · módulo Usuarios · ejemplo implementado, no código hipotético', { dashed: true, stroke: colors.green });
  panel(graphic, 'frameworks', 70, 195, 1690, 975, colors.gray, 'ADAPTADORES Y FRAMEWORKS · HTTP / NestJS / pg / JWT / node:crypto');
  panel(graphic, 'presentation', 100, 300, 340, 610, colors.presentation, 'PRESENTACIÓN');
  text(graphic, 'presentation-path', 120, 366, 'presentacion/', 20, { color: colors.blue, width: 300 });
  card(graphic, 'controller', 120, 400, 300, 145, 'UsuariosController', ['Recibe solicitudes HTTP', 'Lee y emite cookie de sesión', 'Invoca casos de uso'], { titleSize: 24, lineSize: 19 });
  text(graphic, 'http', 120, 605, 'Entrada desde la web Next.js', 20, { width: 300 });
  text(graphic, 'http-2', 120, 636, 'HTTP / JSON · /api/v1', 20, { width: 300 });
  text(graphic, 'http-3', 120, 698, 'No ejecuta consultas SQL.', 20, { bold: true, width: 300 });
  text(graphic, 'http-4', 120, 730, 'No es dueño de las reglas.', 20, { width: 300 });

  panel(graphic, 'application', 490, 260, 810, 720, colors.application, 'APLICACIÓN · aplicacion/ · coordinación de casos de uso');
  card(graphic, 'usecases', 550, 330, 690, 100, 'Usuarios', ['registrar · login · perfil · editar · salir', 'Depende de modelos, validaciones y contratos internos'], { fill: colors.paper, titleSize: 25, lineSize: 20 });
  panel(graphic, 'domain', 520, 490, 750, 455, colors.domain, 'DOMINIO · dominio/ · sin NestJS, pg ni SDK externos', { stroke: '#c5a13d' });
  text(graphic, 'model-heading', 550, 570, 'MODELOS Y REGLAS', 22, { bold: true, width: 310 });
  text(graphic, 'port-heading', 900, 570, 'CONTRATOS / PUERTOS', 22, { bold: true, width: 340 });
  card(graphic, 'user-model', 550, 595, 310, 95, 'Usuario', ['Identidad · nombre · roles', 'Estado de la cuenta'], { fill: '#fffdf5', titleSize: 24, lineSize: 19, lineHeight: 24 });
  card(graphic, 'validation', 550, 715, 310, 125, 'Validaciones puras', ['emailValido · passwordValido', 'nombreValido · estadoValido', 'ErrorUsuario'], { fill: '#fffdf5', titleSize: 23, lineSize: 18, lineHeight: 25 });
  card(graphic, 'repo-port', 900, 595, 340, 85, 'RepositorioUsuarios', ['Persistencia y sesiones'], { fill: '#fffdf5', titleSize: 24, lineSize: 20 });
  card(graphic, 'hash-port', 900, 705, 340, 85, 'HashPasswords', ['Crear / verificar hash'], { fill: '#fffdf5', titleSize: 24, lineSize: 20 });
  card(graphic, 'token-port', 900, 815, 340, 85, 'TokensSesion', ['Emitir / leer token'], { fill: '#fffdf5', titleSize: 24, lineSize: 20 });
  text(graphic, 'domain-pure', 550, 916, 'TypeScript · no importa controladores ni implementaciones', 20, { width: 690 });

  panel(graphic, 'infrastructure', 1340, 300, 390, 610, colors.infrastructure, 'INFRAESTRUCTURA');
  text(graphic, 'infra-path', 1360, 366, 'infraestructura/', 20, { color: colors.purple, width: 350 });
  text(graphic, 'infra-role-1', 1360, 419, 'Implementa los contratos.', 22, { bold: true, width: 350 });
  text(graphic, 'infra-role-2', 1360, 453, 'Conoce tecnologías concretas;', 20, { width: 350 });
  text(graphic, 'infra-role-3', 1360, 484, 'el dominio no la importa.', 20, { width: 350 });
  card(graphic, 'postgres-adapter', 1370, 595, 330, 85, 'PostgresUsuarios', ['SQL parametrizado · driver pg'], { titleSize: 24, lineSize: 19 });
  card(graphic, 'hash-adapter', 1370, 705, 330, 85, 'ScryptPasswords', ['node:crypto · hash con sal'], { titleSize: 24, lineSize: 19 });
  card(graphic, 'token-adapter', 1370, 815, 330, 85, 'JwtTokens', ['JwtService · firma / validación'], { titleSize: 24, lineSize: 19 });

  edge(graphic, 'presentation-application', [[420, 470], [465, 470], [465, 380], [550, 380]], { color: colors.blue });
  edge(graphic, 'application-domain', [[880, 430], [880, 490]], { color: colors.green });
  text(graphic, 'use-contracts', 905, 464, 'Usa reglas y contratos', 19, { color: colors.green, width: 340 });
  edge(graphic, 'repo-implementation', [[1370, 638], [1240, 638]], { color: colors.purple, hollow: true });
  edge(graphic, 'hash-implementation', [[1370, 748], [1240, 748]], { color: colors.purple, hollow: true });
  edge(graphic, 'token-implementation', [[1370, 858], [1240, 858]], { color: colors.purple, hollow: true });

  card(graphic, 'composition', 100, 1020, 1630, 115, 'RAÍZ DE COMPOSICIÓN · usuarios.module.ts', ['NestJS selecciona e inyecta PostgresUsuarios + ScryptPasswords + JwtTokens en Usuarios.', 'Es el lugar que conoce las implementaciones y conecta las capas.'], { fill: '#e3eee9', titleSize: 25, lineSize: 22 });
  edge(graphic, 'inject-controller', [[270, 1020], [270, 910]], { dashed: true, color: colors.muted });
  edge(graphic, 'inject-application', [[880, 1020], [880, 980]], { dashed: true, color: colors.muted });
  edge(graphic, 'inject-adapters', [[1540, 1020], [1540, 910]], { dashed: true, color: colors.muted });

  panel(graphic, 'actual-scope', 1830, 130, 290, 340, colors.gray, 'Ejemplo verificable');
  ['Clases e interfaces reales', 'del módulo Usuarios.', '', 'Proveedores repite el', 'mismo enfoque con sus', 'propias reglas y puertos.', '', 'No es el frontend Angular', 'del ejemplo Marketplace.'].forEach((line, index) => text(graphic, `actual-scope-${index}`, 1850, 201 + index * 28, line, 18, { width: 250 }));
  card(graphic, 'postgres', 1840, 575, 280, 130, 'PostgreSQL', ['Cuentas · roles · sesiones', 'Auditoría y límites', 'Acceso mediante pg'], { fill: '#e3f0e9', titleSize: 25, lineSize: 19, lineHeight: 26 });
  edge(graphic, 'sql', [[1700, 638], [1840, 638]], { color: colors.line });
  text(graphic, 'sql-text', 1765, 621, 'SQL', 19, { anchor: 'middle', width: 100 });
  panel(graphic, 'local-libraries', 1830, 790, 290, 270, colors.gray, 'Sin APIs externas aquí');
  ['scrypt y JWT se ejecutan', 'localmente en el backend.', '', 'IA y pasarela son futuras', 'integraciones de otros', 'módulos, no de Usuarios.'].forEach((line, index) => text(graphic, `local-library-${index}`, 1850, 862 + index * 29, line, 18, { width: 250 }));

  panel(graphic, 'legend', 40, 1240, 650, 250, colors.gray, 'Leyenda · no confundir flechas');
  edge(graphic, 'legend-dependency', [[65, 1311], [130, 1311]], { color: colors.blue });
  text(graphic, 'legend-dependency-text', 150, 1318, 'Dependencia de código hacia el núcleo.', 21, { width: 510 });
  edge(graphic, 'legend-realization', [[65, 1365], [130, 1365]], { color: colors.purple, hollow: true });
  text(graphic, 'legend-realization-text', 150, 1372, 'Implementa un contrato (puerto).', 21, { width: 510 });
  edge(graphic, 'legend-composition', [[65, 1419], [130, 1419]], { dashed: true });
  text(graphic, 'legend-composition-text', 150, 1426, 'Configuración / inyección de dependencias.', 21, { width: 510 });
  text(graphic, 'legend-sql-text', 65, 1470, 'SQL indica I/O, no una dependencia del dominio.', 20, { width: 600 });
  panel(graphic, 'rule', 720, 1240, 700, 250, colors.gray, 'Regla de dependencia');
  ['1. Dominio no conoce HTTP, NestJS ni PostgreSQL.', '2. Aplicación conoce contratos, no sus adapters.', '3. Infraestructura depende de esos contratos.', '4. Composición elige implementaciones concretas.', '', 'Cambiar persistencia no exige reescribir las reglas.'].forEach((line, index) => text(graphic, `rule-${index}`, 740, 1313 + index * 29, line, 20, { width: 660 }));
  panel(graphic, 'execution', 1450, 1240, 670, 250, colors.gray, 'Ejemplo para explicar: registrar usuario');
  ['HTTP → UsuariosController → Usuarios.registrar', '→ validaciones / HashPasswords', '→ RepositorioUsuarios.crear → PostgreSQL', '', 'La ejecución sale mediante adapters;', 'los imports siguen apuntando hacia el núcleo.'].forEach((line, index) => text(graphic, `execution-${index}`, 1470, 1313 + index * 29, line, 20, { width: 630 }));
  return graphic;
}

const escapeXml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function validate(graphic) {
  const identifiers = new Set();
  for (const element of [...graphic.backgrounds, ...graphic.boxes, ...graphic.texts, ...graphic.edges]) {
    assert(!identifiers.has(element.id), `ID repetido: ${element.id}`);
    identifiers.add(element.id);
    if (element.points) {
      element.points.forEach(([horizontal, vertical], index) => {
        assert(horizontal >= 0 && horizontal <= graphic.width && vertical >= 0 && vertical <= graphic.height, `Arista fuera del lienzo: ${element.id}`);
        if (index) assert(horizontal === element.points[index - 1][0] || vertical === element.points[index - 1][1], `Arista no ortogonal: ${element.id}`);
      });
    } else {
      assert(element.x >= 0 && element.y >= 0, `Elemento fuera del lienzo: ${element.id}`);
      assert(element.x + (element.anchor === 'middle' ? 0 : element.width) <= graphic.width, `Ancho fuera del lienzo: ${element.id}`);
      assert(element.y + (element.height ?? 0) <= graphic.height, `Alto fuera del lienzo: ${element.id}`);
    }
  }
}

function svg(graphic) {
  const rectangles = collection => collection.map(shape => `<rect id="${shape.id}" x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" rx="${shape.radius}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="1.5"${shape.dashed ? ' stroke-dasharray="9 6"' : ''}/>`).join('\n');
  const edges = graphic.edges.map(line => `<polyline id="${line.id}" points="${line.points.map(point => point.join(',')).join(' ')}" fill="none" stroke="${line.color}" stroke-width="2"${line.dashed || line.hollow ? ' stroke-dasharray="7 5"' : ''}${line.arrow ? ` marker-end="url(#${line.hollow ? 'hollow' : line.color === colors.blue ? 'blue' : line.color === colors.green ? 'green' : 'arrow'})"` : ''}/>`).join('\n');
  const labels = graphic.texts.map(label => `<text id="${label.id}" x="${label.x}" y="${label.y}" font-size="${label.size}" font-weight="${label.bold ? '700' : '400'}" fill="${label.color}" text-anchor="${label.anchor ?? 'start'}" data-max-width="${label.width}">${escapeXml(label.value)}</text>`).join('\n');
  const marker = (id, fill) => `<marker id="${id}" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M1,1 L9,5 L1,9 Z" fill="${fill}" stroke="${fill === 'white' ? colors.purple : fill}"/></marker>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${graphic.width}" height="${graphic.height}" viewBox="0 0 ${graphic.width} ${graphic.height}" role="img" aria-labelledby="title description">
<title id="title">${escapeXml(graphic.title)}</title><desc id="description">${escapeXml(graphic.subtitle)}</desc>
<defs>${marker('arrow', colors.line)}${marker('blue', colors.blue)}${marker('green', colors.green)}${marker('hollow', 'white')}</defs>
<rect width="100%" height="100%" fill="white"/>
<g font-family="Arial, Helvetica, sans-serif">${rectangles(graphic.backgrounds)}\n${edges}\n${rectangles(graphic.boxes)}\n${labels}</g></svg>\n`;
}

function drawio(graphic) {
  const vertex = (id, value, style, x, y, width, height) => `<mxCell id="${id}" value="${escapeXml(value)}" style="${style}" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry"/></mxCell>`;
  const rectangles = collection => collection.map(shape => vertex(shape.id, '', `rounded=${shape.radius ? 1 : 0};fillColor=${shape.fill};strokeColor=${shape.stroke};strokeWidth=1.5;${shape.dashed ? 'dashed=1;' : ''}`, shape.x, shape.y, shape.width, shape.height)).join('\n');
  const labels = graphic.texts.map(label => vertex(label.id, label.value, `text;html=0;whiteSpace=nowrap;overflow=visible;align=${label.anchor === 'middle' ? 'center' : 'left'};verticalAlign=middle;spacing=0;fontFamily=Arial;fontSize=${label.size};fontColor=${label.color};fontStyle=${label.bold ? 1 : 0};fillColor=none;strokeColor=none;`, label.anchor === 'middle' ? label.x - label.width / 2 : label.x, label.y - label.size, label.width, label.size * 1.3)).join('\n');
  const edges = graphic.edges.map(line => {
    const start = line.points[0];
    const end = line.points.at(-1);
    const points = line.points.slice(1, -1).map(([horizontal, vertical]) => `<mxPoint x="${horizontal}" y="${vertical}"/>`).join('');
    return `<mxCell id="${line.id}" style="edgeStyle=none;strokeColor=${line.color};strokeWidth=2;endArrow=${line.arrow ? line.hollow ? 'block' : 'classic' : 'none'};endFill=${line.hollow ? 0 : 1};${line.dashed || line.hollow ? 'dashed=1;' : ''}" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${start[0]}" y="${start[1]}" as="sourcePoint"/><mxPoint x="${end[0]}" y="${end[1]}" as="targetPoint"/><Array as="points">${points}</Array></mxGeometry></mxCell>`;
  }).join('\n');
  return `<mxfile host="app.diagrams.net"><diagram name="${escapeXml(graphic.title)}"><mxGraphModel grid="1" gridSize="10" page="1" pageWidth="${graphic.width}" pageHeight="${graphic.height}"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${rectangles(graphic.backgrounds)}\n${edges}\n${rectangles(graphic.boxes)}\n${labels}</root></mxGraphModel></diagram></mxfile>\n`;
}

const diagrams = [styleDiagram(), cleanDiagram()];
for (const graphic of diagrams) {
  validate(graphic);
  const artifacts = [
    [path.join(graphDirectory, `${graphic.slug}.json`), `${JSON.stringify(graphic, null, 2)}\n`],
    [path.join(graphDirectory, `${graphic.slug}.drawio`), drawio(graphic)],
    [path.join(vectorDirectory, `${graphic.slug}.svg`), svg(graphic)],
  ];
  for (const [filename, contents] of artifacts) {
    if (argumentsList.includes('--check')) assert.equal(await readFile(filename, 'utf8'), contents, `Artefacto desactualizado: ${filename}`);
    else await writeFile(filename, contents, 'utf8');
  }
  console.log(`${graphic.slug}: JSON, SVG y drawio ${argumentsList.includes('--check') ? 'sincronizados' : 'generados'}.`);
}

if (argumentsList.includes('--png')) {
  const requireFrontend = createRequire(path.resolve(directory, '../../../frontend/package.json'));
  const { chromium } = requireFrontend('playwright');
  const browser = await chromium.launch({ headless: true, executablePath: option('--browser-executable', undefined) });
  try {
    for (const graphic of diagrams) {
      const page = await browser.newPage({ viewport: { width: graphic.width, height: graphic.height }, deviceScaleFactor: 1 });
      await page.setContent(`<!doctype html><html lang="es"><head><meta charset="utf-8"><style>body{margin:0;background:white}svg{display:block}</style></head><body>${svg(graphic)}</body></html>`);
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.locator('text[data-max-width]').evaluateAll(labels => labels.filter(label => label.getBBox().width > Number(label.dataset.maxWidth) + 1).map(label => ({ id: label.id, width: label.getBBox().width, maximum: Number(label.dataset.maxWidth) })));
      assert.deepEqual(overflow, [], `Textos fuera de sus cajas en ${graphic.slug}: ${JSON.stringify(overflow)}`);
      const editable = await readFile(path.join(graphDirectory, `${graphic.slug}.drawio`), 'utf8');
      assert(await page.evaluate(xml => !new DOMParser().parseFromString(xml, 'application/xml').querySelector('parsererror'), editable), 'XML drawio inválido');
      const filename = path.join(imageDirectory, `${graphic.slug}.png`);
      if (!argumentsList.includes('--check')) await page.screenshot({ path: filename, fullPage: false, timeout: 120000, animations: 'disabled' });
      else assert((await readFile(filename)).subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'PNG inválido');
      await page.close();
      console.log(`${graphic.slug}: texto y XML verificados; PNG ${argumentsList.includes('--check') ? 'comprobado' : 'exportado'}.`);
    }
  } finally {
    await browser.close();
  }
}

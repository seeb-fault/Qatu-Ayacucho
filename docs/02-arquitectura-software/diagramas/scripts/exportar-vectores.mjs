// Genera el SVG y el archivo de diagrams.net de las vistas cuyo modelo vive en fuentes/*.json.
// El PNG lo dibujan render-arquitectura.ps1 y render-componentes.ps1 desde el mismo JSON.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const paleta = { person: '#274777', container: '#3f67ad', component: '#a8c7eb', support: '#d9e6f5', external: '#8b9098' };
const clara = kind => ['person', 'container', 'external'].includes(kind);
const esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function texto(x, y, valor, size, color, bold = false, anchor = 'start') {
  return `<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" fill="${color}" font-weight="${bold ? 'bold' : 'normal'}" text-anchor="${anchor}">${esc(valor)}</text>`;
}

function svg(d) {
  const partes = [`<svg xmlns="http://www.w3.org/2000/svg" width="${d.width}" height="${d.height}" viewBox="0 0 ${d.width} ${d.height}"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#667588"/></marker></defs><rect width="100%" height="100%" fill="white"/>`];
  partes.push(texto(28, 42, d.title, 28, '#172b43', true), texto(28, 77, d.subtitle, 18, '#64748b'));
  for (const b of d.boundaries) {
    partes.push(`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="none" stroke="#8390a2" stroke-width="1.5" stroke-dasharray="8 6"/>`);
    partes.push(texto(b.tx ?? b.x + 18, b.y + 28, b.title, 19, '#3d526e', true));
  }
  for (const e of d.edges) {
    const trazo = e.style === 'dashed' ? 'stroke-dasharray="8 6"' : '';
    partes.push(`<polyline points="${e.points.map(p => p.join(',')).join(' ')}" fill="none" stroke="#667588" stroke-width="1.8" ${trazo} marker-end="url(#arrow)"/>`);
  }
  for (const n of d.nodes) {
    if (n.kind === 'person') partes.push(`<circle cx="${n.x + n.w / 2}" cy="${n.y - 25}" r="24" fill="${paleta.person}"/>`);
    partes.push(`<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" fill="${paleta[n.kind]}"/>`);
    const color = clara(n.kind) ? '#ffffff' : '#142d48', primero = n.y + (n.h - (28 + n.lines.length * 23)) / 2 + 22, medio = n.x + n.w / 2;
    partes.push(texto(medio, primero, n.title, 22, color, true, 'middle'));
    n.lines.forEach((l, i) => partes.push(texto(medio, primero + 28 + i * 23, l, 17, color, false, 'middle')));
  }
  for (const e of d.edges) {
    if (!e.label) continue;
    const ancho = e.label.length * 8.1 + 18;
    partes.push(`<rect x="${e.lx - ancho / 2}" y="${e.ly - 18}" width="${ancho}" height="24" fill="white"/>`, texto(e.lx, e.ly, e.label, 16, '#536378', false, 'middle'));
  }
  if (d.legend) {
    const pie = d.height - 140, leyenda = [['person', 'Persona'], ['container', 'Contenedor'], ['component', 'Módulo'], ['support', 'Soporte'], ['external', 'Sistema externo']];
    partes.push(`<rect x="28" y="${pie}" width="850" height="116" fill="none" stroke="#d3d9e0"/>`, `<rect x="908" y="${pie}" width="960" height="116" fill="none" stroke="#d3d9e0"/>`, texto(48, pie + 25, 'Leyenda', 18, '#25334a', true));
    leyenda.forEach(([kind, nombre], i) => partes.push(`<rect x="${48 + i * 164}" y="${pie + 40}" width="148" height="30" fill="${paleta[kind]}"/>`, texto(122 + i * 164, pie + 60, nombre, 14, clara(kind) ? '#ffffff' : '#142d48', false, 'middle')));
    partes.push(texto(48, pie + 94, 'Flecha: relación etiquetada - línea discontinua: evento, opción o límite', 16, '#485669'), texto(928, pie + 25, 'Notas de arquitectura', 18, '#25334a', true));
    d.notes.forEach((nota, i) => partes.push(texto(928, pie + 52 + i * 25, nota, 15, '#485669')));
    partes.push('</svg>');
    return partes.join('\n') + '\n';
  }
  const pie = d.height - 130;
  partes.push(`<rect x="28" y="${pie}" width="${d.width - 56}" height="110" fill="none" stroke="#d3d9e0"/>`, texto(48, pie + 25, 'Lectura del diagrama y límites', 18, '#25334a', true));
  d.notes.forEach((nota, i) => partes.push(texto(48, pie + 51 + i * 23, nota, 16, '#536378')));
  partes.push('</svg>');
  return partes.join('\n') + '\n';
}

function drawio(d) {
  const estilo = (relleno, trazo, color = '#24364d', extra = '') => `rounded=1;whiteSpace=wrap;html=1;fontSize=17;fillColor=${relleno};strokeColor=${trazo};fontColor=${color};${extra}`;
  const caja = (id, valor, style, x, y, w, h) => `<mxCell id="${id}" value="${esc(valor)}" style="${style}" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`;
  const c = [caja('heading', `<b>${d.title}</b><br/>${d.subtitle}`, estilo('none', 'none'), 20, 10, d.width - 40, 80)];
  d.boundaries.forEach((b, i) => {
    c.push(caja(`boundary${i}`, '', estilo('none', '#8390a2', '#24364d', 'dashed=1;'), b.x, b.y, b.w, b.h));
    c.push(caja(`boundary-label${i}`, `<b>${b.title}</b>`, estilo('none', 'none', '#24364d', 'align=left;'), b.x + 10, b.y + 5, b.w - 20, 35));
  });
  for (const n of d.nodes) {
    if (n.kind === 'person') c.push(`<mxCell id="${n.id}-head" style="ellipse;fillColor=${paleta.person};strokeColor=none;" vertex="1" parent="1"><mxGeometry x="${n.x + n.w / 2 - 24}" y="${n.y - 49}" width="48" height="48" as="geometry"/></mxCell>`);
    c.push(caja(n.id, `<b>${n.title}</b><br/>${n.lines.join('<br/>')}`, estilo(paleta[n.kind], 'none', clara(n.kind) ? '#ffffff' : '#142d48'), n.x, n.y, n.w, n.h));
  }
  d.edges.forEach((e, i) => {
    const [a, ...resto] = e.points, b = resto.pop();
    const puntos = resto.length ? `<Array as="points">${resto.map(p => `<mxPoint x="${p[0]}" y="${p[1]}"/>`).join('')}</Array>` : '';
    c.push(`<mxCell id="edge${i}" value="${esc(e.label || '')}" style="edgeStyle=none;html=1;strokeColor=#667588;fontColor=#536378;labelBackgroundColor=#ffffff;${e.style === 'dashed' ? 'dashed=1;' : ''}" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${a[0]}" y="${a[1]}" as="sourcePoint"/><mxPoint x="${b[0]}" y="${b[1]}" as="targetPoint"/>${puntos}</mxGeometry></mxCell>`);
  });
  c.push(caja('notes', `<b>Lectura del diagrama y límites</b><br/>${d.notes.join('<br/>')}`, estilo('none', '#abb6c4', '#24364d', 'align=left;'), 28, d.height - 130, d.width - 56, 110));
  return `<mxfile host="app.diagrams.net"><diagram name="${esc(d.title)}"><mxGraphModel grid="1" gridSize="10" page="1" pageWidth="${d.width}" pageHeight="${d.height}"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${c.join('')}</root></mxGraphModel></diagram></mxfile>`;
}

for (const slug of ['arquitectura-inicial-qatu', 'componentes-qatu']) {
  const datos = JSON.parse(readFileSync(path.join(raiz, 'fuentes', `${slug}.json`), 'utf8'));
  writeFileSync(path.join(raiz, 'svg', `${slug}.svg`), svg(datos));
  writeFileSync(path.join(raiz, 'fuentes', `${slug}.drawio`), drawio(datos));
  console.log(`${slug}: SVG y drawio generados.`);
}

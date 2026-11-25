// Prueba de carga de la API de Qatu con k6 (AC01 Rendimiento, AC03 Escalabilidad).
// Escenarios EQ-01 y EQ-03: mezcla de 70 % búsquedas, 20 % detalles y 10 % consulta de reservas y disponibilidad,
// Perfil base: escalones de 10, 30 y 60 usuarios virtuales y una rampa exploratoria hasta 500.
// Perfil 2000 (-e PERFIL=2000, Sprint 2): sube de forma progresiva por escalones de 100, 250, 500, 1 000, 1 500 y
// 2 000 usuarios; cada escalón sube en 30 s desde el anterior y se mantiene 90 s, con métricas propias.
// Uso: k6 run -e API=http://host:3401 -e DATOS=/ruta/datos.json -e ORIGEN=http://127.0.0.1:3100 [-e PERFIL=2000] carga.k6.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const API = (__ENV.API || 'http://127.0.0.1:3401') + '/api/v1';
const ORIGEN = __ENV.ORIGEN || 'http://127.0.0.1:3100';
const datos = JSON.parse(open(__ENV.DATOS));
const RAPIDO = __ENV.RAPIDO === '1';
const d = s => RAPIDO ? '10s' : s;
const PERFIL_2000 = __ENV.PERFIL === '2000';

// Usuarios de cada escalón del perfil 2000. Cada escalón dura 120 s: 30 s de subida y 90 s estable.
const ESCALONES = [100, 250, 500, 1000, 1500, 2000];
const DURACION = RAPIDO ? 20 : 120, SUBIDA = RAPIDO ? 5 : 30;
const escalonados = Object.fromEntries(ESCALONES.map((vus, i) => [`usuarios_${vus}`, {
  executor: 'ramping-vus', startVUs: i ? ESCALONES[i - 1] : 0, startTime: `${i * DURACION}s`, tags: { nivel: String(vus) }, gracefulRampDown: '0s', gracefulStop: '10s',
  stages: [{ duration: `${SUBIDA}s`, target: vus }, { duration: `${DURACION - SUBIDA}s`, target: vus }],
}]));
const NIVELES = PERFIL_2000 ? ESCALONES.map(String) : ['10', '30', '60', '500'];

// Metas del perfil 2000 (exploratorias, Sprint 2): p95 ≤ 1 s hasta 500 usuarios (AC01/AC03), ≤ 2 s por encima; errores < 1 %.
const metas2000 = Object.fromEntries(ESCALONES.flatMap(vus => [
  [`http_req_duration{nivel:${vus}}`, [`p(95)<${vus <= 500 ? 1000 : 2000}`]],
  [`http_req_failed{nivel:${vus}}`, ['rate<0.01']],
]));

export const options = PERFIL_2000 ? {
  scenarios: escalonados,
  thresholds: metas2000,
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  // 2 000 usuarios abren muchas conexiones: se reutilizan entre iteraciones.
  noConnectionReuse: false,
} : {
  scenarios: {
    usuarios_10: { executor: 'constant-vus', vus: 10, duration: d('1m'), startTime: '0s', tags: { nivel: '10' } },
    usuarios_30: { executor: 'constant-vus', vus: 30, duration: d('3m'), startTime: d('1m'), tags: { nivel: '30' } },
    usuarios_60: { executor: 'constant-vus', vus: 60, duration: d('2m'), startTime: RAPIDO ? '20s' : '4m', tags: { nivel: '60' } },
    hasta_500: { executor: 'ramping-vus', startVUs: 60, startTime: RAPIDO ? '30s' : '6m', tags: { nivel: '500' },
      stages: [{ duration: d('1m'), target: 250 }, { duration: d('1m'), target: 500 }, { duration: d('1m'), target: 500 }] },
  },
  // Metas de 08 - Escenarios: EQ-01 con 30 usuarios (p95 ≤ 1 s); EQ-03 con 60 (p95 ≤ 2 s); errores técnicos < 1 %.
  thresholds: {
    'http_req_duration{nivel:10}': ['p(95)<1000'],
    'http_req_duration{nivel:30}': ['p(95)<1000'],
    'http_req_duration{nivel:60}': ['p(95)<2000'],
    'http_req_duration{nivel:500}': ['p(95)<1000'],
    'http_req_failed{nivel:30}': ['rate<0.01'],
    'http_req_failed{nivel:60}': ['rate<0.01'],
    'http_req_failed{nivel:500}': ['rate<0.01'],
  },
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

const tipos = ['', 'herramienta', 'servicio'];
const categorias = { herramienta: ['perforacion', 'corte', 'pintura', 'jardineria', 'limpieza'], servicio: ['gasfiteria', 'electricidad', 'carpinteria', 'pintor', 'jardinero'] };
const zonas = ['', 'ayacucho', 'san-juan-bautista', 'carmen-alto', 'jesus-nazareno'];
const textos = ['', '', 'taladro', 'gasfitero', 'pintor', 'amoladora'];
// k6 no incluye URLSearchParams: la consulta se arma a mano.
const consulta = p => Object.entries(p).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
const azar = a => a[Math.floor(Math.random() * a.length)];

// Una sesión por cliente sintético (el inicio de sesión tiene límite por IP); los usuarios virtuales las comparten.
export function setup() {
  return {
    cookies: datos.clientes.map(email => {
      const r = http.post(API + '/auth/login', JSON.stringify({ email, password: datos.password }), { headers: { 'Content-Type': 'application/json', Origin: ORIGEN }, tags: { nivel: 'preparacion' } });
      if (r.status !== 200) throw new Error('No se pudo iniciar sesión: ' + r.status);
      return r.headers['Set-Cookie'].split(';')[0];
    }),
  };
}

export default function (s) {
  const x = Math.random();
  if (x < 0.7) {
    const tipo = azar(tipos), p = {};
    if (tipo) { p.tipo = tipo; if (Math.random() < 0.6) p.categoriaId = azar(categorias[tipo]); }
    const zona = azar(zonas), q = azar(textos);
    if (zona) p.zonaId = zona;
    if (q) p.q = q;
    if (Math.random() < 0.3) p.orden = 'precio';
    p.page = String(1 + Math.floor(Math.random() * 3));
    const r = http.get(API + '/publicaciones?' + consulta(p), { tags: { operacion: 'busqueda' } });
    check(r, { 'búsqueda 200': v => v.status === 200, 'máximo 20 resultados': v => v.status !== 200 || v.json('items').length <= 20 });
  } else if (x < 0.9) {
    const r = http.get(API + '/publicaciones/' + azar(datos.muestras).publicacionId, { tags: { operacion: 'detalle' } });
    check(r, { 'detalle 200': v => v.status === 200 });
  } else if (x < 0.95) {
    const r = http.get(API + '/reservas', { headers: { Cookie: azar(s.cookies) }, tags: { operacion: 'mis_reservas' } });
    check(r, { 'reservas 200': v => v.status === 200 });
  } else {
    const m = azar(datos.muestras), inicio = new Date(Date.UTC(2027, 1, 1 + Math.floor(Math.random() * 60)));
    const fin = new Date(inicio.getTime() + 86_400_000);
    const r = http.get(`${API}/recursos/${m.recursoId}/disponibilidad?publicacionId=${m.publicacionId}&inicio=${inicio.toISOString()}&fin=${fin.toISOString()}`, { tags: { operacion: 'disponibilidad' } });
    check(r, { 'disponibilidad 200': v => v.status === 200 });
  }
  sleep(0.5 + Math.random()); // tiempo de lectura de una persona entre acciones
}

export function handleSummary(resumen) {
  // setup_data trae las cookies de sesión de los clientes de prueba: no se guardan.
  const { setup_data: _sesiones, ...publico } = resumen;
  return { [__ENV.SALIDA || 'resumen-k6.json']: JSON.stringify(publico, null, 2), stdout: textoResumen(resumen) };
}

function textoResumen(r) {
  const m = r.metrics, lineas = ['Resumen de la prueba de carga (k6)', ''];
  for (const nivel of NIVELES) {
    const t = m[`http_req_duration{nivel:${nivel}}`]?.values, f = m[`http_req_failed{nivel:${nivel}}`]?.values;
    if (t) lineas.push(`${nivel.padStart(4)} usuarios: p50 ${t.med.toFixed(0)} ms, p95 ${t['p(95)'].toFixed(0)} ms, p99 ${t['p(99)'].toFixed(0)} ms, máx ${t.max.toFixed(0)} ms` + (f ? `, errores ${(f.rate * 100).toFixed(2)} %` : ''));
  }
  lineas.push('', `Peticiones: ${m.http_reqs.values.count} (${m.http_reqs.values.rate.toFixed(1)}/s); checks correctos: ${(m.checks.values.rate * 100).toFixed(2)} %`);
  for (const [k, v] of Object.entries(r.metrics)) if (k.startsWith('http_req_') && k.includes('{nivel') && v.thresholds) for (const [u, e] of Object.entries(v.thresholds)) lineas.push(`${e.ok ? 'CUMPLE' : 'NO CUMPLE'}  ${k} ${u}`);
  return lineas.join('\n') + '\n';
}

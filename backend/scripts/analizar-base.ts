import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool, type QueryResult } from 'pg';
import { PostgresCatalogo } from '../src/modules/catalogo/infraestructura/postgres';
import { PostgresProveedores } from '../src/modules/proveedores/infraestructura/postgres';
import { PostgresReservas } from '../src/modules/reservas/infraestructura/postgres';
import { PostgresUsuarios } from '../src/modules/usuarios/infraestructura/postgres';
import type { FiltrosCatalogo } from '../src/modules/catalogo/dominio/oferta';

/**
 * Análisis del comportamiento de la base de datos (Sprint 2, actividad 5).
 * Ejecuta las consultas reales de los repositorios —mismo SQL y parámetros que la API— y guarda el plan de
 * PostgreSQL de cada una (EXPLAIN ANALYZE, BUFFERS), más el tamaño de las tablas y el uso de los índices.
 * Requiere una base _test con los datos de carga (test/carga/datos-carga.ts). Solo lee.
 * Uso: DATABASE_URL=postgresql://…/<base>_test npm run base:analizar
 */
const SALIDA = resolve(__dirname, '../../docs/06-pruebas-atributos-calidad/base-de-datos');

type Plan = { 'Execution Time': number; 'Planning Time': number; Plan: Record<string, unknown> };
interface Medicion { consulta: string; repeticiones: number; mediaMs: number; maximoMs: number; nodos: string[]; indices: string[]; filasLeidas: number; bloquesCache: number; bloquesDisco: number; plan: Plan }

/** Pool espía: corre cada consulta con EXPLAIN ANALYZE y guarda el plan; devuelve el resultado real al repositorio. */
class PoolAnalizador {
  planes: Plan[] = [];
  constructor(private readonly pool: Pool) {}
  async query(sql: string, args?: unknown[]): Promise<QueryResult> {
    if (/^\s*(SELECT|WITH)\b/i.test(sql)) {
      const r = await this.pool.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`, args);
      this.planes.push(r.rows[0]['QUERY PLAN'][0]);
    }
    return this.pool.query(sql, args);
  }
}

function recorrer(nodo: Record<string, unknown>, visita: (n: Record<string, unknown>) => void) {
  visita(nodo);
  for (const hijo of (nodo.Plans as Record<string, unknown>[] | undefined) ?? []) recorrer(hijo, visita);
}

async function medir(nombre: string, analizador: PoolAnalizador, accion: () => Promise<unknown>, repeticiones = 5): Promise<Medicion> {
  await accion(); // calienta la caché de PostgreSQL, como en uso real
  const tiempos: number[] = []; let ultimo: Plan[] = [];
  for (let i = 0; i < repeticiones; i++) {
    analizador.planes = [];
    await accion();
    ultimo = analizador.planes;
    tiempos.push(ultimo.reduce((s, p) => s + p['Execution Time'] + p['Planning Time'], 0));
  }
  const nodos = new Set<string>(), indices = new Set<string>(); let filas = 0, cache = 0, disco = 0;
  for (const p of ultimo) recorrer(p.Plan, n => {
    nodos.add(String(n['Node Type']));
    if (n['Index Name']) indices.add(String(n['Index Name']));
    if (n['Node Type'] === 'Seq Scan' || String(n['Node Type']).includes('Index') || n['Node Type'] === 'Bitmap Heap Scan') filas += Number(n['Actual Rows'] ?? 0) * Number(n['Actual Loops'] ?? 1);
  });
  for (const p of ultimo) { cache += Number(p.Plan['Shared Hit Blocks'] ?? 0); disco += Number(p.Plan['Shared Read Blocks'] ?? 0); }
  return { consulta: nombre, repeticiones, mediaMs: +(tiempos.reduce((a, b) => a + b, 0) / tiempos.length).toFixed(2), maximoMs: +Math.max(...tiempos).toFixed(2),
    nodos: [...nodos], indices: [...indices], filasLeidas: filas, bloquesCache: cache, bloquesDisco: disco, plan: ultimo[0] };
}

async function principal() {
  const url = process.env.DATABASE_URL;
  if (!url || !new URL(url).pathname.endsWith('_test')) throw new Error('Se requiere una base _test con los datos de carga.');
  const pool = new Pool({ connectionString: url, max: 2 });
  const analizador = new PoolAnalizador(pool), espia = analizador as unknown as Pool;
  try {
    const catalogo = new PostgresCatalogo(espia), proveedores = new PostgresProveedores(espia), usuarios = new PostgresUsuarios(espia);
    const reservas = new PostgresReservas(espia, { marcarReembolso: async () => undefined } as never);
    const muestra = (await pool.query(`SELECT p.id, r.id AS recurso, (SELECT cliente_id FROM reservas GROUP BY cliente_id ORDER BY count(*) DESC LIMIT 1) AS cliente
      FROM catalogo_publicaciones p JOIN catalogo_recursos r ON r.publicacion_id = p.id ORDER BY p.creado_en LIMIT 1`)).rows[0];
    const habilitados = (await proveedores.publicables()).map(p => p.id);
    const f = (extra: Partial<FiltrosCatalogo> = {}): FiltrosCatalogo => ({ q: '', tipo: '', categoriaId: '', zonaId: '', page: 1, limit: 20, orden: 'recomendados', ...extra });
    const inicio = '2027-02-01T15:00:00.000Z', fin = '2027-03-01T15:00:00.000Z';

    const mediciones: Medicion[] = [];
    mediciones.push(await medir('Búsqueda pública sin filtros (página 1)', analizador, () => catalogo.listar(f(), { habilitados })));
    mediciones.push(await medir('Búsqueda por texto «taladro»', analizador, () => catalogo.listar(f({ q: 'taladro' }), { habilitados })));
    mediciones.push(await medir('Búsqueda por tipo, categoría y distrito, orden por precio', analizador, () => catalogo.listar(f({ tipo: 'herramienta', categoriaId: 'perforacion', zonaId: 'ayacucho', orden: 'precio' }), { habilitados })));
    mediciones.push(await medir('Búsqueda con presupuesto máximo, página 3', analizador, () => catalogo.listar(f({ precioMaximoCentimos: 5000, page: 3 }), { habilitados })));
    mediciones.push(await medir('Detalle de una publicación', analizador, () => catalogo.porId(muestra.id)));
    mediciones.push(await medir('Proveedores habilitados (perfiles publicables)', analizador, () => proveedores.publicables()));
    mediciones.push(await medir('Proveedores habilitados (cuentas activas)', analizador, () => usuarios.cuentasActivas(habilitados.length ? habilitados : [muestra.cliente])));
    mediciones.push(await medir('Mis reservas (cliente con más reservas, página 1)', analizador, () => reservas.listar(muestra.cliente, 'cliente', 1)));
    mediciones.push(await medir('Disponibilidad de una unidad en un mes', analizador, () => reservas.disponibilidad(muestra.recurso, inicio, fin)));

    const tablas = (await pool.query(`SELECT relname AS tabla, n_live_tup::int AS filas, pg_size_pretty(pg_total_relation_size(relid)) AS tamano,
      pg_total_relation_size(relid) AS bytes FROM pg_stat_user_tables ORDER BY pg_total_relation_size(relid) DESC LIMIT 12`)).rows;
    const indices = (await pool.query(`SELECT relname AS tabla, indexrelname AS indice, idx_scan::int AS usos, pg_size_pretty(pg_relation_size(indexrelid)) AS tamano
      FROM pg_stat_user_indexes WHERE relname IN ('catalogo_publicaciones','catalogo_recursos','catalogo_tarifas','reservas','reservas_bloqueos','proveedores','usuarios')
      ORDER BY relname, idx_scan DESC`)).rows;
    const config = (await pool.query(`SELECT name, setting, unit FROM pg_settings WHERE name IN ('server_version','max_connections','shared_buffers','work_mem','effective_cache_size','random_page_cost','default_text_search_config')`)).rows;
    const conteo = (await pool.query(`SELECT (SELECT count(*) FROM catalogo_publicaciones)::int AS publicaciones, (SELECT count(*) FROM proveedores)::int AS proveedores, (SELECT count(*) FROM reservas)::int AS reservas, (SELECT count(*) FROM usuarios)::int AS usuarios`)).rows[0];

    mkdirSync(SALIDA, { recursive: true });
    writeFileSync(resolve(SALIDA, 'planes.json'), JSON.stringify({ fecha: new Date().toISOString(), datos: conteo, configuracion: config, mediciones, tablas, indices }, null, 2) + '\n');
    const fila = (m: Medicion) => `| ${m.consulta} | ${m.mediaMs} | ${m.maximoMs} | ${m.nodos.filter(n => /Scan|Join|Sort|Aggregate|Limit|Window/.test(n)).join(', ')} | ${m.indices.join(', ') || '—'} | ${m.bloquesCache} / ${m.bloquesDisco} |`;
    const md = [
      `Datos: ${conteo.publicaciones} publicaciones, ${conteo.proveedores} proveedores, ${conteo.reservas} reservas, ${conteo.usuarios} usuarios. ${config.find(c => c.name === 'server_version')?.setting ? 'PostgreSQL ' + config.find(c => c.name === 'server_version').setting : ''}.`,
      '',
      '| Consulta | Media (ms) | Máximo (ms) | Operaciones del plan | Índices usados | Bloques caché / disco |',
      '|---|---|---|---|---|---|',
      ...mediciones.map(fila),
    ].join('\n');
    writeFileSync(resolve(SALIDA, 'mediciones.md'), md + '\n');
    console.log(md);
  } finally { await pool.end(); }
}

principal().catch(error => { console.error('No se pudo analizar la base:', error instanceof Error ? error.message : error); process.exitCode = 1; });

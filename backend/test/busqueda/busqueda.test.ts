import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { describe, test } from '@jest/globals';
import { Pool } from 'pg';
import { crearApp } from '../../src/app';
import { ErrorAplicacion } from '../../src/shared/dominio/error-aplicacion';
import { BuscarEnLenguajeNatural, hoyEnLima, type CatalogoBusqueda } from '../../src/modules/busqueda/aplicacion/busqueda';
import { combinar, entradaBusqueda, FalloInterprete, validarRespuesta, type InterpreteIntencion, type OpcionesCatalogo } from '../../src/modules/busqueda/dominio/intencion';
import { InterpreteOpenRouter, MODELO_POR_DEFECTO } from '../../src/modules/busqueda/infraestructura/openrouter';
import { caso } from '../caso';

const opciones: OpcionesCatalogo = {
  categorias: [{ id: 'perforacion', nombre: 'Perforación', tipo: 'herramienta' }, { id: 'gasfiteria', nombre: 'Gasfitería', tipo: 'servicio' }],
  zonas: [{ id: 'ayacucho', nombre: 'Ayacucho' }, { id: 'carmen-alto', nombre: 'Carmen Alto' }],
};
const respuesta = (extra: Record<string, unknown> = {}) => ({ palabrasClave: 'taladro', tipo: 'herramienta', categoriaId: 'perforacion', zonaId: 'ayacucho', precioMaximoSoles: 40, fechaInicio: null, fechaFin: null, camposQueRequierenPrecision: [], ...extra });

describe('dominio: la salida de la IA no es confiable', () => {
  test('una respuesta válida se convierte en criterios (soles → céntimos)', () => {
    const r = validarRespuesta(respuesta(), opciones);
    assert.deepEqual(r.criterios, { q: 'taladro', tipo: 'herramienta', categoriaId: 'perforacion', zonaId: 'ayacucho', precioMaximoCentimos: 4000 });
    assert.deepEqual(r.camposQueRequierenPrecision, []);
    assert.equal(r.fechas, null);
  });

  test('ids inventados, tipos incompatibles y precios inválidos se descartan y piden precisión', () => {
    const r = validarRespuesta(respuesta({ categoriaId: 'drones', zonaId: 'lima', precioMaximoSoles: -5, tipo: 'vehiculo' }), opciones);
    assert.deepEqual(r.criterios, { q: 'taladro', tipo: null, categoriaId: null, zonaId: null, precioMaximoCentimos: null });
    assert.deepEqual(r.camposQueRequierenPrecision, ['zona', 'categoria', 'presupuesto', 'tipo']);
    const conflicto = validarRespuesta(respuesta({ tipo: 'servicio', categoriaId: 'perforacion' }), opciones);
    assert.equal(conflicto.criterios.categoriaId, null);
    assert.ok(conflicto.camposQueRequierenPrecision.includes('categoria'));
  });

  test('la categoría fija el tipo; las fechas siempre se confirman; un rango invertido se descarta', () => {
    const r = validarRespuesta(respuesta({ tipo: null, fechaInicio: '2026-12-05', fechaFin: '2026-12-06' }), opciones);
    assert.equal(r.criterios.tipo, 'herramienta');
    assert.deepEqual(r.fechas, { inicio: '2026-12-05', fin: '2026-12-06' });
    assert.deepEqual(r.camposQueRequierenPrecision, ['fechas']);
    assert.equal(validarRespuesta(respuesta({ fechaInicio: '2026-12-06', fechaFin: '2026-12-05' }), opciones).fechas, null);
    assert.equal(validarRespuesta(respuesta({ fechaInicio: 'el sábado' }), opciones).fechas, null);
  });

  test('forma inesperada: campos extra o no es un objeto → respuesta inválida', () => {
    assert.throws(() => validarRespuesta(respuesta({ sql: 'DROP TABLE' }), opciones), (e: unknown) => e instanceof FalloInterprete && e.motivo === 'respuesta_invalida');
    for (const malo of [null, 'texto', [], { palabrasClave: 'x' }]) assert.throws(() => validarRespuesta(malo, opciones), FalloInterprete);
  });

  test('palabras clave con caracteres de control o demasiado largas se descartan', () => {
    assert.equal(validarRespuesta(respuesta({ palabrasClave: 'taladro\u0000' }), opciones).criterios.q, null);
    assert.equal(validarRespuesta(respuesta({ palabrasClave: 'x'.repeat(101) }), opciones).criterios.q, null);
  });

  test('los filtros manuales prevalecen; un tipo manual descarta una categoría deducida de otro tipo', () => {
    const ia = validarRespuesta(respuesta(), opciones).criterios;
    assert.deepEqual(combinar(ia, { zonaId: 'carmen-alto', precioMaximoCentimos: 2500 }, opciones), { ...ia, zonaId: 'carmen-alto', precioMaximoCentimos: 2500 });
    assert.deepEqual(combinar(ia, { tipo: 'servicio' }, opciones), { ...ia, tipo: 'servicio', categoriaId: null });
    assert.deepEqual(combinar(ia, { tipo: 'servicio', categoriaId: 'perforacion' }, opciones), { ...ia, tipo: 'herramienta', categoriaId: 'perforacion' });
  });

  test('entrada: texto de 1 a 500 caracteres, filtros y página válidos, sin campos extra', () => {
    assert.deepEqual(entradaBusqueda({ texto: '  taladro   barato ' }, opciones), { texto: 'taladro barato', manual: {}, page: 1 });
    assert.deepEqual(entradaBusqueda({ texto: 'x', filtros: { zonaId: 'ayacucho' }, page: 2 }, opciones).manual, { zonaId: 'ayacucho' });
    for (const malo of [{}, { texto: '' }, { texto: 'x'.repeat(501) }, { texto: 'x', otro: 1 }, { texto: 'x', filtros: { zonaId: 'lima' } }, { texto: 'x', page: 0 }, { texto: 'x', filtros: { precioMaximoCentimos: 1.5 } }]) {
      assert.throws(() => entradaBusqueda(malo, opciones), /Revisa|Escribe|Página/);
    }
  });

  test('la fecha de referencia es la de Lima (UTC−5)', () => {
    assert.equal(hoyEnLima(Date.parse('2026-12-01T03:00:00Z')), '2026-11-30');
    assert.equal(hoyEnLima(Date.parse('2026-12-01T06:00:00Z')), '2026-12-01');
  });
});

describe('adapter de OpenRouter', () => {
  const contexto = { fechaReferencia: '2026-11-25', opciones };
  function falso(respuestaHttp: () => Response) {
    const llamadas: Array<{ url: string; init: RequestInit }> = [];
    const pedir = (async (url: string, init: RequestInit) => { llamadas.push({ url, init }); return respuestaHttp(); }) as unknown as typeof fetch;
    return { llamadas, interprete: new InterpreteOpenRouter('clave-de-prueba', MODELO_POR_DEFECTO, 'https://ia.example/api/v1', pedir) };
  }
  const ok = (contenido: string) => () => new Response(JSON.stringify({ choices: [{ message: { content: contenido } }] }), { status: 200 });

  test('envía solo la consulta y las listas cerradas, con esquema estricto y sin creatividad', async () => {
    const { llamadas, interprete } = falso(ok(JSON.stringify(respuesta())));
    assert.deepEqual(await interprete.interpretar('taladro barato', contexto, new AbortController().signal), respuesta());
    assert.equal(llamadas[0].url, 'https://ia.example/api/v1/chat/completions');
    assert.equal((llamadas[0].init.headers as Record<string, string>).Authorization, 'Bearer clave-de-prueba');
    const cuerpo = JSON.parse(String(llamadas[0].init.body));
    assert.equal(cuerpo.model, MODELO_POR_DEFECTO);
    assert.equal(cuerpo.temperature, 0);
    assert.equal(cuerpo.response_format.json_schema.strict, true);
    assert.deepEqual(cuerpo.response_format.json_schema.schema.properties.categoriaId.anyOf[0].enum, ['perforacion', 'gasfiteria']);
    assert.deepEqual(JSON.parse(cuerpo.messages[1].content), { consulta: 'taladro barato', hoy: '2026-11-25', categorias: opciones.categorias, distritos: opciones.zonas });
    assert.equal(cuerpo.provider.data_collection, 'deny');
  });

  test('acepta el JSON dentro de un bloque de código', async () => {
    const { interprete } = falso(ok('```json\n' + JSON.stringify(respuesta()) + '\n```'));
    assert.deepEqual(await interprete.interpretar('x', contexto, new AbortController().signal), respuesta());
  });

  test('429/402 → cuota; 5xx → error; contenido no JSON → respuesta inválida; cancelación → tiempo', async () => {
    const motivo = async (r: () => Response, senal = new AbortController().signal) => {
      try { await falso(r).interprete.interpretar('x', contexto, senal); return 'sin error'; } catch (e) { return e instanceof FalloInterprete ? e.motivo : 'otro'; }
    };
    assert.equal(await motivo(() => new Response('{}', { status: 429 })), 'cuota');
    assert.equal(await motivo(() => new Response('{}', { status: 402 })), 'cuota');
    assert.equal(await motivo(() => new Response('{}', { status: 503 })), 'error');
    assert.equal(await motivo(ok('no es json')), 'respuesta_invalida');
    assert.equal(await motivo(() => new Response(JSON.stringify({ choices: [] }), { status: 200 })), 'respuesta_invalida');
    const cancelada = new AbortController(); cancelada.abort();
    const lento = new InterpreteOpenRouter('k', MODELO_POR_DEFECTO, 'https://ia.example', (async () => { throw new DOMException('abortado', 'AbortError'); }) as unknown as typeof fetch);
    await assert.rejects(lento.interpretar('x', contexto, cancelada.signal), (e: unknown) => e instanceof FalloInterprete && e.motivo === 'tiempo');
  });
});

describe('caso de uso: la búsqueda nunca se bloquea por la IA', () => {
  function armar(interprete: InterpreteIntencion | null, opcionesExtra: { total?: (c: Record<string, string>) => number; limite?: boolean } = {}) {
    const consultas: Array<Record<string, string>> = [];
    const catalogo: CatalogoBusqueda = {
      opciones: () => opciones,
      buscar: async c => { consultas.push(c); const total = opcionesExtra.total?.(c) ?? 3; return { items: Array.from({ length: Math.min(total, 20) }, (_, i) => ({ id: String(i) })), total, page: Number(c.page), limit: 20 }; },
    };
    const limites = { limitar: async () => { if (opcionesExtra.limite) throw new ErrorAplicacion('LIMITE_ACCESO', 429, 'límite'); } };
    return { consultas, buscar: new BuscarEnLenguajeNatural(catalogo, limites as never, interprete, { tiempoMs: 50, limitePorIp: 30, limiteGlobal: 600 }, () => Date.parse('2026-11-25T15:00:00Z')) };
  }
  const interpreteCon = (valor: unknown): InterpreteIntencion => ({ nombre: 'doble', interpretar: async () => valor });

  test('modo natural: aplica los criterios interpretados y consulta el catálogo real', async () => {
    const { consultas, buscar } = armar(interpreteCon(respuesta()));
    const r = await buscar.ejecutar('1.1.1.1', { texto: 'taladro en el centro por menos de 40 soles' });
    assert.equal(r.modo, 'natural'); assert.equal(r.motivo, null); assert.equal(r.aviso, null);
    assert.deepEqual(consultas[0], { page: '1', limit: '20', q: 'taladro', tipo: 'herramienta', categoriaId: 'perforacion', zonaId: 'ayacucho', precioMaximoCentimos: '4000' });
    assert.equal(r.resultados.total, 3);
  });

  test('sin IA configurada, con error, con respuesta inválida o fuera de tiempo: modo convencional con el texto', async () => {
    const casos: Array<[InterpreteIntencion | null, string]> = [
      [null, 'sin_configurar'],
      [{ nombre: 'falla', interpretar: async () => { throw new FalloInterprete('error'); } }, 'error'],
      [{ nombre: 'falla rara', interpretar: async () => { throw new TypeError('x'); } }, 'error'],
      [interpreteCon({ sql: 'DROP TABLE' }), 'respuesta_invalida'],
      [{ nombre: 'lento', interpretar: (_t, _c, senal) => new Promise((_, no) => senal.addEventListener('abort', () => no(new Error('abort')))) }, 'tiempo'],
    ];
    for (const [interprete, motivo] of casos) {
      const { consultas, buscar } = armar(interprete);
      const r = await buscar.ejecutar('1.1.1.1', { texto: 'taladro barato', filtros: { zonaId: 'ayacucho' } });
      assert.equal(r.modo, 'convencional', motivo); assert.equal(r.motivo, motivo);
      assert.ok(r.aviso);
      assert.deepEqual(consultas[0], { page: '1', limit: '20', q: 'taladro barato', zonaId: 'ayacucho' }, 'el filtro manual se conserva');
    }
  });

  test('cuota agotada (429 del límite): modo convencional sin llamar a la IA', async () => {
    let llamada = false;
    const { buscar } = armar({ nombre: 'x', interpretar: async () => { llamada = true; return respuesta(); } }, { limite: true });
    const r = await buscar.ejecutar('1.1.1.1', { texto: 'taladro' });
    assert.equal(r.motivo, 'cuota'); assert.equal(llamada, false);
  });

  test('si las palabras clave no encuentran nada, prueba la misma categoría sin ellas', async () => {
    const { consultas, buscar } = armar(interpreteCon(respuesta({ palabrasClave: 'taladro rojo' })), { total: c => c.q ? 0 : 5 });
    const r = await buscar.ejecutar('1.1.1.1', { texto: 'taladro rojo' });
    assert.equal(consultas.length, 2); assert.equal(consultas[1].q, undefined);
    assert.equal(r.criterios.q, null); assert.equal(r.resultados.total, 5); assert.match(r.aviso!, /misma categoría/);
  });

  test('entrada inválida → 400, sin llamar a la IA', async () => {
    let llamada = false;
    const { buscar } = armar({ nombre: 'x', interpretar: async () => { llamada = true; return respuesta(); } });
    await assert.rejects(buscar.ejecutar('1.1.1.1', { texto: '' }), (e: unknown) => (e as { status?: number }).status === 400);
    assert.equal(llamada, false);
  });
});

(!process.env.TEST_DATABASE_URL ? test.skip : test)('HTTP con PostgreSQL y un OpenRouter falso: modo natural, respaldo y Origin', async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET = 'secreto-exclusivo-busqueda-pruebas-2026-qatu'; process.env.APP_ORIGIN = 'http://127.0.0.1:3100'; process.env.NODE_ENV = 'test'; process.env.QATU_DESPACHO_EVENTOS = 'inactivo';
  const f = JSON.parse(execFileSync(process.execPath, ['--import', 'tsx', 'test/reservas/fixture-e2e.ts'], { encoding: 'utf8', env: { ...process.env, QATU_E2E_RESERVAS: '1' } }));
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const oferta = (await pool.query('SELECT categoria_id, zona_id FROM catalogo_publicaciones WHERE id=$1', [f.publicacionId])).rows[0];
  await pool.end();

  // OpenRouter falso: responde lo que diga «modo» y guarda lo que recibió.
  let modo: 'ok' | 'basura' | 'lento' = 'ok'; const recibidos: unknown[] = [];
  const servidor: Server = createServer((req, res) => {
    let cuerpo = ''; req.on('data', d => cuerpo += d).on('end', () => {
      recibidos.push(JSON.parse(cuerpo));
      if (modo === 'lento') { setTimeout(() => res.end('{}'), 5000).unref(); return; }
      const contenido = modo === 'basura' ? 'no es json' : JSON.stringify(respuesta({ palabrasClave: null, categoriaId: oferta.categoria_id, tipo: null, zonaId: oferta.zona_id, precioMaximoSoles: null }));
      res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ choices: [{ message: { content: contenido } }] }));
    });
  });
  await new Promise<void>(ok => servidor.listen(0, '127.0.0.1', ok));
  process.env.OPENROUTER_API_KEY = 'clave-falsa'; process.env.QATU_IA_URL = `http://127.0.0.1:${(servidor.address() as { port: number }).port}`;
  const app = await crearApp(); await app.listen(0, '127.0.0.1'); const base = await app.getUrl() + '/api/v1';
  const pedir = (cuerpo: unknown, origen = process.env.APP_ORIGIN!) => fetch(base + '/busqueda/intencion', { method: 'POST', headers: { Origin: origen, 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
  try {
    await caso('natural: los criterios de la IA traen la oferta real del catálogo', async () => {
      const r = await pedir({ texto: 'necesito algo para mañana en mi casa' });
      assert.equal(r.status, 200);
      const b = await r.json();
      assert.equal(b.modo, 'natural');
      assert.equal(b.criterios.categoriaId, oferta.categoria_id);
      assert.ok(b.resultados.items.some((i: { id: string }) => i.id === f.publicacionId));
      const enviado = recibidos.at(-1) as { messages: Array<{ content: string }> };
      assert.equal(JSON.parse(enviado.messages[1].content).consulta, 'necesito algo para mañana en mi casa');
      assert.doesNotMatch(JSON.stringify(enviado), /example\.com|qatu_sesion/, 'no se envían datos de cuentas ni sesiones');
    });
    await caso('respuesta basura: modo convencional, 200', async () => {
      modo = 'basura';
      const b = await (await pedir({ texto: 'taladro' })).json();
      assert.equal(b.modo, 'convencional'); assert.equal(b.motivo, 'respuesta_invalida'); assert.equal(b.criterios.q, 'taladro');
    });
    await caso('IA lenta: corta a los 3 s y responde en modo convencional', async () => {
      modo = 'lento';
      const inicio = Date.now();
      const b = await (await pedir({ texto: 'taladro' })).json();
      assert.equal(b.motivo, 'tiempo');
      assert.ok(Date.now() - inicio < 4500, 'no espera a la IA más de lo debido');
    });
    await caso('escritura sin Origin: 403, como el resto de la API; entrada inválida: 400', async () => {
      assert.equal((await pedir({ texto: 'taladro' }, 'https://otro.example')).status, 403);
      assert.equal((await pedir({ texto: 'x'.repeat(501) })).status, 400);
    });
  } finally {
    await app.close(); servidor.closeAllConnections(); servidor.close();
    process.env.OPENROUTER_API_KEY = ''; delete process.env.QATU_IA_URL;
  }
});

(process.env.QATU_IA_PRUEBAS !== '1' || !process.env.OPENROUTER_API_KEY ? test.skip : test)('OpenRouter real (QATU_IA_PRUEBAS=1): interpreta una consulta explícita', async () => {
  const interprete = new InterpreteOpenRouter(process.env.OPENROUTER_API_KEY!, process.env.QATU_IA_MODELO || MODELO_POR_DEFECTO);
  const crudo = await interprete.interpretar('busco un taladro en el centro por menos de 40 soles', { fechaReferencia: '2026-11-25', opciones }, AbortSignal.timeout(10000));
  const r = validarRespuesta(crudo, opciones);
  assert.equal(r.criterios.categoriaId, 'perforacion');
  assert.equal(r.criterios.tipo, 'herramienta');
  assert.equal(r.criterios.zonaId, 'ayacucho');
  assert.equal(r.criterios.precioMaximoCentimos, 4000);
});

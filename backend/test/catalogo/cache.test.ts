import assert from 'node:assert/strict';
import { describe, expect, test } from '@jest/globals';
import { CacheMemoria, segundosDeCache } from '../../src/shared/infraestructura/cache';
import { ProveedoresCatalogoEnCache, RepositorioCatalogoEnCache } from '../../src/modules/catalogo/infraestructura/cache';
import type { FiltrosCatalogo, Publicacion } from '../../src/modules/catalogo/dominio/oferta';
import type { ProveedoresCatalogo, RepositorioCatalogo } from '../../src/modules/catalogo/dominio/puertos';
import { crearApp } from '../../src/app';

const filtros = (extra: Partial<FiltrosCatalogo> = {}): FiltrosCatalogo => ({ q: '', tipo: '', categoriaId: '', zonaId: '', page: 1, limit: 20, orden: 'recomendados', ...extra });

describe('CacheMemoria', () => {
  test('guarda durante el TTL y vuelve a leer al vencer', async () => {
    let ahora = 0, lecturas = 0;
    const cache = new CacheMemoria<number>(1000, 10, () => ahora);
    const leer = () => cache.obtener('a', async () => ++lecturas);
    expect(await leer()).toBe(1);
    ahora = 999; expect(await leer()).toBe(1);
    ahora = 1000; expect(await leer()).toBe(2);
    expect(cache.estadisticas()).toEqual({ entradas: 1, aciertos: 1, fallos: 2 });
  });

  test('peticiones simultáneas comparten una sola lectura', async () => {
    let lecturas = 0;
    const cache = new CacheMemoria<string>(1000);
    const resultados = await Promise.all(Array.from({ length: 20 }, () => cache.obtener('x', async () => { lecturas++; await new Promise(r => setTimeout(r, 20)); return 'ok'; })));
    expect(lecturas).toBe(1);
    expect(new Set(resultados)).toEqual(new Set(['ok']));
  });

  test('un error no queda guardado', async () => {
    const cache = new CacheMemoria<string>(1000);
    await expect(cache.obtener('x', async () => { throw new Error('base caída'); })).rejects.toThrow('base caída');
    expect(await cache.obtener('x', async () => 'recuperado')).toBe('recuperado');
  });

  test('con más entradas que el máximo sale la usada hace más tiempo (LRU)', async () => {
    const cache = new CacheMemoria<string>(1000, 2);
    await cache.obtener('a', async () => 'a'); await cache.obtener('b', async () => 'b');
    await cache.obtener('a', async () => 'otra'); // a pasa a ser la más reciente
    await cache.obtener('c', async () => 'c');    // sale b
    expect(await cache.obtener('a', async () => 'nueva')).toBe('a');
    expect(await cache.obtener('b', async () => 'releída')).toBe('releída');
  });

  test('invalidar vacía todo; con TTL 0 no guarda nada', async () => {
    let n = 0;
    const cache = new CacheMemoria<number>(1000);
    await cache.obtener('x', async () => ++n); cache.invalidar();
    expect(await cache.obtener('x', async () => ++n)).toBe(2);
    const apagada = new CacheMemoria<number>(0);
    expect(apagada.activa).toBe(false);
    await apagada.obtener('x', async () => ++n);
    expect(apagada.estadisticas().entradas).toBe(0);
  });

  test('QATU_CACHE_SEGUNDOS: 30 por defecto, 0 en pruebas, rango 0–300', () => {
    expect(segundosDeCache({})).toBe(30);
    expect(segundosDeCache({ NODE_ENV: 'test' })).toBe(0);
    expect(segundosDeCache({ NODE_ENV: 'test', QATU_CACHE_SEGUNDOS: '15' })).toBe(15);
    expect(() => segundosDeCache({ QATU_CACHE_SEGUNDOS: '301' })).toThrow();
    expect(() => segundosDeCache({ QATU_CACHE_SEGUNDOS: '-1' })).toThrow();
    expect(() => new CacheMemoria(-1)).toThrow();
  });
});

describe('Catálogo en caché (decorador)', () => {
  function repositorio(falla = false) {
    const llamadas: string[] = [];
    const pagina = { items: [] as Publicacion[], total: 0 };
    const base = {
      listar: async (_f: FiltrosCatalogo, alcance: object) => { llamadas.push('listar ' + JSON.stringify(alcance)); return pagina; },
      porId: async () => { llamadas.push('porId'); return null; },
      crear: async () => { llamadas.push('crear'); if (falla) throw new Error('conflicto'); return {} as Publicacion; },
      editar: async () => ({} as Publicacion), moderar: async () => ({} as Publicacion), auditoria: async () => [],
      ubicacion: async () => null, guardarUbicacion: async (_id: string, u: never) => u, quitarUbicacion: async () => {},
    } satisfies RepositorioCatalogo;
    return { base, llamadas };
  }

  test('la búsqueda pública se guarda; la del dueño y la del administrador no', async () => {
    const { base, llamadas } = repositorio();
    const repo = new RepositorioCatalogoEnCache(base, new CacheMemoria(30000));
    await repo.listar(filtros(), { habilitados: ['p1', 'p2'] });
    await repo.listar(filtros(), { habilitados: ['p2', 'p1'] }); // mismo conjunto, otro orden
    await repo.listar(filtros({ q: 'taladro' }), { habilitados: ['p1', 'p2'] });
    await repo.listar(filtros(), { habilitados: ['p1'] });       // otro conjunto de proveedores
    await repo.listar(filtros(), { proveedorId: 'p1' });
    await repo.listar(filtros(), { proveedorId: 'p1' });
    await repo.listar(filtros(), { admin: true });
    await repo.porId('x'); await repo.porId('x');
    expect(llamadas.filter(l => l.includes('habilitados'))).toHaveLength(3);
    expect(llamadas.filter(l => l.includes('proveedorId') || l.includes('admin'))).toHaveLength(3);
    expect(llamadas.filter(l => l === 'porId')).toHaveLength(2);
  });

  test('cada escritura vacía la caché y la lista de habilitados, aunque falle', async () => {
    for (const falla of [false, true]) {
      const { base, llamadas } = repositorio(falla);
      let habilitadosInvalidados = 0;
      const repo = new RepositorioCatalogoEnCache(base, new CacheMemoria(30000), () => habilitadosInvalidados++);
      await repo.listar(filtros(), { habilitados: ['p1'] });
      await repo.crear('p1', {} as never).catch(() => {});
      await repo.listar(filtros(), { habilitados: ['p1'] });
      expect(llamadas.filter(l => l.startsWith('listar'))).toHaveLength(2);
      expect(habilitadosInvalidados).toBe(1);
    }
  });

  test('la lista de proveedores habilitados se consulta una vez por TTL', async () => {
    let consultas = 0;
    const base: ProveedoresCatalogo = { propio: async () => ({ id: 'p', visiblePublicamente: true, estadoVerificacion: 'aprobada' }), habilitados: async () => { consultas++; return []; } };
    const proveedores = new ProveedoresCatalogoEnCache(base, new CacheMemoria(30000, 1));
    await Promise.all([proveedores.habilitados(), proveedores.habilitados(), proveedores.habilitados()]);
    expect(consultas).toBe(1);
  });
});

(!process.env.TEST_DATABASE_URL ? test.skip : test)('HTTP: lecturas públicas cacheables, errores y privadas con no-store', async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET = 'secreto-exclusivo-cache-pruebas-2026-qatu-abc'; process.env.APP_ORIGIN = 'http://127.0.0.1:3000';
  process.env.QATU_CACHE_SEGUNDOS = '30';
  const app = await crearApp(); await app.listen(0, '127.0.0.1'); const base = await app.getUrl() + '/api/v1';
  try {
    const cabecera = async (ruta: string, estado: number) => { const r = await fetch(base + ruta); await r.arrayBuffer(); assert.equal(r.status, estado, ruta); return r.headers.get('cache-control'); };
    expect(await cabecera('/publicaciones/opciones', 200)).toBe('public, max-age=3600');
    expect(await cabecera('/proveedores/zonas', 200)).toBe('public, max-age=3600');
    expect(await cabecera('/publicaciones?q=taladro', 200)).toBe('public, max-age=30');
    expect(await cabecera('/publicaciones?q=taladro', 200)).toBe('public, max-age=30');
    // Un error no se cachea, ni la consulta inválida ni la oferta inexistente.
    expect(await cabecera('/publicaciones?orden=otro', 400)).toBe('no-store');
    expect(await cabecera('/publicaciones/00000000-0000-4000-8000-000000000000', 404)).toBe('no-store');
    expect(await cabecera('/usuarios/me', 401)).toBe('no-store');
  } finally { await app.close(); delete process.env.QATU_CACHE_SEGUNDOS; }
});

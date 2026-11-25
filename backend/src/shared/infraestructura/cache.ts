/**
 * Caché de lecturas en memoria del proceso (Sprint 2, estrategia de caché).
 * - Cada entrada vence a los `ttlMs`; con ttlMs = 0 no guarda nada (pasa directo a la fuente).
 * - Como máximo `maximo` entradas: al pasar el límite sale la usada hace más tiempo (LRU).
 * - Peticiones simultáneas con la misma clave comparten una sola lectura a la base (evita la estampida).
 * - Un error no se guarda: la siguiente petición vuelve a intentar.
 * - `invalidar()` vacía todo: lo llaman las escrituras del mismo módulo. Con varias réplicas de la API, las otras
 *   ven el cambio al vencer su TTL; por eso el TTL es corto.
 */
export class CacheMemoria<V> {
  private readonly entradas = new Map<string, { valor: Promise<V>; vence: number }>();
  private aciertos = 0;
  private fallos = 0;

  constructor(private readonly ttlMs: number, private readonly maximo = 500, private readonly ahora: () => number = Date.now) {
    if (!Number.isInteger(ttlMs) || ttlMs < 0) throw new Error('El TTL de la caché debe ser un entero no negativo.');
    if (!Number.isInteger(maximo) || maximo < 1) throw new Error('La caché necesita al menos una entrada.');
  }

  get activa() { return this.ttlMs > 0; }

  obtener(clave: string, cargar: () => Promise<V>): Promise<V> {
    if (!this.activa) return cargar();
    const instante = this.ahora();
    const guardada = this.entradas.get(clave);
    if (guardada && guardada.vence > instante) {
      this.aciertos++;
      // Al final del Map = usada más recientemente.
      this.entradas.delete(clave); this.entradas.set(clave, guardada);
      return guardada.valor;
    }
    this.fallos++;
    const entrada = { valor: cargar(), vence: instante + this.ttlMs };
    this.entradas.set(clave, entrada);
    while (this.entradas.size > this.maximo) this.entradas.delete(this.entradas.keys().next().value as string);
    entrada.valor.catch(() => { if (this.entradas.get(clave) === entrada) this.entradas.delete(clave); });
    return entrada.valor;
  }

  invalidar() { this.entradas.clear(); }

  estadisticas() { return { entradas: this.entradas.size, aciertos: this.aciertos, fallos: this.fallos }; }
}

/** Segundos de caché de lecturas públicas: QATU_CACHE_SEGUNDOS (0–300). Por defecto 30, y 0 en pruebas (NODE_ENV=test). */
export function segundosDeCache(entorno: NodeJS.ProcessEnv = process.env): number {
  const valor = entorno.QATU_CACHE_SEGUNDOS;
  if (valor === undefined || valor === '') return entorno.NODE_ENV === 'test' ? 0 : 30;
  if (!/^\d{1,3}$/.test(valor) || Number(valor) > 300) throw new Error('QATU_CACHE_SEGUNDOS debe ser un entero entre 0 y 300.');
  return Number(valor);
}

/**
 * node:assert/strict para Jest. Jest ejecuta cada archivo de prueba en un contexto vm propio: los objetos que llegan
 * del contexto principal de Node (por ejemplo, el JSON de fetch()) tienen otro Object.prototype, y deepStrictEqual
 * los da por distintos aunque sean iguales («Compared values have no visual difference»).
 * Este módulo reexporta el assert estricto de Node y, solo en las comparaciones profundas, copia antes los objetos y
 * arreglos planos al contexto de la prueba. El resto de la comparación sigue siendo estricta: tipos, claves,
 * undefined frente a ausente, Date, Buffer, Map y Set se comparan igual que en Node.
 * jest.config.cjs lo usa en lugar de node:assert/strict (moduleNameMapper).
 */
// 'assert' sin el prefijo node: no pasa por el moduleNameMapper.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nativo: typeof import('node:assert/strict') = require('assert').strict;

function plano(valor: unknown): boolean {
  if (valor === null || typeof valor !== 'object') return false;
  const prototipo = Object.getPrototypeOf(valor);
  return prototipo === null || (Object.getPrototypeOf(prototipo) === null && prototipo.constructor?.name === 'Object');
}

function alContexto(valor: unknown, vistos = new Map<object, unknown>()): unknown {
  if (valor === null || typeof valor !== 'object') return valor;
  if (vistos.has(valor)) return vistos.get(valor);
  if (Array.isArray(valor)) {
    const copia: unknown[] = []; vistos.set(valor, copia);
    for (let i = 0; i < valor.length; i++) copia[i] = i in valor ? alContexto(valor[i], vistos) : undefined;
    return copia;
  }
  if (plano(valor)) {
    const copia: Record<string, unknown> = Object.getPrototypeOf(valor) === null ? Object.create(null) : {}; vistos.set(valor, copia);
    for (const clave of Object.keys(valor)) copia[clave] = alContexto((valor as Record<string, unknown>)[clave], vistos);
    return copia;
  }
  return valor;
}

type Comparacion = (actual: unknown, esperado: unknown, mensaje?: string | Error) => void;
const profunda = (original: Comparacion): Comparacion => (actual, esperado, mensaje) => original(alContexto(actual), alContexto(esperado), mensaje);

const assert = Object.assign((valor: unknown, mensaje?: string | Error) => nativo(valor, mensaje), nativo, {
  deepEqual: profunda(nativo.deepEqual),
  deepStrictEqual: profunda(nativo.deepStrictEqual),
  notDeepEqual: profunda(nativo.notDeepEqual),
  notDeepStrictEqual: profunda(nativo.notDeepStrictEqual),
}) as typeof nativo;

export default assert;
export const { equal, notEqual, ok, throws, rejects, match, doesNotMatch, doesNotThrow, deepEqual, deepStrictEqual, notDeepEqual, notDeepStrictEqual, strictEqual, notStrictEqual, fail } = assert;

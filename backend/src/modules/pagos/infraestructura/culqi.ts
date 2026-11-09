import type { CargoExterno, ProcesadorPagos, ResultadoPago, SolicitudCobro } from '../dominio/pagos';

const BASE = 'https://api.culqi.com/v2';
const TIMEOUT_MS = 20_000;
type Peticion = typeof fetch;
type Cuerpo = Record<string, unknown> | null;

function codigoSeguro(valor: unknown): string {
  const c = String(valor ?? '').toUpperCase().replace(/[^A-Z0-9_]/g, '_').slice(0, 64);
  return c || 'RECHAZADA_POR_CULQI';
}
/** Culqi muestra el éxito como state 'Exitosa' o response_code 'venta_exitosa'; lo demás no acredita un cobro. */
function exitoso(c: Record<string, unknown>) {
  const outcome = c.outcome as { type?: unknown } | undefined;
  return c.state === 'Exitosa' || c.response_code === 'venta_exitosa' || outcome?.type === 'venta_exitosa';
}
function aCargo(c: Record<string, unknown>): CargoExterno {
  const metadata = c.metadata as { intento_id?: unknown } | null | undefined;
  return {
    referencia: String(c.id), intentoId: typeof metadata?.intento_id === 'string' ? metadata.intento_id : null,
    importeCentimos: Number(c.amount), moneda: String(c.currency ?? c.currency_code ?? ''), exitoso: exitoso(c),
  };
}
const esCargo = (c: Cuerpo): c is Record<string, unknown> => c?.object === 'charge' && typeof c.id === 'string' && c.id.startsWith('chr_');

/**
 * Adaptador de Culqi, solo con llaves de prueba. Las rutas y la autenticación provienen del SDK oficial.
 * La documentación se contradice sobre si 200 o 201 piden 3DS, por lo que se decide por el cuerpo y no por el código HTTP.
 * La autenticación 3DS no está integrada: un cobro que la pida queda rechazado con un código propio.
 */
export class ProcesadorCulqi implements ProcesadorPagos {
  constructor(private readonly llaveSecreta: string, private readonly peticion: Peticion = fetch, private readonly base = BASE, private readonly timeoutMs = TIMEOUT_MS) {
    if (!/^sk_test_/.test(llaveSecreta)) throw new Error('La pasarela solo admite llaves de prueba de Culqi.');
  }

  private async llamar(ruta: string, cuerpo?: unknown) {
    const r = await this.peticion(this.base + ruta, {
      method: cuerpo === undefined ? 'GET' : 'POST', signal: AbortSignal.timeout(this.timeoutMs),
      headers: { Authorization: 'Bearer ' + this.llaveSecreta, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
    return { status: r.status, cuerpo: await r.json().catch(() => null) as Cuerpo };
  }

  async cobrar(c: SolicitudCobro): Promise<ResultadoPago> {
    let r;
    try {
      r = await this.llamar('/charges', {
        amount: c.importeCentimos, currency_code: c.moneda, email: c.email, source_id: c.tokenId, capture: true,
        description: c.descripcion, metadata: { intento_id: c.intentoId, reserva_id: c.reservaId },
      });
    } catch { return { estado: 'desconocido' }; }
    if (r.status >= 500) return { estado: 'desconocido' };
    if (r.status >= 400) return { estado: 'rechazado', codigo: codigoSeguro(r.cuerpo?.decline_code ?? r.cuerpo?.code ?? r.cuerpo?.type) };
    if (!esCargo(r.cuerpo)) return { estado: 'rechazado', codigo: 'AUTENTICACION_3DS_REQUERIDA' };
    const cargo = aCargo(r.cuerpo);
    // Un cargo con otro importe o sin éxito claro no se da por pagado ni por rechazado: se concilia.
    if (!cargo.exitoso || cargo.importeCentimos !== c.importeCentimos || cargo.moneda !== c.moneda) return { estado: 'desconocido' };
    return { estado: 'aprobado', referencia: cargo.referencia };
  }

  async consultar(referencia: string) {
    if (!/^chr_[A-Za-z0-9_-]{1,80}$/.test(referencia)) return null;
    const r = await this.llamar('/charges/' + referencia);
    if (r.status === 404) return null;
    if (r.status >= 400) throw new Error('Culqi respondió ' + r.status + ' al consultar el cargo.');
    return esCargo(r.cuerpo) ? aCargo(r.cuerpo) : null;
  }

  /** El SDK admite filtrar por importe, no por metadata: el intento se confirma en cada resultado. */
  async buscarPorIntento(intento: { id: string; importeCentimos: number }) {
    const q = new URLSearchParams({ amount: String(intento.importeCentimos), limit: '100' });
    const r = await this.llamar('/charges?' + q);
    if (r.status >= 400) throw new Error('Culqi respondió ' + r.status + ' al listar cargos.');
    const lista = Array.isArray(r.cuerpo?.data) ? r.cuerpo.data as Cuerpo[] : [];
    const cargo = lista.filter(esCargo).map(aCargo).find(x => x.intentoId === intento.id);
    return cargo ?? null;
  }
}

/** Doble determinista para pruebas: el token decide el resultado y conserva los cargos en memoria. */
export class ProcesadorDoble implements ProcesadorPagos {
  private readonly cargos: (CargoExterno & { id: string })[] = [];
  private registrar(c: SolicitudCobro) {
    const cargo = { id: c.intentoId, referencia: 'chr_test_' + c.intentoId.replace(/-/g, ''), intentoId: c.intentoId, importeCentimos: c.importeCentimos, moneda: c.moneda, exitoso: true };
    this.cargos.push(cargo);
    return cargo;
  }
  async cobrar(c: SolicitudCobro): Promise<ResultadoPago> {
    if (c.tokenId.startsWith('tkn_test_rechaza')) return { estado: 'rechazado', codigo: 'INSUFFICIENT_FUNDS' };
    if (c.tokenId.startsWith('tkn_test_timeout_sin_cargo')) return { estado: 'desconocido' };
    const cargo = this.registrar(c);
    return c.tokenId.startsWith('tkn_test_timeout') ? { estado: 'desconocido' } : { estado: 'aprobado', referencia: cargo.referencia };
  }
  async consultar(referencia: string) { return this.cargos.find(c => c.referencia === referencia) ?? null; }
  async buscarPorIntento(intento: { id: string }) { return this.cargos.find(c => c.intentoId === intento.id) ?? null; }
}

/** Elige la pasarela según el entorno. Sin configuración no hay pago en línea, y nunca se aceptan llaves reales. */
export function crearProcesador(): { procesador: ProcesadorPagos | null; llavePublica: string | null } {
  const modo = process.env.QATU_PAGOS;
  if (modo === 'doble') {
    if (process.env.NODE_ENV === 'production') throw new Error('El doble de pagos no se puede usar en producción.');
    return { procesador: new ProcesadorDoble(), llavePublica: 'pk_test_doble' };
  }
  const publica = process.env.CULQI_PUBLIC_KEY, secreta = process.env.CULQI_SECRET_KEY;
  if (!publica && !secreta) return { procesador: null, llavePublica: null };
  if (!publica?.startsWith('pk_test_') || !secreta?.startsWith('sk_test_')) throw new Error('Configura CULQI_PUBLIC_KEY y CULQI_SECRET_KEY con llaves de prueba de Culqi.');
  return { procesador: new ProcesadorCulqi(secreta), llavePublica: publica };
}

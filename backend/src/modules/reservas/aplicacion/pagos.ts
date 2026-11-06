import { createHash } from 'node:crypto';
import { claveIdempotencia, entradaPago, type CargoExterno, type IntentoPago, type ProcesadorPagos, type RepositorioPagos } from '../dominio/pagos';
import type { IdentidadReservas } from '../dominio/puertos';
import { ErrorReserva, uuid } from '../dominio/solicitud';
import { describirError } from '../../../shared/infraestructura/base-datos';

const huella = (v: string) => createHash('sha256').update(v).digest('hex');
const PROCESANDO_MS = 2 * 60_000;
// Un token dura 5 minutos: pasada una hora sin cargo localizado ya no puede aparecer uno nuevo.
const SIN_CARGO_MS = 60 * 60_000;

export class Pagos {
  constructor(private readonly repo: RepositorioPagos, private readonly identidad: IdentidadReservas,
    private readonly procesador: ProcesadorPagos | null, private readonly llavePublica: string | null,
    private readonly ahora = () => Date.now()) {}

  configuracion() { return { disponible: Boolean(this.procesador && this.llavePublica), llavePublica: this.llavePublica, modo: 'prueba' as const }; }

  private disponible(): ProcesadorPagos {
    if (!this.procesador) throw new ErrorReserva('PAGOS_NO_DISPONIBLES', 503, 'El pago en línea no está disponible. Puedes coordinar el pago en efectivo.');
    return this.procesador;
  }

  /** El intento se guarda antes de llamar a la pasarela y sin mantener una transacción durante el cobro. */
  async iniciar(token: string, id: string, clave: unknown, value: unknown): Promise<IntentoPago> {
    const procesador = this.disponible(), actor = await this.identidad.resolver(token);
    const { tokenId } = entradaPago(value), k = claveIdempotencia(clave);
    const { intento, repetido, titulo } = await this.repo.prepararPago(uuid(id), actor.id, k, huella(tokenId));
    if (repetido) return intento;
    let resultado;
    try {
      resultado = await procesador.cobrar({ intentoId: intento.id, reservaId: intento.reservaId, importeCentimos: intento.importeCentimos, moneda: intento.moneda, tokenId, email: actor.email, descripcion: titulo.slice(0, 80) });
    } catch (error) {
      console.error('Resultado de cobro desconocido:', describirError(error));
      resultado = { estado: 'desconocido' as const };
    }
    const guardado = resultado.estado === 'aprobado' ? await this.repo.aprobarPago(intento.id, resultado.referencia)
      : resultado.estado === 'rechazado' ? await this.repo.rechazarPago(intento.id, resultado.codigo)
        : await this.repo.marcarPagoDesconocido(intento.id);
    return guardado ?? intento;
  }

  async listar(token: string, id: string) {
    const actor = await this.identidad.resolver(token), pagos = await this.repo.pagosDe(uuid(id), actor.id);
    if (!pagos) throw new ErrorReserva('RESERVA_NO_DISPONIBLE', 404, 'La solicitud no está disponible.');
    return { items: pagos };
  }

  /** Solo cuenta como pago un cargo exitoso del importe, la moneda y el intento esperados. */
  private coincide(cargo: CargoExterno | null, intento: IntentoPago): cargo is CargoExterno {
    return Boolean(cargo?.exitoso && cargo.intentoId === intento.id && cargo.importeCentimos === intento.importeCentimos && cargo.moneda === intento.moneda);
  }

  /** Resuelve intentos con resultado incierto consultando a la pasarela; nunca vuelve a cobrar. */
  async conciliar(limite = 20) {
    if (!this.procesador) return { aprobados: 0, sinCargo: 0, pendientes: 0 };
    const resultado = { aprobados: 0, sinCargo: 0, pendientes: 0 };
    for (const intento of await this.repo.pagosPorConciliar(PROCESANDO_MS, limite)) {
      try {
        const cargo = await this.procesador.buscarPorIntento({ id: intento.id, importeCentimos: intento.importeCentimos });
        if (this.coincide(cargo, intento)) { await this.repo.aprobarPago(intento.id, cargo.referencia); resultado.aprobados++; continue; }
        if (this.ahora() - Date.parse(intento.creadoEn) >= SIN_CARGO_MS) { await this.repo.rechazarPago(intento.id, 'SIN_CARGO_CONFIRMADO'); resultado.sinCargo++; continue; }
        await this.repo.marcarPagoDesconocido(intento.id);
        resultado.pendientes++;
      } catch (error) {
        console.error('No se pudo conciliar un pago:', describirError(error));
        resultado.pendientes++;
      }
    }
    return resultado;
  }

  /**
   * El contenido del webhook no se da por cierto: solo indica qué cargo consultar por la API autenticada.
   * Culqi no documenta firma ni formato, así que un aviso falso no puede aprobar ningún pago.
   */
  async webhook(cuerpo: unknown): Promise<{ recibido: true }> {
    const procesador = this.disponible();
    const texto = JSON.stringify(cuerpo ?? {}), referencia = texto.match(/chr_(?:test|live)_[A-Za-z0-9_-]{1,60}/)?.[0];
    const propio = (cuerpo as { id?: unknown } | null)?.id;
    const eventoId = typeof propio === 'string' && /^[A-Za-z0-9_-]{1,120}$/.test(propio) ? propio : huella(texto);
    if (!referencia || await this.repo.eventoPasarelaRegistrado('culqi', eventoId)) return { recibido: true };
    const cargo = await procesador.consultar(referencia);
    if (cargo?.intentoId && /^[0-9a-f-]{36}$/i.test(cargo.intentoId)) {
      const intento = await this.repo.pagoPorId(cargo.intentoId);
      if (intento && this.coincide(cargo, intento)) await this.repo.aprobarPago(intento.id, cargo.referencia);
    }
    await this.repo.registrarEventoPasarela('culqi', eventoId);
    return { recibido: true };
  }
}

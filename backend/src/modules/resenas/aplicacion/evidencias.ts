import { ArchivoRechazado, ArchivosCifrados, type ArchivoEntrante } from '../../../shared/infraestructura/archivos-cifrados';
import { ErrorResena, uuid, type IdentidadResenas, type ReservasDeResena } from '../dominio/resenas';
import { DIAS_DE_RETENCION, MAXIMO_POR_ETAPA, etapaValida, etapasAbiertas, exigirEtapaAbierta, type CierresDeReservas, type EvidenciaGuardada } from '../dominio/evidencias';
import type { PostgresEvidencias } from '../infraestructura/postgres-evidencias';

const FOTOS = ['image/jpeg', 'image/png'] as const;

export class Evidencias {
  private readonly archivos = new ArchivosCifrados();

  constructor(private readonly repo: PostgresEvidencias, private readonly reservas: ReservasDeResena & CierresDeReservas,
    private readonly identidad: IdentidadResenas, private readonly ahora = () => Date.now()) {}

  habilitado() { return this.archivos.habilitado(); }

  private async participante(token: string, id: string) {
    const actor = await this.identidad.resolver(token);
    const reserva = await this.reservas.paraResena(uuid(id), actor.id);
    if (!reserva) throw new ErrorResena('RESERVA_NO_DISPONIBLE', 404, 'La reserva no está disponible.');
    return { actor, reserva };
  }

  /** Lo usa el guard antes de recibir archivos: solo participantes llegan a subir. */
  async exigirParticipante(token: string, id: string) { await this.participante(token, id); }

  private resumen(e: EvidenciaGuardada, clienteId: string) {
    return { id: e.id, etapa: e.etapa, autor: e.autorId === clienteId ? 'cliente' as const : 'proveedor' as const, tipo: e.tipo, bytes: e.bytes, sha256: e.sha256, creadaEn: e.creadaEn, disponible: e.eliminadaEn === null };
  }

  async listar(token: string, id: string) {
    const { reserva } = await this.participante(token, id);
    const items = (await this.repo.deReserva(reserva.id)).map(e => this.resumen(e, reserva.clienteId));
    return { items, etapasAbiertas: this.habilitado() ? etapasAbiertas(reserva, this.ahora()) : [], maximoPorEtapa: MAXIMO_POR_ETAPA, diasDeRetencion: DIAS_DE_RETENCION };
  }

  async subir(token: string, id: string, body: unknown, recibidos: ArchivoEntrante[]) {
    if (!this.habilitado()) throw new ErrorResena('EVIDENCIAS_NO_DISPONIBLES', 503, 'La recepción de evidencias todavía no está disponible.');
    const campos = body && typeof body === 'object' ? Object.keys(body) : [];
    if (campos.some(c => c !== 'etapa')) throw new ErrorResena('ENTRADA_INVALIDA', 400, 'Revisa los datos de la evidencia.');
    const etapa = etapaValida((body as { etapa?: unknown }).etapa);
    if (!recibidos.length || recibidos.length > MAXIMO_POR_ETAPA) throw new ErrorResena('ENTRADA_INVALIDA', 400, `Adjunta de 1 a ${MAXIMO_POR_ETAPA} fotos.`);
    const { actor, reserva } = await this.participante(token, id);
    exigirEtapaAbierta(reserva, etapa, this.ahora());
    let cifrados;
    try { cifrados = recibidos.map(a => this.archivos.cifrar(a, FOTOS)); }
    catch (error) {
      if (error instanceof ArchivoRechazado) throw new ErrorResena('ARCHIVO_INVALIDO', 400, error.motivo === 'TAMANO' ? 'Cada foto debe ocupar como máximo 5 MiB.' : 'Solo se admiten fotos JPG o PNG con formato y tipo compatibles.');
      throw error;
    }
    const guardadas = await this.repo.guardar(reserva.id, actor.id, etapa, cifrados);
    return { items: guardadas.map(e => this.resumen(e, reserva.clienteId)) };
  }

  /** Descarga para participantes de la reserva o administradores; a cualquier otro, 404. */
  async descargar(token: string, evidenciaId: string) {
    const actor = await this.identidad.resolver(token);
    const evidencia = await this.repo.archivo(uuid(evidenciaId));
    const visible = evidencia && (actor.roles.includes('admin') || await this.reservas.paraResena(evidencia.reservaId, actor.id));
    if (!evidencia || !visible) throw new ErrorResena('EVIDENCIA_NO_DISPONIBLE', 404, 'La evidencia no está disponible.');
    if (!evidencia.contenido || !evidencia.iv || !evidencia.tag) throw new ErrorResena('EVIDENCIA_ELIMINADA', 410, `La foto se eliminó al cumplirse ${DIAS_DE_RETENCION} días del cierre; se conserva su huella.`);
    return { id: evidencia.id, tipo: evidencia.tipo, contenido: this.archivos.descifrar({ id: evidencia.id, contenido: evidencia.contenido, iv: evidencia.iv, tag: evidencia.tag }) };
  }

  /** Borra el contenido de las reservas cerradas hace más de 90 días. Las incidencias (006.3) lo retendrán. */
  async limpiar(lote = 500) {
    const ids = await this.repo.reservasConContenido(lote);
    if (!ids.length) return 0;
    const cierres = await this.reservas.cierres(ids), limite = this.ahora() - DIAS_DE_RETENCION * 86_400_000;
    return this.repo.borrarContenido(ids.filter(id => { const c = cierres.get(id); return c !== null && c !== undefined && Date.parse(c) <= limite; }));
  }
}

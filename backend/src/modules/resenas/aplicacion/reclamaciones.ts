import { createHash, randomBytes } from 'node:crypto';
import { ErrorResena, pagina, uuid, type IdentidadResenas } from '../dominio/resenas';
import { entradaHoja, entradaRespuesta, titularConfigurado, type Hoja, type Titular } from '../dominio/reclamaciones';
import type { PostgresReclamaciones } from '../infraestructura/postgres-reclamaciones';

export interface IdentidadReclamaciones extends IdentidadResenas { limitar(clave: string, maximo: number): Promise<unknown> }

const hash = (codigo: string) => createHash('sha256').update(codigo).digest('hex');

/** Lo que ve el consumidor: su propia hoja, sin ids internos. */
const constancia = (h: Hoja) => ({
  numero: h.numero, tipo: h.tipo, titular: h.titular, presentadaEn: h.presentadaEn, venceEn: h.venceEn,
  consumidor: { nombre: h.nombre, tipoDocumento: h.tipoDocumento, numeroDocumento: h.numeroDocumento, domicilio: h.domicilio, telefono: h.telefono,
    email: h.email, menorDeEdad: h.menorDeEdad, apoderadoNombre: h.apoderadoNombre, apoderadoDocumento: h.apoderadoDocumento },
  medioRespuesta: h.medioRespuesta,
  bien: { tipo: h.bienTipo, descripcion: h.bienDescripcion, montoCentimos: h.montoCentimos },
  detalle: h.detalle, pedido: h.pedido,
  respuesta: h.respuesta ? { texto: h.respuesta, medio: h.respuestaMedio, respondidaEn: h.respondidaEn } : null,
});

export class Reclamaciones {
  constructor(private readonly repo: PostgresReclamaciones, private readonly identidad: IdentidadReclamaciones,
    private readonly titular: () => Titular = () => titularConfigurado(), private readonly hoy = () => new Date()) {}

  datosTitular() { return this.titular(); }

  /**
   * Cualquiera puede presentar una hoja, con o sin cuenta: el libro no puede condicionarse a registrarse.
   * Si hay sesión, la hoja queda vinculada a la cuenta. Cuotas para frenar el abuso automatizado: por documento
   * (3 cada 15 min) y por IP (60). Detrás del proxy de Next todas las peticiones llegan desde la misma IP local,
   * por eso la cuota por IP es amplia y la que limita es la del documento.
   */
  async presentar(token: string, ip: string, value: unknown) {
    const datos = entradaHoja(value);
    await this.identidad.limitar(`ip:${ip}:reclamaciones`, 60);
    await this.identidad.limitar(`doc:${hash(datos.tipoDocumento + ':' + datos.numeroDocumento)}:reclamaciones`, 3);
    const usuarioId = token ? await this.identidad.resolver(token).then(u => u.id, () => null) : null;
    const codigo = randomBytes(9).toString('base64url');
    const hoja = await this.repo.presentar({ ...datos, titular: this.titular(), usuarioId, codigoHash: hash(codigo) }, this.hoy());
    return { ...constancia(hoja), codigoConsulta: codigo };
  }

  /** Consulta pública del estado con el número y el código que se entregó en la constancia. */
  async consultar(ip: string, query: unknown) {
    const q = (query ?? {}) as { numero?: unknown; codigo?: unknown };
    await this.identidad.limitar(`ip:${ip}:reclamaciones-consulta`, 120);
    const numero = typeof q.numero === 'string' ? q.numero.trim().toUpperCase() : '';
    const codigo = typeof q.codigo === 'string' ? q.codigo.trim() : '';
    if (!/^LR-\d{4}-\d{6}$/.test(numero) || !/^[A-Za-z0-9_-]{12}$/.test(codigo)) throw new ErrorResena('ENTRADA_INVALIDA', 400, 'Revisa el número de hoja y el código de consulta.');
    const hoja = await this.repo.porConsulta(numero, hash(codigo));
    if (!hoja) throw new ErrorResena('HOJA_NO_DISPONIBLE', 404, 'No encontramos una hoja con ese número y código.');
    return constancia(hoja);
  }

  private async administrador(token: string) {
    const actor = await this.identidad.resolver(token);
    if (!actor.roles.includes('admin')) throw new ErrorResena('SIN_PERMISO', 403, 'Esta acción requiere una cuenta administrativa.');
    return actor;
  }

  async paraAdministrar(token: string, query: unknown) {
    await this.administrador(token);
    const q = (query ?? {}) as { estado?: unknown; page?: unknown };
    const estado = q.estado ?? 'pendiente';
    if (estado !== 'pendiente' && estado !== 'respondida') throw new ErrorResena('ENTRADA_INVALIDA', 400, 'Estado inválido.');
    const page = pagina(q.page);
    const { items, total } = await this.repo.paraAdministrar(estado, page);
    const hoy = this.hoy().toISOString().slice(0, 10);
    return { items: items.map(h => ({ id: h.id, ...constancia(h), vencida: !h.respuesta && h.venceEn < hoy })), total, page, limit: 20 };
  }

  /** Registra la respuesta que el administrador ya envió por el medio elegido por el consumidor. Una sola vez. */
  async responder(token: string, id: string, value: unknown) {
    const actor = await this.administrador(token), datos = entradaRespuesta(value);
    const actual = await this.repo.porId(uuid(id));
    if (!actual) throw new ErrorResena('HOJA_NO_DISPONIBLE', 404, 'La hoja no existe.');
    if (actual.respuesta) throw new ErrorResena('HOJA_RESPONDIDA', 409, 'Esta hoja ya tiene respuesta registrada.');
    const hoja = await this.repo.responder(actual.id, actor.id, datos.respuesta, datos.medio);
    if (!hoja) throw new ErrorResena('HOJA_RESPONDIDA', 409, 'Esta hoja ya tiene respuesta registrada.');
    return { id: hoja.id, ...constancia(hoja) };
  }
}

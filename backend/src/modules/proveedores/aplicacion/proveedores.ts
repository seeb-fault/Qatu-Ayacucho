import { entradaPerfil, ErrorProveedor, proveedorIdValido, type ProveedorPublico } from '../dominio/proveedor';
import type { CifradoDocumentos, IdentidadActores, RepositorioProveedores } from '../dominio/puertos';
import { entradaRevision, entradaVerificacion, type ArchivoRecibido } from '../dominio/verificacion';

export class Proveedores {
  constructor(private readonly repo: RepositorioProveedores, private readonly identidad: IdentidadActores, private readonly documentos: CifradoDocumentos) {}

  zonas() { return this.repo.zonas(); }

  async propio(token: string) {
    const actor = await this.identidad.resolver(token);
    const perfil = await this.repo.porUsuario(actor.id);
    if (!perfil) throw new ErrorProveedor('PERFIL_NO_EXISTE', 404, 'Todavía no tienes un perfil de proveedor.');
    return perfil;
  }

  async crear(token: string, value: unknown) {
    const actor = await this.identidad.resolver(token);
    const { datos } = entradaPerfil(value, false);
    return this.repo.crear(actor.id, datos);
  }

  async editar(token: string, value: unknown) {
    const actor = await this.identidad.resolver(token);
    const { datos, versionActual } = entradaPerfil(value, true);
    return this.repo.editar(actor.id, versionActual!, datos);
  }

  async publico(id: string): Promise<ProveedorPublico> {
    const perfil = await this.repo.porId(proveedorIdValido(id));
    if (!perfil || !perfil.visiblePublicamente || !await this.identidad.cuentaActiva(perfil.usuarioId)) {
      throw new ErrorProveedor('PERFIL_NO_DISPONIBLE', 404, 'Este perfil no está disponible.');
    }
    return { id: perfil.id, nombrePublico: perfil.nombrePublico, descripcion: perfil.descripcion, zona: perfil.zona, estadoVerificacion: perfil.estadoVerificacion };
  }

  politicaDocumental() {
    return { habilitada: this.documentos.habilitado(), tipos: ['application/pdf','image/jpeg','image/png'], maximoBytes: 5242880, maximoArchivos: 2, conservacion: 'Mientras tu cuenta esté activa. Después se eliminan los adjuntos; se conserva el historial de decisiones.' };
  }

  async historial(token: string) { return this.repo.historial((await this.propio(token)).id); }

  async solicitar(token: string, value: unknown, archivos: ArchivoRecibido[]) {
    const perfil = await this.propio(token);
    const version = entradaVerificacion(value);
    if (!archivos || archivos.length < 1 || archivos.length > 2) throw new ErrorProveedor('ARCHIVOS_REQUERIDOS', 400, 'Adjunta uno o dos documentos.');
    return this.repo.solicitar(perfil.id, version, archivos.map(archivo => this.documentos.cifrar(archivo)));
  }

  async descargar(token: string, id: string) {
    const actor = await this.identidad.resolver(token);
    const documento = await this.repo.documento(proveedorIdValido(id));
    if (!documento || (documento.usuarioId !== actor.id && !actor.roles.includes('admin')) || !await this.identidad.cuentaActiva(documento.usuarioId)) throw new ErrorProveedor('DOCUMENTO_NO_DISPONIBLE', 404, 'El documento no está disponible.');
    return { contenido: this.documentos.descifrar(documento), tipo: documento.tipo, id: documento.id };
  }

  private async administrador(token: string) {
    const actor = await this.identidad.resolver(token);
    if (!actor.roles.includes('admin')) throw new ErrorProveedor('SIN_PERMISO', 403, 'Esta acción requiere una cuenta administrativa.');
    return actor;
  }

  async pendientes(token: string, value: unknown) {
    await this.administrador(token);
    const datos = value as Record<string,unknown>;
    if (!datos || Object.keys(datos).some(campo => !['pagina','estado'].includes(campo)) || (datos.pagina !== undefined && (typeof datos.pagina !== 'string' || !/^[1-9]\d{0,4}$/.test(datos.pagina))) || (datos.estado !== undefined && !['pendiente','aprobada','rechazada','cancelada'].includes(String(datos.estado)))) throw new ErrorProveedor('ENTRADA_INVALIDA', 400, 'Filtros inválidos.');
    return this.repo.pendientes(datos.pagina === undefined ? 1 : Number(datos.pagina),datos.estado as 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada' | undefined);
  }

  async revisar(token: string, id: string, value: unknown) {
    const actor = await this.administrador(token);
    const datos = entradaRevision(value);
    const perfil = await this.repo.porId(proveedorIdValido(id));
    if (!perfil || !await this.identidad.cuentaActiva(perfil.usuarioId)) throw new ErrorProveedor('PERFIL_NO_DISPONIBLE', 404, 'El proveedor no está disponible.');
    return this.repo.resolverVerificacion(id, proveedorIdValido(datos.solicitudId), actor.id, datos.decision as 'aprobada' | 'rechazada', datos.motivo);
  }

  async limpiarDocumentosInactivos() {
    let eliminados = 0;
    for (const perfil of await this.repo.conDocumentos()) {
      if (!await this.identidad.cuentaActiva(perfil.usuarioId)) eliminados += await this.repo.purgarDocumentos(perfil.id);
    }
    return eliminados;
  }
}

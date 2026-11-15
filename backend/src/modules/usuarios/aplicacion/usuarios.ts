import { randomUUID } from 'node:crypto';
import { emailValido, entrada, ErrorUsuario, estadoValido, idValido, motivoValido, nombreValido, paginaValida, passwordValido, whatsappValido, type Usuario } from '../dominio/usuario';
import type { HashPasswords, RepositorioUsuarios, TokensSesion } from '../dominio/puertos';

export class Usuarios {
  constructor(private readonly repo: RepositorioUsuarios, private readonly passwords: HashPasswords, private readonly tokens: TokensSesion) {}

  async registrar(value: unknown) {
    const datos = entrada(value, ['email', 'password', 'nombre']);
    const email = emailValido(datos.email);
    const nombre = nombreValido(datos.nombre);
    const password = passwordValido(datos.password);
    const usuario = await this.repo.crear(email, nombre, await this.passwords.crear(password));
    return this.iniciarSesion(usuario);
  }

  async login(value: unknown) {
    const datos = entrada(value, ['email', 'password']);
    const email = emailValido(datos.email);
    const password = passwordValido(datos.password);
    const credenciales = await this.repo.credenciales(email);
    const dummy = 'scrypt$' + '00'.repeat(16) + '$' + '00'.repeat(64);
    const coincide = await this.passwords.verificar(password, credenciales?.passwordHash ?? dummy);
    if (!credenciales || !coincide || credenciales.usuario.estado !== 'activo') {
      throw new ErrorUsuario('CREDENCIALES_INVALIDAS', 401, 'Correo o contraseña incorrectos.');
    }
    return this.iniciarSesion(credenciales.usuario);
  }

  private async iniciarSesion(usuario: Usuario) {
    const sid = randomUUID();
    const expiraEn = new Date(Date.now() + 15 * 60_000);
    await this.repo.crearSesion(sid, usuario.id, expiraEn);
    const token = await this.tokens.emitir(usuario.id, sid);
    return { usuario, token, expiraEn: expiraEn.toISOString() };
  }

  async identidad(token: string) {
    let claims: { sub: string; sid: string };
    try {
      claims = await this.tokens.leer(token);
    } catch {
      throw new ErrorUsuario('SESION_INVALIDA', 401, 'Ingresa nuevamente para continuar.');
    }
    const activa = await this.repo.sesionActiva(claims.sid, claims.sub);
    const usuario = activa ? await this.repo.porId(claims.sub) : null;
    if (!usuario || usuario.estado !== 'activo') throw new ErrorUsuario('SESION_INVALIDA', 401, 'Ingresa nuevamente para continuar.');
    return { usuario, sid: claims.sid };
  }

  /** El perfil propio incluye el WhatsApp; nunca se entrega a otros módulos salvo por `contactoPublico`. */
  async perfil(token: string) {
    const { usuario } = await this.identidad(token);
    const c = await this.repo.contacto(usuario.id);
    return { ...usuario, whatsapp: c?.whatsapp ?? null, whatsappVisible: c?.whatsappVisible ?? false };
  }

  /** Para la contraparte de una reserva: el número solo si su dueño consintió mostrarlo y la cuenta está activa. */
  async contactoPublico(usuarioId: string) {
    const c = await this.repo.contacto(usuarioId);
    if (!c) return null;
    return { nombre: c.nombre, whatsapp: c.activo && c.whatsappVisible ? c.whatsapp : null };
  }

  async tieneWhatsapp(usuarioId: string) {
    const c = await this.repo.contacto(usuarioId);
    return Boolean(c?.whatsapp && c.whatsappVisible);
  }

  cuentasActivas(ids: string[]) { return this.repo.cuentasActivas(ids); }

  async cuentaActiva(usuarioId: string) {
    return (await this.repo.porId(usuarioId))?.estado === 'activo';
  }

  async editar(token: string, value: unknown) {
    const { usuario } = await this.identidad(token);
    const datos = entrada(value, ['nombre', 'whatsapp', 'whatsappVisible']);
    const nombre = nombreValido(datos.nombre);
    if (datos.whatsappVisible !== undefined && typeof datos.whatsappVisible !== 'boolean') throw new ErrorUsuario('ENTRADA_INVALIDA', 400, 'Revisa los campos enviados.');
    const actual = await this.repo.contacto(usuario.id);
    const whatsapp = datos.whatsapp === undefined ? actual?.whatsapp ?? null : whatsappValido(datos.whatsapp);
    const whatsappVisible = whatsapp === null ? false : (datos.whatsappVisible as boolean | undefined) ?? actual?.whatsappVisible ?? false;
    const resultado = await this.repo.cambiarNombre(usuario.id, nombre);
    if (!resultado) throw new ErrorUsuario('SESION_INVALIDA', 401, 'Ingresa nuevamente para continuar.');
    await this.repo.cambiarContacto(usuario.id, { whatsapp, whatsappVisible });
    return { ...resultado, whatsapp, whatsappVisible };
  }

  async salir(token: string) {
    const { sid } = await this.identidad(token);
    await this.repo.revocarSesion(sid);
  }

  limitar(clave: string, maximo: number) {
    return this.repo.limitar(clave, maximo);
  }

  private async administrador(token: string) {
    const { usuario } = await this.identidad(token);
    if (!usuario.roles.includes('admin')) throw new ErrorUsuario('SIN_PERMISO', 403, 'Esta acción requiere una cuenta administrativa.');
    return usuario;
  }

  async listarUsuarios(token: string, value: unknown) {
    await this.administrador(token);
    const datos = entrada(value, ['pagina', 'q', 'estado']);
    if (datos.q !== undefined && (typeof datos.q !== 'string' || datos.q.trim().length > 100)) throw new ErrorUsuario('ENTRADA_INVALIDA', 400, 'La búsqueda admite hasta 100 caracteres.');
    return this.repo.listar({ pagina: paginaValida(datos.pagina), q: typeof datos.q === 'string' ? datos.q.trim() : '', estado: datos.estado === undefined ? undefined : estadoValido(datos.estado) });
  }

  async consultarAuditoria(token: string, usuarioId: string, value: unknown) {
    await this.administrador(token);
    const datos = entrada(value, ['pagina']);
    idValido(usuarioId);
    if (!await this.repo.porId(usuarioId)) throw new ErrorUsuario('USUARIO_NO_EXISTE', 404, 'La cuenta no existe.');
    return this.repo.auditoria(usuarioId, paginaValida(datos.pagina));
  }

  async cambiarEstado(token: string, usuarioId: string, value: unknown) {
    const actor = await this.administrador(token);
    const datos = entrada(value, ['estadoActual', 'estado', 'motivo']);
    idValido(usuarioId);
    const estadoActual = estadoValido(datos.estadoActual);
    const estado = estadoValido(datos.estado);
    const motivo = motivoValido(datos.motivo);
    if (estadoActual === estado) throw new ErrorUsuario('ENTRADA_INVALIDA', 400, 'Selecciona un estado diferente al actual.');
    return this.repo.cambiarEstado(actor.id, usuarioId, estadoActual, estado, motivo);
  }
}

import { randomUUID } from 'node:crypto';
import { emailValido, entrada, ErrorUsuario, estadoValido, idValido, motivoValido, nombreValido, paginaValida, passwordValido, type Usuario } from '../dominio/usuario';
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

  async perfil(token: string) {
    return (await this.identidad(token)).usuario;
  }

  async cuentaActiva(usuarioId: string) {
    return (await this.repo.porId(usuarioId))?.estado === 'activo';
  }

  async editar(token: string, value: unknown) {
    const { usuario } = await this.identidad(token);
    const datos = entrada(value, ['nombre']);
    const resultado = await this.repo.cambiarNombre(usuario.id, nombreValido(datos.nombre));
    if (!resultado) throw new ErrorUsuario('SESION_INVALIDA', 401, 'Ingresa nuevamente para continuar.');
    return resultado;
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

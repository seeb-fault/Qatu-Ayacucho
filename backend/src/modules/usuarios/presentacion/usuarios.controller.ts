import { Body, Controller, Get, HttpCode, Inject, Param, Patch, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createHash } from 'node:crypto';
import { Doc, motivo, opciones, ref, texto } from '../../../shared/presentacion/openapi';
import { Usuarios } from '../aplicacion/usuarios';
import { ErrorUsuario } from '../dominio/usuario';
import { CambioEstado, EdicionPerfil, Login, Registro, paginaAdmin } from './openapi';

const cookie = 'qatu_sesion';
const opcionesCookie = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/api/v1' });

function token(request: Request): string {
  return request.headers.cookie?.split(';').map(valor => valor.trim()).find(valor => valor.startsWith(`${cookie}=`))?.slice(cookie.length + 1) ?? '';
}

const COOKIE_SESION = 'Fija la cookie `qatu_sesion` (HttpOnly, SameSite=Strict, Path=/api/v1, 15 minutos).';

@Controller()
export class UsuariosController {
  constructor(@Inject(Usuarios) private readonly usuarios: Usuarios) {}

  private async limite(request: Request, body: unknown, registro: boolean) {
    await this.usuarios.limitar(`ip:${request.ip}:${registro ? 'registro' : 'login'}`, registro ? 10 : 30);
    const email = body && typeof body === 'object' ? (body as Record<string, unknown>).email : undefined;
    if (!registro && typeof email === 'string') {
      const hash = createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
      await this.usuarios.limitar(`email:${hash}`, 10);
    }
  }

  @Doc({
    etiqueta: 'Usuarios', acceso: 'publico', resumen: 'Crear una cuenta',
    detalle: `Crea una cuenta con rol cliente e inicia sesión. ${COOKIE_SESION} No acepta roles ni estados enviados por el navegador.`,
    cuerpo: Registro, devuelve: ref('Sesion'), exito: 'Cuenta creada y sesión iniciada',
    errores: { 409: 'Ya existe una cuenta con ese correo', 429: 'Demasiados registros desde esta IP' },
  })
  @Post('auth/registro')
  async registrar(@Body() body: unknown, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.limite(request, body, true);
    const sesion = await this.usuarios.registrar(body);
    response.cookie(cookie, sesion.token, { ...opcionesCookie(), maxAge: 15 * 60_000 });
    return { usuario: sesion.usuario, expiraEn: sesion.expiraEn };
  }

  @Doc({
    etiqueta: 'Usuarios', acceso: 'publico', resumen: 'Iniciar sesión',
    detalle: `${COOKIE_SESION} El error no revela si el correo existe.`,
    cuerpo: Login, devuelve: ref('Sesion'), exito: 'Sesión iniciada',
    errores: { 401: 'Correo o contraseña incorrectos, o cuenta inactiva (CREDENCIALES_INVALIDAS)', 429: 'Demasiados intentos desde esta IP o para este correo' },
  })
  @Post('auth/login')
  @HttpCode(200)
  async login(@Body() body: unknown, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.limite(request, body, false);
    const sesion = await this.usuarios.login(body);
    response.cookie(cookie, sesion.token, { ...opcionesCookie(), maxAge: 15 * 60_000 });
    return { usuario: sesion.usuario, expiraEn: sesion.expiraEn };
  }

  @Doc({ etiqueta: 'Usuarios', resumen: 'Ver mi perfil', devuelve: ref('Usuario') })
  @Get('usuarios/me')
  perfil(@Req() request: Request) {
    return this.usuarios.perfil(token(request));
  }

  @Doc({
    etiqueta: 'Usuarios', resumen: 'Editar mi perfil',
    detalle: 'Cambia el nombre y el WhatsApp. Quitar el WhatsApp también retira el permiso de mostrarlo.',
    cuerpo: EdicionPerfil, devuelve: ref('Usuario'),
  })
  @Patch('usuarios/me')
  editar(@Body() body: unknown, @Req() request: Request) {
    return this.usuarios.editar(token(request), body);
  }

  @Doc({
    etiqueta: 'Usuarios', acceso: 'opcional', resumen: 'Cerrar sesión',
    detalle: 'Revoca la sesión en el servidor y borra la cookie. Si la sesión ya no era válida, igual responde 204.',
    exito: 'Sesión cerrada',
  })
  @Post('auth/logout')
  @HttpCode(204)
  async salir(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    try {
      await this.usuarios.salir(token(request));
    } catch (error) {
      if (!(error instanceof ErrorUsuario) || error.status !== 401) throw error;
    }
    response.clearCookie(cookie, opcionesCookie());
  }

  @Doc({
    etiqueta: 'Administración', acceso: 'admin', resumen: 'Listar cuentas',
    detalle: '20 cuentas por página, de la más nueva a la más antigua. `q` busca de forma literal en nombre y correo.',
    consultas: { pagina: paginaAdmin, q: { esquema: texto(0, 100), descripcion: 'Texto a buscar' }, estado: { esquema: opciones('activo', 'inactivo') } },
    devuelve: ref('PaginaUsuarios'),
  })
  @Get('admin/usuarios')
  listar(@Req() request: Request, @Query() query: unknown) {
    return this.usuarios.listarUsuarios(token(request), query);
  }

  @Doc({
    etiqueta: 'Administración', acceso: 'admin', resumen: 'Ver la auditoría de una cuenta',
    detalle: 'Cambios de estado de la cuenta, del más reciente al más antiguo. No existe ruta para editar ni borrar eventos.',
    consultas: { pagina: paginaAdmin }, devuelve: ref('PaginaAuditoriaUsuario'), errores: { 404: 'La cuenta no existe' },
  })
  @Get('admin/usuarios/:id/auditoria')
  auditoria(@Req() request: Request, @Param('id') id: string, @Query() query: unknown) {
    return this.usuarios.consultarAuditoria(token(request), id, query);
  }

  @Doc({
    etiqueta: 'Administración', acceso: 'admin', resumen: 'Activar o desactivar una cuenta',
    detalle: `Desactivar revoca todas sus sesiones; reactivar obliga a iniciar sesión de nuevo. El motivo (${motivo.minLength}–${motivo.maxLength} caracteres) queda en la auditoría.`,
    cuerpo: CambioEstado, devuelve: ref('Usuario'),
    errores: { 404: 'La cuenta no existe', 409: 'El estado cambió mientras tanto, o la cuenta es administradora y está protegida' },
  })
  @Patch('admin/usuarios/:id/estado')
  cambiarEstado(@Req() request: Request, @Param('id') id: string, @Body() body: unknown) {
    return this.usuarios.cambiarEstado(token(request), id, body);
  }
}

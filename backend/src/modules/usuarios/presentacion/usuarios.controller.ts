import { Body, Controller, Get, HttpCode, Inject, Param, Patch, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createHash } from 'node:crypto';
import { Usuarios } from '../aplicacion/usuarios';
import { ErrorUsuario } from '../dominio/usuario';

const cookie = 'qatu_sesion';
const opcionesCookie = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/api/v1' });

function token(request: Request): string {
  return request.headers.cookie?.split(';').map(valor => valor.trim()).find(valor => valor.startsWith(`${cookie}=`))?.slice(cookie.length + 1) ?? '';
}

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

  @Post('auth/registro')
  async registrar(@Body() body: unknown, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.limite(request, body, true);
    const sesion = await this.usuarios.registrar(body);
    response.cookie(cookie, sesion.token, { ...opcionesCookie(), maxAge: 15 * 60_000 });
    return { usuario: sesion.usuario, expiraEn: sesion.expiraEn };
  }

  @Post('auth/login')
  @HttpCode(200)
  async login(@Body() body: unknown, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.limite(request, body, false);
    const sesion = await this.usuarios.login(body);
    response.cookie(cookie, sesion.token, { ...opcionesCookie(), maxAge: 15 * 60_000 });
    return { usuario: sesion.usuario, expiraEn: sesion.expiraEn };
  }

  @Get('usuarios/me')
  perfil(@Req() request: Request) {
    return this.usuarios.perfil(token(request));
  }

  @Patch('usuarios/me')
  editar(@Body() body: unknown, @Req() request: Request) {
    return this.usuarios.editar(token(request), body);
  }

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

  @Get('admin/usuarios')
  listar(@Req() request: Request, @Query() query: unknown) {
    return this.usuarios.listarUsuarios(token(request), query);
  }

  @Get('admin/usuarios/:id/auditoria')
  auditoria(@Req() request: Request, @Param('id') id: string, @Query() query: unknown) {
    return this.usuarios.consultarAuditoria(token(request), id, query);
  }

  @Patch('admin/usuarios/:id/estado')
  cambiarEstado(@Req() request: Request, @Param('id') id: string, @Body() body: unknown) {
    return this.usuarios.cambiarEstado(token(request), id, body);
  }
}

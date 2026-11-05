import { Body, Controller, Get, Inject, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Avisos } from '../aplicacion/avisos';

const token = (r: Request) => r.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('qatu_sesion='))?.slice('qatu_sesion='.length) ?? '';

@Controller('avisos')
export class AvisosController {
  constructor(@Inject(Avisos) private readonly avisos: Avisos) {}
  @Get() listar(@Req() r: Request, @Query() q: unknown) { return this.avisos.listar(token(r),q); }
  @Get('resumen') resumen(@Req() r: Request) { return this.avisos.resumen(token(r)); }
  @Post('lectura') marcarTodos(@Req() r: Request, @Body() d: unknown) { return this.avisos.marcarTodos(token(r),d); }
  @Post(':id/lectura') marcar(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.avisos.marcar(token(r),id,d); }
}

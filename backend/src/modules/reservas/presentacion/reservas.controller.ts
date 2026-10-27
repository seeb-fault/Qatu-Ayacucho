import { Body, Controller, Get, Inject, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Reservas } from '../aplicacion/reservas';

const token = (r: Request) => r.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('qatu_sesion='))?.slice('qatu_sesion='.length) ?? '';

@Controller('reservas')
export class ReservasController {
  constructor(@Inject(Reservas) private readonly reservas: Reservas) {}
  @Post() solicitar(@Req() r: Request, @Body() d: unknown) { return this.reservas.solicitar(token(r), d); }
  @Get() listar(@Req() r: Request, @Query() q: unknown) { return this.reservas.listar(token(r), q); }
  @Get(':id') consultar(@Req() r: Request, @Param('id') id: string) { return this.reservas.consultar(token(r), id); }
  @Post(':id/rechazo') rechazar(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.rechazar(token(r), id, d); }
}

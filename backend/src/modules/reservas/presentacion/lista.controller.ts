import { Body, Controller, Delete, Get, Headers, HttpCode, Inject, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Lista } from '../aplicacion/lista';

const token = (r: Request) => r.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('qatu_sesion='))?.slice('qatu_sesion='.length) ?? '';

/** Mi lista (009): solo su dueño la ve y la modifica. */
@Controller('lista')
export class ListaController {
  constructor(@Inject(Lista) private readonly lista: Lista) {}
  @Get() listar(@Req() r: Request) { return this.lista.listar(token(r)); }
  @Get('resumen') resumen(@Req() r: Request) { return this.lista.resumen(token(r)); }
  @Post('items') agregar(@Req() r: Request, @Body() d: unknown) { return this.lista.agregar(token(r), d); }
  @Delete('items/:id') @HttpCode(204) quitar(@Req() r: Request, @Param('id') id: string) { return this.lista.quitar(token(r), id); }
  @Post('items/:id/tarifa') aceptarTarifa(@Req() r: Request, @Param('id') id: string) { return this.lista.aceptarTarifa(token(r), id); }
  @Post('envio') enviar(@Req() r: Request, @Headers('idempotency-key') clave: string | undefined, @Body() d: unknown) { return this.lista.enviar(token(r), clave, d); }
}

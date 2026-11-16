import { Body, Controller, Get, HttpCode, Inject, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Reclamaciones } from '../aplicacion/reclamaciones';

const token = (r: Request) => r.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('qatu_sesion='))?.slice('qatu_sesion='.length) ?? '';

/** Libro de Reclamaciones virtual (012): público, con o sin cuenta. */
@Controller('reclamaciones')
export class LibroReclamacionesController {
  constructor(@Inject(Reclamaciones) private readonly reclamaciones: Reclamaciones) {}
  @Get('titular') titular() { return this.reclamaciones.datosTitular(); }
  @Post() @HttpCode(201) presentar(@Req() r: Request, @Body() d: unknown) { return this.reclamaciones.presentar(token(r), r.ip ?? '', d); }
  @Get('consulta') consultar(@Req() r: Request, @Query() q: unknown) { return this.reclamaciones.consultar(r.ip ?? '', q); }
}

@Controller('admin/reclamaciones')
export class AtencionReclamacionesController {
  constructor(@Inject(Reclamaciones) private readonly reclamaciones: Reclamaciones) {}
  @Get() listar(@Req() r: Request, @Query() q: unknown) { return this.reclamaciones.paraAdministrar(token(r), q); }
  @Patch(':id/respuesta') responder(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reclamaciones.responder(token(r), id, d); }
}

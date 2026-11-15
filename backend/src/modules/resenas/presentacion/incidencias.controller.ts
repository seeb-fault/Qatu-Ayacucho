import { Body, Controller, Get, Inject, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Incidencias } from '../aplicacion/incidencias';

const token = (r: Request) => r.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('qatu_sesion='))?.slice('qatu_sesion='.length) ?? '';

@Controller('reservas/:id')
export class IncidenciasReservaController {
  constructor(@Inject(Incidencias) private readonly incidencias: Incidencias) {}
  @Get('incidencias') listar(@Req() r: Request, @Param('id') id: string) { return this.incidencias.deReserva(token(r), id); }
  @Post('incidencias') abrir(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.incidencias.abrir(token(r), id, d); }
  @Get('garantia') garantia(@Req() r: Request, @Param('id') id: string) { return this.incidencias.garantia(token(r), id); }
  @Put('garantia') documentar(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.incidencias.documentar(token(r), id, d); }
  @Post('garantia/conformidad') confirmar(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.incidencias.confirmar(token(r), id, d); }
}

@Controller('admin/incidencias')
export class ResolucionIncidenciasController {
  constructor(@Inject(Incidencias) private readonly incidencias: Incidencias) {}
  @Get() listar(@Req() r: Request, @Query() q: unknown) { return this.incidencias.paraAdministrar(token(r), q); }
  @Patch(':id/resolucion') resolver(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.incidencias.resolver(token(r), id, d); }
  @Get(':id/evidencias') evidencias(@Req() r: Request, @Param('id') id: string) { return this.incidencias.evidenciasDe(token(r), id); }
}

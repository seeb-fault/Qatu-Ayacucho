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
  @Post(':id/cotizacion') cotizar(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.cotizar(token(r),id,d); }
  @Post(':id/cotizacion/aceptacion') aceptarCotizacion(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.responderCotizacion(token(r),id,d,'ACEPTADA'); }
  @Post(':id/cotizacion/rechazo') rechazarCotizacion(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.responderCotizacion(token(r),id,d,'RECHAZADA'); }
  @Post(':id/agenda/confirmacion') confirmarAgenda(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.confirmarAgenda(token(r),id,d); }
  @Post(':id/rechazo') rechazar(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.rechazar(token(r), id, d); }
  @Post(':id/aceptacion') aceptar(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'aceptacion',d); }
  @Post(':id/visita') visita(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'visita',d); }
  @Post(':id/ampliacion') ampliar(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'ampliacion',d); }
  @Post(':id/cancelacion') cancelar(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'cancelacion',d); }
  @Post(':id/efectivo') efectivo(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'efectivo',d); }
  @Post(':id/recepcion') recepcion(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'recepcion',d); }
  @Post(':id/devolucion/aviso') aviso(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'devolucion/aviso',d); }
  @Post(':id/devolucion/confirmacion') devolucion(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'devolucion/confirmacion',d); }
  @Post(':id/devolucion/rechazo') rechazarDevolucion(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'devolucion/rechazo',d); }
  @Post(':id/servicio/inicio') iniciarServicio(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'servicio/inicio',d); }
  @Post(':id/servicio/termino') terminarServicio(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'servicio/termino',d); }
  @Post(':id/servicio/confirmacion') confirmarServicio(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'servicio/confirmacion',d); }
  @Post(':id/servicio/rechazo') rechazarTermino(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'servicio/rechazo',d); }
}

@Controller('recursos')
export class DisponibilidadController {
  constructor(@Inject(Reservas) private readonly reservas: Reservas) {}
  @Get(':id/disponibilidad') consultar(@Param('id') id: string, @Query() q: unknown) { return this.reservas.disponibilidad(id,q); }
}

import { Body, Controller, Get, Headers, HttpCode, Inject, Param, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Reservas } from '../aplicacion/reservas';
import { Pagos } from '../aplicacion/pagos';

const token = (r: Request) => r.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('qatu_sesion='))?.slice('qatu_sesion='.length) ?? '';

@Controller('reservas')
export class ReservasController {
  constructor(@Inject(Reservas) private readonly reservas: Reservas, @Inject(Pagos) private readonly pagos: Pagos) {}
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
  @Post(':id/entrega') entregar(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'entrega',d); }
  @Post(':id/servicio/cobro') solicitarCobro(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'servicio/cobro',d); }
  @Get(':id/pagos') listarPagos(@Req() r: Request, @Param('id') id: string) { return this.pagos.listar(token(r),id); }
  @Post(':id/pagos') async pagar(@Req() r: Request, @Res({ passthrough: true }) res: Response, @Param('id') id: string, @Headers('idempotency-key') clave: string, @Body() d: unknown) {
    const intento = await this.pagos.iniciar(token(r),id,clave,d);
    // Un resultado incierto no es un fallo ni un pago: se informa como 202 y se concilia.
    if (['PROCESANDO','DESCONOCIDO'].includes(intento.estado)) res.status(202);
    return intento;
  }
  @Post(':id/servicio/inicio') iniciarServicio(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'servicio/inicio',d); }
  @Post(':id/servicio/termino') terminarServicio(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'servicio/termino',d); }
  @Post(':id/servicio/confirmacion') confirmarServicio(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'servicio/confirmacion',d); }
  @Post(':id/servicio/rechazo') rechazarTermino(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'servicio/rechazo',d); }
}

@Controller('pagos')
export class PagosController {
  constructor(@Inject(Pagos) private readonly pagos: Pagos) {}
  @Get('configuracion') configuracion() { return this.pagos.configuracion(); }
  @Post('webhooks/culqi') @HttpCode(200) webhook(@Body() d: unknown) { return this.pagos.webhook(d); }
}

@Controller('recursos')
export class DisponibilidadController {
  constructor(@Inject(Reservas) private readonly reservas: Reservas) {}
  @Get(':id/disponibilidad') consultar(@Param('id') id: string, @Query() q: unknown) { return this.reservas.disponibilidad(id,q); }
}

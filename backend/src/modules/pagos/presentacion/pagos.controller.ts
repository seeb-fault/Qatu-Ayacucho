import { Body, Controller, Get, Headers, HttpCode, Inject, Param, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Pagos } from '../aplicacion/pagos';

const token = (r: Request) => r.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('qatu_sesion='))?.slice('qatu_sesion='.length) ?? '';

@Controller('reservas/:id/pagos')
export class PagosReservaController {
  constructor(@Inject(Pagos) private readonly pagos: Pagos) {}
  @Get() listar(@Req() r: Request, @Param('id') id: string) { return this.pagos.listar(token(r),id); }
  @Post() async pagar(@Req() r: Request, @Res({ passthrough: true }) res: Response, @Param('id') id: string, @Headers('idempotency-key') clave: string, @Body() d: unknown) {
    const intento = await this.pagos.iniciar(token(r),id,clave,d);
    // Un resultado incierto no es un fallo ni un pago: se informa como 202 y se concilia.
    if (['PROCESANDO','DESCONOCIDO'].includes(intento.estado)) res.status(202);
    return intento;
  }
}

@Controller('pagos')
export class PagosController {
  constructor(@Inject(Pagos) private readonly pagos: Pagos) {}
  @Get('configuracion') configuracion() { return this.pagos.configuracion(); }
  @Post('webhooks/culqi') @HttpCode(200) webhook(@Body() d: unknown) { return this.pagos.webhook(d); }
}

import { Body, Controller, Get, Headers, HttpCode, Inject, Param, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Doc, cabeceraIdempotencia, lista, ref, respuesta } from '../../../shared/presentacion/openapi';
import { Pagos } from '../aplicacion/pagos';
import { AvisoPasarela, Pago } from './openapi';

const token = (r: Request) => r.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('qatu_sesion='))?.slice('qatu_sesion='.length) ?? '';

@ApiTags('Pagos')
@Controller('reservas/:id/pagos')
export class PagosReservaController {
  constructor(@Inject(Pagos) private readonly pagos: Pagos) {}
  @Doc({ resumen: 'Ver los pagos de una reserva', devuelve: respuesta({ items: lista(ref('IntentoPago')) }), errores: { 404: 'La reserva no existe o no participas en ella' } })
  @Get() listar(@Req() r: Request, @Param('id') id: string) { return this.pagos.listar(token(r),id); }
  @Doc({
    resumen: 'Pagar en línea (modo de prueba)',
    detalle: 'Cliente. Cobra el importe que calcula el servidor (nunca uno enviado por el navegador). Se puede pagar en ACEPTADA vigente o en SERVICIO_POR_PAGAR. El token no se guarda ni se registra.',
    cabeceras: cabeceraIdempotencia, cuerpo: Pago, devuelve: ref('IntentoPago'), exito: 'Pago aprobado o rechazado por la pasarela',
    otrosExitos: { 202: 'Resultado incierto (PROCESANDO o DESCONOCIDO): se concilia después; consulta GET /reservas/{id}/pagos' },
    errores: {
      400: 'Token, clave de idempotencia o campos inválidos', 403: 'Solo el cliente paga', 404: 'La reserva no existe o no participas en ella',
      409: 'La reserva no admite pago (PAGO_NO_DISPONIBLE), ya hay un pago en curso (PAGO_EN_CURSO) o la clave llegó con otro token', 503: 'La pasarela no está configurada (PAGOS_NO_DISPONIBLES)',
    },
  })
  @Post() async pagar(@Req() r: Request, @Res({ passthrough: true }) res: Response, @Param('id') id: string, @Headers('idempotency-key') clave: string, @Body() d: unknown) {
    const intento = await this.pagos.iniciar(token(r),id,clave,d);
    // Un resultado incierto no es un fallo ni un pago: se informa como 202 y se concilia.
    if (['PROCESANDO','DESCONOCIDO'].includes(intento.estado)) res.status(202);
    return intento;
  }
}

@ApiTags('Pagos')
@Controller('pagos')
export class PagosController {
  constructor(@Inject(Pagos) private readonly pagos: Pagos) {}
  @Doc({ acceso: 'publico', resumen: 'Ver si el pago en línea está disponible', detalle: 'Entrega solo la llave pública de prueba.', devuelve: ref('ConfiguracionPagos') })
  @Get('configuracion') configuracion() { return this.pagos.configuracion(); }
  @Doc({
    acceso: 'pasarela', resumen: 'Recibir avisos de Culqi',
    detalle: 'El aviso no se cree: solo indica qué cargo consultar por la API autenticada de Culqi. Se acepta si coinciden intento, importe, moneda y éxito. Eventos repetidos no tienen efecto adicional.',
    cuerpo: AvisoPasarela, devuelve: respuesta({ recibido: { type: 'boolean', enum: [true] } }), errores: { 503: 'La pasarela no está configurada' },
  })
  @Post('webhooks/culqi') @HttpCode(200) webhook(@Body() d: unknown) { return this.pagos.webhook(d); }
}

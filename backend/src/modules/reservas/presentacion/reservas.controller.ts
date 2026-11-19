import { Body, Controller, Get, Inject, Param, Post, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Doc, entero, instante, opciones, ref, uuid, type DocOperacion } from '../../../shared/presentacion/openapi';
import { Reservas } from '../aplicacion/reservas';
import { Propuesta, RechazoCotizacion, RespuestaCotizacion, Solicitud, SoloVersion, VersionYMotivo } from './openapi';

const token = (r: Request) => r.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('qatu_sesion='))?.slice('qatu_sesion='.length) ?? '';

/** Las transiciones comparten forma: participante, versión, la reserva actualizada y los mismos errores. */
const paso = (resumen: string, detalle: string, conMotivo = false): DocOperacion => ({
  resumen, detalle, cuerpo: conMotivo ? VersionYMotivo : SoloVersion, devuelve: ref('Reserva'),
  errores: { 403: 'Te corresponde a la otra parte de la reserva', 404: 'La reserva no existe o no participas en ella', 409: 'La versión cambió o el estado no lo permite' },
});

@ApiTags('Reservas')
@Controller('reservas')
export class ReservasController {
  constructor(@Inject(Reservas) private readonly reservas: Reservas) {}
  @Doc({
    resumen: 'Solicitar una herramienta o un oficio',
    detalle: 'La solicitud queda PENDIENTE y no bloquea fechas hasta que el proveedor la acepta. No se puede solicitar una oferta propia. El precio lo calcula el servidor.',
    cuerpo: Solicitud, devuelve: ref('Reserva'),
    errores: { 403: 'Es tu propia oferta', 404: 'La oferta o la unidad no están disponibles', 409: 'Ya tienes una solicitud pendiente igual, o la tarifa cambió' },
  })
  @Post() solicitar(@Req() r: Request, @Body() d: unknown) { return this.reservas.solicitar(token(r), d); }
  @Doc({
    resumen: 'Listar mis reservas',
    detalle: '20 por página, de la más reciente a la más antigua. vista=proveedor muestra las recibidas.',
    consultas: { vista: { esquema: { ...opciones('cliente', 'proveedor'), default: 'cliente' } }, page: { esquema: entero(1, 9999, { default: 1 }) } },
    devuelve: ref('PaginaReservas'),
  })
  @Get() listar(@Req() r: Request, @Query() q: unknown) { return this.reservas.listar(token(r), q); }
  @Doc({ resumen: 'Ver el contacto de la otra parte', detalle: 'Nombre, WhatsApp (si lo permitió) y punto exacto, solo mientras la reserva está activa.', devuelve: ref('Contacto'), errores: { 404: 'La reserva no existe o no participas en ella', 409: 'El contacto no está disponible en este estado (CONTACTO_NO_DISPONIBLE)' } })
  @Get(':id/contacto') contacto(@Req() r: Request, @Param('id') id: string) { return this.reservas.contacto(token(r), id); }
  @Doc({ resumen: 'Ver una reserva', devuelve: ref('Reserva'), errores: { 404: 'La reserva no existe o no participas en ella (también para administradores)' } })
  @Get(':id') consultar(@Req() r: Request, @Param('id') id: string) { return this.reservas.consultar(token(r), id); }
  @Doc({ ...paso('Proponer una cotización (oficios)', 'Proveedor. Crea una nueva versión; la anterior sin respuesta queda sustituida. Hasta 50 versiones.'), cuerpo: Propuesta })
  @Post(':id/cotizacion') cotizar(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.cotizar(token(r),id,d); }
  @Doc({ ...paso('Aceptar la cotización', 'Cliente. Acepta la última versión vigente y reserva el horario en la misma transacción: pasa a SERVICIO_CONFIRMADO.'), cuerpo: RespuestaCotizacion, errores: { 403: 'Solo el cliente responde', 404: 'La reserva no existe o no participas en ella', 409: 'Versión vieja, cotización vencida o sustituida, u horario ocupado (RECURSO_OCUPADO)' } })
  @Post(':id/cotizacion/aceptacion') aceptarCotizacion(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.responderCotizacion(token(r),id,d,'ACEPTADA'); }
  @Doc({ ...paso('Rechazar la cotización', 'Cliente, con motivo. El proveedor puede proponer otra versión.'), cuerpo: RechazoCotizacion })
  @Post(':id/cotizacion/rechazo') rechazarCotizacion(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.responderCotizacion(token(r),id,d,'RECHAZADA'); }
  @Doc({ ...paso('Confirmar la agenda de un acuerdo anterior', 'Cliente. Solo para cotizaciones aceptadas antes de 005.4, que aún no reservaban horario.'), cuerpo: RespuestaCotizacion })
  @Post(':id/agenda/confirmacion') confirmarAgenda(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.confirmarAgenda(token(r),id,d); }
  @Doc(paso('Rechazar la solicitud', 'Proveedor, con motivo. Solo desde PENDIENTE.', true))
  @Post(':id/rechazo') rechazar(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.rechazar(token(r), id, d); }
  @Doc({ ...paso('Aceptar y apartar la herramienta', 'Proveedor. PENDIENTE → ACEPTADA: bloquea la unidad 60 minutos para el pago o la entrega.'), errores: { 403: 'Solo el proveedor acepta', 404: 'La reserva no existe o no participas en ella', 409: 'La versión cambió, el estado no lo permite o la unidad está ocupada' } })
  @Post(':id/aceptacion') aceptar(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'aceptacion',d); }
  @Doc(paso('Acordar una visita', 'Proveedor, con motivo. Solicitud de visita → VISITA_ACORDADA; no bloquea ni cobra.', true))
  @Post(':id/visita') visita(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'visita',d); }
  @Doc(paso('Ampliar el apartado', 'Proveedor, con motivo. Renueva el apartado vigente a 60 minutos desde ahora, sin pasar del fin.', true))
  @Post(':id/ampliacion') ampliar(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'ampliacion',d); }
  @Doc(paso('Cancelar la reserva', 'Cliente o proveedor, con motivo. Libera el bloqueo. En oficios, hasta que el trabajo empiece; si estaba pagada en línea, queda reembolso pendiente.', true))
  @Post(':id/cancelacion') cancelar(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'cancelacion',d); }
  @Doc(paso('Registrar efectivo y entrega', 'Proveedor. ACEPTADA → ENTREGA_POR_CONFIRMAR. Es una declaración, no una verificación bancaria.'))
  @Post(':id/efectivo') efectivo(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'efectivo',d); }
  @Doc(paso('Confirmar la recepción', 'Cliente. ENTREGA_POR_CONFIRMAR → EN_CURSO.'))
  @Post(':id/recepcion') recepcion(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'recepcion',d); }
  @Doc(paso('Avisar la devolución', 'Cliente. EN_CURSO → DEVOLUCION_PENDIENTE; la hora la pone el servidor.'))
  @Post(':id/devolucion/aviso') aviso(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'devolucion/aviso',d); }
  @Doc(paso('Confirmar la devolución', 'Proveedor. DEVOLUCION_PENDIENTE → DEVUELTA: calcula días extra, importe final y saldo, y libera la unidad.'))
  @Post(':id/devolucion/confirmacion') devolucion(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'devolucion/confirmacion',d); }
  @Doc(paso('Rechazar el aviso de devolución', 'Proveedor, con motivo. Vuelve a EN_CURSO conservando el historial.', true))
  @Post(':id/devolucion/rechazo') rechazarDevolucion(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'devolucion/rechazo',d); }
  @Doc(paso('Entregar una herramienta pagada en línea', 'Proveedor. APARTADO_PAGADO → ENTREGA_POR_CONFIRMAR.'))
  @Post(':id/entrega') entregar(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'entrega',d); }
  @Doc(paso('Pedir el pago en línea del servicio', 'Proveedor. SERVICIO_EN_CURSO → SERVICIO_POR_PAGAR.'))
  @Post(':id/servicio/cobro') solicitarCobro(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'servicio/cobro',d); }
  @Doc(paso('Iniciar el servicio', 'Proveedor, desde la hora acordada. SERVICIO_CONFIRMADO → SERVICIO_EN_CURSO.'))
  @Post(':id/servicio/inicio') iniciarServicio(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'servicio/inicio',d); }
  @Doc(paso('Terminar el servicio', 'Proveedor. Declara el trabajo terminado y el efectivo por el total acordado: SERVICIO_POR_CONFIRMAR.'))
  @Post(':id/servicio/termino') terminarServicio(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'servicio/termino',d); }
  @Doc(paso('Confirmar el servicio terminado', 'Cliente. SERVICIO_POR_CONFIRMAR → SERVICIO_CERRADO y libera la agenda.'))
  @Post(':id/servicio/confirmacion') confirmarServicio(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'servicio/confirmacion',d); }
  @Doc(paso('Rechazar el término del servicio', 'Cliente, con motivo. Vuelve a SERVICIO_EN_CURSO y anula el efectivo declarado.', true))
  @Post(':id/servicio/rechazo') rechazarTermino(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reservas.operar(token(r),id,'servicio/rechazo',d); }
}

@ApiTags('Reservas')
@Controller('recursos')
export class DisponibilidadController {
  constructor(@Inject(Reservas) private readonly reservas: Reservas) {}
  @Doc({
    acceso: 'publico', resumen: 'Consultar la disponibilidad de una unidad',
    detalle: 'Rangos ocupados entre inicio y fin, sin identidades. No promete disponibilidad futura si hay retrasos.',
    consultas: { publicacionId: { esquema: uuid, requerido: true }, inicio: { esquema: instante, requerido: true }, fin: { esquema: instante, requerido: true } },
    devuelve: ref('Disponibilidad'), errores: { 404: 'La oferta o la unidad no son públicas' },
  })
  @Get(':id/disponibilidad') consultar(@Param('id') id: string, @Query() q: unknown) { return this.reservas.disponibilidad(id,q); }
}

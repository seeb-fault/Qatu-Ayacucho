import { Body, Controller, Get, HttpCode, Inject, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Doc, booleano, opciones, pagina, ref, respuesta, texto, uuid } from '../../../shared/presentacion/openapi';
import { Reclamaciones } from '../aplicacion/reclamaciones';
import { NuevaHoja, RespuestaHoja, paginaPublica } from './openapi';

const token = (r: Request) => r.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('qatu_sesion='))?.slice('qatu_sesion='.length) ?? '';

/** Libro de Reclamaciones virtual (012): público, con o sin cuenta. */
@ApiTags('Libro de Reclamaciones')
@Controller('reclamaciones')
export class LibroReclamacionesController {
  constructor(@Inject(Reclamaciones) private readonly reclamaciones: Reclamaciones) {}
  @Doc({ acceso: 'publico', resumen: 'Ver los datos del proveedor del servicio', detalle: 'Razón social, RUC y dirección que figuran en cada hoja.', devuelve: ref('Titular') })
  @Get('titular') titular() { return this.reclamaciones.datosTitular(); }
  @Doc({
    acceso: 'opcional', resumen: 'Presentar una hoja de reclamación',
    detalle: 'No exige cuenta. Asigna un número correlativo (LR-AAAA-NNNNNN) y calcula el plazo de respuesta de 15 días hábiles. El `codigoConsulta` se muestra solo esta vez; se guarda como hash.',
    cuerpo: NuevaHoja, devuelve: { allOf: [ref('HojaReclamacion'), respuesta({ codigoConsulta: texto(12, 12, { description: 'Guárdalo: sirve para consultar la respuesta' }) })] },
    errores: { 429: 'Más de 3 hojas con el mismo documento en 15 minutos, o demasiadas desde esta IP' },
  })
  @Post() @HttpCode(201) presentar(@Req() r: Request, @Body() d: unknown) { return this.reclamaciones.presentar(token(r), r.ip ?? '', d); }
  @Doc({
    acceso: 'publico', resumen: 'Consultar una hoja y su respuesta', detalle: 'Con el número de hoja y el código de consulta de la constancia.',
    consultas: { numero: { esquema: texto(14, 14, { pattern: '^LR-\\d{4}-\\d{6}$', example: 'LR-2026-000001' }), requerido: true }, codigo: { esquema: texto(12, 12, { pattern: '^[A-Za-z0-9_-]{12}$' }), requerido: true } },
    devuelve: ref('HojaReclamacion'), errores: { 404: 'Número o código incorrectos', 429: 'Demasiadas consultas desde esta IP' },
  })
  @Get('consulta') consultar(@Req() r: Request, @Query() q: unknown) { return this.reclamaciones.consultar(r.ip ?? '', q); }
}

@ApiTags('Administración')
@Controller('admin/reclamaciones')
export class AtencionReclamacionesController {
  constructor(@Inject(Reclamaciones) private readonly reclamaciones: Reclamaciones) {}
  @Doc({
    acceso: 'admin', resumen: 'Listar hojas de reclamación', detalle: '`vencida` indica las pendientes que pasaron su plazo.',
    consultas: { estado: { esquema: { ...opciones('pendiente', 'respondida'), default: 'pendiente' } }, page: paginaPublica },
    devuelve: pagina({ allOf: [ref('HojaReclamacion'), respuesta({ id: uuid, vencida: booleano })] }),
  })
  @Get() listar(@Req() r: Request, @Query() q: unknown) { return this.reclamaciones.paraAdministrar(token(r), q); }
  @Doc({
    acceso: 'admin', resumen: 'Registrar la respuesta a una hoja', detalle: 'Una sola respuesta por hoja, enviada por correo o carta.',
    cuerpo: RespuestaHoja, devuelve: { allOf: [ref('HojaReclamacion'), respuesta({ id: uuid })] }, errores: { 404: 'La hoja no existe', 409: 'Ya fue respondida' },
  })
  @Patch(':id/respuesta') responder(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.reclamaciones.responder(token(r), id, d); }
}

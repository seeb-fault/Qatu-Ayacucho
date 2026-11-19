import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Doc, booleano, instante, nulable, nulableRef, pagina, ref, respuesta, texto } from '../../../shared/presentacion/openapi';
import { Resenas } from '../aplicacion/resenas';
import { ModeracionResena, NuevaResena, paginaPublica } from './openapi';

const token = (r: Request) => r.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('qatu_sesion='))?.slice('qatu_sesion='.length) ?? '';

@ApiTags('Reseñas')
@Controller('reservas/:id/resena')
export class ResenaReservaController {
  constructor(@Inject(Resenas) private readonly resenas: Resenas) {}
  @Doc({
    resumen: 'Ver la reseña de una reserva', detalle: 'Solo participantes. Indica si el cliente todavía puede reseñar y hasta cuándo.',
    devuelve: respuesta({ resena: nulableRef('ResenaModerable'), puedeResenar: booleano, plazo: nulable(instante) }), errores: { 404: 'La reserva no existe o no participas en ella' },
  })
  @Get() consultar(@Req() r: Request, @Param('id') id: string) { return this.resenas.deReserva(token(r), id); }
  @Doc({
    resumen: 'Reseñar una reserva cerrada',
    detalle: 'Cliente, una vez por reserva, cuando está DEVUELTA o SERVICIO_CERRADO y hasta 14 días después.',
    cuerpo: NuevaResena, devuelve: ref('ResenaModerable'),
    errores: { 403: 'Solo el cliente reseña', 404: 'La reserva no existe o no participas en ella', 409: 'La reserva no está cerrada (RESERVA_NO_CERRADA), venció el plazo (PLAZO_VENCIDO) o ya tiene reseña (RESENA_DUPLICADA)' },
  })
  @Post() crear(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.resenas.crear(token(r), id, d); }
}

@ApiTags('Reseñas')
@Controller()
export class ResenasPublicasController {
  constructor(@Inject(Resenas) private readonly resenas: Resenas) {}
  @Doc({
    acceso: 'publico', resumen: 'Ver las reseñas de un proveedor', detalle: 'Solo las visibles, 20 por página, con el promedio.',
    consultas: { page: paginaPublica }, devuelve: pagina(ref('Resena'), { promedio: nulable({ type: 'number', description: 'Un decimal; null sin reseñas visibles' }) }),
  })
  @Get('proveedores/:id/resenas') deProveedor(@Param('id') id: string, @Query() q: unknown) { return this.resenas.deProveedor(id, q); }
  @Doc({
    acceso: 'publico', resumen: 'Ver la reputación de varios proveedores',
    detalle: 'Para las tarjetas del catálogo. Devuelve un objeto cuyas claves son los id de proveedor.',
    consultas: { proveedores: { esquema: texto(36, undefined, { description: 'Hasta 50 id separados por comas' }), requerido: true } },
    devuelve: { type: 'object', additionalProperties: ref('Reputacion') },
  })
  @Get('resenas/resumen') resumen(@Query() q: unknown) { return this.resenas.resumen(q); }
}

@ApiTags('Administración')
@Controller('admin/resenas')
export class ModeracionResenasController {
  constructor(@Inject(Resenas) private readonly resenas: Resenas) {}
  @Doc({ acceso: 'admin', resumen: 'Listar todas las reseñas', detalle: 'Incluye las ocultas y la última moderación.', consultas: { page: paginaPublica }, devuelve: pagina(ref('ResenaModerable')) })
  @Get() listar(@Req() r: Request, @Query() q: unknown) { return this.resenas.paraAdministrar(token(r), q); }
  @Doc({
    acceso: 'admin', resumen: 'Ocultar o mostrar una reseña', detalle: 'Con motivo. No la puede moderar quien participó en la reserva.',
    cuerpo: ModeracionResena, devuelve: ref('ResenaModerable'), errores: { 403: 'Participaste en esa reserva', 404: 'La reseña no existe' },
  })
  @Patch(':id/moderacion') moderar(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.resenas.moderar(token(r), id, d); }
}

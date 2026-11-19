import { Body, Controller, Get, Inject, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Doc, booleano, lista, nulableRef, opciones, pagina, ref, respuesta, uuid } from '../../../shared/presentacion/openapi';
import { Incidencias } from '../aplicacion/incidencias';
import { Conformidad, DocumentoGarantia, NuevaIncidencia, Resolucion, paginaPublica } from './openapi';

const token = (r: Request) => r.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('qatu_sesion='))?.slice('qatu_sesion='.length) ?? '';
const AJENA = { 404: 'La reserva no existe o no participas en ella' };

@ApiTags('Incidencias')
@Controller('reservas/:id')
export class IncidenciasReservaController {
  constructor(@Inject(Incidencias) private readonly incidencias: Incidencias) {}
  @Doc({ resumen: 'Ver las incidencias de una reserva', devuelve: respuesta({ items: lista(ref('Incidencia')), puedeReclamar: booleano }), errores: AJENA })
  @Get('incidencias') listar(@Req() r: Request, @Param('id') id: string) { return this.incidencias.deReserva(token(r), id); }
  @Doc({
    resumen: 'Reportar un problema', detalle: 'Participantes, desde la entrega hasta 48 h después del cierre. Avisa a la otra parte; lo revisa una persona.',
    cuerpo: NuevaIncidencia, devuelve: ref('Incidencia'),
    errores: { ...AJENA, 409: 'Fuera de plazo (RECLAMO_FUERA_DE_PLAZO) o ya hay una abierta (INCIDENCIA_ABIERTA)' },
  })
  @Post('incidencias') abrir(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.incidencias.abrir(token(r), id, d); }
  @Doc({ resumen: 'Ver la garantía documental', detalle: 'Solo aplica a herramientas.', devuelve: respuesta({ aplica: booleano, garantia: nulableRef('Garantia') }), errores: AJENA })
  @Get('garantia') garantia(@Req() r: Request, @Param('id') id: string) { return this.incidencias.garantia(token(r), id); }
  @Doc({
    resumen: 'Registrar las condiciones de la garantía', detalle: 'Proveedor, antes de entregar. Describe el estado y los accesorios; no incluye montos.',
    cuerpo: DocumentoGarantia, devuelve: ref('Garantia'), errores: { ...AJENA, 403: 'Solo el proveedor la registra', 409: 'El cliente ya dio su conformidad o el estado no lo permite' },
  })
  @Put('garantia') documentar(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.incidencias.documentar(token(r), id, d); }
  @Doc({
    resumen: 'Dar conformidad a la garantía', detalle: 'Cliente, al recibir la herramienta, sobre la versión vigente.',
    cuerpo: Conformidad, devuelve: ref('Garantia'), errores: { ...AJENA, 403: 'Solo el cliente da conformidad', 409: 'La garantía cambió' },
  })
  @Post('garantia/conformidad') confirmar(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.incidencias.confirmar(token(r), id, d); }
}

@ApiTags('Administración')
@Controller('admin/incidencias')
export class ResolucionIncidenciasController {
  constructor(@Inject(Incidencias) private readonly incidencias: Incidencias) {}
  @Doc({
    acceso: 'admin', resumen: 'Listar incidencias', consultas: { estado: { esquema: opciones('abierta', 'resuelta') }, page: paginaPublica },
    devuelve: pagina({ allOf: [ref('Incidencia'), respuesta({ reservaId: uuid })] }),
  })
  @Get() listar(@Req() r: Request, @Query() q: unknown) { return this.incidencias.paraAdministrar(token(r), q); }
  @Doc({
    acceso: 'admin', resumen: 'Resolver una incidencia', detalle: 'Con motivo, avisa a ambas partes. No la resuelve quien participó en la reserva. Cambiar el estado no implica una devolución de dinero.',
    cuerpo: Resolucion, devuelve: ref('Incidencia'), errores: { 403: 'Participaste en esa reserva', 404: 'La incidencia no existe', 409: 'Ya está resuelta' },
  })
  @Patch(':id/resolucion') resolver(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.incidencias.resolver(token(r), id, d); }
  @Doc({
    acceso: 'admin', resumen: 'Ver las fotos de la reserva de una incidencia', detalle: 'Solo metadatos; cada foto se descarga en GET /evidencias/{id}/archivo.',
    devuelve: respuesta({ items: lista(respuesta({ id: uuid, etapa: opciones('entrega', 'devolucion', 'trabajo'), autor: opciones('cliente', 'proveedor'), disponible: booleano })) }),
    errores: { 404: 'La incidencia no existe' },
  })
  @Get(':id/evidencias') evidencias(@Req() r: Request, @Param('id') id: string) { return this.incidencias.evidenciasDe(token(r), id); }
}

import { Body, Controller, Delete, Get, Header, HttpCode, Inject, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Doc, lista, ref } from '../../../shared/presentacion/openapi';
import { Catalogo } from '../aplicacion/catalogo';
import { AltaPublicacion, EdicionPublicacion, Moderacion, Ubicacion, filtrosCatalogo } from './openapi';
const token=(r:Request)=>r.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('qatu_sesion='))?.slice('qatu_sesion='.length)??'';
const PROPIA = { 404: 'La oferta no existe o no es tuya' };
/** Lecturas públicas cacheables por el navegador o una CDN (estrategia de caché, Sprint 2). Lo privado sigue con no-store. */
const REFERENCIA = 'public, max-age=3600', PUBLICA = 'public, max-age=30';
@ApiTags('Catálogo')
@Controller('publicaciones')
export class CatalogoController {
 constructor(@Inject(Catalogo) private readonly catalogo:Catalogo) {}
 @Doc({ acceso: 'publico', resumen: 'Ver categorías y distritos', devuelve: ref('OpcionesCatalogo') })
 @Header('Cache-Control', REFERENCIA) @Get('opciones') opciones() {return this.catalogo.opciones();}
 @Doc({ resumen: 'Listar mis publicaciones', detalle: 'Incluye las inactivas y las retiradas por moderación. Mismos filtros que la búsqueda.', consultas: filtrosCatalogo, devuelve: ref('PaginaPublicacionesPropias'), errores: { 404: 'Aún no tienes perfil de proveedor' } })
 @Get('mias') propias(@Req() r:Request,@Query() q:unknown) {return this.catalogo.propias(token(r),q);}
 @Doc({
  acceso: 'publico', resumen: 'Buscar publicaciones',
  detalle: 'Solo ofertas activas, permitidas y de proveedores habilitados. Los filtros se combinan (AND); la búsqueda ignora tildes. Una página mayor al total devuelve items vacíos. Parámetros repetidos o desconocidos: 400.',
  consultas: filtrosCatalogo, devuelve: ref('PaginaPublicaciones'),
 })
 @Header('Cache-Control', PUBLICA) @Get() listar(@Query() q:unknown) {return this.catalogo.listar(q);}
 @Doc({ resumen: 'Ver la ubicación exacta de mi oferta', detalle: 'Solo el dueño: el punto guardado y el que ve el público.', devuelve: ref('UbicacionPropia'), errores: PROPIA })
 @Get(':id/ubicacion') ubicacion(@Req() r:Request,@Param('id') id:string) {return this.catalogo.ubicacionPropia(token(r),id);}
 @Doc({ resumen: 'Marcar la ubicación de mi oferta', detalle: 'El punto debe estar en la zona de servicio de Qatu (Huamanga y alrededores).', cuerpo: Ubicacion, devuelve: ref('UbicacionGuardada'), errores: { 400: 'Fuera de la zona de servicio o datos inválidos', ...PROPIA } })
 @Put(':id/ubicacion') ubicar(@Req() r:Request,@Param('id') id:string,@Body() d:unknown) {return this.catalogo.ubicar(token(r),id,d);}
 @Doc({ resumen: 'Quitar la ubicación de mi oferta', errores: PROPIA })
 @Delete(':id/ubicacion') @HttpCode(204) quitarUbicacion(@Req() r:Request,@Param('id') id:string) {return this.catalogo.quitarUbicacion(token(r),id);}
 @Doc({ acceso: 'publico', resumen: 'Ver el detalle de una publicación', devuelve: ref('Publicacion'), errores: { 404: 'No existe o no está visible' } })
 @Header('Cache-Control', PUBLICA) @Get(':id') consultar(@Param('id') id:string) {return this.catalogo.consultar(id);}
 @Doc({
  resumen: 'Publicar una oferta',
  detalle: 'Requiere perfil de proveedor aprobado y público, y WhatsApp visible en Mi cuenta. Herramienta: precio fijo por día. Servicio: precio fijo por servicio o cotización.',
  cuerpo: AltaPublicacion, devuelve: ref('PublicacionPropia'),
  errores: { 403: 'Verificación no aprobada o perfil no público (PROVEEDOR_NO_HABILITADO)', 404: 'Aún no tienes perfil de proveedor', 409: 'Falta tu WhatsApp visible (WHATSAPP_REQUERIDO)' },
 })
 @Post() crear(@Req() r:Request,@Body() d:unknown) {return this.catalogo.crear(token(r),d);}
 @Doc({
  resumen: 'Editar mi oferta',
  detalle: 'El tipo no cambia. No hay borrado: se desactiva. Una oferta retirada por moderación no se puede reactivar.',
  cuerpo: EdicionPublicacion, devuelve: ref('PublicacionPropia'),
  errores: { 403: 'La oferta es de otro proveedor o tu verificación no está aprobada', 404: 'La oferta no existe', 409: 'La versión cambió o la oferta fue retirada (OFERTA_RETIRADA)' },
 })
 @Patch(':id') editar(@Req() r:Request,@Param('id') id:string,@Body() d:unknown) {return this.catalogo.editar(token(r),id,d);}
}
@ApiTags('Administración')
@Controller('admin/publicaciones')
export class ModeracionController {
 constructor(@Inject(Catalogo) private readonly catalogo:Catalogo) {}
 @Doc({ acceso: 'admin', resumen: 'Listar todas las publicaciones', detalle: 'Incluye inactivas y retiradas.', consultas: filtrosCatalogo, devuelve: ref('PaginaPublicacionesPropias') })
 @Get() listar(@Req() r:Request,@Query() q:unknown) {return this.catalogo.administrativas(token(r),q);}
 @Doc({ acceso: 'admin', resumen: 'Ver el historial de moderación de una publicación', devuelve: lista(ref('EventoModeracion')), errores: { 404: 'La oferta no existe' } })
 @Get(':id/auditoria') auditoria(@Req() r:Request,@Param('id') id:string) {return this.catalogo.auditoria(token(r),id);}
 @Doc({
  acceso: 'admin', resumen: 'Permitir o retirar una publicación',
  detalle: 'Queda auditado con motivo. Volver a permitirla no la reactiva si el dueño la dejó inactiva.',
  cuerpo: Moderacion, devuelve: ref('PublicacionPropia'), errores: { 404: 'La oferta no existe', 409: 'La versión cambió' },
 })
 @Patch(':id/moderacion') moderar(@Req() r:Request,@Param('id') id:string,@Body() d:unknown) {return this.catalogo.moderar(token(r),id,d);}
}

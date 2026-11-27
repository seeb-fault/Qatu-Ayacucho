import { Body, Controller, Get, Header, Inject, Injectable, Param, Patch, Post, Query, Req, Res, UploadedFiles, UseGuards, UseInterceptors, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Doc, entero, lista, opciones, ref } from '../../../shared/presentacion/openapi';
import { Proveedores } from '../aplicacion/proveedores';
import type { ArchivoRecibido } from '../dominio/verificacion';
import { AltaPerfil, EdicionPerfil, Revision, SolicitudDocumental } from './openapi';

function token(request: Request) {
  return request.headers.cookie?.split(';').map(valor => valor.trim()).find(valor => valor.startsWith('qatu_sesion='))?.slice('qatu_sesion='.length) ?? '';
}

@Injectable()
export class SesionProveedorGuard implements CanActivate {
  constructor(@Inject(Proveedores) private readonly proveedores: Proveedores) {}
  async canActivate(context: ExecutionContext) {
    await this.proveedores.propio(token(context.switchToHttp().getRequest<Request>()));
    return true;
  }
}

@ApiTags('Proveedores')
@Controller('proveedores')
export class ProveedoresController {
  constructor(@Inject(Proveedores) private readonly proveedores: Proveedores) {}

  @Doc({ acceso: 'publico', resumen: 'Listar distritos de servicio', devuelve: lista(ref('Zona')) })
  @Header('Cache-Control', 'public, max-age=3600')
  @Get('zonas')
  zonas() { return this.proveedores.zonas(); }

  @Doc({ acceso: 'publico', resumen: 'Ver las reglas de los documentos de verificación', detalle: 'Tipos, tamaño máximo y conservación. Nunca expone la clave de cifrado.', devuelve: ref('PoliticaDocumental') })
  @Get('politica-documental')
  politica() { return this.proveedores.politicaDocumental(); }

  @Doc({
    resumen: 'Descargar un documento de verificación',
    detalle: 'Solo el dueño o un administrador, mientras la cuenta dueña siga activa. Se descifra después de autorizar y se entrega como adjunto con `Cache-Control: no-store` y `CSP: sandbox`.',
    archivo: ['application/pdf', 'image/jpeg', 'image/png'], errores: { 404: 'No existe, es ajeno, se eliminó o la cuenta dueña está inactiva' },
  })
  @Get('documentos/:id')
  async documento(@Req() request: Request, @Param('id') id: string, @Res() response: Response) {
    const documento = await this.proveedores.descargar(token(request),id);
    const extension = documento.tipo === 'application/pdf' ? 'pdf' : documento.tipo === 'image/png' ? 'png' : 'jpg';
    response.setHeader('Content-Type',documento.tipo);
    response.setHeader('Content-Disposition',`attachment; filename="documento-${documento.id}.${extension}"`);
    response.setHeader('Content-Security-Policy',"sandbox; default-src 'none'");
    response.send(Buffer.from(documento.contenido));
  }

  @Doc({ resumen: 'Ver mi perfil de proveedor', devuelve: ref('ProveedorPropio'), errores: { 404: 'Aún no tienes perfil de proveedor' } })
  @Get('me')
  propio(@Req() request: Request) { return this.proveedores.propio(token(request)); }

  @Doc({ resumen: 'Crear mi perfil de proveedor', detalle: 'Un perfil por cuenta. El estado de verificación empieza en no_solicitada.', cuerpo: AltaPerfil, devuelve: ref('ProveedorPropio'), errores: { 409: 'Ya tienes un perfil de proveedor' } })
  @Post('me')
  crear(@Req() request: Request, @Body() body: unknown) { return this.proveedores.crear(token(request), body); }

  @Doc({
    resumen: 'Editar mi perfil de proveedor',
    detalle: 'Mientras la verificación está pendiente solo cambia la visibilidad. Cambiar nombre, descripción o zona después de una decisión reinicia la verificación.',
    cuerpo: EdicionPerfil, devuelve: ref('ProveedorPropio'), errores: { 404: 'Aún no tienes perfil de proveedor', 409: 'La versión cambió o la verificación está pendiente' },
  })
  @Patch('me')
  editar(@Req() request: Request, @Body() body: unknown) { return this.proveedores.editar(token(request), body); }

  @Doc({ resumen: 'Ver mis solicitudes de verificación', detalle: 'Las últimas 20, de la más reciente a la más antigua.', devuelve: lista(ref('SolicitudVerificacion')), errores: { 404: 'Aún no tienes perfil de proveedor' } })
  @Get('me/verificaciones')
  historial(@Req() request: Request) { return this.proveedores.historial(token(request)); }

  @Doc({
    resumen: 'Enviar documentos para verificar mi perfil',
    detalle: 'La sesión se comprueba antes de leer los archivos. Se guardan cifrados (AES-256-GCM) y la solicitud queda pendiente de revisión humana.',
    multipart: SolicitudDocumental, devuelve: ref('SolicitudVerificacion'),
    errores: { 404: 'Aún no tienes perfil de proveedor', 409: 'Ya hay una revisión pendiente o aprobada, o el perfil cambió', 413: 'Un archivo supera 5 MiB', 429: 'Más de tres solicitudes en 24 horas', 503: 'El servidor no tiene configurada la clave de cifrado' },
  })
  @Post('me/verificaciones')
  @UseGuards(SesionProveedorGuard)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'documentos', maxCount: 2 }], { limits: { fileSize: 5242880, files: 2, fields: 2, parts: 5, fieldSize: 100, fieldNameSize: 50 } }))
  solicitar(@Req() request: Request, @Body() body: unknown, @UploadedFiles() archivos: { documentos?: ArchivoRecibido[] }) {
    return this.proveedores.solicitar(token(request), body, archivos?.documentos ?? []);
  }

  @Doc({ acceso: 'publico', resumen: 'Ver el perfil público de un proveedor', detalle: 'Sin correo, usuario, documentos ni motivos.', devuelve: ref('ProveedorPublico'), errores: { 404: 'No existe, está oculto o la cuenta está inactiva' } })
  @Get(':id')
  publico(@Param('id') id: string) { return this.proveedores.publico(id); }
}

@ApiTags('Administración')
@Controller('admin/proveedores')
export class RevisionProveedoresController {
  constructor(@Inject(Proveedores) private readonly proveedores: Proveedores) {}

  @Doc({
    acceso: 'admin', resumen: 'Listar solicitudes de verificación',
    detalle: '20 por página, de la más antigua a la más nueva, con el perfil actual y el enviado.',
    consultas: { pagina: { esquema: entero(1, 99999, { default: 1 }) }, estado: { esquema: { ...opciones('pendiente', 'aprobada', 'rechazada', 'cancelada'), default: 'pendiente' } } },
    devuelve: ref('PaginaSolicitudesVerificacion'),
  })
  @Get('verificaciones')
  pendientes(@Req() request: Request, @Query() query: unknown) { return this.proveedores.pendientes(token(request),query); }

  @Doc({
    acceso: 'admin', resumen: 'Aprobar o rechazar una verificación',
    detalle: 'Lo decide otro administrador: nadie revisa su propio perfil. La decisión y el estado del perfil se guardan juntos y quedan auditados.',
    cuerpo: Revision, devuelve: ref('SolicitudVerificacion'),
    errores: { 403: 'Es tu propio perfil', 404: 'La solicitud no es de este perfil o la cuenta no está disponible', 409: 'Ya está resuelta o no tiene documentos' },
  })
  @Post(':id/verificacion')
  revisar(@Req() request: Request, @Param('id') id: string, @Body() body: unknown) { return this.proveedores.revisar(token(request),id,body); }
}

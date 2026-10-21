import { Body, Controller, Get, Inject, Injectable, Param, Patch, Post, Query, Req, Res, UploadedFiles, UseGuards, UseInterceptors, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { Proveedores } from '../aplicacion/proveedores';
import type { ArchivoRecibido } from '../dominio/verificacion';

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

@Controller('proveedores')
export class ProveedoresController {
  constructor(@Inject(Proveedores) private readonly proveedores: Proveedores) {}

  @Get('zonas')
  zonas() { return this.proveedores.zonas(); }

  @Get('politica-documental')
  politica() { return this.proveedores.politicaDocumental(); }

  @Get('documentos/:id')
  async documento(@Req() request: Request, @Param('id') id: string, @Res() response: Response) {
    const documento = await this.proveedores.descargar(token(request),id);
    const extension = documento.tipo === 'application/pdf' ? 'pdf' : documento.tipo === 'image/png' ? 'png' : 'jpg';
    response.setHeader('Content-Type',documento.tipo);
    response.setHeader('Content-Disposition',`attachment; filename="documento-${documento.id}.${extension}"`);
    response.setHeader('Content-Security-Policy',"sandbox; default-src 'none'");
    response.send(Buffer.from(documento.contenido));
  }

  @Get('me')
  propio(@Req() request: Request) { return this.proveedores.propio(token(request)); }

  @Post('me')
  crear(@Req() request: Request, @Body() body: unknown) { return this.proveedores.crear(token(request), body); }

  @Patch('me')
  editar(@Req() request: Request, @Body() body: unknown) { return this.proveedores.editar(token(request), body); }

  @Get('me/verificaciones')
  historial(@Req() request: Request) { return this.proveedores.historial(token(request)); }

  @Post('me/verificaciones')
  @UseGuards(SesionProveedorGuard)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'documentos', maxCount: 2 }], { limits: { fileSize: 5242880, files: 2, fields: 2, parts: 5, fieldSize: 100, fieldNameSize: 50 } }))
  solicitar(@Req() request: Request, @Body() body: unknown, @UploadedFiles() archivos: { documentos?: ArchivoRecibido[] }) {
    return this.proveedores.solicitar(token(request), body, archivos?.documentos ?? []);
  }

  @Get(':id')
  publico(@Param('id') id: string) { return this.proveedores.publico(id); }
}

@Controller('admin/proveedores')
export class RevisionProveedoresController {
  constructor(@Inject(Proveedores) private readonly proveedores: Proveedores) {}

  @Get('verificaciones')
  pendientes(@Req() request: Request, @Query() query: unknown) { return this.proveedores.pendientes(token(request),query); }

  @Post(':id/verificacion')
  revisar(@Req() request: Request, @Param('id') id: string, @Body() body: unknown) { return this.proveedores.revisar(token(request),id,body); }
}

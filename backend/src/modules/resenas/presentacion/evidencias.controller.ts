import { Body, type CanActivate, Controller, type ExecutionContext, Get, Inject, Injectable, Param, Post, Req, Res, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import type { ArchivoEntrante } from '../../../shared/infraestructura/archivos-cifrados';
import { Evidencias } from '../aplicacion/evidencias';

const token = (r: Request) => r.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('qatu_sesion='))?.slice('qatu_sesion='.length) ?? '';

/** Comprueba sesión y participación antes de leer los archivos: nadie ajeno llega a subir bytes. */
@Injectable()
export class ParticipanteEvidenciaGuard implements CanActivate {
  constructor(@Inject(Evidencias) private readonly evidencias: Evidencias) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    await this.evidencias.exigirParticipante(token(request), String(request.params.id));
    return true;
  }
}

@Controller('reservas/:id/evidencias')
export class EvidenciasReservaController {
  constructor(@Inject(Evidencias) private readonly evidencias: Evidencias) {}
  @Get() listar(@Req() r: Request, @Param('id') id: string) { return this.evidencias.listar(token(r), id); }
  @Post()
  @UseGuards(ParticipanteEvidenciaGuard)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'fotos', maxCount: 4 }], { limits: { fileSize: 5242880, files: 4, fields: 1, parts: 5, fieldSize: 20, fieldNameSize: 20 } }))
  subir(@Req() r: Request, @Param('id') id: string, @Body() body: unknown, @UploadedFiles() archivos: { fotos?: ArchivoEntrante[] }) {
    return this.evidencias.subir(token(r), id, body, archivos?.fotos ?? []);
  }
}

@Controller('evidencias')
export class DescargaEvidenciaController {
  constructor(@Inject(Evidencias) private readonly evidencias: Evidencias) {}
  @Get(':id/archivo')
  async archivo(@Req() r: Request, @Param('id') id: string, @Res() response: Response) {
    const foto = await this.evidencias.descargar(token(r), id);
    response.setHeader('Content-Type', foto.tipo);
    response.setHeader('Content-Disposition', `attachment; filename="evidencia-${foto.id}.${foto.tipo === 'image/png' ? 'png' : 'jpg'}"`);
    response.setHeader('Content-Security-Policy', "sandbox; default-src 'none'");
    response.send(foto.contenido);
  }
}

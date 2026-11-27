import { Body, type CanActivate, Controller, type ExecutionContext, Get, Inject, Injectable, Param, Post, Req, Res, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import type { ArchivoEntrante } from '../../../shared/infraestructura/archivos-cifrados';
import { Doc, entero, lista, ref, respuesta } from '../../../shared/presentacion/openapi';
import { Evidencias } from '../aplicacion/evidencias';
import { SubidaEvidencia } from './openapi';

const token = (r: Request) => r.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('qatu_sesion='))?.slice('qatu_sesion='.length) ?? '';
const AJENA = { 404: 'La reserva no existe o no participas en ella' };

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

@ApiTags('Evidencias')
@Controller('reservas/:id/evidencias')
export class EvidenciasReservaController {
  constructor(@Inject(Evidencias) private readonly evidencias: Evidencias) {}
  @Doc({
    resumen: 'Ver las fotos de evidencia de una reserva', detalle: 'Metadatos (sin el archivo) y las etapas abiertas para subir.',
    devuelve: respuesta({ items: lista(ref('Evidencia')), etapasAbiertas: lista({ type: 'string', enum: ['entrega', 'devolucion', 'trabajo'] }), maximoPorEtapa: entero(1), diasDeRetencion: entero(1) }),
    errores: AJENA,
  })
  @Get() listar(@Req() r: Request, @Param('id') id: string) { return this.evidencias.listar(token(r), id); }
  @Doc({
    resumen: 'Subir fotos de evidencia',
    detalle: 'Entrega: con la herramienta en manos del cliente. Devolución: desde el aviso y hasta 48 h después. Trabajo: durante el servicio y hasta 48 h después del cierre. Se guardan cifradas.',
    multipart: SubidaEvidencia, devuelve: respuesta({ items: lista(ref('Evidencia')) }),
    errores: { ...AJENA, 409: 'La etapa está cerrada (ETAPA_CERRADA) o ya tiene 4 fotos (CUPO_EVIDENCIAS)', 413: 'Una foto supera 5 MiB', 503: 'El servidor no tiene configurada la clave de cifrado' },
  })
  @Post()
  @UseGuards(ParticipanteEvidenciaGuard)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'fotos', maxCount: 4 }], { limits: { fileSize: 5242880, files: 4, fields: 1, parts: 5, fieldSize: 20, fieldNameSize: 20 } }))
  subir(@Req() r: Request, @Param('id') id: string, @Body() body: unknown, @UploadedFiles() archivos: { fotos?: ArchivoEntrante[] }) {
    return this.evidencias.subir(token(r), id, body, archivos?.fotos ?? []);
  }
}

@ApiTags('Evidencias')
@Controller('evidencias')
export class DescargaEvidenciaController {
  constructor(@Inject(Evidencias) private readonly evidencias: Evidencias) {}
  @Doc({
    resumen: 'Descargar una foto de evidencia', detalle: 'Participantes o administradores. Se descifra después de autorizar y se entrega como adjunto con `CSP: sandbox`.',
    archivo: ['image/jpeg', 'image/png'], errores: { 404: 'No existe o no participas en la reserva', 410: 'Se borró al cumplirse la retención' },
  })
  @Get(':id/archivo')
  async archivo(@Req() r: Request, @Param('id') id: string, @Res() response: Response) {
    const foto = await this.evidencias.descargar(token(r), id);
    response.setHeader('Content-Type', foto.tipo);
    response.setHeader('Content-Disposition', `attachment; filename="evidencia-${foto.id}.${foto.tipo === 'image/png' ? 'png' : 'jpg'}"`);
    response.setHeader('Content-Security-Policy', "sandbox; default-src 'none'");
    response.send(foto.contenido);
  }
}

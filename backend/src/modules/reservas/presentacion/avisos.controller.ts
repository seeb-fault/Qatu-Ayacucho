import { Body, Controller, Get, Inject, Param, Post, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Doc, entero, lista, ref, respuesta } from '../../../shared/presentacion/openapi';
import { Avisos } from '../aplicacion/avisos';

const token = (r: Request) => r.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('qatu_sesion='))?.slice('qatu_sesion='.length) ?? '';

@ApiTags('Avisos')
@Controller('avisos')
export class AvisosController {
  constructor(@Inject(Avisos) private readonly avisos: Avisos) {}
  @Doc({
    resumen: 'Ver mis avisos', detalle: '20 por página, del más reciente al más antiguo.',
    consultas: { page: { esquema: entero(1, 9999, { default: 1 }) } },
    devuelve: respuesta({ items: lista(ref('Aviso')), total: entero(0), noLeidos: entero(0), page: entero(1), limit: entero(20, 20) }),
  })
  @Get() listar(@Req() r: Request, @Query() q: unknown) { return this.avisos.listar(token(r),q); }
  @Doc({ resumen: 'Contar mis avisos sin leer', devuelve: respuesta({ noLeidos: entero(0) }) })
  @Get('resumen') resumen(@Req() r: Request) { return this.avisos.resumen(token(r)); }
  @Doc({ resumen: 'Marcar todos mis avisos como leídos', devuelve: respuesta({ marcados: entero(0), noLeidos: entero(0) }) })
  @Post('lectura') marcarTodos(@Req() r: Request, @Body() d: unknown) { return this.avisos.marcarTodos(token(r),d); }
  @Doc({ resumen: 'Marcar un aviso como leído', detalle: 'Si se repite, conserva la primera lectura.', devuelve: respuesta({ noLeidos: entero(0) }), errores: { 404: 'El aviso no existe o es de otra persona' } })
  @Post(':id/lectura') marcar(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.avisos.marcar(token(r),id,d); }
}

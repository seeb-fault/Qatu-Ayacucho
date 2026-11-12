import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Resenas } from '../aplicacion/resenas';

const token = (r: Request) => r.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('qatu_sesion='))?.slice('qatu_sesion='.length) ?? '';

@Controller('reservas/:id/resena')
export class ResenaReservaController {
  constructor(@Inject(Resenas) private readonly resenas: Resenas) {}
  @Get() consultar(@Req() r: Request, @Param('id') id: string) { return this.resenas.deReserva(token(r), id); }
  @Post() crear(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.resenas.crear(token(r), id, d); }
}

@Controller()
export class ResenasPublicasController {
  constructor(@Inject(Resenas) private readonly resenas: Resenas) {}
  @Get('proveedores/:id/resenas') deProveedor(@Param('id') id: string, @Query() q: unknown) { return this.resenas.deProveedor(id, q); }
  @Get('resenas/resumen') resumen(@Query() q: unknown) { return this.resenas.resumen(q); }
}

@Controller('admin/resenas')
export class ModeracionResenasController {
  constructor(@Inject(Resenas) private readonly resenas: Resenas) {}
  @Get() listar(@Req() r: Request, @Query() q: unknown) { return this.resenas.paraAdministrar(token(r), q); }
  @Patch(':id/moderacion') moderar(@Req() r: Request, @Param('id') id: string, @Body() d: unknown) { return this.resenas.moderar(token(r), id, d); }
}

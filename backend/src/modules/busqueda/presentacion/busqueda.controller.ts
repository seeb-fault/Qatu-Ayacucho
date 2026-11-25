import { Body, Controller, HttpCode, Inject, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Doc, ref } from '../../../shared/presentacion/openapi';
import { BuscarEnLenguajeNatural } from '../aplicacion/busqueda';
import { ConsultaNatural } from './openapi';

@ApiTags('Búsqueda')
@Controller('busqueda')
export class BusquedaController {
  constructor(@Inject(BuscarEnLenguajeNatural) private readonly buscar: BuscarEnLenguajeNatural) {}

  @Doc({
    acceso: 'publico', resumen: 'Buscar en lenguaje natural',
    detalle: 'La IA (OpenRouter) traduce el texto a criterios validados contra las categorías y distritos reales; las ofertas y precios salen del catálogo. Si la IA no está configurada, tarda más de 3 s, falla o se agota la cuota (30 por IP cada 15 min), responde igual en modo convencional buscando las palabras tal cual. Solo se envía al proveedor de IA el texto de la consulta.',
    cuerpo: ConsultaNatural, devuelve: ref('ResultadoBusquedaInteligente'), exito: 'Resultados, en modo natural o convencional',
  })
  @Post('intencion')
  @HttpCode(200)
  intencion(@Req() r: Request, @Body() d: unknown) { return this.buscar.ejecutar(r.ip ?? '', d); }
}

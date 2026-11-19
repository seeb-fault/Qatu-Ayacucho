import { Body, Controller, Delete, Get, Headers, HttpCode, Inject, Param, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Doc, cabeceraIdempotencia, entero, lista, opciones, ref, respuesta, uuid } from '../../../shared/presentacion/openapi';
import { Lista } from '../aplicacion/lista';
import { Envio, NuevoItem } from './openapi';

const token = (r: Request) => r.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('qatu_sesion='))?.slice('qatu_sesion='.length) ?? '';
const NO_ES_TUYO = { 404: 'El elemento no existe o es de otra persona' };

/** Mi lista (009): solo su dueño la ve y la modifica. */
@ApiTags('Mi lista')
@Controller('lista')
export class ListaController {
  constructor(@Inject(Lista) private readonly lista: Lista) {}
  @Doc({ resumen: 'Ver mi lista', detalle: 'Cada elemento indica si sigue listo, si cambió la tarifa o si ya no está disponible.', devuelve: respuesta({ items: lista(ref('ItemLista')), total: entero(0) }) })
  @Get() listar(@Req() r: Request) { return this.lista.listar(token(r)); }
  @Doc({ resumen: 'Contar los elementos de mi lista', devuelve: respuesta({ total: entero(0) }) })
  @Get('resumen') resumen(@Req() r: Request) { return this.lista.resumen(token(r)); }
  @Doc({
    resumen: 'Agregar a mi lista', cuerpo: NuevoItem, devuelve: ref('ItemLista'),
    errores: { 403: 'Es tu propia oferta', 404: 'La oferta no está activa', 409: 'Ya está en tu lista (ITEM_DUPLICADO) o la lista está llena (LISTA_LLENA)' },
  })
  @Post('items') agregar(@Req() r: Request, @Body() d: unknown) { return this.lista.agregar(token(r), d); }
  @Doc({ resumen: 'Quitar de mi lista', errores: NO_ES_TUYO })
  @Delete('items/:id') @HttpCode(204) quitar(@Req() r: Request, @Param('id') id: string) { return this.lista.quitar(token(r), id); }
  @Doc({ resumen: 'Aceptar la tarifa nueva', detalle: 'Cuando la oferta cambió de precio, acepta el vigente.', devuelve: ref('ItemLista'), errores: NO_ES_TUYO })
  @Post('items/:id/tarifa') aceptarTarifa(@Req() r: Request, @Param('id') id: string) { return this.lista.aceptarTarifa(token(r), id); }
  @Doc({
    resumen: 'Enviar mi lista como solicitudes',
    detalle: 'Crea una solicitud por elemento; cada uno se envía o se rechaza por separado.',
    cabeceras: cabeceraIdempotencia, cuerpo: Envio,
    devuelve: respuesta({ resultados: lista(respuesta({ itemId: uuid, estado: opciones('enviado', 'rechazado'), solicitudId: uuid, motivo: { type: 'string' } })) }),
    errores: { 400: 'Falta Idempotency-Key o es inválida', 409: 'La misma clave llegó con otro cuerpo' },
  })
  @Post('envio') enviar(@Req() r: Request, @Headers('idempotency-key') clave: string | undefined, @Body() d: unknown) { return this.lista.enviar(token(r), clave, d); }
}

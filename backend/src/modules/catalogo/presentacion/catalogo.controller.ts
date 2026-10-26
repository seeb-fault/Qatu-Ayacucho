import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Catalogo } from '../aplicacion/catalogo';
const token=(r:Request)=>r.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('qatu_sesion='))?.slice('qatu_sesion='.length)??'';
@Controller('publicaciones')
export class CatalogoController {
 constructor(@Inject(Catalogo) private readonly catalogo:Catalogo) {}
 @Get('opciones') opciones() {return this.catalogo.opciones();}
 @Get('mias') propias(@Req() r:Request,@Query() q:unknown) {return this.catalogo.propias(token(r),q);}
 @Get() listar(@Query() q:unknown) {return this.catalogo.listar(q);}
 @Get(':id') consultar(@Param('id') id:string) {return this.catalogo.consultar(id);}
 @Post() crear(@Req() r:Request,@Body() d:unknown) {return this.catalogo.crear(token(r),d);}
 @Patch(':id') editar(@Req() r:Request,@Param('id') id:string,@Body() d:unknown) {return this.catalogo.editar(token(r),id,d);}
}
@Controller('admin/publicaciones')
export class ModeracionController {
 constructor(@Inject(Catalogo) private readonly catalogo:Catalogo) {}
 @Get() listar(@Req() r:Request,@Query() q:unknown) {return this.catalogo.administrativas(token(r),q);}
 @Get(':id/auditoria') auditoria(@Req() r:Request,@Param('id') id:string) {return this.catalogo.auditoria(token(r),id);}
 @Patch(':id/moderacion') moderar(@Req() r:Request,@Param('id') id:string,@Body() d:unknown) {return this.catalogo.moderar(token(r),id,d);}
}

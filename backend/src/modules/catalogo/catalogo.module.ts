import { Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';
import { crearPool } from '../../shared/infraestructura/base-datos';
import { CacheMemoria, segundosDeCache } from '../../shared/infraestructura/cache';
import { UsuariosModule, IdentidadUsuarios } from '../usuarios';
import { ProveedoresModule, ConsultaProveedores } from '../proveedores';
import { Catalogo } from './aplicacion/catalogo';
import { ProveedoresCatalogoEnCache, RepositorioCatalogoEnCache } from './infraestructura/cache';
import { PostgresCatalogo } from './infraestructura/postgres';
import { CatalogoController, ModeracionController } from './presentacion/catalogo.controller';
export class ConsultaCatalogo {
 constructor(private readonly catalogo:Catalogo) {}
 consultar(id:string) { return this.catalogo.consultar(id); }
 ubicacionExacta(id:string) { return this.catalogo.ubicacionExacta(id); }
}
/** Catálogo que usan las rutas HTTP: búsqueda pública y proveedores habilitados en caché (QATU_CACHE_SEGUNDOS). */
function catalogoConCache(pool:Pool,identidad:IdentidadUsuarios,proveedores:ConsultaProveedores) {
 const ttl=segundosDeCache()*1000, habilitados=new CacheMemoria<Awaited<ReturnType<ConsultaProveedores['habilitados']>>>(ttl,1);
 const repo=new RepositorioCatalogoEnCache(new PostgresCatalogo(pool),new CacheMemoria(ttl,500),()=>habilitados.invalidar());
 return new Catalogo(repo,identidad,new ProveedoresCatalogoEnCache(proveedores,habilitados));
}
@Module({imports:[UsuariosModule,ProveedoresModule],controllers:[CatalogoController,ModeracionController],providers:[
 {provide:Pool,useFactory:()=>crearPool(5)},
 {provide:Catalogo,inject:[Pool,IdentidadUsuarios,ConsultaProveedores],useFactory:catalogoConCache},
 // Reservas valida ofertas y unidades al solicitar: siempre lee la base, sin caché.
 {provide:ConsultaCatalogo,inject:[Pool,IdentidadUsuarios,ConsultaProveedores],useFactory:(pool:Pool,identidad:IdentidadUsuarios,proveedores:ConsultaProveedores)=>new ConsultaCatalogo(new Catalogo(new PostgresCatalogo(pool),identidad,proveedores))},
],exports:[ConsultaCatalogo]})
export class CatalogoModule implements OnApplicationShutdown {
 constructor(@Inject(Pool) private readonly pool:Pool) {}
 async onApplicationShutdown() {await this.pool.end();}
}

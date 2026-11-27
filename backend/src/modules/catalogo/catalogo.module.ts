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
/** Fachada de Catálogo para otros módulos. `consultar` lee la base (Reservas valida al solicitar); `buscar` es la búsqueda pública, con caché. */
export class ConsultaCatalogo {
 constructor(private readonly catalogo:Catalogo,private readonly publico:Catalogo=catalogo) {}
 consultar(id:string) { return this.catalogo.consultar(id); }
 ubicacionExacta(id:string) { return this.catalogo.ubicacionExacta(id); }
 /** Categorías y distritos válidos (Búsqueda los usa para validar lo que interpreta la IA). */
 opciones() { const o=this.catalogo.opciones(); return {categorias:o.categorias.map(c=>({id:c.id,nombre:c.nombre,tipo:c.tipo})),zonas:o.zonas.map(z=>({id:z.id,nombre:z.nombre}))}; }
 /** Misma búsqueda que GET /publicaciones: los mismos filtros y validaciones. */
 buscar(consulta:Record<string,string>) { return this.publico.listar(consulta); }
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
 {provide:ConsultaCatalogo,inject:[Pool,IdentidadUsuarios,ConsultaProveedores,Catalogo],useFactory:(pool:Pool,identidad:IdentidadUsuarios,proveedores:ConsultaProveedores,publico:Catalogo)=>new ConsultaCatalogo(new Catalogo(new PostgresCatalogo(pool),identidad,proveedores),publico)},
],exports:[ConsultaCatalogo]})
export class CatalogoModule implements OnApplicationShutdown {
 constructor(@Inject(Pool) private readonly pool:Pool) {}
 async onApplicationShutdown() {await this.pool.end();}
}

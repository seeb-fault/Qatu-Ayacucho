import { Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';
import { UsuariosModule, IdentidadUsuarios } from '../usuarios';
import { ProveedoresModule, ConsultaProveedores } from '../proveedores';
import { Catalogo } from './aplicacion/catalogo';
import { PostgresCatalogo } from './infraestructura/postgres';
import { CatalogoController, ModeracionController } from './presentacion/catalogo.controller';
export class ConsultaCatalogo {
 constructor(private readonly catalogo:Catalogo) {}
 consultar(id:string) { return this.catalogo.consultar(id); }
}
@Module({imports:[UsuariosModule,ProveedoresModule],controllers:[CatalogoController,ModeracionController],providers:[
 {provide:Pool,useFactory:()=>new Pool({connectionString:process.env.DATABASE_URL,max:5,connectionTimeoutMillis:5000})},
 {provide:Catalogo,inject:[Pool,IdentidadUsuarios,ConsultaProveedores],useFactory:(pool:Pool,identidad:IdentidadUsuarios,proveedores:ConsultaProveedores)=>new Catalogo(new PostgresCatalogo(pool),identidad,proveedores)},
 {provide:ConsultaCatalogo,inject:[Catalogo],useFactory:(catalogo:Catalogo)=>new ConsultaCatalogo(catalogo)},
],exports:[ConsultaCatalogo]})
export class CatalogoModule implements OnApplicationShutdown {
 constructor(@Inject(Pool) private readonly pool:Pool) {}
 async onApplicationShutdown() {await this.pool.end();}
}

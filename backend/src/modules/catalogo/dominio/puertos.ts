import type { DatosOferta, FiltrosCatalogo, ProveedorCatalogo, Publicacion } from './oferta';
import type { Punto, UbicacionOferta } from './ubicacion';
export interface IdentidadCatalogo {
  resolver(token:string): Promise<{id:string;roles:string[]}>;
  /** Publicar exige un WhatsApp visible para coordinar con los clientes (010). */
  tieneWhatsapp(usuarioId:string): Promise<boolean>;
}
export interface ProveedoresCatalogo {
  propio(token:string): Promise<{id:string;visiblePublicamente:boolean;estadoVerificacion:string}>;
  habilitados(): Promise<ProveedorCatalogo[]>;
}
export interface RepositorioCatalogo {
  crear(proveedorId:string,datos:DatosOferta):Promise<Publicacion>;
  porId(id:string):Promise<Publicacion|null>;
  listar(f:FiltrosCatalogo,alcance:{habilitados?:string[];proveedorId?:string;admin?:boolean}):Promise<{items:Publicacion[];total:number}>;
  editar(id:string,proveedorId:string,versionActual:number,datos:DatosOferta):Promise<Publicacion>;
  moderar(id:string,actorId:string,versionActual:number,estado:'permitida'|'retirada',motivo:string):Promise<Publicacion>;
  auditoria(id:string):Promise<unknown[]>;
  ubicacion(publicacionId:string):Promise<UbicacionOferta|null>;
  guardarUbicacion(publicacionId:string,u:UbicacionOferta):Promise<UbicacionOferta>;
  quitarUbicacion(publicacionId:string):Promise<void>;
}

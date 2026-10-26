export interface RecursoOferta { id?:string; identificador:string; activo:boolean }
export interface DatosPublicacion {
 tipo:'herramienta'|'servicio';categoriaId:string;zonaId:string;titulo:string;descripcion:string;incluye:string[];condiciones:string[];
 modalidadPrecio:'fija'|'cotizacion';tarifaCentimos:number|null;unidad:'día'|'servicio'|null;activa:boolean;recursos:RecursoOferta[];
}
export interface PublicacionPropia extends DatosPublicacion { id:string;proveedorId:string;version:number;estadoModeracion:'permitida'|'retirada';creadoEn:string }
export interface OpcionesCatalogo { categorias:{id:string;nombre:string;tipo:'herramienta'|'servicio';imagen:string}[];zonas:{id:string;nombre:string}[] }
export interface PaginaOfertas {items:PublicacionPropia[];page:number;limit:number;total:number}
export interface PublicacionPublica extends DatosPublicacion {id:string;proveedorId:string;imagen:string;zona:{id:string;nombre:string};proveedor:{id:string;nombrePublico:string;estadoVerificacion:string}}

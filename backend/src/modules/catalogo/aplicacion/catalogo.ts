import { categorias, zonas, filtros, entradaOferta, uuid, objeto, version, texto, ErrorCatalogo, type Publicacion, type ProveedorCatalogo } from '../dominio/oferta';
import type { IdentidadCatalogo, ProveedoresCatalogo, RepositorioCatalogo } from '../dominio/puertos';
export class Catalogo {
  constructor(private readonly repo:RepositorioCatalogo,private readonly identidad:IdentidadCatalogo,private readonly proveedores:ProveedoresCatalogo) {}
  opciones() { return {categorias,zonas}; }
  private async proveedor(token:string, publicar=false) {
    await this.identidad.resolver(token);
    const propio = await this.proveedores.propio(token);
    if (publicar && (propio.estadoVerificacion!=='aprobada' || !propio.visiblePublicamente)) throw new ErrorCatalogo('PROVEEDOR_NO_HABILITADO',403,'Para publicar necesitas verificación aprobada y un perfil público.');
    return propio;
  }
  private async admin(token:string) {
    const actor=await this.identidad.resolver(token);
    if (!actor.roles.includes('admin')) throw new ErrorCatalogo('SIN_PERMISO',403,'Esta acción requiere una cuenta administrativa.');
    return actor;
  }
  private publico(p:Publicacion,proveedor:ProveedorCatalogo) {
    const {activa,estadoModeracion,version,...datos}=p;
    return {...datos,recursos:datos.recursos.filter(r=>r.activo),moneda:'PEN',proveedor,imagen:'/ilustraciones/'+categorias.find(c=>c.id===p.categoriaId)!.imagen+'.svg',zona:zonas.find(z=>z.id===p.zonaId)!};
  }
  async listar(value:unknown) {
    const f=filtros(value), proveedores=await this.proveedores.habilitados();
    const resultado=await this.repo.listar(f,{habilitados:proveedores.map(p=>p.id)});
    return {...resultado,items:resultado.items.map(p=>this.publico(p,proveedores.find(v=>v.id===p.proveedorId)!)),page:f.page,limit:f.limit};
  }
  async consultar(id:string) {
    const p=await this.repo.porId(uuid(id));
    const proveedor=p && (await this.proveedores.habilitados()).find(v=>v.id===p.proveedorId);
    if (!p || !p.activa || p.estadoModeracion!=='permitida' || !proveedor) throw new ErrorCatalogo('OFERTA_NO_DISPONIBLE',404,'Esta publicación no está disponible.');
    return this.publico(p,proveedor);
  }
  async propias(token:string,value:unknown) {
    const proveedor=await this.proveedor(token),f=filtros(value);
    return {...await this.repo.listar(f,{proveedorId:proveedor.id}),page:f.page,limit:f.limit};
  }
  async crear(token:string,value:unknown) {
    const proveedor=await this.proveedor(token,true);
    return this.repo.crear(proveedor.id,entradaOferta(value).datos);
  }
  async editar(token:string,id:string,value:unknown) {
    const proveedor=await this.proveedor(token,true),datos=entradaOferta(value,true);
    return this.repo.editar(uuid(id),proveedor.id,datos.versionActual!,datos.datos);
  }
  async administrativas(token:string,value:unknown) { await this.admin(token); const f=filtros(value);return {...await this.repo.listar(f,{admin:true}),page:f.page,limit:f.limit}; }
  async moderar(token:string,id:string,value:unknown) {
    const actor=await this.admin(token),d=objeto(value,['estado','motivo','versionActual']);
    if (!['permitida','retirada'].includes(String(d.estado))) throw new ErrorCatalogo('ENTRADA_INVALIDA',400,'Selecciona una decisión válida.');
    return this.repo.moderar(uuid(id),actor.id,version(d.versionActual),d.estado as 'permitida'|'retirada',texto(d.motivo,10,500));
  }
  async auditoria(token:string,id:string) { await this.admin(token); if (!await this.repo.porId(uuid(id))) throw new ErrorCatalogo('OFERTA_NO_EXISTE',404,'La oferta no existe.');return this.repo.auditoria(id); }
}

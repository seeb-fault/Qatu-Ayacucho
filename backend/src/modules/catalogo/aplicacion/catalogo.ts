import { categorias, zonas, filtros, entradaOferta, uuid, objeto, version, texto, ErrorCatalogo, type Publicacion, type ProveedorCatalogo } from '../dominio/oferta';
import type { IdentidadCatalogo, ProveedoresCatalogo, RepositorioCatalogo } from '../dominio/puertos';
import { entradaUbicacion, puntoPublico } from '../dominio/ubicacion';
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
    if (!await this.identidad.tieneWhatsapp((await this.identidad.resolver(token)).id)) throw new ErrorCatalogo('WHATSAPP_REQUERIDO',409,'Agrega tu WhatsApp en Mi cuenta y permite mostrarlo a tus clientes para publicar ofertas.');
    return this.repo.crear(proveedor.id,entradaOferta(value).datos);
  }
  async editar(token:string,id:string,value:unknown) {
    const proveedor=await this.proveedor(token,true),datos=entradaOferta(value,true);
    return this.repo.editar(uuid(id),proveedor.id,datos.versionActual!,datos.datos);
  }
  /** Solo el dueño de la oferta ve y cambia su punto exacto (011). */
  private async propia(token:string,id:string) {
    const proveedor=await this.proveedor(token),p=await this.repo.porId(uuid(id));
    if (!p || p.proveedorId!==proveedor.id) throw new ErrorCatalogo('OFERTA_NO_DISPONIBLE',404,'Esta publicación no está disponible.');
    return p;
  }
  /** Siempre un objeto JSON: `{ ubicacion: null }` si aún no se marcó (un null suelto llega como cuerpo vacío). */
  async ubicacionPropia(token:string,id:string) { return { ubicacion: await this.repo.ubicacion((await this.propia(token,id)).id) }; }
  async ubicar(token:string,id:string,value:unknown) {
    const p=await this.propia(token,id),d=entradaUbicacion(value);
    return this.repo.guardarUbicacion(p.id,{lat:d.lat,lng:d.lng,precision:d.precision,publica:puntoPublico(p.proveedorId,d,d.precision)});
  }
  async quitarUbicacion(token:string,id:string) { await this.repo.quitarUbicacion((await this.propia(token,id)).id); }
  /** Para Reservas: el punto exacto, que solo se entrega a la contraparte de una reserva activa. */
  async ubicacionExacta(publicacionId:string) { const u=await this.repo.ubicacion(publicacionId); return u?{lat:u.lat,lng:u.lng}:null; }
  async administrativas(token:string,value:unknown) { await this.admin(token); const f=filtros(value);return {...await this.repo.listar(f,{admin:true}),page:f.page,limit:f.limit}; }
  async moderar(token:string,id:string,value:unknown) {
    const actor=await this.admin(token),d=objeto(value,['estado','motivo','versionActual']);
    if (!['permitida','retirada'].includes(String(d.estado))) throw new ErrorCatalogo('ENTRADA_INVALIDA',400,'Selecciona una decisión válida.');
    return this.repo.moderar(uuid(id),actor.id,version(d.versionActual),d.estado as 'permitida'|'retirada',texto(d.motivo,10,500));
  }
  async auditoria(token:string,id:string) { await this.admin(token); if (!await this.repo.porId(uuid(id))) throw new ErrorCatalogo('OFERTA_NO_EXISTE',404,'La oferta no existe.');return this.repo.auditoria(id); }
}

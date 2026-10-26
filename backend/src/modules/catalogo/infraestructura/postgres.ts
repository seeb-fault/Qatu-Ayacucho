import { randomUUID } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';
import { editarRecursos, ErrorCatalogo, type DatosOferta, type FiltrosCatalogo, type Publicacion } from '../dominio/oferta';
import type { RepositorioCatalogo } from '../dominio/puertos';
const campos = `p.id,p.proveedor_id AS "proveedorId",p.tipo,p.categoria_id AS "categoriaId",p.zona_id AS "zonaId",p.titulo,p.descripcion,
 p.incluye,p.condiciones,p.activa,p.estado_moderacion AS "estadoModeracion",p.version,p.creado_en AS "creadoEn",p.actualizado_en AS "actualizadoEn",
 t.modalidad AS "modalidadPrecio",t.monto_centimos AS "tarifaCentimos",t.unidad`;
const recursos = `COALESCE((SELECT json_agg(json_build_object('id',r.id,'identificador',r.identificador,'activo',r.activo) ORDER BY r.id) FROM catalogo_recursos r WHERE r.publicacion_id=p.id),'[]'::json)`;
const origen = `FROM catalogo_publicaciones p JOIN catalogo_tarifas t ON t.publicacion_id=p.id`;
const seleccion = `SELECT ${campos},${recursos} AS recursos ${origen}`;
export class PostgresCatalogo implements RepositorioCatalogo {
  constructor(private readonly pool:Pool) {}
  async porId(id:string):Promise<Publicacion|null> { return (await this.pool.query(`${seleccion} WHERE p.id=$1`,[id])).rows[0]??null; }
  private async transaccion<T>(accion:(client:PoolClient)=>Promise<T>):Promise<T> {
    const client=await this.pool.connect();
    try { await client.query('BEGIN');const resultado=await accion(client);await client.query('COMMIT');return resultado; }
    catch(e) { await client.query('ROLLBACK'); if ((e as {code?:string}).code==='23505') throw new ErrorCatalogo('RECURSO_DUPLICADO',409,'Ya existe una unidad con ese identificador.'); throw e; }
    finally { client.release(); }
  }
  private async tarifa(client:PoolClient,id:string,d:DatosOferta) {
    await client.query(`INSERT INTO catalogo_tarifas(publicacion_id,modalidad,monto_centimos,unidad) VALUES($1,$2,$3,$4)
      ON CONFLICT(publicacion_id) DO UPDATE SET modalidad=excluded.modalidad,monto_centimos=excluded.monto_centimos,unidad=excluded.unidad`,[id,d.modalidadPrecio,d.tarifaCentimos,d.unidad]);
  }
  private async recursos(client:PoolClient,id:string,d:DatosOferta) {
    for (const r of d.recursos) await client.query(`INSERT INTO catalogo_recursos(id,publicacion_id,clase,identificador,activo) VALUES($1,$2,$3,$4,$5)
      ON CONFLICT(id) DO UPDATE SET identificador=excluded.identificador,activo=excluded.activo WHERE catalogo_recursos.publicacion_id=excluded.publicacion_id`,[r.id??randomUUID(),id,d.tipo==='herramienta'?'unidad_fisica':'agenda',r.identificador,r.activo]);
  }
  async crear(proveedorId:string,d:DatosOferta):Promise<Publicacion> {
    return this.transaccion(async c=>{
      const id=randomUUID();
      await c.query(`INSERT INTO catalogo_publicaciones(id,proveedor_id,tipo,categoria_id,zona_id,titulo,descripcion,incluye,condiciones,activa) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[id,proveedorId,d.tipo,d.categoriaId,d.zonaId,d.titulo,d.descripcion,JSON.stringify(d.incluye),JSON.stringify(d.condiciones),d.activa]);
      await this.tarifa(c,id,d); await this.recursos(c,id,d);
      return (await c.query(`${seleccion} WHERE p.id=$1`,[id])).rows[0];
    });
  }
  async editar(id:string,proveedorId:string,versionActual:number,d:DatosOferta):Promise<Publicacion> {
    return this.transaccion(async c=>{
      await c.query('SELECT id FROM catalogo_publicaciones WHERE id=$1 FOR UPDATE',[id]);
      const actual:Publicacion|undefined=(await c.query(`${seleccion} WHERE p.id=$1`,[id])).rows[0];
      if (!actual) throw new ErrorCatalogo('OFERTA_NO_EXISTE',404,'La oferta no existe.');
      if (actual.proveedorId!==proveedorId) throw new ErrorCatalogo('SIN_PERMISO',403,'Solo puedes editar tus propias ofertas.');
      if (actual.version!==versionActual) throw new ErrorCatalogo('OFERTA_DESACTUALIZADA',409,'La oferta cambió. Recarga antes de guardar.');
      editarRecursos(actual,d);
      await c.query(`UPDATE catalogo_publicaciones SET categoria_id=$2,zona_id=$3,titulo=$4,descripcion=$5,incluye=$6,condiciones=$7,activa=$8,version=version+1,actualizado_en=now() WHERE id=$1`,[id,d.categoriaId,d.zonaId,d.titulo,d.descripcion,JSON.stringify(d.incluye),JSON.stringify(d.condiciones),d.activa]);
      await this.tarifa(c,id,d);await this.recursos(c,id,d);
      return (await c.query(`${seleccion} WHERE p.id=$1`,[id])).rows[0];
    });
  }
  async listar(f:FiltrosCatalogo,alcance:{habilitados?:string[];proveedorId?:string;admin?:boolean}):Promise<{items:Publicacion[];total:number}> {
    const args:unknown[]=[],where:string[]=[];
    const agregar=(expr:string,value:unknown)=>{ args.push(value);where.push(expr.replace('?',`$${args.length}`)); };
    if (alcance.proveedorId) agregar('p.proveedor_id=?',alcance.proveedorId);
    else if (!alcance.admin) { agregar('p.proveedor_id=ANY(?::uuid[])',alcance.habilitados??[]);where.push("p.activa AND p.estado_moderacion='permitida'"); }
    if (f.q) agregar("p.busqueda @@ plainto_tsquery('spanish',unaccent(?))",f.q);
    if (f.tipo) agregar('p.tipo=?',f.tipo);
    if (f.categoriaId) agregar('p.categoria_id=?',f.categoriaId);
    if (f.zonaId) agregar('p.zona_id=?',f.zonaId);
    if (f.precioMaximoCentimos!==undefined) agregar('t.monto_centimos<=?',f.precioMaximoCentimos);
    const condicion=where.length?' WHERE '+where.join(' AND '):'';
    const orden=f.orden==='precio'?'"tarifaCentimos" ASC NULLS LAST,id':f.orden==='nombre'?'titulo COLLATE "C",id':'"creadoEn" DESC,id';
    args.push(f.limit,(f.page-1)*f.limit);
    // Count/filter a lightweight projection; load resource JSON only for the selected page.
    const r=await this.pool.query(`WITH filtradas AS (
        SELECT p.id,p.titulo,p.creado_en AS "creadoEn",t.monto_centimos AS "tarifaCentimos" ${origen}${condicion}
      ), pagina AS (
        SELECT id,row_number() OVER (ORDER BY ${orden}) AS posicion FROM filtradas
        ORDER BY ${orden} LIMIT $${args.length-1} OFFSET $${args.length}
      ), resultado AS (
        SELECT ${campos},${recursos} AS recursos,pagina.posicion ${origen} JOIN pagina ON pagina.id=p.id
      ) SELECT COALESCE((SELECT json_agg(to_jsonb(resultado)-'posicion' ORDER BY posicion) FROM resultado),'[]'::json) AS items,
        (SELECT count(*)::int FROM filtradas) AS total`,args);
    return r.rows[0];
  }
  async moderar(id:string,actorId:string,versionActual:number,estado:'permitida'|'retirada',motivo:string):Promise<Publicacion> {
    return this.transaccion(async c=>{
      const actual=(await c.query('SELECT version,estado_moderacion FROM catalogo_publicaciones WHERE id=$1 FOR UPDATE',[id])).rows[0];
      if (!actual) throw new ErrorCatalogo('OFERTA_NO_EXISTE',404,'La oferta no existe.');
      if (actual.version!==versionActual || actual.estado_moderacion===estado) throw new ErrorCatalogo('MODERACION_DESACTUALIZADA',409,'La oferta cambió o ya tiene ese estado. Recarga el listado.');
      await c.query('UPDATE catalogo_publicaciones SET estado_moderacion=$2,version=version+1,actualizado_en=now() WHERE id=$1',[id,estado]);
      await c.query('INSERT INTO catalogo_auditoria(id,publicacion_id,actor_id,estado_anterior,estado_nuevo,motivo,version) VALUES($1,$2,$3,$4,$5,$6,$7)',[randomUUID(),id,actorId,actual.estado_moderacion,estado,motivo,versionActual+1]);
      return (await c.query(`${seleccion} WHERE p.id=$1`,[id])).rows[0];
    });
  }
  async auditoria(id:string) { return (await this.pool.query(`SELECT actor_id AS "actorId",estado_anterior AS "estadoAnterior",estado_nuevo AS "estadoNuevo",motivo,version,creado_en AS "creadoEn" FROM catalogo_auditoria WHERE publicacion_id=$1 ORDER BY creado_en DESC,id`,[id])).rows; }
}

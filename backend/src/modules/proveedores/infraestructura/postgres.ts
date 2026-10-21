import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { ErrorProveedor, type DatosPerfil, type Proveedor, type ZonaProveedor } from '../dominio/proveedor';
import type { RepositorioProveedores } from '../dominio/puertos';
import type { DocumentoCifrado, DocumentoPrivado, Verificacion } from '../dominio/verificacion';

const columnas = `p.id,p.usuario_id AS "usuarioId",p.nombre_publico AS "nombrePublico",p.descripcion,p.zona_id AS "zonaId",
  p.visible_publicamente AS "visiblePublicamente",p.estado_verificacion AS "estadoVerificacion",p.version,
  p.creado_en AS "creadoEn",p.actualizado_en AS "actualizadoEn",
  (SELECT json_build_object('id',z.id,'nombre',z.nombre) FROM zonas_proveedor z WHERE z.id=p.zona_id) AS zona`;
const seleccion = `SELECT ${columnas} FROM proveedores p`;
const verificacionColumnas = `v.id,v.estado,v.motivo,v.revisor_id AS "revisorId",v.creado_en AS "creadoEn",v.revisado_en AS "revisadoEn",v.perfil_enviado AS "perfilEnviado",
  COALESCE((SELECT json_agg(json_build_object('id',d.id,'tipo',d.tipo,'bytes',d.bytes,'disponible',d.contenido IS NOT NULL) ORDER BY d.creado_en,d.id)
    FROM documentos_proveedor d WHERE d.verificacion_id=v.id),'[]'::json) AS documentos`;

export class PostgresProveedores implements RepositorioProveedores {
  constructor(private readonly pool: Pool) {}

  async zonas(): Promise<ZonaProveedor[]> {
    return (await this.pool.query('SELECT id,nombre FROM zonas_proveedor ORDER BY nombre')).rows;
  }

  async porUsuario(usuarioId: string): Promise<Proveedor | null> {
    return (await this.pool.query(`${seleccion} WHERE p.usuario_id=$1`, [usuarioId])).rows[0] ?? null;
  }

  async porId(id: string): Promise<Proveedor | null> {
    return (await this.pool.query(`${seleccion} WHERE p.id=$1`, [id])).rows[0] ?? null;
  }

  async crear(usuarioId: string, datos: DatosPerfil): Promise<Proveedor> {
    try {
      const result = await this.pool.query(`INSERT INTO proveedores AS p(id,usuario_id,nombre_publico,descripcion,zona_id,visible_publicamente)
        VALUES ($1,$2,$3,$4,$5,$6) RETURNING ${columnas}`, [randomUUID(), usuarioId, datos.nombrePublico, datos.descripcion, datos.zonaId, datos.visiblePublicamente]);
      return result.rows[0];
    } catch (error) {
      if ((error as { code?: string }).code === '23505') throw new ErrorProveedor('PERFIL_DUPLICADO', 409, 'Ya tienes un perfil de proveedor.');
      if ((error as { code?: string }).code === '23503') throw new ErrorProveedor('ZONA_INVALIDA', 400, 'Selecciona un distrito disponible.');
      throw error;
    }
  }

  async editar(usuarioId: string, versionActual: number, datos: DatosPerfil): Promise<Proveedor> {
    try {
      const result = await this.pool.query(`UPDATE proveedores AS p SET nombre_publico=$3,descripcion=$4,zona_id=$5,
        estado_verificacion=CASE WHEN nombre_publico<>$3 OR descripcion<>$4 OR zona_id<>$5 THEN 'no_solicitada' ELSE estado_verificacion END,
        visible_publicamente=$6,version=version+1,actualizado_en=now() WHERE usuario_id=$1 AND version=$2
        AND (estado_verificacion<>'pendiente' OR (nombre_publico=$3 AND descripcion=$4 AND zona_id=$5)) RETURNING ${columnas}`,
      [usuarioId, versionActual, datos.nombrePublico, datos.descripcion, datos.zonaId, datos.visiblePublicamente]);
      if (result.rowCount) return result.rows[0];
      const actual = await this.porUsuario(usuarioId);
      if (!actual) throw new ErrorProveedor('PERFIL_NO_EXISTE', 404, 'Todavía no tienes un perfil de proveedor.');
      if (actual.estadoVerificacion === 'pendiente' && actual.version === versionActual) throw new ErrorProveedor('REVISION_EN_CURSO', 409, 'Tu perfil está en revisión; espera la decisión antes de modificar sus datos.');
      throw new ErrorProveedor('PERFIL_DESACTUALIZADO', 409, 'El perfil cambió. Recárgalo antes de volver a guardar.');
    } catch (error) {
      if ((error as { code?: string }).code === '23503') throw new ErrorProveedor('ZONA_INVALIDA', 400, 'Selecciona un distrito disponible.');
      throw error;
    }
  }

  async solicitar(proveedorId: string, versionActual: number, documentos: DocumentoCifrado[]): Promise<Verificacion> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query('SELECT version,estado_verificacion,nombre_publico,descripcion,zona_id FROM proveedores WHERE id=$1 FOR UPDATE', [proveedorId]);
      const perfil = result.rows[0];
      if (!perfil || perfil.version !== versionActual) throw new ErrorProveedor('PERFIL_DESACTUALIZADO', 409, 'Recarga tu perfil antes de enviar documentos.');
      if (['pendiente','aprobada'].includes(perfil.estado_verificacion)) throw new ErrorProveedor('VERIFICACION_NO_PERMITIDA', 409, 'La verificación ya está pendiente o aprobada.');
      const cantidad = await client.query("SELECT count(*)::int AS total FROM verificaciones_proveedor WHERE proveedor_id=$1 AND creado_en>now()-interval '24 hours'", [proveedorId]);
      if (cantidad.rows[0].total >= 3) throw new ErrorProveedor('LIMITE_VERIFICACIONES', 429, 'Puedes enviar hasta tres solicitudes en 24 horas.');
      const id = randomUUID();
      const perfilEnviado = { nombrePublico: perfil.nombre_publico, descripcion: perfil.descripcion, zonaId: perfil.zona_id };
      const creada = await client.query('INSERT INTO verificaciones_proveedor(id,proveedor_id,perfil_enviado) VALUES ($1,$2,$3) RETURNING creado_en', [id,proveedorId,JSON.stringify(perfilEnviado)]);
      for (const documento of documentos) {
        await client.query('INSERT INTO documentos_proveedor(id,verificacion_id,tipo,bytes,sha256,contenido,iv,tag) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
          [documento.id,id,documento.tipo,documento.bytes,documento.sha256,Buffer.from(documento.contenido),Buffer.from(documento.iv),Buffer.from(documento.tag)]);
      }
      await client.query("UPDATE proveedores SET estado_verificacion='pendiente',version=version+1,actualizado_en=now() WHERE id=$1", [proveedorId]);
      await client.query('COMMIT');
      return { id, estado: 'pendiente', motivo: null, revisorId: null, creadoEn: creada.rows[0].creado_en.toISOString(), revisadoEn: null, perfilEnviado,
        documentos: documentos.map(documento => ({ id: documento.id, tipo: documento.tipo, bytes: documento.bytes, disponible: true })) };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }

  async historial(proveedorId: string): Promise<Verificacion[]> {
    return (await this.pool.query(`SELECT ${verificacionColumnas} FROM verificaciones_proveedor v WHERE v.proveedor_id=$1 ORDER BY v.creado_en DESC,v.id DESC LIMIT 20`, [proveedorId])).rows;
  }

  async documento(id: string): Promise<DocumentoPrivado | null> {
    return (await this.pool.query(`SELECT d.id,d.tipo,d.bytes,d.sha256,d.contenido,d.iv,d.tag,p.usuario_id AS "usuarioId"
      FROM documentos_proveedor d JOIN verificaciones_proveedor v ON v.id=d.verificacion_id JOIN proveedores p ON p.id=v.proveedor_id
      WHERE d.id=$1 AND d.contenido IS NOT NULL`, [id])).rows[0] ?? null;
  }

  async pendientes(pagina: number, estado: Verificacion['estado'] = 'pendiente') {
    const [filas,conteo] = await Promise.all([
      this.pool.query(`SELECT ${verificacionColumnas},p.id AS "proveedorId" FROM verificaciones_proveedor v JOIN proveedores p ON p.id=v.proveedor_id
        WHERE v.estado=$1 ORDER BY v.creado_en,v.id LIMIT 20 OFFSET $2`, [estado,(pagina-1)*20]),
      this.pool.query('SELECT count(*)::int AS total FROM verificaciones_proveedor WHERE estado=$1',[estado]),
    ]);
    const solicitudes = await Promise.all(filas.rows.map(async fila => {
      const { proveedorId, ...solicitud } = fila;
      return { ...solicitud, proveedor: (await this.porId(proveedorId))! } as Verificacion & { proveedor: Proveedor };
    }));
    const total = conteo.rows[0].total as number;
    return { solicitudes, pagina, total, paginas: Math.max(1,Math.ceil(total/20)) };
  }

  async resolverVerificacion(proveedorId: string, solicitudId: string, revisorId: string, decision: 'aprobada' | 'rechazada', motivo: string): Promise<Verificacion> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const perfil = await client.query('SELECT usuario_id,estado_verificacion FROM proveedores WHERE id=$1 FOR UPDATE', [proveedorId]);
      if (!perfil.rowCount) throw new ErrorProveedor('PERFIL_NO_EXISTE', 404, 'El proveedor no existe.');
      if (perfil.rows[0].usuario_id === revisorId) throw new ErrorProveedor('AUTOAPROBACION_NO_PERMITIDA', 403, 'Otra persona administradora debe revisar tu documentación.');
      const solicitud = await client.query('SELECT estado FROM verificaciones_proveedor WHERE id=$1 AND proveedor_id=$2 FOR UPDATE', [solicitudId,proveedorId]);
      if (!solicitud.rowCount) throw new ErrorProveedor('SOLICITUD_NO_EXISTE', 404, 'La solicitud no existe.');
      if (solicitud.rows[0].estado !== 'pendiente' || perfil.rows[0].estado_verificacion !== 'pendiente') throw new ErrorProveedor('SOLICITUD_RESUELTA', 409, 'Esta solicitud ya fue resuelta o dejó de estar vigente.');
      const archivos = await client.query('SELECT id FROM documentos_proveedor WHERE verificacion_id=$1 AND contenido IS NOT NULL', [solicitudId]);
      if (!archivos.rowCount) throw new ErrorProveedor('DOCUMENTOS_NO_DISPONIBLES', 409, 'Los documentos ya no están disponibles para revisión.');
      await client.query('UPDATE verificaciones_proveedor SET estado=$2,motivo=$3,revisor_id=$4,revisado_en=now() WHERE id=$1', [solicitudId,decision,motivo,revisorId]);
      await client.query('UPDATE proveedores SET estado_verificacion=$2,version=version+1,actualizado_en=now() WHERE id=$1', [proveedorId,decision]);
      const resultado = await client.query(`SELECT ${verificacionColumnas} FROM verificaciones_proveedor v WHERE v.id=$1`, [solicitudId]);
      await client.query('COMMIT');
      return resultado.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }

  async conDocumentos() {
    return (await this.pool.query(`SELECT DISTINCT p.id,p.usuario_id AS "usuarioId" FROM proveedores p JOIN verificaciones_proveedor v ON v.proveedor_id=p.id
      JOIN documentos_proveedor d ON d.verificacion_id=v.id WHERE d.contenido IS NOT NULL`)).rows as { id: string; usuarioId: string }[];
  }

  async purgarDocumentos(proveedorId: string) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT id FROM proveedores WHERE id=$1 FOR UPDATE', [proveedorId]);
      const result = await client.query(`UPDATE documentos_proveedor SET contenido=NULL,iv=NULL,tag=NULL,eliminado_en=now()
        WHERE verificacion_id IN (SELECT id FROM verificaciones_proveedor WHERE proveedor_id=$1) AND contenido IS NOT NULL`, [proveedorId]);
      await client.query("UPDATE verificaciones_proveedor SET estado='cancelada',motivo='Documentación eliminada al detectar cuenta inactiva.',revisado_en=now() WHERE proveedor_id=$1 AND estado='pendiente'", [proveedorId]);
      await client.query("UPDATE proveedores SET estado_verificacion='no_solicitada',version=version+1,actualizado_en=now() WHERE id=$1", [proveedorId]);
      await client.query('COMMIT');
      return result.rowCount ?? 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }
}

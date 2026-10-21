import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import type { RepositorioUsuarios } from '../dominio/puertos';
import { ErrorUsuario, type EstadoUsuario, type FiltrosUsuarios, type Usuario, type PaginaAuditoria } from '../dominio/usuario';

const seleccion = `SELECT u.id, u.email_normalizado AS email, u.nombre, u.estado,
  ARRAY(SELECT rol FROM roles_usuario WHERE usuario_id = u.id ORDER BY rol) AS roles FROM usuarios u`;

export class PostgresUsuarios implements RepositorioUsuarios {
  constructor(private readonly pool: Pool) {}

  async crear(email: string, nombre: string, passwordHash: string) {
    return this.crearConRoles(email, nombre, passwordHash);
  }

  async crearAdministrador(email: string, nombre: string, passwordHash: string, motivo: string) {
    return this.crearConRoles(email, nombre, passwordHash, motivo);
  }

  private async crearConRoles(email: string, nombre: string, passwordHash: string, motivo?: string) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const id = randomUUID();
      await client.query('INSERT INTO usuarios(id,email_normalizado,nombre,password_hash) VALUES ($1,$2,$3,$4)', [id, email, nombre, passwordHash]);
      await client.query("INSERT INTO roles_usuario(usuario_id,rol) VALUES ($1,'cliente')", [id]);
      if (motivo !== undefined) {
        await client.query("INSERT INTO roles_usuario(usuario_id,rol) VALUES ($1,'admin')", [id]);
        await client.query("INSERT INTO auditoria_usuarios(id,usuario_id,accion,estado_nuevo,motivo) VALUES ($1,$2,'crear_admin','activo',$3)", [randomUUID(), id, motivo]);
      }
      await client.query('COMMIT');
      return { id, email, nombre, estado: 'activo' as const, roles: motivo === undefined ? ['cliente' as const] : ['admin' as const, 'cliente' as const] };
    } catch (error) {
      await client.query('ROLLBACK');
      if ((error as { code?: string }).code === '23505') throw new ErrorUsuario('EMAIL_DUPLICADO', 409, 'Ya existe una cuenta con ese correo.');
      throw error;
    } finally { client.release(); }
  }

  async credenciales(email: string) {
    const result = await this.pool.query(`${seleccion} WHERE u.email_normalizado = $1`, [email]);
    if (!result.rows[0]) return null;
    const hash = await this.pool.query('SELECT password_hash FROM usuarios WHERE id = $1', [result.rows[0].id]);
    return { usuario: result.rows[0] as Usuario, passwordHash: hash.rows[0].password_hash as string };
  }

  async porId(id: string) {
    const result = await this.pool.query(`${seleccion} WHERE u.id = $1`, [id]);
    return (result.rows[0] as Usuario | undefined) ?? null;
  }

  async cambiarNombre(id: string, nombre: string) {
    const result = await this.pool.query("UPDATE usuarios SET nombre = $2, version = version + 1 WHERE id = $1 AND estado = 'activo' RETURNING id", [id, nombre]);
    return result.rowCount ? this.porId(id) : null;
  }

  async crearSesion(id: string, usuarioId: string, expira: Date) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const cuenta = await client.query('SELECT estado FROM usuarios WHERE id=$1 FOR UPDATE', [usuarioId]);
      if (cuenta.rows[0]?.estado !== 'activo') throw new ErrorUsuario('CREDENCIALES_INVALIDAS', 401, 'Correo o contraseña incorrectos.');
      await client.query('INSERT INTO sesiones_usuario(id,usuario_id,expira_en) VALUES ($1,$2,$3)', [id, usuarioId, expira]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }

  async sesionActiva(id: string, usuarioId: string) {
    const result = await this.pool.query('SELECT id FROM sesiones_usuario WHERE id = $1 AND usuario_id = $2 AND NOT revocada AND expira_en > now()', [id, usuarioId]);
    return !!result.rowCount;
  }

  async revocarSesion(id: string) {
    await this.pool.query('UPDATE sesiones_usuario SET revocada = true WHERE id = $1', [id]);
  }

  async limitar(clave: string, maximo: number) {
    const result = await this.pool.query(`INSERT INTO limites_acceso(clave,intentos,hasta) VALUES ($1,1,now() + interval '15 minutes')
      ON CONFLICT (clave) DO UPDATE SET intentos = CASE WHEN limites_acceso.hasta <= now() THEN 1 ELSE limites_acceso.intentos + 1 END,
      hasta = CASE WHEN limites_acceso.hasta <= now() THEN now() + interval '15 minutes' ELSE limites_acceso.hasta END RETURNING intentos`, [clave]);
    if (result.rows[0].intentos > maximo) throw new ErrorUsuario('LIMITE_ACCESO', 429, 'Demasiados intentos. Espera 15 minutos.');
  }

  async listar(filtros: FiltrosUsuarios) {
    const busqueda = `%${filtros.q.replace(/[\\%_]/g, '\\$&')}%`;
    const condicion = ' WHERE (u.nombre ILIKE $1 OR u.email_normalizado ILIKE $1) AND ($2::text IS NULL OR u.estado=$2)';
    const valores = [busqueda, filtros.estado ?? null];
    const [cuentas, conteo] = await Promise.all([
      this.pool.query(`${seleccion}${condicion} ORDER BY u.creado_en DESC, u.id DESC LIMIT 20 OFFSET $3`, [...valores, (filtros.pagina - 1) * 20]),
      this.pool.query(`SELECT count(*)::int AS total FROM usuarios u${condicion}`, valores),
    ]);
    const total = conteo.rows[0].total as number;
    return { usuarios: cuentas.rows as Usuario[], pagina: filtros.pagina, total, paginas: Math.max(1, Math.ceil(total / 20)) };
  }

  async auditoria(usuarioId: string, pagina: number): Promise<PaginaAuditoria> {
    const [eventos, conteo] = await Promise.all([
      this.pool.query(`SELECT id, actor_id AS "actorId", usuario_id AS "usuarioId", accion, estado_anterior AS "estadoAnterior",
        estado_nuevo AS "estadoNuevo", motivo, creado_en AS "creadoEn" FROM auditoria_usuarios
        WHERE usuario_id=$1 ORDER BY creado_en DESC,id DESC LIMIT 20 OFFSET $2`, [usuarioId, (pagina - 1) * 20]),
      this.pool.query('SELECT count(*)::int AS total FROM auditoria_usuarios WHERE usuario_id=$1', [usuarioId]),
    ]);
    const total = conteo.rows[0].total as number;
    return { eventos: eventos.rows, pagina, total, paginas: Math.max(1, Math.ceil(total / 20)) };
  }

  async cambiarEstado(actorId: string, usuarioId: string, estadoActual: EstadoUsuario, estado: EstadoUsuario, motivo: string) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const actor = await client.query('SELECT estado FROM usuarios WHERE id=$1 FOR SHARE', [actorId]);
      const permiso = await client.query("SELECT 1 FROM roles_usuario WHERE usuario_id=$1 AND rol='admin'", [actorId]);
      if (actor.rows[0]?.estado !== 'activo' || !permiso.rowCount) throw new ErrorUsuario('SIN_PERMISO', 403, 'Esta acción requiere una cuenta administrativa activa.');
      if (actorId === usuarioId) throw new ErrorUsuario('ADMIN_PROTEGIDO', 409, 'Las cuentas administrativas no se modifican desde esta pantalla.');
      const administrador = await client.query("SELECT 1 FROM roles_usuario WHERE usuario_id=$1 AND rol='admin'", [usuarioId]);
      if (administrador.rowCount) throw new ErrorUsuario('ADMIN_PROTEGIDO', 409, 'Las cuentas administrativas no se modifican desde esta pantalla.');
      const cuenta = await client.query('SELECT estado FROM usuarios WHERE id=$1 FOR UPDATE', [usuarioId]);
      if (!cuenta.rowCount) throw new ErrorUsuario('USUARIO_NO_EXISTE', 404, 'La cuenta no existe.');
      if (cuenta.rows[0].estado !== estadoActual) throw new ErrorUsuario('ESTADO_DESACTUALIZADO', 409, 'La cuenta cambió. Actualiza el listado antes de continuar.');
      await client.query('UPDATE usuarios SET estado=$2,version=version+1 WHERE id=$1', [usuarioId, estado]);
      if (estado === 'inactivo') await client.query('UPDATE sesiones_usuario SET revocada=true WHERE usuario_id=$1 AND NOT revocada', [usuarioId]);
      await client.query(`INSERT INTO auditoria_usuarios(id,actor_id,usuario_id,accion,estado_anterior,estado_nuevo,motivo)
        VALUES ($1,$2,$3,'cambiar_estado',$4,$5,$6)`, [randomUUID(), actorId, usuarioId, estadoActual, estado, motivo]);
      const resultado = await client.query(`${seleccion} WHERE u.id=$1`, [usuarioId]);
      await client.query('COMMIT');
      return resultado.rows[0] as Usuario;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }
}

'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { ErrorAcceso, usuariosApi, type Usuario } from '@/lib/api/usuarios';
import styles from './usuarios.module.css';

interface Listado {
  usuarios: Usuario[];
  pagina: number;
  paginas: number;
  total: number;
}

interface Auditoria {
  eventos: {
    id: string;
    actorId: string | null;
    accion: string;
    estadoAnterior: string | null;
    estadoNuevo: string;
    motivo: string;
    creadoEn: string;
  }[];
  pagina: number;
  paginas: number;
  total: number;
}

export default function AdministracionUsuarios() {
  const [listado, setListado] = useState<Listado | null>(null);
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('');
  const [filtros, setFiltros] = useState({ q: '', estado: '' });
  const [seleccionado, setSeleccionado] = useState<Usuario | null>(null);
  const [motivo, setMotivo] = useState('');
  const [cuentaAuditoria, setCuentaAuditoria] = useState<Usuario | null>(null);
  const [auditoria, setAuditoria] = useState<Auditoria | null>(null);
  const [pendiente, setPendiente] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [acceso, setAcceso] = useState<number | null>(null);

  function fallo(error: unknown) {
    setError(error instanceof Error ? error.message : 'Intenta nuevamente.');
    if (error instanceof ErrorAcceso && [401, 403].includes(error.status)) {
      setAcceso(error.status);
      setListado(null);
      setSeleccionado(null);
      setCuentaAuditoria(null);
      setAuditoria(null);
    }
  }

  async function cargar(pagina = 1, criterios = filtros) {
    const query = new URLSearchParams({ pagina: String(pagina) });
    if (criterios.q) query.set('q', criterios.q);
    if (criterios.estado) query.set('estado', criterios.estado);
    const datos = await usuariosApi<Listado>(`/admin/usuarios?${query}`);
    setListado(datos);
    setAcceso(null);
  }

  async function actualizar(pagina = 1, criterios = filtros) {
    setPendiente(true);
    setError('');
    setSeleccionado(null);
    try { await cargar(pagina, criterios); }
    catch (error) { fallo(error); }
    finally { setPendiente(false); }
  }

  useEffect(() => { void actualizar(); }, []);

  function buscar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const criterios = { q: q.trim(), estado };
    setFiltros(criterios);
    setCuentaAuditoria(null);
    setAuditoria(null);
    setMensaje('');
    void actualizar(1, criterios);
  }

  async function cambiar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!seleccionado) return;
    setPendiente(true);
    setError('');
    setMensaje('');
    try {
      const cuenta = await usuariosApi<Usuario>(`/admin/usuarios/${seleccionado.id}/estado`, 'PATCH', {
        estadoActual: seleccionado.estado,
        estado: seleccionado.estado === 'activo' ? 'inactivo' : 'activo',
        motivo,
      });
      setSeleccionado(null);
      setMotivo('');
      setMensaje(`La cuenta de ${cuenta.nombre} está ${cuenta.estado === 'activo' ? 'activa' : 'inactiva'}. El cambio quedó auditado.`);
      setCuentaAuditoria(null);
      setAuditoria(null);
      setListado(null);
      await cargar(listado?.pagina ?? 1);
    } catch (error) { fallo(error); }
    finally { setPendiente(false); }
  }

  async function verAuditoria(cuenta: Usuario, pagina = 1) {
    setPendiente(true);
    setError('');
    try {
      const datos = await usuariosApi<Auditoria>(`/admin/usuarios/${cuenta.id}/auditoria?pagina=${pagina}`);
      setCuentaAuditoria(cuenta);
      setAuditoria(datos);
    } catch (error) { fallo(error); }
    finally { setPendiente(false); }
  }

  return <section className={`${styles.panel} ${styles.admin}`} aria-labelledby="titulo-administracion">
    <span className="eyebrow">ADMINISTRACIÓN</span>
    <h1 id="titulo-administracion">Administrar usuarios</h1>
    <p>Revisa cuentas y registra el motivo de cada cambio de acceso.</p>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {mensaje && <p role="status">{mensaje}</p>}
    {pendiente && <p role="status">Procesando…</p>}
    {acceso === 401 && <Link href="/ingresar">Ingresar con una cuenta administrativa</Link>}
    {acceso === 403 && <Link href="/cuenta">Volver a mi cuenta</Link>}
    {acceso === null && <>
      <form onSubmit={buscar} className={`${styles.form} ${styles.filtros}`}>
        <label>Buscar por nombre o correo<input name="q" maxLength={100} value={q} onChange={event => setQ(event.target.value)}/></label>
        <label>Estado de cuenta<select value={estado} onChange={event => setEstado(event.target.value)}><option value="">Todos</option><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select></label>
        <button className="button primary" disabled={pendiente}>Buscar usuarios</button>
      </form>
      <button className="button outline" disabled={pendiente} onClick={() => actualizar(listado?.pagina ?? 1)}>Actualizar listado</button>
      {listado && <>
        <p>{listado.total} {listado.total === 1 ? 'cuenta encontrada' : 'cuentas encontradas'}</p>
        {listado.usuarios.length === 0 && <p>No hay cuentas con estos criterios.</p>}
        <ul className={styles.cuentas} aria-label="Cuentas de usuarios">
          {listado.usuarios.map(cuenta => <li key={cuenta.id}>
            <article aria-label={cuenta.email}>
              <h2>{cuenta.nombre}</h2><p>{cuenta.email}</p>
              <p>Estado: <strong>{cuenta.estado === 'activo' ? 'Activo' : 'Inactivo'}</strong> · Roles: {cuenta.roles.join(', ')}</p>
              {cuenta.roles.includes('admin') ? <p>Cuenta administrativa protegida</p> : <button className="button outline" disabled={pendiente} aria-label={`Cambiar estado de ${cuenta.nombre}`} onClick={() => { setSeleccionado(cuenta); setMotivo(''); setMensaje(''); }}>{cuenta.estado === 'activo' ? 'Desactivar cuenta' : 'Activar cuenta'}</button>}
              <button className="button outline" disabled={pendiente} aria-label={`Ver auditoría de ${cuenta.nombre}`} onClick={() => verAuditoria(cuenta)}>Ver auditoría</button>
            </article>
          </li>)}
        </ul>
        <nav aria-label="Páginas de usuarios" className={styles.paginacion}>
          <button className="button outline" disabled={pendiente || listado.pagina <= 1} onClick={() => actualizar(listado.pagina - 1)}>Anterior</button>
          <span>Página {listado.pagina} de {listado.paginas}</span>
          <button className="button outline" disabled={pendiente || listado.pagina >= listado.paginas} onClick={() => actualizar(listado.pagina + 1)}>Siguiente</button>
        </nav>
      </>}
      {seleccionado && <form onSubmit={cambiar} className={styles.form} aria-labelledby="titulo-cambio">
        <h2 id="titulo-cambio">{seleccionado.estado === 'activo' ? 'Desactivar' : 'Activar'} a {seleccionado.nombre}</h2>
        <p>{seleccionado.email}</p>
        <p>{seleccionado.estado === 'activo' ? 'Se cerrarán sus sesiones y no podrá ingresar.' : 'Deberá iniciar una sesión nueva para ingresar.'}</p>
        <label>Motivo del cambio<textarea name="motivo" required minLength={10} maxLength={500} rows={3} value={motivo} onChange={event => setMotivo(event.target.value)}/></label>
        <button className="button primary" disabled={pendiente}>Confirmar cambio de estado</button>
        <button type="button" className="button outline" disabled={pendiente} onClick={() => setSeleccionado(null)}>Cancelar</button>
      </form>}
      {cuentaAuditoria && auditoria && <section aria-labelledby="titulo-auditoria" className={styles.auditoria}>
        <h2 id="titulo-auditoria">Auditoría de {cuentaAuditoria.nombre}</h2>
        {auditoria.eventos.length === 0 && <p>Sin cambios registrados.</p>}
        <ol>{auditoria.eventos.map(evento => <li key={evento.id}>
          <p><strong>{evento.accion === 'crear_admin' ? 'Creación administrativa' : `${evento.estadoAnterior} → ${evento.estadoNuevo}`}</strong></p>
          <p>{evento.motivo}</p>
          <p><time dateTime={evento.creadoEn}>{new Date(evento.creadoEn).toLocaleString('es-PE', { timeZone: 'America/Lima' })}</time> · Actor: {evento.actorId ?? 'Aprovisionamiento local'}</p>
        </li>)}</ol>
        <nav aria-label="Páginas de auditoría" className={styles.paginacion}>
          <button className="button outline" disabled={pendiente || auditoria.pagina <= 1} onClick={() => verAuditoria(cuentaAuditoria, auditoria.pagina - 1)}>Anterior</button>
          <span>Página {auditoria.pagina} de {auditoria.paginas}</span>
          <button className="button outline" disabled={pendiente || auditoria.pagina >= auditoria.paginas} onClick={() => verAuditoria(cuentaAuditoria, auditoria.pagina + 1)}>Siguiente</button>
        </nav>
      </section>}
    </>}
  </section>;
}

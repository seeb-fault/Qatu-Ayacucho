'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { apiJson, ErrorApi } from '@/lib/api/http';
import type { Proveedor, VerificacionProveedor } from '@/lib/api/proveedores';
import styles from './proveedores.module.css';

interface Cola { solicitudes: (VerificacionProveedor & { proveedor: Proveedor })[]; pagina: number; paginas: number; total: number; }

export default function RevisionProveedores() {
  const [cola,setCola] = useState<Cola | null>(null);
  const [estado,setEstado] = useState('pendiente');
  const [pendiente,setPendiente] = useState(false);
  const [error,setError] = useState('');
  const [mensaje,setMensaje] = useState('');
  const [acceso,setAcceso] = useState<number | null>(null);

  async function cargar(pagina = 1, filtro = estado) {
    setPendiente(true);
    setError('');
    try {
      setCola(await apiJson<Cola>(`/admin/proveedores/verificaciones?pagina=${pagina}&estado=${filtro}`));
      setAcceso(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Intenta nuevamente.');
      if (error instanceof ErrorApi && [401,403].includes(error.status)) { setAcceso(error.status); setCola(null); }
    } finally { setPendiente(false); }
  }

  useEffect(() => { void cargar(); },[]);

  async function resolver(event: FormEvent<HTMLFormElement>,solicitud: Cola['solicitudes'][number]) {
    event.preventDefault();
    const datos = new FormData(event.currentTarget);
    setPendiente(true);
    setError('');
    setMensaje('');
    try {
      await apiJson(`/admin/proveedores/${solicitud.proveedor.id}/verificacion`,'POST',{ solicitudId: solicitud.id, decision: datos.get('decision'), motivo: datos.get('motivo') });
      setMensaje('La decisión quedó registrada en el historial.');
      setCola(null);
      await cargar(cola?.pagina ?? 1);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo registrar la decisión.');
      if (error instanceof ErrorApi && [401,403].includes(error.status)) { setAcceso(error.status); setCola(null); }
    } finally { setPendiente(false); }
  }

  return <section className={styles.panel} aria-labelledby="titulo-revision">
    <span className="eyebrow">ADMINISTRACIÓN</span><h1 id="titulo-revision">Revisar proveedores</h1>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {mensaje && <p role="status">{mensaje}</p>}
    {pendiente && <p role="status">Procesando…</p>}
    {acceso === 401 && <Link href="/ingresar">Ingresar para revisar proveedores</Link>}
    {acceso === 403 && <Link href="/cuenta">Volver a mi cuenta</Link>}
    {acceso === null && <>
      <div className={styles.form}><label htmlFor="estado-revision">Estado de solicitudes</label><select id="estado-revision" value={estado} disabled={pendiente} onChange={event => { setEstado(event.target.value); setMensaje(''); void cargar(1,event.target.value); }}><option value="pendiente">Pendientes</option><option value="aprobada">Aprobadas</option><option value="rechazada">Rechazadas</option><option value="cancelada">Canceladas</option></select></div>
      <button className="button outline" disabled={pendiente} onClick={() => cargar(cola?.pagina ?? 1)}>Actualizar solicitudes</button>
      {cola?.solicitudes.length === 0 && <p>No hay solicitudes con este estado.</p>}
      {cola?.solicitudes.map(solicitud => <article key={solicitud.id} aria-label={solicitud.perfilEnviado.nombrePublico} className={styles.solicitud}>
        <h2>{solicitud.perfilEnviado.nombrePublico}</h2>
        <p className={styles.descripcion}>{solicitud.perfilEnviado.descripcion}</p><p>Distrito enviado: {solicitud.perfilEnviado.zonaId}</p>
        <p>Estado: <strong>{solicitud.estado}</strong></p>
        {solicitud.motivo && <p>{solicitud.motivo}</p>}
        {solicitud.documentos.map((documento,indice) => <p key={documento.id}>{documento.disponible ? <a href={`/api/v1/proveedores/documentos/${documento.id}`}>Descargar documento {indice+1}</a> : `Documento ${indice+1}: eliminado por conservación`}</p>)}
        {solicitud.estado === 'pendiente' && <form onSubmit={event => resolver(event,solicitud)} className={styles.form}>
          <label htmlFor={`decision-${solicitud.id}`}>Decisión</label><select id={`decision-${solicitud.id}`} name="decision" required defaultValue=""><option value="" disabled>Selecciona una decisión</option><option value="aprobada">Aprobar documentación</option><option value="rechazada">Rechazar documentación</option></select>
          <label>Motivo de la revisión<textarea name="motivo" required minLength={10} maxLength={500} rows={3}/></label>
          <button className="button primary" disabled={pendiente}>Registrar decisión</button>
        </form>}
      </article>)}
      {cola && <nav aria-label="Páginas de verificaciones" className={styles.acciones}>
        <button className="button outline" disabled={pendiente || cola.pagina <= 1} onClick={() => cargar(cola.pagina-1)}>Anterior</button>
        <span>Página {cola.pagina} de {cola.paginas}</span>
        <button className="button outline" disabled={pendiente || cola.pagina >= cola.paginas} onClick={() => cargar(cola.pagina+1)}>Siguiente</button>
      </nav>}
    </>}
  </section>;
}

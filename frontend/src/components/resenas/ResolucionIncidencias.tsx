'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { apiJson, ErrorApi } from '@/lib/api/http';
import { fechaReserva } from '@/lib/api/reservas';
import catalogo from '@/components/catalogo/catalogo.module.css';
import styles from './resenas.module.css';
import { RESULTADOS, TIPOS } from './IncidenciasReserva';

interface Incidencia { id: string; reservaId: string; tipo: string; descripcion: string; estado: 'abierta' | 'resuelta'; resultado: string | null; motivo: string | null; creadaEn: string; autor: string }
interface Evidencia { id: string; etapa: string; autor: string; disponible: boolean }

function Revision({ incidencia, onCambio }: { incidencia: Incidencia; onCambio: () => void }) {
  const [resultado, setResultado] = useState(''), [motivo, setMotivo] = useState(''), [error, setError] = useState(''), [ocupado, setOcupado] = useState(false);
  const [fotos, setFotos] = useState<Evidencia[] | null>(null);
  async function resolver(e: FormEvent) {
    e.preventDefault(); setOcupado(true); setError('');
    try { await apiJson(`/admin/incidencias/${incidencia.id}/resolucion`, 'PATCH', { resultado, motivo }); onCambio(); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo resolver.'); } finally { setOcupado(false); }
  }
  return <article className={catalogo.item} aria-label={`Incidencia ${TIPOS[incidencia.tipo]}`}>
    <h3>{TIPOS[incidencia.tipo]} · reportada por {incidencia.autor === 'cliente' ? 'el cliente' : 'el proveedor'}</h3>
    <p className={styles.meta}>{fechaReserva(incidencia.creadaEn)} · <strong>{incidencia.estado === 'abierta' ? 'Abierta' : 'Resuelta'}</strong></p>
    <p className={styles.texto}>{incidencia.descripcion}</p>
    {incidencia.estado === 'resuelta' ? <p>{RESULTADOS[incidencia.resultado ?? '']}: {incidencia.motivo}</p> : <>
      {fotos === null
        ? <button className="button outline" onClick={() => apiJson<{ items: Evidencia[] }>(`/admin/incidencias/${incidencia.id}/evidencias`).then(r => setFotos(r.items)).catch(() => setFotos([]))}>Ver fotos de la reserva</button>
        : fotos.length === 0 ? <p className={styles.nota}>La reserva no tiene fotos de evidencia.</p>
        : <ul className={styles.evidencias}>{fotos.map(f => <li key={f.id}>{f.disponible ? <a href={`/api/v1/evidencias/${f.id}/archivo`} download>Foto de {f.etapa} ({f.autor})</a> : <span>Foto eliminada</span>}</li>)}</ul>}
      {error && <p role="alert" className={catalogo.error}>{error}</p>}
      <form onSubmit={resolver}>
        <label>Resultado<select value={resultado} onChange={e => setResultado(e.target.value)} required><option value="">Elige un resultado</option>{Object.entries(RESULTADOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
        <label>Motivo de la decisión<textarea value={motivo} onChange={e => setMotivo(e.target.value)} required minLength={10} maxLength={500} rows={2}/></label>
        <button className="button primary" disabled={ocupado}>Resolver incidencia</button>
      </form>
    </>}
  </article>;
}

export default function ResolucionIncidencias() {
  const [estado, setEstado] = useState<'abierta' | 'resuelta'>('abierta');
  const [datos, setDatos] = useState<{ items: Incidencia[]; total: number } | null>(null);
  const [cargando, setCargando] = useState(true), [error, setError] = useState(''), [sinSesion, setSinSesion] = useState(false);
  async function cargar(e = estado) {
    setCargando(true); setError('');
    try { setDatos(await apiJson(`/admin/incidencias?estado=${e}`)); setSinSesion(false); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron cargar.'); setSinSesion(err instanceof ErrorApi && err.status === 401); }
    finally { setCargando(false); }
  }
  useEffect(() => { void cargar(estado); }, [estado]);
  return <section className={catalogo.panel} aria-labelledby="titulo-incidencias">
    <h1 id="titulo-incidencias">Resolver incidencias</h1>
    <p>Revisa el reclamo y las fotos de la reserva, y registra el resultado con un motivo. La decisión queda registrada y no mueve dinero. No puedes resolver operaciones en las que participaste.</p>
    <div className={catalogo.toolbar} aria-label="Filtro de incidencias">
      <button className="button outline" aria-pressed={estado === 'abierta'} onClick={() => setEstado('abierta')}>Abiertas</button>
      <button className="button outline" aria-pressed={estado === 'resuelta'} onClick={() => setEstado('resuelta')}>Resueltas</button>
    </div>
    {cargando && <p role="status">Cargando incidencias…</p>}
    {error && <p role="alert" className={catalogo.error}>{error}</p>}
    {sinSesion && <Link href="/ingresar">Ingresar como administrador</Link>}
    {datos && <div className={catalogo.list}>
      {datos.total === 0 && <p>No hay incidencias {estado === 'abierta' ? 'abiertas' : 'resueltas'}.</p>}
      {datos.items.map(i => <Revision key={i.id} incidencia={i} onCambio={() => void cargar()}/>)}
    </div>}
  </section>;
}

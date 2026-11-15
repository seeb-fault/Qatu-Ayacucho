'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiJson } from '@/lib/api/http';
import { fechaReserva } from '@/lib/api/reservas';
import styles from './resenas.module.css';

export const TIPOS: Record<string, string> = { dano: 'Daño', faltante: 'Faltante', servicio: 'Problema con el servicio', otro: 'Otro' };
export const RESULTADOS: Record<string, string> = { a_favor_cliente: 'A favor del cliente', a_favor_proveedor: 'A favor del proveedor', sin_acuerdo: 'Sin acuerdo' };
interface Incidencia { id: string; tipo: string; descripcion: string; estado: 'abierta' | 'resuelta'; resultado: string | null; motivo: string | null; creadaEn: string; resueltaEn: string | null; autor: 'cliente' | 'proveedor' }

/** Reclamo de un participante; lo resuelve un administrador ajeno a la operación. No mueve dinero. */
export default function IncidenciasReserva({ reservaId, estado }: { reservaId: string; estado: string }) {
  const [datos, setDatos] = useState<{ items: Incidencia[]; puedeReclamar: boolean } | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState('dano');
  const [descripcion, setDescripcion] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');

  async function cargar() {
    try { setDatos(await apiJson(`/reservas/${reservaId}/incidencias`)); } catch { setDatos(null); }
  }
  useEffect(() => { void cargar(); }, [reservaId, estado]);

  async function reportar(e: FormEvent) {
    e.preventDefault(); setOcupado(true); setError('');
    try { await apiJson(`/reservas/${reservaId}/incidencias`, 'POST', { tipo, descripcion }); setAbierto(false); setDescripcion(''); await cargar(); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo registrar.'); } finally { setOcupado(false); }
  }

  if (!datos || (!datos.items.length && !datos.puedeReclamar)) return null;
  return <section className={styles.resena} aria-label="Incidencias">
    <p className={styles.titulo}>Incidencias</p>
    {datos.items.map(i => <div key={i.id}>
      <p><strong>{TIPOS[i.tipo]}</strong> <span className={styles.meta}>· reportada por {i.autor === 'cliente' ? 'el cliente' : 'el proveedor'} · {fechaReserva(i.creadaEn)}</span></p>
      <p className={styles.texto}>{i.descripcion}</p>
      <p className={styles.meta}>{i.estado === 'abierta' ? 'En revisión por la administración. Las fotos de la reserva se conservan mientras tanto.' : `Resuelta: ${RESULTADOS[i.resultado ?? '']}. ${i.motivo}`}</p>
    </div>)}
    {datos.puedeReclamar && !abierto && <div className={styles.acciones}><button className="button outline" onClick={() => setAbierto(true)}>Reportar un problema</button></div>}
    {abierto && <form className={styles.campo} onSubmit={reportar} aria-label="Reportar un problema">
      <label>Tipo de problema<select value={tipo} onChange={e => setTipo(e.target.value)}>{Object.entries(TIPOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
      <label>Qué pasó
        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} minLength={20} maxLength={1000} rows={3} required placeholder="Describe el problema. Sube fotos en Evidencias para respaldarlo."/>
      </label>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <p className={styles.nota}>Lo revisa una persona de la administración. Qatu no mueve dinero por una incidencia.</p>
      <div className={styles.acciones}><button className="button primary" disabled={ocupado}>Enviar reporte</button><button type="button" className="button outline" onClick={() => setAbierto(false)}>Cancelar</button></div>
    </form>}
  </section>;
}

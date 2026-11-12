'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { apiFormulario, apiJson } from '@/lib/api/http';
import { fechaReserva } from '@/lib/api/reservas';
import styles from './resenas.module.css';

type Etapa = 'entrega' | 'devolucion' | 'trabajo';
interface Evidencia { id: string; etapa: Etapa; autor: 'cliente' | 'proveedor'; bytes: number; creadaEn: string; disponible: boolean }
interface Respuesta { items: Evidencia[]; etapasAbiertas: Etapa[]; maximoPorEtapa: number; diasDeRetencion: number }

const NOMBRES: Record<Etapa, string> = { entrega: 'Entrega', devolucion: 'Devolución', trabajo: 'Trabajo' };
const tamano = (bytes: number) => bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** Fotos privadas de entrega, devolución o trabajo: solo las ven los participantes y la administración. */
export default function EvidenciasReserva({ reservaId }: { reservaId: string }) {
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [etapa, setEtapa] = useState<Etapa | ''>('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const archivos = useRef<HTMLInputElement>(null);

  async function cargar() {
    try {
      const r = await apiJson<Respuesta>(`/reservas/${reservaId}/evidencias`);
      setDatos(r); setEtapa(actual => actual && r.etapasAbiertas.includes(actual) ? actual : r.etapasAbiertas[0] ?? '');
    } catch { setDatos(null); }
  }
  useEffect(() => { void cargar(); }, [reservaId]);

  async function subir(e: FormEvent) {
    e.preventDefault();
    const fotos = Array.from(archivos.current?.files ?? []);
    if (!etapa || !fotos.length) { setError('Elige al menos una foto.'); return; }
    const form = new FormData();
    form.set('etapa', etapa);
    fotos.forEach(f => form.append('fotos', f));
    setEnviando(true); setError(''); setMensaje('');
    try {
      await apiFormulario(`/reservas/${reservaId}/evidencias`, form);
      if (archivos.current) archivos.current.value = '';
      setMensaje(fotos.length === 1 ? 'Foto guardada.' : `${fotos.length} fotos guardadas.`);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar las fotos.');
    } finally { setEnviando(false); }
  }

  if (!datos || (!datos.items.length && !datos.etapasAbiertas.length)) return null;
  const usadas = (e: Etapa) => datos.items.filter(i => i.etapa === e).length;
  const etapas = [...new Set([...datos.items.map(i => i.etapa), ...datos.etapasAbiertas])];

  return <section className={styles.resena} aria-label="Evidencias de la operación">
    <p className={styles.titulo}>Evidencias</p>
    <p className={styles.nota}>Fotos privadas: solo las ven los participantes y la administración. Se borran {datos.diasDeRetencion} días después del cierre.</p>
    {etapas.map(e => {
      const items = datos.items.filter(i => i.etapa === e);
      return <div key={e}>
        <p><strong>{NOMBRES[e]}</strong> <span className={styles.meta}>· {items.length} de {datos.maximoPorEtapa}</span></p>
        {items.length > 0 && <ul className={styles.evidencias}>{items.map(i => <li key={i.id}>
          {i.disponible ? <a href={`/api/v1/evidencias/${i.id}/archivo`} download>Foto de {i.autor === 'cliente' ? 'el cliente' : 'el proveedor'}</a> : <span>Foto eliminada por retención</span>}
          <span className={styles.meta}> · {tamano(i.bytes)} · {fechaReserva(i.creadaEn)}</span>
        </li>)}</ul>}
      </div>;
    })}
    {datos.etapasAbiertas.some(e => usadas(e) < datos.maximoPorEtapa) && <form onSubmit={subir} className={styles.campo} aria-label="Subir evidencias">
      {datos.etapasAbiertas.length > 1 && <label>Etapa
        <select value={etapa} onChange={e => setEtapa(e.target.value as Etapa)}>{datos.etapasAbiertas.map(e => <option key={e} value={e}>{NOMBRES[e]}</option>)}</select>
      </label>}
      <label>Fotos de {etapa ? NOMBRES[etapa].toLowerCase() : 'la operación'} (JPG o PNG, hasta 5 MB cada una)
        <input ref={archivos} type="file" accept="image/jpeg,image/png" multiple required/>
      </label>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {mensaje && <p role="status" className={styles.nota}>{mensaje}</p>}
      <div className={styles.acciones}><button className="button outline" disabled={enviando}>{enviando ? 'Subiendo…' : 'Subir fotos'}</button></div>
    </form>}
  </section>;
}

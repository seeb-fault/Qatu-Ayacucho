'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Icono from '@/components/descubrimiento/Icono';
import { apiJson, ErrorApi } from '@/lib/api/http';
import styles from './mapa.module.css';

const Mapa = dynamic(() => import('./Mapa'), { ssr: false, loading: () => <div className="q-mapa" style={{ height: 320 }} aria-hidden="true"/> });

type Precision = 'exacta' | 'aproximada';
interface Guardada { lat: number; lng: number; precision: Precision; publica: { lat: number; lng: number } }

/**
 * El proveedor marca dónde está su herramienta o desde dónde trabaja (011). Elige si el público ve
 * el punto exacto (un local) o uno casi exacto, a menos de 100 m (su casa). El exacto solo lo ve
 * quien tiene una reserva aceptada con él.
 */
export default function EditorUbicacion({ publicacionId }: { publicacionId: string }) {
  const [punto, setPunto] = useState<{ lat: number; lng: number } | null>(null);
  const [precision, setPrecision] = useState<Precision>('aproximada');
  const [guardada, setGuardada] = useState<Guardada | null>(null);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'guardando' | 'ubicando'>('cargando');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    apiJson<{ ubicacion: Guardada | null }>(`/publicaciones/${publicacionId}/ubicacion`)
      .then(({ ubicacion: u }) => { if (!vigente) return; setGuardada(u); if (u) { setPunto({ lat: u.lat, lng: u.lng }); setPrecision(u.precision); } })
      .catch(e => { if (vigente) setError(e instanceof Error ? e.message : 'No se pudo cargar la ubicación.'); })
      .finally(() => { if (vigente) setEstado('listo'); });
    return () => { vigente = false; };
  }, [publicacionId]);

  function usarMiUbicacion() {
    if (!navigator.geolocation) { setError('Tu navegador no permite compartir la ubicación. Marca el punto en el mapa.'); return; }
    setEstado('ubicando'); setError('');
    navigator.geolocation.getCurrentPosition(
      pos => { setPunto({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setEstado('listo'); setMensaje(''); },
      () => { setEstado('listo'); setError('No pudimos obtener tu ubicación. Marca el punto tocando el mapa.'); },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  async function guardar() {
    if (!punto) return;
    setEstado('guardando'); setError(''); setMensaje('');
    try {
      const u = await apiJson<Guardada>(`/publicaciones/${publicacionId}/ubicacion`, 'PUT', { lat: punto.lat, lng: punto.lng, precision });
      setGuardada(u); setPunto({ lat: u.lat, lng: u.lng });
      setMensaje(precision === 'exacta' ? 'Ubicación guardada. El público ve el punto exacto.' : 'Ubicación guardada. El público ve un punto a menos de 100 m; el exacto, solo quien tenga una reserva aceptada contigo.');
    } catch (e) { setError(e instanceof ErrorApi || e instanceof Error ? e.message : 'No se pudo guardar la ubicación.'); }
    finally { setEstado('listo'); }
  }

  async function quitar() {
    setEstado('guardando'); setError(''); setMensaje('');
    try { await apiJson(`/publicaciones/${publicacionId}/ubicacion`, 'DELETE', {}); setGuardada(null); setPunto(null); setMensaje('Quitaste la ubicación. La oferta ya no muestra mapa.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo quitar la ubicación.'); }
    finally { setEstado('listo'); }
  }

  const ocupado = estado !== 'listo';
  const cambiada = punto && (!guardada || guardada.lat !== punto.lat || guardada.lng !== punto.lng || guardada.precision !== precision);
  return <section className={styles.editor} aria-labelledby="titulo-ubicacion-editor">
    <h2 id="titulo-ubicacion-editor">Ubicación en el mapa</h2>
    <p className={styles.ayuda}>Toca el mapa o arrastra el pin hasta donde recogen la herramienta o desde donde trabajas. Así los clientes saben qué tan cerca estás.</p>
    <div className={styles.acciones}>
      <button type="button" className="button outline small" disabled={ocupado} onClick={usarMiUbicacion}><Icono nombre="pin" size={16}/>{estado === 'ubicando' ? 'Buscando…' : 'Usar mi ubicación'}</button>
      {punto && <span className={styles.coordenadas}>{punto.lat.toFixed(5)}, {punto.lng.toFixed(5)}</span>}
    </div>
    <Mapa puntos={punto ? [{ ...punto, precision: 'exacta', titulo: 'Tu punto exacto' }] : []} alElegir={p => { setPunto({ lat: Math.round(p.lat * 1e6) / 1e6, lng: Math.round(p.lng * 1e6) / 1e6 }); setMensaje(''); }} etiqueta="Mapa para elegir la ubicación de la oferta" alto={320}/>
    <fieldset className={styles.opciones} disabled={ocupado}>
      <legend>¿Qué ve el público antes de reservar?</legend>
      <label><input type="radio" name="precision" checked={precision === 'aproximada'} onChange={() => setPrecision('aproximada')}/><span><strong>Casi exacta (a menos de 100 m)</strong><small>Para tu casa: el cliente ve la cuadra; el punto exacto, solo con una reserva aceptada.</small></span></label>
      <label><input type="radio" name="precision" checked={precision === 'exacta'} onChange={() => setPrecision('exacta')}/><span><strong>Exacta</strong><small>Para un taller, tienda o ferretería abiertos al público.</small></span></label>
    </fieldset>
    {guardada && <p className={styles.ayuda}>Vista del público: {guardada.precision === 'exacta' ? 'el punto exacto.' : `un punto en ${guardada.publica.lat.toFixed(5)}, ${guardada.publica.lng.toFixed(5)}, dentro de un círculo de 100 m.`}</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {mensaje && <p role="status" className={styles.exito}>{mensaje}</p>}
    <div className={styles.acciones}>
      <button type="button" className="button primary" disabled={ocupado || !cambiada} onClick={() => void guardar()}>{estado === 'guardando' ? 'Guardando…' : 'Guardar ubicación'}</button>
      {guardada && <button type="button" className="button outline" disabled={ocupado} onClick={() => void quitar()}>Quitar del mapa</button>}
    </div>
  </section>;
}

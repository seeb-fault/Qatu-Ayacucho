'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFormulario, apiJson } from '@/lib/api/http';
import type { Proveedor, VerificacionProveedor as Verificacion } from '@/lib/api/proveedores';
import styles from './proveedores.module.css';

interface Politica { habilitada: boolean; conservacion: string; }

export default function VerificacionProveedor({ perfil, onActualizado }: { perfil: Proveedor; onActualizado: () => Promise<void> }) {
  const [politica,setPolitica] = useState<Politica | null>(null);
  const [historial,setHistorial] = useState<Verificacion[]>([]);
  const [archivos,setArchivos] = useState<File[]>([]);
  const [acepta,setAcepta] = useState(false);
  const [pendiente,setPendiente] = useState(false);
  const [error,setError] = useState('');

  async function cargar() {
    setError('');
    try {
      const [reglas,solicitudes] = await Promise.all([apiJson<Politica>('/proveedores/politica-documental'),apiJson<Verificacion[]>('/proveedores/me/verificaciones')]);
      setPolitica(reglas);
      setHistorial(solicitudes);
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo cargar la verificación.'); }
  }

  useEffect(() => { void cargar(); },[perfil.version]);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!acepta || archivos.length < 1 || archivos.length > 2 || archivos.some(archivo => archivo.size > 5242880 || archivo.size === 0)) { setError('Acepta la conservación y adjunta uno o dos archivos de hasta 5 MiB cada uno.'); return; }
    setPendiente(true);
    setError('');
    const form = new FormData();
    form.set('versionActual',String(perfil.version));
    form.set('aceptaConservacion','true');
    archivos.forEach(archivo => form.append('documentos',archivo));
    try {
      await apiFormulario('/proveedores/me/verificaciones',form);
      await onActualizado();
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo enviar.'); }
    finally { setPendiente(false); }
  }

  return <section aria-labelledby="titulo-documentacion">
    <h2 id="titulo-documentacion">Verificación documental</h2>
    <p>Envía únicamente los documentos necesarios para acreditar tu identidad o actividad. Solo tú y el equipo administrador pueden descargarlos.</p>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {politica && <p>{politica.conservacion}</p>}
    {politica && !politica.habilitada && <p>La recepción de documentos todavía no está disponible.</p>}
    {politica?.habilitada && !['pendiente','aprobada'].includes(perfil.estadoVerificacion) && <form onSubmit={enviar} className={styles.form}>
      <label>Documentos privados<input type="file" name="documentos" accept="application/pdf,image/jpeg,image/png" multiple required onChange={event => setArchivos(Array.from(event.target.files ?? []))}/></label>
      <small>Uno o dos PDF, JPG o PNG; máximo 5 MiB por archivo.</small>
      <label className={styles.consentimiento}><input type="checkbox" required checked={acepta} onChange={event => setAcepta(event.target.checked)}/>Acepto la política de conservación indicada.</label>
      <button className="button primary" disabled={pendiente}>{pendiente ? 'Enviando…' : 'Solicitar verificación'}</button>
    </form>}
    {perfil.estadoVerificacion === 'pendiente' && <p>Tu solicitud está en revisión. Podrás modificar los datos del perfil cuando se resuelva; sí puedes ocultar su página pública.</p>}
    <h2>Historial de solicitudes</h2>
    {historial.length === 0 && <p>Todavía no hay solicitudes.</p>}
    <ol className={styles.historial}>{historial.map(solicitud => <li key={solicitud.id}>
      <p><strong>{solicitud.estado}</strong> · {new Date(solicitud.creadoEn).toLocaleDateString('es-PE',{ timeZone: 'America/Lima' })}</p>
      {solicitud.motivo && <p>{solicitud.motivo}</p>}
      {solicitud.documentos.map((documento,indice) => <p key={documento.id}>{documento.disponible ? <a href={`/api/v1/proveedores/documentos/${documento.id}`}>Descargar documento {indice+1}</a> : `Documento ${indice+1}: adjunto eliminado según conservación`}</p>)}
    </li>)}</ol>
    {error && <button className="button outline" onClick={cargar} disabled={pendiente}>Reintentar historial</button>}
  </section>;
}

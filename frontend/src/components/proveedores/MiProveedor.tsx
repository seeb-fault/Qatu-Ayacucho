'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { apiJson, ErrorApi } from '@/lib/api/http';
import type { Proveedor, ZonaProveedor } from '@/lib/api/proveedores';
import { estadosVerificacion } from '@/lib/api/proveedores';
import VerificacionProveedor from './VerificacionProveedor';
import styles from './proveedores.module.css';

export default function MiProveedor() {
  const [perfil, setPerfil] = useState<Proveedor | null>(null);
  const [zonas, setZonas] = useState<ZonaProveedor[]>([]);
  const [nombrePublico, setNombrePublico] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [zonaId, setZonaId] = useState('');
  const [visiblePublicamente, setVisiblePublicamente] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [pendiente, setPendiente] = useState(false);
  const [sinSesion, setSinSesion] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  function fallo(error: unknown) {
    setError(error instanceof Error ? error.message : 'Intenta nuevamente.');
    if (error instanceof ErrorApi && error.status === 401) {
      setSinSesion(true);
      setPerfil(null);
      setZonas([]);
    }
  }

  async function cargar() {
    setCargando(true);
    setError('');
    setMensaje('');
    try {
      const [opciones, datos] = await Promise.all([
        apiJson<ZonaProveedor[]>('/proveedores/zonas'),
        apiJson<Proveedor>('/proveedores/me').catch(error => {
          if (error instanceof ErrorApi && error.status === 404) return null;
          throw error;
        }),
      ]);
      setZonas(opciones);
      setPerfil(datos);
      setNombrePublico(datos?.nombrePublico ?? '');
      setDescripcion(datos?.descripcion ?? '');
      setZonaId(datos?.zonaId ?? '');
      setVisiblePublicamente(datos?.visiblePublicamente ?? false);
      setSinSesion(false);
    } catch (error) { fallo(error); }
    finally { setCargando(false); }
  }

  useEffect(() => { void cargar(); }, []);

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendiente(true);
    setError('');
    setMensaje('');
    try {
      const datos = await apiJson<Proveedor>('/proveedores/me', perfil ? 'PATCH' : 'POST', {
        nombrePublico, descripcion, zonaId, visiblePublicamente,
        ...(perfil ? { versionActual: perfil.version } : {}),
      });
      setPerfil(datos);
      setNombrePublico(datos.nombrePublico);
      setDescripcion(datos.descripcion);
      setMensaje('Tu perfil de proveedor se guardó.');
    } catch (error) { fallo(error); }
    finally { setPendiente(false); }
  }

  return <section className={styles.panel} aria-labelledby="titulo-proveedor">
    <span className="eyebrow">OFRECE EN TU COMUNIDAD</span><h1 id="titulo-proveedor">Mi perfil de proveedor</h1>
    <p>Presenta tus herramientas u oficios y el distrito donde atiendes.</p>
    <div className={styles.estado}><strong>{estadosVerificacion[perfil?.estadoVerificacion ?? 'no_solicitada']}</strong>La revisión documental es independiente de publicar ofertas. El catálogo todavía está en fase de demostración.</div>
    {cargando && <p role="status">Cargando tu perfil…</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {mensaje && <p role="status">{mensaje}</p>}
    {sinSesion && <p><Link href="/ingresar">Ingresar para crear mi perfil de proveedor</Link></p>}
    {!cargando && !sinSesion && zonas.length > 0 && <form onSubmit={guardar} className={styles.form}>
      <label>Nombre público<input name="nombrePublico" value={nombrePublico} onChange={event => setNombrePublico(event.target.value)} required minLength={2} maxLength={100} aria-describedby="ayuda-nombre" readOnly={perfil?.estadoVerificacion === 'pendiente'}/></label>
      <small id="ayuda-nombre">Nombre comercial o nombre que deseas mostrar. Tu correo de cuenta no se publica.</small>
      <label>Descripción<textarea name="descripcion" rows={5} required minLength={20} maxLength={1500} value={descripcion} onChange={event => setDescripcion(event.target.value)} aria-describedby="ayuda-descripcion" readOnly={perfil?.estadoVerificacion === 'pendiente'}/></label>
      <small id="ayuda-descripcion">Entre 20 y 1500 caracteres. Describe tu actividad sin incluir documentos de identidad ni dirección exacta.</small>
      <label htmlFor="distrito-proveedor">Distrito de atención</label><select id="distrito-proveedor" name="zonaId" required value={zonaId} onChange={event => setZonaId(event.target.value)} disabled={perfil?.estadoVerificacion === 'pendiente'}><option value="">Selecciona un distrito</option>{zonas.map(zona => <option key={zona.id} value={zona.id}>{zona.nombre}</option>)}</select>
      <small>Selección manual de distrito. No necesitas un mapa para completar tu perfil.</small>
      <label className={styles.consentimiento}><input name="visiblePublicamente" type="checkbox" checked={visiblePublicamente} onChange={event => setVisiblePublicamente(event.target.checked)}/>Mostrar públicamente mi nombre, descripción y distrito de atención.</label>
      <button className="button primary" disabled={pendiente}>{pendiente ? 'Guardando…' : perfil ? 'Guardar cambios del proveedor' : 'Crear perfil de proveedor'}</button>
    </form>}
    {!cargando && !sinSesion && <div className={styles.acciones}>
      {perfil?.visiblePublicamente && <Link href={`/proveedores/${perfil.id}`}>Ver mi página pública</Link>}
      <button className="button outline" disabled={pendiente} onClick={cargar}>Recargar perfil</button>
      <Link href="/cuenta">Volver a mi cuenta</Link>
    </div>}
    {!cargando && !sinSesion && perfil && <VerificacionProveedor perfil={perfil} onActualizado={cargar}/>}
  </section>;
}

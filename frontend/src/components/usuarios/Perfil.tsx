'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { ErrorAcceso, usuariosApi, type Usuario } from '@/lib/api/usuarios';
import styles from './usuarios.module.css';

export default function Perfil() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const [pendiente, setPendiente] = useState(false);
  const [sinSesion, setSinSesion] = useState(false);

  async function cargar() {
    setCargando(true);
    setError('');
    try {
      const datos = await usuariosApi<Usuario>('/usuarios/me');
      setUsuario(datos);
      setNombre(datos.nombre);
      setSinSesion(false);
    } catch (error) { fallo(error); }
    finally { setCargando(false); }
  }

  useEffect(() => { void cargar(); }, []);

  function fallo(error: unknown) {
    if (error instanceof ErrorAcceso && error.status === 401) {
      setUsuario(null);
      setSinSesion(true);
    }
    setError(error instanceof Error ? error.message : 'Intenta nuevamente.');
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendiente(true);
    setMensaje('');
    setError('');
    try {
      setUsuario(await usuariosApi<Usuario>('/usuarios/me', 'PATCH', { nombre }));
      setMensaje('Tu perfil se guardó.');
    } catch (error) { fallo(error); }
    finally { setPendiente(false); }
  }

  async function salir() {
    setPendiente(true);
    setError('');
    try {
      await usuariosApi('/auth/logout', 'POST', {});
      setUsuario(null);
      setSinSesion(true);
      setMensaje('Cerraste tu sesión.');
    } catch (error) { fallo(error); }
    finally { setPendiente(false); }
  }

  return <section className={styles.panel} aria-labelledby="titulo-cuenta">
    <span className="eyebrow">TU CUENTA QATU</span><h1 id="titulo-cuenta">Mi perfil</h1>
    {cargando && <p role="status">Cargando tu perfil…</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {mensaje && <p role="status">{mensaje}</p>}
    {sinSesion && <p><Link href="/ingresar">Ingresar a mi cuenta</Link></p>}
    {!cargando && !sinSesion && !usuario && <button className="button outline" onClick={cargar}>Reintentar</button>}
    {usuario && <><p>{usuario.email}</p><p>Roles: {usuario.roles.join(', ')}</p>
      <p><Link href="/proveedor">Mi perfil de proveedor</Link></p>
      {usuario.roles.includes('admin') && <p><Link href="/admin/usuarios">Administrar usuarios</Link></p>}
      {usuario.roles.includes('admin') && <p><Link href="/admin/proveedores">Revisar proveedores</Link></p>}
      <form onSubmit={guardar} className={styles.form}>
        <label>Nombre<input name="nombre" autoComplete="name" value={nombre} onChange={event => setNombre(event.target.value)} required minLength={2} maxLength={100}/></label>
        <button className="button primary" disabled={pendiente}>{pendiente ? 'Procesando…' : 'Guardar perfil'}</button>
      </form>
      <button className="button outline" onClick={salir} disabled={pendiente}>Cerrar sesión</button>
    </>}
  </section>;
}

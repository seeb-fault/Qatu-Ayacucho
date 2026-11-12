'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { ErrorAcceso, usuariosApi, type Usuario } from '@/lib/api/usuarios';
import Icono from '@/components/descubrimiento/Icono';
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

  const iniciales = usuario?.nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') ?? '';
  const accesos = usuario ? [
    { href: '/proveedor', texto: 'Panel del proveedor', detalle: 'Solicitudes, ofertas, perfil y verificación en un solo lugar.', icono: 'shield' },
    { href: '/publicar', texto: 'Gestionar mis ofertas', detalle: 'Publica herramientas u oficios y edítalos.', icono: 'box' },
    { href: '/reservas', texto: 'Mis solicitudes', detalle: 'Revisa solicitudes enviadas y recibidas.', icono: 'calendar' },
    ...(usuario.roles.includes('admin') ? [
      { href: '/admin/usuarios', texto: 'Administrar usuarios', detalle: 'Activa o desactiva cuentas con auditoría.', icono: 'users' },
      { href: '/admin/proveedores', texto: 'Revisar proveedores', detalle: 'Evalúa la documentación enviada.', icono: 'check' },
      { href: '/admin/publicaciones', texto: 'Moderar publicaciones', detalle: 'Retira o restablece ofertas.', icono: 'info' },
    ] : []),
  ] : [];

  return <section className={styles.panel + ' ' + styles.cuenta} aria-labelledby="titulo-cuenta">
    <div className={styles.cabecera}>
      <span className={styles.avatar} aria-hidden="true">{iniciales || <Icono nombre="user" size={26}/>}</span>
      <div><h1 id="titulo-cuenta">Mi perfil</h1>{usuario && <p className={styles.correo}>{usuario.email}</p>}</div>
    </div>
    {cargando && <p role="status">Cargando tu perfil…</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {mensaje && <p role="status" className={styles.exito}>{mensaje}</p>}
    {sinSesion && <p><Link href="/ingresar" className="button primary">Ingresar a mi cuenta</Link></p>}
    {!cargando && !sinSesion && !usuario && <button className="button outline" onClick={cargar}>Reintentar</button>}
    {usuario && <>
      <ul className={styles.roles} aria-label="Roles de la cuenta">{usuario.roles.map(rol => <li key={rol}>{rol}</li>)}</ul>
      <ul className={styles.accesos}>{accesos.map(a => <li key={a.href}><span className={styles.accesoIcono} aria-hidden="true"><Icono nombre={a.icono} size={20}/></span><span><Link href={a.href}>{a.texto}</Link><small>{a.detalle}</small></span><Icono nombre="chevron" size={16}/></li>)}</ul>
      <form onSubmit={guardar} className={styles.form}>
        <h2>Datos personales</h2>
        <label>Nombre<input name="nombre" autoComplete="name" value={nombre} onChange={event => setNombre(event.target.value)} required minLength={2} maxLength={100}/></label>
        <button className="button primary" disabled={pendiente}>{pendiente ? 'Procesando…' : 'Guardar perfil'}</button>
      </form>
      <button className="button outline" onClick={salir} disabled={pendiente}><Icono nombre="logout" size={17}/>Cerrar sesión</button>
    </>}
  </section>;
}

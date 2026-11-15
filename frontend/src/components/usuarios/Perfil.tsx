'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { ErrorAcceso, usuariosApi, type Usuario } from '@/lib/api/usuarios';
import Icono from '@/components/descubrimiento/Icono';
import styles from './usuarios.module.css';

export default function Perfil() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [nombre, setNombre] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [whatsappVisible, setWhatsappVisible] = useState(false);
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
      setWhatsapp(datos.whatsapp?.replace(/^\+51/, '') ?? '');
      setWhatsappVisible(datos.whatsappVisible ?? false);
      setSinSesion(false);
    } catch (error) { fallo(error); }
    finally { setCargando(false); }
  }

  useEffect(() => { void cargar(); }, []);

  function fallo(error: unknown) {
    // Sesión vencida o inexistente: directo al ingreso, sin pasar por un aviso intermedio.
    if (error instanceof ErrorAcceso && error.status === 401) {
      setUsuario(null);
      setSinSesion(true);
      router.replace('/ingresar');
      return;
    }
    setError(error instanceof Error ? error.message : 'Intenta nuevamente.');
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendiente(true);
    setMensaje('');
    setError('');
    try {
      const guardado = await usuariosApi<Usuario>('/usuarios/me', 'PATCH', { nombre, whatsapp: whatsapp.trim(), whatsappVisible: whatsapp.trim() ? whatsappVisible : false });
      setUsuario(guardado);
      setWhatsapp(guardado.whatsapp?.replace(/^\+51/, '') ?? '');
      setWhatsappVisible(guardado.whatsappVisible ?? false);
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
      // Al salir se vuelve a la portada de Qatu.
      router.replace('/');
      router.refresh();
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
      { href: '/admin/resenas', texto: 'Moderar reseñas', detalle: 'Oculta o restablece reseñas con motivo.', icono: 'star' },
      { href: '/admin/incidencias', texto: 'Resolver incidencias', detalle: 'Revisa reclamos y fotos de evidencia.', icono: 'shield' },
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
        <label>WhatsApp<span className={styles.telefono}><span aria-hidden="true">+51</span><input name="whatsapp" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="987 654 321" pattern="[0-9 ]{9,11}" title="9 dígitos que empiezan con 9" value={whatsapp} onChange={event => { setWhatsapp(event.target.value); if (!event.target.value.trim()) setWhatsappVisible(false); }} aria-describedby="ayuda-whatsapp"/></span></label>
        <label className={styles.consentimiento}><input type="checkbox" checked={whatsappVisible} disabled={!whatsapp.trim()} onChange={event => setWhatsappVisible(event.target.checked)}/>Mostrar mi WhatsApp solo a quienes tengan una reserva aceptada conmigo</label>
        <p id="ayuda-whatsapp" className={styles.ayuda}>Sirve para coordinar la entrega, la visita o la hora del trabajo. Se comparte desde que la reserva se acepta, se agenda la visita o se envía la cotización, y deja de mostrarse al terminar. Los proveedores lo necesitan para publicar.</p>
        <button className="button primary" disabled={pendiente}>{pendiente ? 'Procesando…' : 'Guardar perfil'}</button>
      </form>
      <button className="button outline" onClick={salir} disabled={pendiente}><Icono nombre="logout" size={17}/>Cerrar sesión</button>
    </>}
  </section>;
}

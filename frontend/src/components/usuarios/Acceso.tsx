'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { rutaInterna } from '@/lib/rutas';
import { ErrorAcceso, usuariosApi, type Usuario } from '@/lib/api/usuarios';

/** Tras iniciar sesión: el proveedor va a su panel, el administrador a su cuenta y el cliente al inicio. */
async function destinoTrasIngreso(usuario: Usuario | undefined) {
  if (usuario?.roles.includes('admin')) return '/cuenta';
  try {
    await usuariosApi('/proveedores/me');
    return '/proveedor';
  } catch (error) {
    if (error instanceof ErrorAcceso && error.status === 404) return '/';
    return '/cuenta';
  }
}
import Icono from '@/components/descubrimiento/Icono';
import styles from './acceso.module.css';

export default function Acceso({ registro = false }: { registro?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pendiente, setPendiente] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  // Página a la que se vuelve después de ingresar (por ejemplo, una publicación que se quería guardar).
  const [siguiente, setSiguiente] = useState<string | null>(null);
  useEffect(() => { setSiguiente(rutaInterna(new URLSearchParams(window.location.search).get('siguiente'))); }, []);
  const conRegreso = (ruta: string) => siguiente ? ruta + '?siguiente=' + encodeURIComponent(siguiente) : ruta;

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendiente) return;
    const form = new FormData(event.currentTarget);
    setPendiente(true);
    setError('');
    try {
      const respuesta = await usuariosApi<{ usuario?: Usuario }>(registro ? '/auth/registro' : '/auth/login', 'POST', {
        email: form.get('email'), password: form.get('password'),
        ...(registro ? { nombre: form.get('nombre') } : {}),
      });
      // Una cuenta nueva completa su perfil; quien vuelve a entrar va directo a lo suyo.
      router.replace(siguiente ?? (registro ? '/cuenta' : await destinoTrasIngreso(respuesta?.usuario)));
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Intenta nuevamente.');
    } finally { setPendiente(false); }
  }

  return <section className={styles.page} aria-labelledby="titulo-acceso">
    <div className={styles.shell}>
      <aside className={styles.story} aria-label="La comunidad Qatu">
        <span className={styles.location}><Icono nombre="pin" size={15}/> HECHO PARA AYACUCHO</span>
        <div className={styles.storyCopy}>
          
          <h2>Grandes proyectos.<br/>{' '}Buenas manos.<br/>{' '}<span>Tu comunidad.</span></h2>
          <p>Encuentra esa herramienta que te falta o el talento que hace la diferencia. Todo comienza cerca.</p>
        </div>
        <div className={styles.scene} aria-hidden="true">
          
          <div className={styles.toolCard}><span className={styles.toolIcon}><Icono nombre="drill" size={48}/></span><div><small>PARA TU PRÓXIMO PROYECTO</small><strong>La herramienta indicada</strong><span>Alquila cerca de ti <Icono nombre="arrow" size={15}/></span></div></div>
          <div className={styles.talentCard}><span className={styles.avatar}><Icono nombre="user" size={24}/></span><div><strong>Talento de tu barrio</strong><span>Oficios que conectan</span></div><Icono nombre="spark" size={22}/></div>
          <span className={styles.sceneLabel}><Icono nombre="leaf" size={16}/> Compartir nos lleva más lejos</span>
        </div>
        <div className={styles.storyFooter}><Icono nombre="pin" size={17}/><span>Ayacucho, Perú <span>·</span> Lo que necesitas, cerca de ti.</span></div>
      </aside>
      <div className={styles.content}>
        <Link href="/" className={styles.back}><span aria-hidden="true">←</span> Volver al inicio</Link>
        <nav className={styles.tabs} aria-label="Acceso a tu cuenta">
          <Link href={conRegreso('/ingresar')} aria-current={!registro ? 'page' : undefined}>Iniciar sesión</Link>
          <Link href={conRegreso('/registro')} aria-current={registro ? 'page' : undefined}>Crear cuenta</Link>
        </nav>
        <h1 id="titulo-acceso" className={styles.srOnly}>{registro ? 'Crea tu cuenta en Qatu' : 'Iniciar sesión en Qatu'}</h1>
        {siguiente && <p className={styles.switch} role="note">Después de ingresar volverás a la página donde estabas.</p>}
        <form onSubmit={enviar} className={styles.form} aria-busy={pendiente}>
          {registro && <div className={styles.field}><label htmlFor="acceso-nombre">Nombre</label><input id="acceso-nombre" name="nombre" placeholder="¿Cómo te llamas?" autoComplete="name" required minLength={2} maxLength={100}/></div>}
          <div className={styles.field}><label htmlFor="acceso-email">Correo electrónico</label><input id="acceso-email" name="email" type="email" placeholder="tu@correo.com" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254}/></div>
          <div className={styles.field}>
            <label htmlFor="acceso-password">Contraseña</label>
            <div className={styles.password}>
              <input id="acceso-password" name="password" type={mostrarPassword ? 'text' : 'password'} placeholder={registro ? 'Crea una contraseña segura' : 'Tu contraseña'} autoComplete={registro ? 'new-password' : 'current-password'} required minLength={12} maxLength={128} aria-describedby="ayuda-password"/>
              <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)} aria-controls="acceso-password" aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{mostrarPassword ? 'Ocultar' : 'Mostrar'}</button>
            </div>
            <small id="ayuda-password">{registro ? 'Usa entre 12 y 128 caracteres. Una frase larga es una buena opción.' : 'Tu contraseña tiene entre 12 y 128 caracteres.'}</small>
          </div>
          {error && <p role="alert" className={styles.error}><Icono nombre="info" size={19}/><span>{error}</span></p>}
          <button type="submit" className={styles.submit} disabled={pendiente}><span>{pendiente ? 'Procesando…' : registro ? 'Crear cuenta' : 'Ingresar'}</span>{pendiente ? <span className={styles.spinner} aria-hidden="true"/> : <Icono nombre="arrow" size={19}/>}</button>
        </form>
        <p className={styles.switch}>{registro ? '¿Ya eres parte de Qatu?' : '¿Todavía no tienes una cuenta?'} <Link href={conRegreso(registro ? '/ingresar' : '/registro')}>{registro ? 'Ingresa' : 'Crea tu cuenta'}</Link></p>
        <div className={styles.note}><Icono nombre={registro ? 'leaf' : 'shield'} size={18}/><p>{registro ? 'Empieza como cliente. También podrás crear tu perfil de proveedor desde tu cuenta.' : 'Tu espacio para encontrar, compartir y conectar con tu comunidad.'}</p></div>
      </div>
    </div>
  </section>;
}

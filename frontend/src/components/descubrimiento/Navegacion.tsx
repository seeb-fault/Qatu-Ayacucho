import Link from 'next/link';
import Icono from './Icono';
import AccionFutura from './AccionFutura';

export function Marca() {
  return <Link href="/" className="brand" aria-label="Qatu, inicio"><span className="brand-mark"><span/><span/><span/><span/></span>qatu<span className="brand-dot">.</span></Link>;
}
export default function Navegacion() {
  return <><a className="skip-link" href="#contenido">Saltar al contenido</a>
    <div className="demo-bar"><span><Icono nombre="leaf" size={14}/> Más proyectos. Más comunidad.</span><span className="bar-divider">|</span><span>Hecho para Ayacucho</span><span className="bar-divider">|</span><strong>Catálogo de demostración</strong></div>
    <header className="header"><div className="container header-inner"><div className="brand-lockup"><Marca/><span>HERRAMIENTAS & TALENTO LOCAL</span></div><span className="header-location"><Icono nombre="pin" size={17}/> Ayacucho, Perú</span>
      <nav className="desktop-nav" aria-label="Navegación principal"><Link href="/buscar">Explorar</Link><Link href="/#como-funciona">Cómo funciona</Link><AccionFutura clase="nav-publish" titulo="Comparte lo que sabes y lo que tienes">Publicar una oferta <Icono nombre="arrow" size={16}/></AccionFutura><Link className="account-button" href="/cuenta"><Icono nombre="user" size={19}/><span>Mi cuenta</span></Link></nav><Link className="mobile-explore" href="/buscar" aria-label="Explorar ofertas"><Icono nombre="search"/></Link></div>
      <nav className="market-subnav container" aria-label="Explorar por tipo"><Link className="all-categories" href="/buscar"><Icono nombre="menu" size={17}/> Todas las categorías</Link><Link href="/">Inicio</Link><Link href="/buscar?tipo=herramienta">Herramientas</Link><Link href="/buscar?tipo=servicio">Servicios y oficios</Link><Link href="/buscar?categoria=jardineria&tipo=herramienta">Jardinería</Link><span><Icono nombre="pin" size={14}/> Lo bueno está cerca</span></nav>
    </header></>;
}
export function Footer() {
  return <><footer className="footer"><div className="container footer-main"><div className="footer-brand"><Marca/><p>Herramientas y talento de Ayacucho.<br/>Para las ideas que merecen<br/>hacerse realidad.</p><span className="footer-local"><Icono nombre="pin" size={15}/> Ayacucho, Perú</span></div><div><span className="eyebrow">EXPLORA QATU</span><Link href="/buscar?tipo=herramienta">Alquilar herramientas</Link><Link href="/buscar?tipo=servicio">Encontrar un oficio</Link><Link href="/buscar">Todas las categorías</Link></div><div><span className="eyebrow">TU ESPACIO</span><Link href="/cuenta">Mi cuenta</Link><Link href="/ingresar">Iniciar sesión</Link><Link href="/registro">Crear una cuenta</Link><Link href="/proveedor">Mi perfil de proveedor</Link></div><div className="footer-note"><span className="eyebrow">CONOCE EL PROYECTO</span><Link href="/#como-funciona">Cómo funciona</Link><Link href="/demo">Acerca de este prototipo</Link><p>Un proyecto local para conectar<br/>lo que tienes con lo que necesitas.</p></div></div><div className="container footer-bottom"><span>© 2026 Qatu · Proyecto académico</span><span>Catálogo de demostración. Ofertas, precios y testimonios ficticios.</span><span>Hecho en Ayacucho <Icono nombre="leaf" size={14}/></span></div></footer>
    <nav className="bottom-nav" aria-label="Navegación móvil"><Link href="/buscar"><Icono nombre="search" size={21}/>Buscar</Link><AccionFutura titulo="Publica en la próxima entrega"><Icono nombre="box" size={21}/>Publicar</AccionFutura><AccionFutura titulo="Tus reservas, en una próxima entrega"><Icono nombre="calendar" size={21}/>Reservas</AccionFutura><Link href="/cuenta"><Icono nombre="user" size={21}/>Perfil</Link></nav></>;
}

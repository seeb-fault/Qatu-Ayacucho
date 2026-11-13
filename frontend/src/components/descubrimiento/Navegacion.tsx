import { Suspense } from 'react';
import Link from 'next/link';
import Icono from './Icono';
import Marca from './Marca';
import BuscadorCabecera from './BuscadorCabecera';
import MenuUbicacion from './MenuUbicacion';
import BarraCategorias from './BarraCategorias';
import EnlacesPrincipales from './EnlacesPrincipales';
import OcultarAlBajar from './OcultarAlBajar';
import CampanaAvisos from '@/components/avisos/CampanaAvisos';
import {fuenteCatalogo} from '@/lib/api/publicaciones';

export { Marca };
export default function Navegacion() {
  return <><a className="skip-link" href="#contenido">Saltar al contenido</a>
    <header className="header">
      <OcultarAlBajar/>
      <div className="container header-inner">
        <Marca/>
        <BuscadorCabecera/>
        <nav className="desktop-nav" aria-label="Navegación principal"><Suspense fallback={null}><EnlacesPrincipales/></Suspense><Link className="nav-publish" href="/publicar" aria-label="Publicar una oferta"><Icono nombre="plus" size={17}/>Publicar</Link></nav>
        <CampanaAvisos/>
        <Link className="account-button" href="/cuenta" aria-label="Mi cuenta" title="Mi cuenta"><Icono nombre="user" size={19}/></Link>
        <div className="mobile-actions"><Link className="mobile-explore" href="/cuenta" aria-label="Mi cuenta"><Icono nombre="user" size={20}/></Link></div>
      </div>
      <Suspense fallback={<div className="category-pills"/>}><BarraCategorias><Suspense fallback={<span className="location-menu-placeholder"/>}><MenuUbicacion/></Suspense></BarraCategorias></Suspense>
    </header></>;
}
export function Footer() {
  return <><footer className="footer"><div className="container footer-main"><div className="footer-brand"><Marca/><p>Herramientas y talento de Ayacucho, en un solo lugar. Para las ideas que merecen hacerse realidad.</p><span className="footer-local"><Icono nombre="pin" size={15}/> Ayacucho, Perú</span></div><div><span className="eyebrow">EXPLORA QATU</span><Link href="/buscar?tipo=herramienta">Alquilar herramientas</Link><Link href="/buscar?tipo=servicio">Encontrar un oficio</Link><Link href="/buscar">Todas las categorías</Link></div><div><span className="eyebrow">TU ESPACIO</span><Link href="/cuenta">Mi cuenta</Link><Link href="/reservas">Mis solicitudes</Link><Link href="/avisos">Avisos</Link><Link href="/ingresar">Iniciar sesión</Link><Link href="/registro">Crear una cuenta</Link><Link href="/proveedor">Mi perfil de proveedor</Link></div><div className="footer-note"><span className="eyebrow">CONOCE EL PROYECTO</span><Link href="/#como-funciona">Cómo funciona</Link><Link href="/demo">Acerca de este prototipo</Link><p>Un proyecto local para conectar lo que tienes con lo que necesitas.</p></div></div><div className="container footer-bottom"><span>© 2026 Qatu · Proyecto académico</span><span>{fuenteCatalogo==="demostracion"?"Catálogo de demostración. Ofertas y precios ficticios.":"Ofertas de proveedores locales. Ilustraciones de referencia."} Testimonios ilustrativos.</span><span>Hecho en Ayacucho <Icono nombre="heart" size={14}/></span></div></footer>
    <nav className="bottom-nav" aria-label="Navegación móvil"><Link href="/"><Icono nombre="grid" size={21}/>Inicio</Link><Link href="/buscar"><Icono nombre="search" size={21}/>Buscar</Link><Link href="/publicar" className="bottom-nav-publish"><span><Icono nombre="plus" size={22}/></span>Publicar</Link><Link href="/cuenta"><Icono nombre="user" size={21}/>Perfil</Link></nav></>;
}

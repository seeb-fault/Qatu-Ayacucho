'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { categorias, urlBusqueda } from '@/lib/catalogo';
import Icono from './Icono';

const todo = { tipo: '', nombre: 'Todo', icono: 'grid' };
const tipos = [
  { tipo: 'herramienta', nombre: 'Herramientas', icono: 'drill' },
  { tipo: 'servicio', nombre: 'Oficios', icono: 'hammer' },
];

export default function BarraCategorias() {
  const ruta = usePathname();
  const enResultados = ruta === '/buscar';
  const params = useSearchParams();
  const tipo = enResultados ? params.get('tipo') ?? '' : null;
  const categoria = enResultados ? params.get('categoria') ?? '' : null;

  // La lista se renderiza dos veces para que el desplazamiento continuo no tenga cortes;
  // la copia queda fuera del árbol de accesibilidad y del orden de tabulación.
  const grupo = (copia: boolean) => <div className="category-group" aria-hidden={copia || undefined}>
    {tipos.map(t => {
      const activo = tipo === t.tipo && !categoria;
      return <Link key={t.nombre} href={urlBusqueda({ tipo: t.tipo })} tabIndex={copia ? -1 : undefined} className={'pill' + (activo ? ' active' : '')} aria-current={activo && !copia ? 'page' : undefined}><span className="pill-icon"><Icono nombre={t.icono} size={20}/></span>{t.nombre}</Link>;
    })}
    <span className="pill-divider" aria-hidden="true"/>
    {categorias.map(c => {
      const activo = categoria === c.id;
      return <Link key={c.id} href={urlBusqueda({ tipo: c.tipo, categoria: c.id })} tabIndex={copia ? -1 : undefined} className={'pill' + (activo ? ' active' : '')} aria-current={activo && !copia ? 'page' : undefined}><span className="pill-icon"><Icono nombre={c.icono} size={20}/></span>{c.nombre}</Link>;
    })}
    <span className="pill-divider" aria-hidden="true"/>
  </div>;

  // «Todo» queda fijo; en el inicio se resalta como punto de partida, sin marcarlo como página actual.
  const todoActivo = tipo === '' && !categoria;
  const todoResaltado = todoActivo || ruta === '/';

  // El resto se mueve solo dentro del recuadro y se detiene al pasar el cursor o enfocar.
  return <nav className="category-pills" aria-label="Categorías">
    <div className="container category-bar">
      <Link href={urlBusqueda({ tipo: todo.tipo })} className={'pill pill-fija' + (todoResaltado ? ' active' : '')} aria-current={todoActivo ? 'page' : undefined}><span className="pill-icon"><Icono nombre={todo.icono} size={20}/></span>{todo.nombre}</Link>
      <span className="pill-divider" aria-hidden="true"/>
      <div className="category-viewport">
        <div className="category-track">{grupo(false)}{grupo(true)}</div>
      </div>
    </div>
  </nav>;
}

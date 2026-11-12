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

  // «Todo» queda fijo; en el inicio se resalta como punto de partida, sin marcarlo como página actual.
  const todoActivo = tipo === '' && !categoria;
  const todoResaltado = todoActivo || ruta === '/';

  // El resto se recorre deslizando dentro del recuadro.
  return <nav className="category-pills" aria-label="Categorías">
    <div className="container category-bar">
      <Link href={urlBusqueda({ tipo: todo.tipo })} className={'pill pill-fija' + (todoResaltado ? ' active' : '')} aria-current={todoActivo ? 'page' : undefined}><span className="pill-icon"><Icono nombre={todo.icono} size={20}/></span>{todo.nombre}</Link>
      <span className="pill-divider" aria-hidden="true"/>
      <div className="category-viewport">
        <div className="category-group">
          {tipos.map(t => {
            const activo = tipo === t.tipo && !categoria;
            return <Link key={t.nombre} href={urlBusqueda({ tipo: t.tipo })} className={'pill' + (activo ? ' active' : '')} aria-current={activo ? 'page' : undefined}><span className="pill-icon"><Icono nombre={t.icono} size={20}/></span>{t.nombre}</Link>;
          })}
          <span className="pill-divider" aria-hidden="true"/>
          {categorias.map(c => {
            const activo = categoria === c.id;
            return <Link key={c.id} href={urlBusqueda({ tipo: c.tipo, categoria: c.id })} className={'pill' + (activo ? ' active' : '')} aria-current={activo ? 'page' : undefined}><span className="pill-icon"><Icono nombre={c.icono} size={20}/></span>{c.nombre}</Link>;
          })}
        </div>
      </div>
    </div>
  </nav>;
}

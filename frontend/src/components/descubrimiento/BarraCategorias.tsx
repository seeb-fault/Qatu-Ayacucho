'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { categorias, urlBusqueda } from '@/lib/catalogo';
import Icono from './Icono';

const todo = { tipo: '', nombre: 'Todo', icono: 'grid' };

/** Herramientas y Oficios están en el encabezado; aquí van las categorías y, a la derecha, la ubicación. */
export default function BarraCategorias({ children }: { children?: ReactNode }) {
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
      <div className="category-viewport">
        <div className="category-group">
          <Link href={urlBusqueda({ tipo: todo.tipo })} className={'pill' + (todoResaltado ? ' active' : '')} aria-current={todoActivo ? 'page' : undefined}><span className="pill-icon"><Icono nombre={todo.icono} size={18}/></span>{todo.nombre}</Link>
          {categorias.map(c => {
            const activo = categoria === c.id;
            return <Link key={c.id} href={urlBusqueda({ tipo: c.tipo, categoria: c.id })} className={'pill' + (activo ? ' active' : '')} aria-current={activo ? 'page' : undefined}><span className="pill-icon"><Icono nombre={c.icono} size={20}/></span>{c.nombre}</Link>;
          })}
        </div>
      </div>
      {children}
    </div>
  </nav>;
}

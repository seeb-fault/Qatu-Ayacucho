'use client';

import { useEffect, useRef } from 'react';

/**
 * Al bajar, el encabezado se esconde; al subir, reaparece compacto (sin la barra de categorías).
 * Arriba de todo vuelve a su tamaño. No se esconde si el foco está dentro (teclado o menú abierto).
 */
export default function OcultarAlBajar() {
  const marca = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const header = marca.current?.closest('header');
    if (!header) return;
    let ultimo = window.scrollY, pendiente = false;
    const actualizar = () => {
      pendiente = false;
      const y = window.scrollY, delta = y - ultimo;
      if (y > 140) header.classList.add('is-compacto');
      else if (y < 40) header.classList.remove('is-compacto');
      if (delta > 6 && y > 200 && !header.contains(document.activeElement)) header.classList.add('is-oculto');
      else if (delta < -6 || y < 200) header.classList.remove('is-oculto');
      if (Math.abs(delta) > 6) ultimo = y;
    };
    const alDesplazar = () => { if (!pendiente) { pendiente = true; requestAnimationFrame(actualizar); } };
    const alEnfocar = () => header.classList.remove('is-oculto');
    window.addEventListener('scroll', alDesplazar, { passive: true });
    header.addEventListener('focusin', alEnfocar);
    return () => { window.removeEventListener('scroll', alDesplazar); header.removeEventListener('focusin', alEnfocar); header.classList.remove('is-oculto', 'is-compacto'); };
  }, []);
  return <span ref={marca} hidden/>;
}

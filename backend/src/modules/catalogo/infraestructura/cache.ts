import { createHash } from 'node:crypto';
import { CacheMemoria } from '../../../shared/infraestructura/cache';
import type { DatosOferta, FiltrosCatalogo, ProveedorCatalogo, Publicacion } from '../dominio/oferta';
import type { ProveedoresCatalogo, RepositorioCatalogo } from '../dominio/puertos';
import type { UbicacionOferta } from '../dominio/ubicacion';

type Pagina = { items: Publicacion[]; total: number };

/**
 * Decorador del repositorio (patrón Decorator): guarda en caché solo la búsqueda pública y deja todo lo demás igual.
 * La clave incluye los filtros y el conjunto de proveedores habilitados, así una oferta de un proveedor que deja de
 * estar habilitado sale de la búsqueda en cuanto vence la lista de habilitados. Cualquier escritura del catálogo
 * vacía la caché, aunque falle (no se sabe si llegó a confirmarse).
 */
export class RepositorioCatalogoEnCache implements RepositorioCatalogo {
  constructor(private readonly base: RepositorioCatalogo, private readonly busquedas: CacheMemoria<Pagina>, private readonly alEscribir: () => void = () => {}) {}

  listar(f: FiltrosCatalogo, alcance: { habilitados?: string[]; proveedorId?: string; admin?: boolean }) {
    // Las vistas del dueño y del administrador deben verse al día: no pasan por la caché.
    if (!alcance.habilitados || alcance.proveedorId || alcance.admin) return this.base.listar(f, alcance);
    const proveedores = createHash('sha256').update([...alcance.habilitados].sort().join(',')).digest('base64url');
    return this.busquedas.obtener(JSON.stringify([f.q, f.tipo, f.categoriaId, f.zonaId, f.precioMaximoCentimos ?? null, f.page, f.limit, f.orden, proveedores]), () => this.base.listar(f, alcance));
  }

  porId(id: string) { return this.base.porId(id); }
  auditoria(id: string) { return this.base.auditoria(id); }
  ubicacion(publicacionId: string) { return this.base.ubicacion(publicacionId); }

  crear(proveedorId: string, datos: DatosOferta) { return this.escribir(() => this.base.crear(proveedorId, datos)); }
  editar(id: string, proveedorId: string, versionActual: number, datos: DatosOferta) { return this.escribir(() => this.base.editar(id, proveedorId, versionActual, datos)); }
  moderar(id: string, actorId: string, versionActual: number, estado: 'permitida' | 'retirada', motivo: string) { return this.escribir(() => this.base.moderar(id, actorId, versionActual, estado, motivo)); }
  guardarUbicacion(publicacionId: string, u: UbicacionOferta) { return this.escribir(() => this.base.guardarUbicacion(publicacionId, u)); }
  quitarUbicacion(publicacionId: string) { return this.escribir(() => this.base.quitarUbicacion(publicacionId)); }

  private async escribir<T>(operacion: () => Promise<T>): Promise<T> {
    try { return await operacion(); } finally { this.busquedas.invalidar(); this.alEscribir(); }
  }
}

/** Decorador de la fachada de Proveedores: la lista de habilitados se consulta en cada búsqueda y cambia poco. */
export class ProveedoresCatalogoEnCache implements ProveedoresCatalogo {
  constructor(private readonly base: ProveedoresCatalogo, private readonly cache: CacheMemoria<ProveedorCatalogo[]>) {}
  propio(token: string) { return this.base.propio(token); }
  habilitados() { return this.cache.obtener('habilitados', () => this.base.habilitados()); }
}

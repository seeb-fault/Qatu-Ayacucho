import { isIP } from 'node:net';

/**
 * Dirección en la que escucha la API. Por defecto solo la propia máquina (127.0.0.1). En Docker (Dokploy) cada servicio
 * va en su contenedor: la API debe escuchar en 0.0.0.0 para que la web la alcance por la red interna. No debe
 * publicarse con dominio ni puerto expuesto: solo Traefik → web es público.
 */
export function direccionEscucha(valor: string | undefined): string {
  if (valor === undefined || valor.trim() === '') return '127.0.0.1';
  const v = valor.trim();
  if (!isIP(v)) throw new Error('QATU_HOST debe ser una dirección IP, por ejemplo 127.0.0.1 o, dentro de Docker, 0.0.0.0.');
  return v;
}

/**
 * Proxies cuya cabecera X-Forwarded-For se cree, para conocer la IP real del visitante (límites de intentos).
 *
 * El proxy de Next.js (rewrites de /api/v1) NO agrega X-Forwarded-For: reenvía la que traiga el visitante.
 * Por eso confiar en ella solo es seguro si delante hay un proxy inverso (Traefik en Dokploy, Nginx, Caddy) que la
 * escriba con la IP real, y si Next y la API no son accesibles sin pasar por él. En Dokploy: `uniquelocal`.
 * Sin esta configuración, la API usa la IP de la conexión (la de Next) y nadie puede falsificarla.
 *
 * Valores: `loopback`, `linklocal`, `uniquelocal` o direcciones IP/CIDR, separados por comas. `true` o un número de
 * saltos se rechazan: harían confiar en cualquier cabecera.
 */
export function proxiesConfiables(valor: string | undefined): string[] | null {
  if (valor === undefined || valor.trim() === '') return null;
  const partes = valor.split(',').map(p => p.trim()).filter(Boolean);
  const valida = (p: string) => {
    if (['loopback', 'linklocal', 'uniquelocal'].includes(p)) return true;
    const [ip, prefijo, ...resto] = p.split('/');
    const version = isIP(ip);
    if (!version || resto.length) return false;
    if (prefijo === undefined) return true;
    return /^\d{1,3}$/.test(prefijo) && Number(prefijo) <= (version === 4 ? 32 : 128);
  };
  if (!partes.length || !partes.every(valida)) {
    throw new Error('QATU_PROXIES_CONFIABLES admite loopback, linklocal, uniquelocal o direcciones IP/CIDR separadas por comas.');
  }
  return partes;
}

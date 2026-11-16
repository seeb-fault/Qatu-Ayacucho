'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import type { Map as MapaLeaflet, LayerGroup, Marker } from 'leaflet';

/** Centro de Huamanga (Plaza de Armas): vista inicial cuando aún no hay puntos. */
export const HUAMANGA = { lat: -13.160227, lng: -74.225762 };
/** Radio que se dibuja alrededor de un punto casi exacto: el desplazamiento máximo es de 100 m. */
const RADIO_APROXIMADO = 100;

export interface PuntoMapa { lat: number; lng: number; precision: 'exacta' | 'aproximada'; titulo?: string; href?: string }

const pin = (L: typeof import('leaflet'), activo = false) => L.divIcon({ className: 'q-pin' + (activo ? ' q-pin--activo' : ''), html: '<span></span>', iconSize: [30, 40], iconAnchor: [15, 38], popupAnchor: [0, -34] });

/**
 * Mapa de OpenStreetMap con Leaflet. Los puntos casi exactos se dibujan como un círculo de 100 m,
 * no como un pin. Con `alElegir`, un clic o arrastrar el pin elige el punto (formulario del proveedor).
 */
export default function Mapa({ puntos, alElegir, etiqueta, alto = 280, zoom = 16 }: {
  puntos: PuntoMapa[]; alElegir?: (p: { lat: number; lng: number }) => void; etiqueta: string; alto?: number; zoom?: number;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLeaflet | null>(null);
  const capa = useRef<LayerGroup | null>(null);
  const lib = useRef<typeof import('leaflet') | null>(null);
  const elegir = useRef(alElegir);
  elegir.current = alElegir;
  const clave = JSON.stringify(puntos);

  // Crea el mapa una vez, en el navegador, y solo cuando se acerca a la vista: Leaflet (unos 150 KB)
  // no compite con el contenido principal de la página en celulares lentos.
  useEffect(() => {
    let vigente = true, observador: ResizeObserver | undefined, vista: IntersectionObserver | undefined;
    const cargar = () => void import('leaflet').then(({ default: L }) => {
      if (!vigente || !contenedor.current || mapa.current) return;
      lib.current = L;
      const m = L.map(contenedor.current, { scrollWheelZoom: false, attributionControl: true }).setView([HUAMANGA.lat, HUAMANGA.lng], 14);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(m);
      capa.current = L.layerGroup().addTo(m);
      if (elegir.current) m.on('click', e => elegir.current?.({ lat: e.latlng.lat, lng: e.latlng.lng }));
      mapa.current = m;
      dibujar();
      // Si el contenedor cambia de tamaño (al abrir un panel o rotar el celular), Leaflet recalcula los mosaicos.
      observador = new ResizeObserver(() => m.invalidateSize());
      observador.observe(contenedor.current);
    });
    if (typeof IntersectionObserver === 'undefined' || !contenedor.current) cargar();
    else {
      vista = new IntersectionObserver(entradas => {
        if (entradas.some(e => e.isIntersecting)) { vista?.disconnect(); cargar(); }
      }, { rootMargin: '300px 0px' });
      vista.observe(contenedor.current);
    }
    return () => { vigente = false; vista?.disconnect(); observador?.disconnect(); mapa.current?.remove(); mapa.current = null; };
  }, []);

  // Redibuja cuando cambian los puntos.
  useEffect(() => { dibujar(); }, [clave]);

  function dibujar() {
    const L = lib.current, m = mapa.current, grupo = capa.current;
    if (!L || !m || !grupo) return;
    grupo.clearLayers();
    for (const p of puntos) {
      let marca: Marker | null = null;
      if (p.precision === 'aproximada') {
        L.circle([p.lat, p.lng], { radius: RADIO_APROXIMADO, color: '#C8102E', weight: 2, fillColor: '#C8102E', fillOpacity: 0.15 }).addTo(grupo);
        marca = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: 'q-punto', html: '<span></span>', iconSize: [14, 14], iconAnchor: [7, 7] }), keyboard: false });
      } else {
        marca = L.marker([p.lat, p.lng], { icon: pin(L, Boolean(alElegir)), draggable: Boolean(alElegir), title: p.titulo ?? 'Ubicación' });
        if (alElegir) marca.on('dragend', () => { const ll = marca!.getLatLng(); elegir.current?.({ lat: ll.lat, lng: ll.lng }); });
      }
      if (p.titulo) marca.bindPopup(p.href ? `<a href="${p.href}">${escapar(p.titulo)}</a>` : escapar(p.titulo));
      marca.addTo(grupo);
    }
    if (puntos.length === 1) m.setView([puntos[0].lat, puntos[0].lng], zoom);
    else if (puntos.length > 1) m.fitBounds(L.latLngBounds(puntos.map(p => [p.lat, p.lng] as [number, number])), { padding: [32, 32], maxZoom: zoom });
  }

  return <div ref={contenedor} className="q-mapa" style={{ height: alto }} role="region" aria-label={etiqueta}/>;
}

function escapar(texto: string) {
  return texto.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** Enlaces gratuitos para abrir el punto en la app de mapas del celular. */
export const enGoogleMaps = (p: { lat: number; lng: number }) => `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
export const enOpenStreetMap = (p: { lat: number; lng: number }) => `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=18/${p.lat}/${p.lng}`;

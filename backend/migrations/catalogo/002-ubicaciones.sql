-- Mapas y ubicación (011). Punto exacto del proveedor y punto público: el mismo si es un local abierto al
-- público, o desplazado 50–100 m si prefiere no mostrar su casa. El exacto solo se entrega a la contraparte
-- de una reserva activa. Zona de servicio de Qatu: provincia de Huamanga y alrededores.
CREATE TABLE catalogo_ubicaciones (
  publicacion_id uuid PRIMARY KEY REFERENCES catalogo_publicaciones(id),
  lat numeric(8,6) NOT NULL CHECK (lat BETWEEN -13.6 AND -12.6),
  lng numeric(9,6) NOT NULL CHECK (lng BETWEEN -74.7 AND -73.7),
  precision text NOT NULL CHECK (precision IN ('exacta','aproximada')),
  lat_publica numeric(8,6) NOT NULL CHECK (lat_publica BETWEEN -13.6 AND -12.6),
  lng_publica numeric(9,6) NOT NULL CHECK (lng_publica BETWEEN -74.7 AND -73.7),
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  CHECK (precision <> 'exacta' OR (lat_publica = lat AND lng_publica = lng)),
  CHECK (precision <> 'aproximada' OR (lat_publica, lng_publica) <> (lat, lng))
);

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE TABLE catalogo_categorias (
 id text PRIMARY KEY, tipo text NOT NULL CHECK(tipo IN ('herramienta','servicio')), nombre text NOT NULL, UNIQUE(id,tipo)
);
INSERT INTO catalogo_categorias VALUES
 ('perforacion','herramienta','Perforación'),('corte','herramienta','Corte y lijado'),('pintura','herramienta','Pintura'),('jardineria','herramienta','Jardinería'),('limpieza','herramienta','Limpieza'),
 ('gasfiteria','servicio','Gasfitería'),('electricidad','servicio','Electricidad'),('carpinteria','servicio','Carpintería'),('pintor','servicio','Pintores'),('jardinero','servicio','Jardineros');
CREATE TABLE catalogo_zonas (id text PRIMARY KEY, nombre text NOT NULL);
INSERT INTO catalogo_zonas VALUES ('ayacucho','Ayacucho'),('san-juan-bautista','San Juan Bautista'),('carmen-alto','Carmen Alto'),('jesus-nazareno','Jesús Nazareno');
CREATE TABLE catalogo_publicaciones (
 id uuid PRIMARY KEY, proveedor_id uuid NOT NULL, tipo text NOT NULL, categoria_id text NOT NULL, zona_id text NOT NULL REFERENCES catalogo_zonas(id),
 titulo text NOT NULL CHECK(length(btrim(titulo)) BETWEEN 5 AND 120), descripcion text NOT NULL CHECK(length(btrim(descripcion)) BETWEEN 20 AND 3000),
 incluye jsonb NOT NULL CHECK(jsonb_typeof(incluye)='array' AND jsonb_array_length(incluye) BETWEEN 1 AND 10), condiciones jsonb NOT NULL CHECK(jsonb_typeof(condiciones)='array' AND jsonb_array_length(condiciones) BETWEEN 1 AND 10),
 activa boolean NOT NULL, estado_moderacion text NOT NULL DEFAULT 'permitida' CHECK(estado_moderacion IN ('permitida','retirada')),
 version integer NOT NULL DEFAULT 1 CHECK(version>0), busqueda tsvector NOT NULL DEFAULT ''::tsvector,
 creado_en timestamptz NOT NULL DEFAULT now(), actualizado_en timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(categoria_id,tipo) REFERENCES catalogo_categorias(id,tipo)
);
CREATE FUNCTION catalogo_actualizar_busqueda() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 NEW.busqueda := to_tsvector('spanish',unaccent(NEW.titulo || ' ' || NEW.descripcion)); RETURN NEW;
END $$;
CREATE TRIGGER catalogo_busqueda BEFORE INSERT OR UPDATE OF titulo,descripcion ON catalogo_publicaciones FOR EACH ROW EXECUTE FUNCTION catalogo_actualizar_busqueda();
CREATE INDEX catalogo_busqueda_idx ON catalogo_publicaciones USING gin(busqueda);
CREATE INDEX catalogo_publicas_idx ON catalogo_publicaciones(creado_en DESC,id) WHERE activa AND estado_moderacion='permitida';
CREATE INDEX catalogo_filtros_idx ON catalogo_publicaciones(tipo,categoria_id,zona_id,id);
CREATE INDEX catalogo_propias_idx ON catalogo_publicaciones(proveedor_id,creado_en DESC,id);
CREATE TABLE catalogo_tarifas (
 publicacion_id uuid PRIMARY KEY REFERENCES catalogo_publicaciones(id), moneda text NOT NULL DEFAULT 'PEN' CHECK(moneda='PEN'),
 modalidad text NOT NULL CHECK(modalidad IN ('fija','cotizacion')), monto_centimos integer, unidad text,
 CHECK((modalidad='fija' AND monto_centimos IS NOT NULL AND unidad IS NOT NULL AND monto_centimos BETWEEN 1 AND 99999999 AND unidad IN ('día','servicio')) OR (modalidad='cotizacion' AND monto_centimos IS NULL AND unidad IS NULL))
);
CREATE INDEX catalogo_precio_idx ON catalogo_tarifas(monto_centimos,publicacion_id) WHERE modalidad='fija';
CREATE TABLE catalogo_recursos (
 id uuid PRIMARY KEY, publicacion_id uuid NOT NULL REFERENCES catalogo_publicaciones(id), clase text NOT NULL CHECK(clase IN ('unidad_fisica','agenda')),
 identificador text NOT NULL CHECK(length(btrim(identificador)) BETWEEN 1 AND 80), activo boolean NOT NULL
);
CREATE UNIQUE INDEX catalogo_recurso_etiqueta_idx ON catalogo_recursos(publicacion_id,lower(identificador));
CREATE INDEX catalogo_recurso_oferta_idx ON catalogo_recursos(publicacion_id,id);
CREATE TABLE catalogo_auditoria (
 id uuid PRIMARY KEY, publicacion_id uuid NOT NULL REFERENCES catalogo_publicaciones(id), actor_id uuid NOT NULL,
 estado_anterior text NOT NULL, estado_nuevo text NOT NULL, motivo text NOT NULL CHECK(length(btrim(motivo)) BETWEEN 10 AND 500),
 version integer NOT NULL, creado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX catalogo_auditoria_oferta_idx ON catalogo_auditoria(publicacion_id,creado_en DESC,id);

-- Invariantes entre datos propios del módulo; se comprueban al confirmar la transacción.
CREATE FUNCTION catalogo_validar_coherencia() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE oferta_id uuid; p catalogo_publicaciones; t catalogo_tarifas; cantidad integer; activos integer; incorrectos integer;
BEGIN
 IF TG_TABLE_NAME='catalogo_publicaciones' THEN oferta_id:=COALESCE(NEW.id,OLD.id); ELSE oferta_id:=COALESCE(NEW.publicacion_id,OLD.publicacion_id); END IF;
 SELECT * INTO p FROM catalogo_publicaciones WHERE id=oferta_id;
 IF NOT FOUND THEN RETURN NULL; END IF;
 SELECT * INTO t FROM catalogo_tarifas WHERE publicacion_id=oferta_id;
 IF NOT FOUND OR (p.tipo='herramienta' AND (t.modalidad<>'fija' OR t.unidad IS DISTINCT FROM 'día')) OR (p.tipo='servicio' AND t.modalidad='fija' AND t.unidad IS DISTINCT FROM 'servicio') THEN RAISE EXCEPTION 'Tarifa incompatible' USING ERRCODE='23514'; END IF;
 SELECT count(*),count(*) FILTER(WHERE activo),count(*) FILTER(WHERE clase<>CASE WHEN p.tipo='herramienta' THEN 'unidad_fisica' ELSE 'agenda' END) INTO cantidad,activos,incorrectos FROM catalogo_recursos WHERE publicacion_id=oferta_id;
 IF cantidad<1 OR cantidad>20 OR (p.tipo='servicio' AND cantidad<>1) OR incorrectos>0 OR (p.activa AND activos=0) THEN RAISE EXCEPTION 'Recursos incompatibles' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER catalogo_coherencia_publicacion AFTER INSERT OR UPDATE ON catalogo_publicaciones DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION catalogo_validar_coherencia();
CREATE CONSTRAINT TRIGGER catalogo_coherencia_tarifa AFTER INSERT OR UPDATE OR DELETE ON catalogo_tarifas DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION catalogo_validar_coherencia();
CREATE CONSTRAINT TRIGGER catalogo_coherencia_recurso AFTER INSERT OR UPDATE OR DELETE ON catalogo_recursos DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION catalogo_validar_coherencia();

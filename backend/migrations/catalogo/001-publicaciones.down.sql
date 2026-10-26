-- Rollback manual: exige retirar previamente cualquier dependencia futura de Reservas.
DROP TABLE catalogo_auditoria;
DROP TABLE catalogo_recursos;
DROP TABLE catalogo_tarifas;
DROP TABLE catalogo_publicaciones;
DROP FUNCTION catalogo_actualizar_busqueda();
DROP FUNCTION catalogo_validar_coherencia();
DROP TABLE catalogo_zonas;
DROP TABLE catalogo_categorias;
-- No se elimina unaccent: puede estar compartida por otros módulos.

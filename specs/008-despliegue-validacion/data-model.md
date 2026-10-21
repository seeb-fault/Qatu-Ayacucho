# Datos operativos

Sin tablas de negocio propias. Mantener inventario: versión/commit de imágenes, migraciones aplicadas, fecha y hash de backup DB/archivos, destino externo, resultado de verificación y ensayo de restore. Registro de secretos solo por nombre y responsable, nunca valor.

La coherencia de archivos/metadata debe comprobarse al restaurar. Pagos externos posteriores al punto de copia requieren consulta y conciliación; no recrear cobros para reconstruir historial.

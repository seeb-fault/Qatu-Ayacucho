DROP TABLE documentos_proveedor;
DROP TABLE verificaciones_proveedor;
ALTER TABLE proveedores DROP CONSTRAINT proveedores_estado_verificacion_check;
UPDATE proveedores SET estado_verificacion='no_solicitada';
ALTER TABLE proveedores ADD CONSTRAINT proveedores_estado_verificacion_check CHECK (estado_verificacion='no_solicitada');

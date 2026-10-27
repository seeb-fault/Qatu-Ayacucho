-- Rollback manual destructivo: elimina solicitudes y eventos propios de Reservas.
DROP TABLE reservas_outbox;
DROP TABLE reservas;

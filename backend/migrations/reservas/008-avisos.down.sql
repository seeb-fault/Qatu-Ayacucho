-- Borra los avisos ya entregados y su estado de lectura; sus eventos permanecen como enviados.
UPDATE reservas_outbox SET estado='PENDIENTE', ultimo_error=NULL WHERE ultimo_error='ANTERIOR_A_AVISOS';
DROP TABLE reservas_avisos;

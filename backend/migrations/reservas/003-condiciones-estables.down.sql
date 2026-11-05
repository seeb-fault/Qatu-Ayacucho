DROP TRIGGER reservas_acuerdo_estable ON reservas;
DROP FUNCTION conservar_acuerdo_reserva();
ALTER TABLE reservas DROP CONSTRAINT reservas_condiciones_check;

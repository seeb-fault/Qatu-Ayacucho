-- Coordinación por WhatsApp (010): número de Perú y consentimiento para mostrarlo a la contraparte de una reserva.
ALTER TABLE usuarios ADD COLUMN whatsapp text CHECK (whatsapp IS NULL OR whatsapp ~ '^\+519[0-9]{8}$');
ALTER TABLE usuarios ADD COLUMN whatsapp_visible boolean NOT NULL DEFAULT false;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_whatsapp_visible CHECK (NOT whatsapp_visible OR whatsapp IS NOT NULL);

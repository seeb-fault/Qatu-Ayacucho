ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_whatsapp_visible;
ALTER TABLE usuarios DROP COLUMN IF EXISTS whatsapp_visible;
ALTER TABLE usuarios DROP COLUMN IF EXISTS whatsapp;

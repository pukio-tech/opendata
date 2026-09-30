-- =====================================================================
-- 003 · Habilita el CRUD de empresas y museos desde el Control Center
-- Solo cambios aditivos. Idempotente.
--
--   npx prisma db execute --file prisma/sql/003_empresas_museos_origen.sql --schema prisma/schema.prisma
-- =====================================================================

BEGIN;

-- Origen del registro: 'importado' (pipe-empresas / scraping_museos) o 'manual' (panel).
ALTER TABLE empresas.empresas
  ADD COLUMN IF NOT EXISTS origen VARCHAR(20) NOT NULL DEFAULT 'importado';
CREATE INDEX IF NOT EXISTS idx_empresas_origen ON empresas.empresas (origen);

ALTER TABLE museos.museos
  ADD COLUMN IF NOT EXISTS origen VARCHAR(20) NOT NULL DEFAULT 'importado';
CREATE INDEX IF NOT EXISTS idx_museos_origen ON museos.museos (origen);

-- id_contribuyente no tiene default (viene del padrón, hoy < 1.4M).
-- Las empresas creadas en el panel usan un rango propio.
CREATE SEQUENCE IF NOT EXISTS empresas.empresas_manual_id_seq START 9000000000;

COMMIT;

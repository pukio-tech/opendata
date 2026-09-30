-- =====================================================================
-- 002 · Habilita la gestión de turismo.recursos desde el Control Center
-- Solo cambios aditivos. Idempotente (se puede ejecutar varias veces).
--
-- Ejecutar desde bk_opendata:
--   npx prisma db execute --file prisma/sql/002_recursos_admin_seo.sql --schema prisma/schema.prisma
-- =====================================================================

BEGIN;

-- 1. Columnas SEO + origen del registro.
--    El scraper de MINCETUR no las incluye en su ON CONFLICT DO UPDATE,
--    así que lo que se edite aquí no se pierde al re-scrapear.
ALTER TABLE turismo.recursos
  ADD COLUMN IF NOT EXISTS slug             VARCHAR(255),
  ADD COLUMN IF NOT EXISTS meta_title       VARCHAR(255),
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS keywords         TEXT,
  ADD COLUMN IF NOT EXISTS origen           VARCHAR(20) NOT NULL DEFAULT 'mincetur';

-- 2. Códigos para lugares creados manualmente, en un rango que no choca
--    con los códigos de ficha de MINCETUR (actualmente < 11 000).
CREATE SEQUENCE IF NOT EXISTS turismo.recursos_manual_codigo_seq START 900001;

-- 3. Generador de slug (misma lógica que el panel/backend) + código para unicidad.
CREATE OR REPLACE FUNCTION turismo.fn_slugify(txt TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT trim(both '-' FROM regexp_replace(public.unaccent(lower(coalesce(txt, ''))), '[^a-z0-9]+', '-', 'g'));
$$;

-- 4. Backfill de slugs sin tocar fecha_actualizacion.
ALTER TABLE turismo.recursos DISABLE TRIGGER trg_recursos_actualizacion;
UPDATE turismo.recursos
   SET slug = turismo.fn_slugify(nombre) || '-' || codigo
 WHERE slug IS NULL;
ALTER TABLE turismo.recursos ENABLE TRIGGER trg_recursos_actualizacion;

CREATE UNIQUE INDEX IF NOT EXISTS recursos_slug_key ON turismo.recursos (slug);
CREATE INDEX IF NOT EXISTS idx_recursos_origen ON turismo.recursos (origen);

-- 5. Nuevos registros insertados por el scraper reciben slug automáticamente.
CREATE OR REPLACE FUNCTION turismo.fn_trigger_recursos_slug()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := turismo.fn_slugify(NEW.nombre) || '-' || NEW.codigo;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recursos_slug ON turismo.recursos;
CREATE TRIGGER trg_recursos_slug
  BEFORE INSERT ON turismo.recursos
  FOR EACH ROW EXECUTE FUNCTION turismo.fn_trigger_recursos_slug();

COMMIT;

-- ============================================================================
-- BASE DE DATOS: OPENDATA EMPRESAS DEL PERÚ (SUNAT / REGISTRO EMPRESARIAL)
-- Esquema: empresas
-- Script DDL Completo: Tablas, Auditoría, Triggers, Índices Trigram (GIN)
-- y Vistas para consumo de API NestJS.
-- ============================================================================

-- 1. EXTENSIONES REQUERIDAS (En esquema public)
CREATE EXTENSION IF NOT EXISTS "unaccent" SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" SCHEMA public;

-- 2. CREACIÓN DEL ESQUEMA
CREATE SCHEMA IF NOT EXISTS empresas;
SET search_path TO empresas, public;

-- ============================================================================
-- FUNCIÓN GENÉRICA PARA ACTUALIZAR fecha_actualizacion EN CADA UPDATE
-- ============================================================================
CREATE OR REPLACE FUNCTION empresas.fn_trigger_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. TABLAS DE CATÁLOGO AUXILIARES
-- ============================================================================

-- Catálogo de Actividades Económicas (CIIU)
CREATE TABLE IF NOT EXISTS empresas.actividades_ciiu (
    codigo_ciiu VARCHAR(10) PRIMARY KEY,
    descripcion TEXT NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_actividades_ciiu_actualizacion ON empresas.actividades_ciiu;
CREATE TRIGGER trg_actividades_ciiu_actualizacion
BEFORE UPDATE ON empresas.actividades_ciiu
FOR EACH ROW EXECUTE FUNCTION empresas.fn_trigger_fecha_actualizacion();

-- Catálogo de Tipos de Contribuyente
CREATE TABLE IF NOT EXISTS empresas.tipos_contribuyente (
    id_tipo_contribuyente SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_tipos_contribuyente_actualizacion ON empresas.tipos_contribuyente;
CREATE TRIGGER trg_tipos_contribuyente_actualizacion
BEFORE UPDATE ON empresas.tipos_contribuyente
FOR EACH ROW EXECUTE FUNCTION empresas.fn_trigger_fecha_actualizacion();

-- ============================================================================
-- 2. TABLA PRINCIPAL: EMPRESAS / CONTRIBUYENTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS empresas.empresas (
    id_contribuyente BIGINT PRIMARY KEY,
    tipo_documento VARCHAR(10) NOT NULL DEFAULT '20',
    numero_documento VARCHAR(20) NOT NULL UNIQUE,       -- RUC (11 dígitos) o DNI
    razon_social VARCHAR(500) NOT NULL,
    nombre_comercial VARCHAR(500),
    
    -- Estados tributarios
    estado_contribuyente VARCHAR(50) DEFAULT 'ACTIVO',  -- ACTIVO, BAJA, etc.
    condicion_domicilio VARCHAR(50) DEFAULT 'HABIDO',    -- HABIDO, NO HABIDO, etc.
    tipo_contribuyente VARCHAR(150),                    -- SOCIEDAD ANONIMA CERRADA, etc.
    
    -- Actividad económica
    actividad_economica TEXT,
    codigo_ciiu VARCHAR(10),
    
    -- Fechas de registro
    fecha_inscripcion DATE,
    fecha_inicio_actividades DATE,
    fecha_baja DATE,
    
    -- URL amigable / SEO Slug
    url_empresa VARCHAR(500),
    
    -- Ubicación y Geografía
    codigo_ubigeo VARCHAR(6),
    direccion TEXT,
    departamento VARCHAR(100),
    provincia VARCHAR(100),
    distrito VARCHAR(100),
    
    -- Datos persona natural (para RUC 10)
    dni VARCHAR(15),
    nombres VARCHAR(150),
    apellido_paterno VARCHAR(150),
    apellido_materno VARCHAR(150),
    
    -- Contacto
    telefono VARCHAR(100),
    correo_electronico VARCHAR(255),
    sitio_web VARCHAR(500),
    
    -- Auditoría de la fuente original
    fecha_actualizacion_fuente TIMESTAMP WITH TIME ZONE,
    fecha_creacion_fuente TIMESTAMP WITH TIME ZONE,
    
    -- Control interno
    is_active BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_empresas_actualizacion ON empresas.empresas;
CREATE TRIGGER trg_empresas_actualizacion
BEFORE UPDATE ON empresas.empresas
FOR EACH ROW EXECUTE FUNCTION empresas.fn_trigger_fecha_actualizacion();

-- ============================================================================
-- 3. ÍNDICES DE ALTO RENDIMIENTO
-- ============================================================================

-- Búsqueda exacta por RUC / Documento
CREATE UNIQUE INDEX IF NOT EXISTS idx_empresas_numero_documento 
ON empresas.empresas(numero_documento);

-- Índices B-Tree para filtrado geográfico
CREATE INDEX IF NOT EXISTS idx_empresas_ubigeo 
ON empresas.empresas(codigo_ubigeo);

CREATE INDEX IF NOT EXISTS idx_empresas_departamento 
ON empresas.empresas(departamento);

CREATE INDEX IF NOT EXISTS idx_empresas_provincia 
ON empresas.empresas(provincia);

CREATE INDEX IF NOT EXISTS idx_empresas_distrito 
ON empresas.empresas(distrito);

-- Índices B-Tree para estados y clasificaciones
CREATE INDEX IF NOT EXISTS idx_empresas_estado 
ON empresas.empresas(estado_contribuyente);

CREATE INDEX IF NOT EXISTS idx_empresas_condicion 
ON empresas.empresas(condicion_domicilio);

CREATE INDEX IF NOT EXISTS idx_empresas_ciiu 
ON empresas.empresas(codigo_ciiu);

CREATE INDEX IF NOT EXISTS idx_empresas_tipo_contribuyente 
ON empresas.empresas(tipo_contribuyente);

CREATE INDEX IF NOT EXISTS idx_empresas_url 
ON empresas.empresas(url_empresa);

CREATE INDEX IF NOT EXISTS idx_empresas_fecha_inicio 
ON empresas.empresas(fecha_inicio_actividades);

-- Índices GIN Trigram para autocompletado y búsqueda de texto ultra-rápida (ILIKE / %)
CREATE INDEX IF NOT EXISTS idx_empresas_razon_social_trgm 
ON empresas.empresas USING gin (razon_social gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_empresas_nombre_comercial_trgm 
ON empresas.empresas USING gin (nombre_comercial gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_empresas_documento_trgm 
ON empresas.empresas USING gin (numero_documento gin_trgm_ops);

-- ============================================================================
-- 4. VISTAS PARA CONSULTAS RÁPIDAS Y APIS (NestJS)
-- ============================================================================

-- Vista de resumen para tarjetas y listados públicos
CREATE OR REPLACE VIEW empresas.vw_empresas_resumen AS
SELECT 
    e.id_contribuyente,
    e.numero_documento AS ruc,
    e.razon_social,
    COALESCE(NULLIF(e.nombre_comercial, '-'), e.razon_social) AS nombre_comercial_limpio,
    e.estado_contribuyente,
    e.condicion_domicilio,
    e.tipo_contribuyente,
    e.codigo_ciiu,
    e.actividad_economica,
    e.codigo_ubigeo,
    e.departamento,
    e.provincia,
    e.distrito,
    e.direccion,
    e.fecha_inicio_actividades,
    e.url_empresa
FROM empresas.empresas e
WHERE e.is_active = TRUE;

-- Vista estadística por departamento
CREATE OR REPLACE VIEW empresas.vw_estadisticas_departamento AS
SELECT 
    COALESCE(departamento, 'NO ESPECIFICADO') AS departamento,
    COUNT(*) AS total_empresas,
    COUNT(*) FILTER (WHERE estado_contribuyente = 'ACTIVO') AS total_activas,
    COUNT(*) FILTER (WHERE condicion_domicilio = 'HABIDO') AS total_habidas
FROM empresas.empresas
WHERE is_active = TRUE
GROUP BY departamento
ORDER BY total_empresas DESC;

-- Vista de top actividades económicas (CIIU)
CREATE OR REPLACE VIEW empresas.vw_top_actividades AS
SELECT 
    codigo_ciiu,
    actividad_economica,
    COUNT(*) AS total_empresas
FROM empresas.empresas
WHERE codigo_ciiu IS NOT NULL
GROUP BY codigo_ciiu, actividad_economica
ORDER BY total_empresas DESC;

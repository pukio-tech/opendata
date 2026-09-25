-- ============================================================================
-- BASE DE DATOS: OPENDATA MUSEOS DEL PERÚ (MINISTERIO DE CULTURA)
-- Esquema: museos
-- Script DDL Completo: Tablas, Auditoría, Triggers espaciales (PostGIS),
-- Índices Trigram (GIN) / B-Tree y Vistas JSON / GeoJSON.
-- Fuente Oficial: https://museos.cultura.pe/museos
-- ============================================================================

-- 1. EXTENSIONES REQUERIDAS (En esquema public)
CREATE EXTENSION IF NOT EXISTS "unaccent" SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "postgis" SCHEMA public;

-- 2. CREACIÓN DEL ESQUEMA
CREATE SCHEMA IF NOT EXISTS museos;
SET search_path TO museos, public;

-- ============================================================================
-- FUNCIONES Y TRIGGERS DE AUDITORÍA Y GEOMETRÍA
-- ============================================================================

-- Función genérica para actualizar timestamp fecha_actualizacion
CREATE OR REPLACE FUNCTION museos.fn_trigger_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función automática para sincronizar la columna geométrica PostGIS a partir de latitud y longitud
CREATE OR REPLACE FUNCTION museos.fn_trigger_geom_museo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.longitud IS NOT NULL AND NEW.latitud IS NOT NULL AND 
       NEW.longitud >= -180 AND NEW.longitud <= 180 AND 
       NEW.latitud >= -90 AND NEW.latitud <= 90 THEN
        NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitud, NEW.latitud), 4326);
    ELSE
        NEW.geom = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. TABLAS DE CATÁLOGO AUXILIARES
-- ============================================================================

-- Catálogo de Servicios / Facilidades disponibles en museos
CREATE TABLE IF NOT EXISTS museos.servicios_catalogo (
    id_servicio SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    icono_url TEXT,
    descripcion TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_servicios_catalogo_actualizacion ON museos.servicios_catalogo;
CREATE TRIGGER trg_servicios_catalogo_actualizacion
BEFORE UPDATE ON museos.servicios_catalogo
FOR EACH ROW EXECUTE FUNCTION museos.fn_trigger_fecha_actualizacion();

-- ============================================================================
-- 2. TABLA PRINCIPAL: MUSEOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS museos.museos (
    id_museo SERIAL PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(300) NOT NULL,
    categoria VARCHAR(100) DEFAULT 'Ministerio de Cultura', -- 'Ministerio de Cultura' | 'Públicos y Privados'
    tipo_museo VARCHAR(100),                                -- Tipo de clasificación
    administracion VARCHAR(255),                            -- 'Ministerio de Cultura', 'Municipalidad...', etc.
    estado VARCHAR(50) DEFAULT 'Abierto',                  -- 'Abierto', 'Cerrado', 'En mantenimiento'
    
    -- Ubicación y Georreferenciación
    ubigeo_texto VARCHAR(255),                              -- Texto original: 'LIMA - LIMA - PUEBLO LIBRE'
    departamento VARCHAR(100),
    provincia VARCHAR(100),
    distrito VARCHAR(100),
    ubigeo VARCHAR(6),
    direccion TEXT,
    latitud NUMERIC(11, 8),
    longitud NUMERIC(11, 8),
    geom geometry(Point, 4326),

    -- Horarios y Tarifas
    horario_atencion TEXT,
    tarifario_descripcion TEXT,                             -- Texto normativo/exoneraciones
    
    -- Contacto y Canales Oficiales
    telefono VARCHAR(150),
    email VARCHAR(150),
    web_url TEXT,
    recorrido_virtual_url TEXT,
    coleccion_virtual_url TEXT,
    facebook_url TEXT,
    instagram_url TEXT,
    twitter_url TEXT,
    youtube_url TEXT,
    tiktok_url TEXT,

    -- Enlaces de Imágenes (Solo URLs)
    imagen_portada TEXT,
    imagen_tarjeta TEXT,

    -- Reseña y Descripción
    descripcion TEXT,

    -- Estructuras JSON complementarias (Solo URLs y metadatos)
    servicios_json JSONB DEFAULT '[]'::jsonb,
    tarifas_json JSONB DEFAULT '[]'::jsonb,
    galeria_json JSONB DEFAULT '[]'::jsonb,               -- Array de URLs: [{"url": "https://...", "alt": "..."}]
    raw_data JSONB DEFAULT '{}'::jsonb,

    -- Auditoría y Control
    url_origen TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para fecha de actualización
DROP TRIGGER IF EXISTS trg_museos_actualizacion ON museos.museos;
CREATE TRIGGER trg_museos_actualizacion
BEFORE UPDATE ON museos.museos
FOR EACH ROW EXECUTE FUNCTION museos.fn_trigger_fecha_actualizacion();

-- Trigger para actualización automática de geometría espacial
DROP TRIGGER IF EXISTS trg_museos_geom ON museos.museos;
CREATE TRIGGER trg_museos_geom
BEFORE INSERT OR UPDATE OF latitud, longitud ON museos.museos
FOR EACH ROW EXECUTE FUNCTION museos.fn_trigger_geom_museo();

-- ============================================================================
-- 3. TABLAS HIJAS / NORMALIZADAS
-- ============================================================================

-- Relación N a M: Museo <-> Servicios
CREATE TABLE IF NOT EXISTS museos.museo_servicios (
    id_museo_servicio SERIAL PRIMARY KEY,
    id_museo INT NOT NULL REFERENCES museos.museos(id_museo) ON DELETE CASCADE,
    id_servicio INT NOT NULL REFERENCES museos.servicios_catalogo(id_servicio) ON DELETE CASCADE,
    nombre_servicio VARCHAR(150),
    icono_url TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_museo_servicio UNIQUE (id_museo, id_servicio)
);

-- Desglose Normalizado de Tarifas por Museo
CREATE TABLE IF NOT EXISTS museos.museo_tarifas (
    id_tarifa SERIAL PRIMARY KEY,
    id_museo INT NOT NULL REFERENCES museos.museos(id_museo) ON DELETE CASCADE,
    tipo VARCHAR(150) NOT NULL,                           -- 'Adultos', 'Estudiantes', 'Gratuito', etc.
    descripcion TEXT,                                     -- Texto completo original
    precio NUMERIC(10, 2) DEFAULT 0.00,
    moneda VARCHAR(10) DEFAULT 'PEN',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Galería de Enlaces de Fotos por Museo (Solo URLs)
CREATE TABLE IF NOT EXISTS museos.museo_fotos (
    id_foto SERIAL PRIMARY KEY,
    id_museo INT NOT NULL REFERENCES museos.museos(id_museo) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt VARCHAR(300),
    tipo VARCHAR(50) DEFAULT 'galeria',                   -- 'portada', 'tarjeta', 'galeria'
    orden INT DEFAULT 0,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. ÍNDICES DE RENDIMIENTO Y BÚSQUEDA
-- ============================================================================

-- Índices B-Tree
CREATE INDEX IF NOT EXISTS idx_museos_slug ON museos.museos(slug);
CREATE INDEX IF NOT EXISTS idx_museos_departamento ON museos.museos(departamento);
CREATE INDEX IF NOT EXISTS idx_museos_provincia ON museos.museos(provincia);
CREATE INDEX IF NOT EXISTS idx_museos_distrito ON museos.museos(distrito);
CREATE INDEX IF NOT EXISTS idx_museos_estado ON museos.museos(estado);
CREATE INDEX IF NOT EXISTS idx_museos_categoria ON museos.museos(categoria);
CREATE INDEX IF NOT EXISTS idx_museos_administracion ON museos.museos(administracion);
CREATE INDEX IF NOT EXISTS idx_museos_is_active ON museos.museos(is_active);

-- Índices Espaciales PostGIS (GIST)
CREATE INDEX IF NOT EXISTS idx_museos_geom ON museos.museos USING GIST (geom);

-- Índices Trigram (GIN) para Búsqueda Difusa (Fuzzy Search / Autocomplete)
CREATE INDEX IF NOT EXISTS idx_museos_nombre_trgm ON museos.museos USING GIN (nombre gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_museos_departamento_trgm ON museos.museos USING GIN (departamento gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_museos_distrito_trgm ON museos.museos USING GIN (distrito gin_trgm_ops);

-- Índices Full-Text Search en Español
CREATE INDEX IF NOT EXISTS idx_museos_fts ON museos.museos USING GIN (
    to_tsvector('spanish', COALESCE(nombre, '') || ' ' || COALESCE(descripcion, '') || ' ' || COALESCE(direccion, ''))
);

-- Índices JSONB (GIN)
CREATE INDEX IF NOT EXISTS idx_museos_servicios_json ON museos.museos USING GIN (servicios_json);
CREATE INDEX IF NOT EXISTS idx_museos_tarifas_json ON museos.museos USING GIN (tarifas_json);
CREATE INDEX IF NOT EXISTS idx_museos_galeria_json ON museos.museos USING GIN (galeria_json);

-- Índices para Tablas Hijas
CREATE INDEX IF NOT EXISTS idx_museo_servicios_museo ON museos.museo_servicios(id_museo);
CREATE INDEX IF NOT EXISTS idx_museo_servicios_servicio ON museos.museo_servicios(id_servicio);
CREATE INDEX IF NOT EXISTS idx_museo_tarifas_museo ON museos.museo_tarifas(id_museo);
CREATE INDEX IF NOT EXISTS idx_museo_fotos_museo ON museos.museo_fotos(id_museo);

-- ============================================================================
-- 5. VISTAS PARA CONSUMO DE API (NestJS / Frontend)
-- ============================================================================

-- Vista 1: Listado Resumido de Museos
CREATE OR REPLACE VIEW museos.v_museos_listado AS
SELECT 
    m.id_museo,
    m.slug,
    m.nombre,
    m.categoria,
    m.administracion,
    m.estado,
    m.departamento,
    m.provincia,
    m.distrito,
    m.direccion,
    m.latitud,
    m.longitud,
    m.horario_atencion,
    m.imagen_portada,
    m.imagen_tarjeta,
    m.recorrido_virtual_url,
    m.servicios_json,
    jsonb_array_length(m.galeria_json) AS total_fotos,
    m.fecha_actualizacion
FROM museos.museos m
WHERE m.is_active = TRUE
ORDER BY m.departamento ASC, m.nombre ASC;

-- Vista 2: GeoJSON FeatureCollection para Mapas Interactivos (Mapbox / Leaflet)
CREATE OR REPLACE VIEW museos.v_museos_geojson AS
SELECT json_build_object(
    'type', 'FeatureCollection',
    'features', COALESCE(json_agg(
        json_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(m.geom)::json,
            'properties', json_build_object(
                'id_museo', m.id_museo,
                'slug', m.slug,
                'nombre', m.nombre,
                'categoria', m.categoria,
                'administracion', m.administracion,
                'estado', m.estado,
                'departamento', m.departamento,
                'provincia', m.provincia,
                'distrito', m.distrito,
                'direccion', m.direccion,
                'horario', m.horario_atencion,
                'imagen_portada', m.imagen_portada,
                'recorrido_virtual_url', m.recorrido_virtual_url,
                'servicios', m.servicios_json
            )
        )
    ), '[]'::json)
) AS geojson
FROM museos.museos m
WHERE m.is_active = TRUE AND m.geom IS NOT NULL;

-- Vista 3: Estadísticas por Departamento y Categoría
CREATE OR REPLACE VIEW museos.v_estadisticas_departamento AS
SELECT 
    COALESCE(m.departamento, 'SIN ESPECIFICAR') AS departamento,
    COUNT(*) AS total_museos,
    COUNT(*) FILTER (WHERE m.estado ILIKE '%Abierto%') AS total_abiertos,
    COUNT(*) FILTER (WHERE m.categoria ILIKE '%Ministerio de Cultura%') AS total_mincultura,
    COUNT(*) FILTER (WHERE m.recorrido_virtual_url IS NOT NULL AND m.recorrido_virtual_url <> '') AS total_virtuales,
    COUNT(*) FILTER (WHERE m.geom IS NOT NULL) AS total_georreferenciados
FROM museos.museos m
WHERE m.is_active = TRUE
GROUP BY m.departamento
ORDER BY total_museos DESC;

-- ============================================================================
-- BASE DE DATOS: OPENDATA MINCETUR (RECURSOS TURÍSTICOS DEL PERÚ)
-- Esquema: turismo
-- Script DDL Completo: Tablas, Auditoría (fecha_creacion/actualizacion),
-- Triggers automáticos, Índices de alto rendimiento, Procedimiento UPSERT y Vistas JSON.
-- ============================================================================

-- 1. EXTENSIONES REQUERIDAS (En esquema public)
CREATE EXTENSION IF NOT EXISTS "unaccent" SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "postgis" SCHEMA public;

-- 2. CREACIÓN DEL ESQUEMA
CREATE SCHEMA IF NOT EXISTS turismo;
SET search_path TO turismo, public;

-- ============================================================================
-- FUNCIÓN GENÉRICA PARA ACTUALIZAR fecha_actualizacion EN CADA UPDATE
-- ============================================================================
CREATE OR REPLACE FUNCTION turismo.fn_trigger_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. CATÁLOGOS GEOGRÁFICOS / UBIGEO
-- ============================================================================

CREATE TABLE IF NOT EXISTS turismo.departamentos (
    id_departamento VARCHAR(2) PRIMARY KEY, -- '01'..'25'
    nombre VARCHAR(100) NOT NULL UNIQUE,
    id_region VARCHAR(10),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_departamentos_actualizacion ON turismo.departamentos;
CREATE TRIGGER trg_departamentos_actualizacion
BEFORE UPDATE ON turismo.departamentos
FOR EACH ROW EXECUTE FUNCTION turismo.fn_trigger_fecha_actualizacion();

CREATE TABLE IF NOT EXISTS turismo.provincias (
    id_provincia VARCHAR(4) PRIMARY KEY, -- '0101'..'2504'
    id_departamento VARCHAR(2) NOT NULL REFERENCES turismo.departamentos(id_departamento) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_provincias_nombre_dpto UNIQUE (id_departamento, nombre)
);

DROP TRIGGER IF EXISTS trg_provincias_actualizacion ON turismo.provincias;
CREATE TRIGGER trg_provincias_actualizacion
BEFORE UPDATE ON turismo.provincias
FOR EACH ROW EXECUTE FUNCTION turismo.fn_trigger_fecha_actualizacion();

CREATE TABLE IF NOT EXISTS turismo.distritos (
    ubigeo VARCHAR(6) PRIMARY KEY, -- '010101'..'250401'
    id_provincia VARCHAR(4) NOT NULL REFERENCES turismo.provincias(id_provincia) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_distritos_actualizacion ON turismo.distritos;
CREATE TRIGGER trg_distritos_actualizacion
BEFORE UPDATE ON turismo.distritos
FOR EACH ROW EXECUTE FUNCTION turismo.fn_trigger_fecha_actualizacion();

-- ============================================================================
-- 2. CATÁLOGOS TURÍSTICOS (Categorías y Actividades)
-- ============================================================================

CREATE TABLE IF NOT EXISTS turismo.categorias (
    id_categoria INT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_categorias_actualizacion ON turismo.categorias;
CREATE TRIGGER trg_categorias_actualizacion
BEFORE UPDATE ON turismo.categorias
FOR EACH ROW EXECUTE FUNCTION turismo.fn_trigger_fecha_actualizacion();

CREATE TABLE IF NOT EXISTS turismo.tipos_categoria (
    id_tipo INT PRIMARY KEY,
    id_categoria INT NOT NULL REFERENCES turismo.categorias(id_categoria) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_tipos_categoria_actualizacion ON turismo.tipos_categoria;
CREATE TRIGGER trg_tipos_categoria_actualizacion
BEFORE UPDATE ON turismo.tipos_categoria
FOR EACH ROW EXECUTE FUNCTION turismo.fn_trigger_fecha_actualizacion();

CREATE TABLE IF NOT EXISTS turismo.subtipos_categoria (
    id_subtipo INT PRIMARY KEY,
    id_tipo INT NOT NULL REFERENCES turismo.tipos_categoria(id_tipo) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_subtipos_categoria_actualizacion ON turismo.subtipos_categoria;
CREATE TRIGGER trg_subtipos_categoria_actualizacion
BEFORE UPDATE ON turismo.subtipos_categoria
FOR EACH ROW EXECUTE FUNCTION turismo.fn_trigger_fecha_actualizacion();

CREATE TABLE IF NOT EXISTS turismo.actividades (
    id_actividad INT PRIMARY KEY,
    codigo VARCHAR(50),
    nombre VARCHAR(150) NOT NULL,
    imagen VARCHAR(500),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_actividades_actualizacion ON turismo.actividades;
CREATE TRIGGER trg_actividades_actualizacion
BEFORE UPDATE ON turismo.actividades
FOR EACH ROW EXECUTE FUNCTION turismo.fn_trigger_fecha_actualizacion();

CREATE TABLE IF NOT EXISTS turismo.subactividades (
    id_subactividad INT PRIMARY KEY,
    id_actividad INT NOT NULL REFERENCES turismo.actividades(id_actividad) ON DELETE CASCADE,
    codigo VARCHAR(50),
    nombre VARCHAR(150) NOT NULL,
    codigo_tipo VARCHAR(50),
    imagen VARCHAR(500),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_subactividades_actualizacion ON turismo.subactividades;
CREATE TRIGGER trg_subactividades_actualizacion
BEFORE UPDATE ON turismo.subactividades
FOR EACH ROW EXECUTE FUNCTION turismo.fn_trigger_fecha_actualizacion();

-- Control de fichas dadas de baja / retiradas por MINCETUR
CREATE TABLE IF NOT EXISTS turismo.fichas_offline (
    codigo INT PRIMARY KEY,
    motivo VARCHAR(255) DEFAULT 'Ficha no disponible o retirada del inventario oficial',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_fichas_offline_actualizacion ON turismo.fichas_offline;
CREATE TRIGGER trg_fichas_offline_actualizacion
BEFORE UPDATE ON turismo.fichas_offline
FOR EACH ROW EXECUTE FUNCTION turismo.fn_trigger_fecha_actualizacion();

-- ============================================================================
-- 3. TABLA PRINCIPAL: RECURSOS TURÍSTICOS (FICHAS MAESTRAS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS turismo.recursos (
    codigo INT PRIMARY KEY,                       -- cod_ficha / cod_reg oficial MINCETUR
    nombre VARCHAR(255) NOT NULL,
    
    -- Clasificación
    id_categoria INT REFERENCES turismo.categorias(id_categoria) ON DELETE SET NULL,
    id_tipo INT REFERENCES turismo.tipos_categoria(id_tipo) ON DELETE SET NULL,
    id_subtipo INT REFERENCES turismo.subtipos_categoria(id_subtipo) ON DELETE SET NULL,
    categoria_nombre VARCHAR(150),
    tipo_categoria_nombre VARCHAR(150),
    subtipo_categoria_nombre VARCHAR(150),
    
    jerarquia VARCHAR(50),                       -- 'Jerarquía 1', 'Jerarquía 2', 'Jerarquía 3', 'Jerarquía 4'
    altitud VARCHAR(50),                         -- ej: '3827 m.s.n.m.'

    -- Ubicación y Geopolítica
    ubigeo VARCHAR(6) REFERENCES turismo.distritos(ubigeo) ON DELETE SET NULL,
    departamento VARCHAR(100) NOT NULL,
    provincia VARCHAR(100) NOT NULL,
    distrito VARCHAR(100) NOT NULL,

    -- Coordenadas Geográficas (EPSG:4326 WGS84 para OpenStreetMap / Leaflet)
    latitud NUMERIC(10, 7),
    longitud NUMERIC(10, 7),
    geom public.GEOMETRY(Point, 4326) GENERATED ALWAYS AS (
        CASE 
            WHEN longitud IS NOT NULL AND latitud IS NOT NULL 
            THEN public.ST_SetSRID(public.ST_MakePoint(longitud, latitud), 4326)
            ELSE NULL 
        END
    ) STORED,

    -- Multimedia Principal y Enlaces
    foto_principal TEXT,
    url_ficha TEXT,
    youtube_url TEXT,
    youtube_id VARCHAR(50),

    -- Contenidos Descriptivos
    descripcion TEXT,
    particularidades TEXT,
    estado_actual TEXT,
    observaciones TEXT,

    -- Control de Estado y Auditoría
    is_active BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_recursos_actualizacion ON turismo.recursos;
CREATE TRIGGER trg_recursos_actualizacion
BEFORE UPDATE ON turismo.recursos
FOR EACH ROW EXECUTE FUNCTION turismo.fn_trigger_fecha_actualizacion();

-- ============================================================================
-- 4. TABLAS HIJAS: DETALLES DE LA FICHA TÉCNICA
-- ============================================================================

-- 4.1. Galería de Fotos Oficiales
CREATE TABLE IF NOT EXISTS turismo.ficha_fotos (
    id BIGSERIAL PRIMARY KEY,
    recurso_codigo INT NOT NULL REFERENCES turismo.recursos(codigo) ON DELETE CASCADE,
    url_foto TEXT NOT NULL,
    es_principal BOOLEAN DEFAULT FALSE,
    orden INT DEFAULT 0,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_ficha_fotos UNIQUE (recurso_codigo, url_foto)
);

DROP TRIGGER IF EXISTS trg_ficha_fotos_actualizacion ON turismo.ficha_fotos;
CREATE TRIGGER trg_ficha_fotos_actualizacion
BEFORE UPDATE ON turismo.ficha_fotos
FOR EACH ROW EXECUTE FUNCTION turismo.fn_trigger_fecha_actualizacion();

-- 4.2. Actividades Desarrolladas / Permitidas
CREATE TABLE IF NOT EXISTS turismo.ficha_actividades (
    id BIGSERIAL PRIMARY KEY,
    recurso_codigo INT NOT NULL REFERENCES turismo.recursos(codigo) ON DELETE CASCADE,
    id_actividad INT REFERENCES turismo.actividades(id_actividad) ON DELETE SET NULL,
    id_subactividad INT REFERENCES turismo.subactividades(id_subactividad) ON DELETE SET NULL,
    actividad VARCHAR(150) NOT NULL,
    tipo VARCHAR(150) NOT NULL DEFAULT '',
    observacion TEXT,
    icono_url TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_ficha_actividades UNIQUE (recurso_codigo, actividad, tipo)
);

DROP TRIGGER IF EXISTS trg_ficha_actividades_actualizacion ON turismo.ficha_actividades;
CREATE TRIGGER trg_ficha_actividades_actualizacion
BEFORE UPDATE ON turismo.ficha_actividades
FOR EACH ROW EXECUTE FUNCTION turismo.fn_trigger_fecha_actualizacion();

-- 4.3. Rutas y Medios de Acceso
CREATE TABLE IF NOT EXISTS turismo.ficha_rutas (
    id BIGSERIAL PRIMARY KEY,
    recurso_codigo INT NOT NULL REFERENCES turismo.recursos(codigo) ON DELETE CASCADE,
    recorrido VARCHAR(255),
    tramo VARCHAR(255),
    detalle TEXT,
    tipo_acceso VARCHAR(150),
    medio_transporte VARCHAR(150),
    tipo_via VARCHAR(150),
    distancia_tiempo VARCHAR(150),
    orden INT DEFAULT 0,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_ficha_rutas UNIQUE (recurso_codigo, orden, recorrido, tramo)
);

DROP TRIGGER IF EXISTS trg_ficha_rutas_actualizacion ON turismo.ficha_rutas;
CREATE TRIGGER trg_ficha_rutas_actualizacion
BEFORE UPDATE ON turismo.ficha_rutas
FOR EACH ROW EXECUTE FUNCTION turismo.fn_trigger_fecha_actualizacion();

-- 4.4. Época Propicia de Visita y Horarios
CREATE TABLE IF NOT EXISTS turismo.ficha_epocas (
    id BIGSERIAL PRIMARY KEY,
    recurso_codigo INT NOT NULL REFERENCES turismo.recursos(codigo) ON DELETE CASCADE,
    epoca VARCHAR(255) NOT NULL,
    especificacion TEXT,
    horario TEXT NOT NULL DEFAULT '',
    observaciones TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_ficha_epocas UNIQUE (recurso_codigo, epoca, horario)
);

DROP TRIGGER IF EXISTS trg_ficha_epocas_actualizacion ON turismo.ficha_epocas;
CREATE TRIGGER trg_ficha_epocas_actualizacion
BEFORE UPDATE ON turismo.ficha_epocas
FOR EACH ROW EXECUTE FUNCTION turismo.fn_trigger_fecha_actualizacion();

-- 4.5. Tarifas y Modalidades de Ingreso
CREATE TABLE IF NOT EXISTS turismo.ficha_tarifas (
    id BIGSERIAL PRIMARY KEY,
    recurso_codigo INT NOT NULL REFERENCES turismo.recursos(codigo) ON DELETE CASCADE,
    tipo VARCHAR(150) NOT NULL,
    observaciones TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_ficha_tarifas UNIQUE (recurso_codigo, tipo)
);

DROP TRIGGER IF EXISTS trg_ficha_tarifas_actualizacion ON turismo.ficha_tarifas;
CREATE TRIGGER trg_ficha_tarifas_actualizacion
BEFORE UPDATE ON turismo.ficha_tarifas
FOR EACH ROW EXECUTE FUNCTION turismo.fn_trigger_fecha_actualizacion();

-- 4.6. Servicios Turísticos Actuales (Dentro / Fuera)
CREATE TABLE IF NOT EXISTS turismo.ficha_servicios (
    id BIGSERIAL PRIMARY KEY,
    recurso_codigo INT NOT NULL REFERENCES turismo.recursos(codigo) ON DELETE CASCADE,
    ubicacion VARCHAR(20) CHECK (ubicacion IN ('dentro', 'fuera')),
    instalacion VARCHAR(255),
    servicio VARCHAR(255) NOT NULL DEFAULT '',
    tipo_servicio VARCHAR(255) NOT NULL DEFAULT '',
    observacion TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_ficha_servicios UNIQUE (recurso_codigo, ubicacion, servicio, tipo_servicio)
);

DROP TRIGGER IF EXISTS trg_ficha_servicios_actualizacion ON turismo.ficha_servicios;
CREATE TRIGGER trg_ficha_servicios_actualizacion
BEFORE UPDATE ON turismo.ficha_servicios
FOR EACH ROW EXECUTE FUNCTION turismo.fn_trigger_fecha_actualizacion();

-- 4.7. Secciones Descriptivas (Acordeón HTML)
CREATE TABLE IF NOT EXISTS turismo.ficha_secciones (
    id BIGSERIAL PRIMARY KEY,
    recurso_codigo INT NOT NULL REFERENCES turismo.recursos(codigo) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    contenido_texto TEXT,
    contenido_html TEXT,
    orden INT DEFAULT 0,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_ficha_secciones UNIQUE (recurso_codigo, titulo)
);

DROP TRIGGER IF EXISTS trg_ficha_secciones_actualizacion ON turismo.ficha_secciones;
CREATE TRIGGER trg_ficha_secciones_actualizacion
BEFORE UPDATE ON turismo.ficha_secciones
FOR EACH ROW EXECUTE FUNCTION turismo.fn_trigger_fecha_actualizacion();

-- ============================================================================
-- 5. ÍNDICES DE ALTO RENDIMIENTO (OPTIMIZACIÓN PARA < 5ms)
-- ============================================================================

-- Wrapper IMMUTABLE para unaccent (Requerido obligatoriamente por PostgreSQL para índices)
CREATE OR REPLACE FUNCTION turismo.f_unaccent(text)
RETURNS text AS $$
    SELECT public.unaccent('public.unaccent', $1)
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

-- B-Tree para Llaves Foráneas y Filtros comunes
CREATE INDEX IF NOT EXISTS idx_recursos_ubigeo ON turismo.recursos(ubigeo);
CREATE INDEX IF NOT EXISTS idx_recursos_departamento ON turismo.recursos(departamento);
CREATE INDEX IF NOT EXISTS idx_recursos_categoria ON turismo.recursos(id_categoria, id_tipo, id_subtipo);
CREATE INDEX IF NOT EXISTS idx_recursos_jerarquia ON turismo.recursos(jerarquia);
CREATE INDEX IF NOT EXISTS idx_recursos_is_active ON turismo.recursos(is_active);
CREATE INDEX IF NOT EXISTS idx_recursos_actualizacion ON turismo.recursos(fecha_actualizacion);

-- GIN Trigram para Full Text Search en Español sin distinción de mayúsculas ni tildes
CREATE INDEX IF NOT EXISTS idx_recursos_search_trgm ON turismo.recursos USING GIN (
    (turismo.f_unaccent(lower(nombre || ' ' || departamento || ' ' || provincia || ' ' || distrito))) public.gin_trgm_ops
);

-- GiST Espacial para OpenStreetMap / Leaflet (Bounding Box, cercanía y Mapas)
CREATE INDEX IF NOT EXISTS idx_recursos_geom ON turismo.recursos USING GIST (geom);

-- Índices en tablas hijas
CREATE INDEX IF NOT EXISTS idx_ficha_fotos_rec ON turismo.ficha_fotos(recurso_codigo);
CREATE INDEX IF NOT EXISTS idx_ficha_actividades_rec ON turismo.ficha_actividades(recurso_codigo);
CREATE INDEX IF NOT EXISTS idx_ficha_rutas_rec ON turismo.ficha_rutas(recurso_codigo);
CREATE INDEX IF NOT EXISTS idx_ficha_epocas_rec ON turismo.ficha_epocas(recurso_codigo);
CREATE INDEX IF NOT EXISTS idx_ficha_servicios_rec ON turismo.ficha_servicios(recurso_codigo);
CREATE INDEX IF NOT EXISTS idx_ficha_secciones_rec ON turismo.ficha_secciones(recurso_codigo);

-- ============================================================================
-- 6. PROCEDIMIENTO PARA GUARDAR O ACTUALIZAR UNA FICHA COMPLETA (UPSERT ATÓMICO)
-- ============================================================================
-- Permite al scraper insertar o actualizar una ficha técnica en una sola llamada transaccional

CREATE OR REPLACE FUNCTION turismo.sp_guardar_ficha_tecnica(p_ficha JSONB)
RETURNS VOID AS $$
DECLARE
    v_codigo INT;
    v_nombre TEXT;
    v_dpto TEXT;
    v_prov TEXT;
    v_dist TEXT;
    v_cat TEXT;
    v_tipo TEXT;
    v_subtipo TEXT;
    v_jerarquia TEXT;
    v_altitud TEXT;
    v_lat NUMERIC(10, 7);
    v_lon NUMERIC(10, 7);
    v_foto_princ TEXT;
    v_url_ficha TEXT;
    v_youtube_url TEXT;
    v_youtube_id TEXT;
    v_desc TEXT;
    v_part TEXT;
    v_estado TEXT;
    v_obs TEXT;
    v_id_cat INT;
    v_id_tipo INT;
    v_id_subtipo INT;
    v_id_act INT;
    v_id_subact INT;
    v_elem JSONB;
    v_elem_txt TEXT;
    v_idx INT;
BEGIN
    v_codigo := (p_ficha->>'cod_ficha')::INT;
    IF v_codigo IS NULL OR v_codigo <= 0 THEN
        RETURN;
    END IF;

    v_nombre := TRIM(p_ficha->>'nombre');
    IF v_nombre IS NULL OR v_nombre = '' THEN
        RETURN;
    END IF;

    v_dpto := UPPER(TRIM(COALESCE(p_ficha->>'departamento', '')));
    v_prov := UPPER(TRIM(COALESCE(p_ficha->>'provincia', '')));
    v_dist := UPPER(TRIM(COALESCE(p_ficha->>'distrito', '')));
    
    v_cat := UPPER(TRIM(REGEXP_REPLACE(COALESCE(p_ficha->>'categoria', ''), '^\d+\.\s*', '')));
    v_tipo := UPPER(TRIM(COALESCE(p_ficha->>'tipo', '')));
    v_subtipo := UPPER(TRIM(COALESCE(p_ficha->>'subtipo', '')));
    v_jerarquia := TRIM(COALESCE(p_ficha->>'jerarquia', ''));
    v_altitud := TRIM(COALESCE(p_ficha->>'altitud', ''));

    v_lat := (p_ficha->'coordenadas'->>'latitud')::NUMERIC;
    v_lon := (p_ficha->'coordenadas'->>'longitud')::NUMERIC;
    IF v_lat IS NULL THEN v_lat := (p_ficha->>'y')::NUMERIC; END IF;
    IF v_lon IS NULL THEN v_lon := (p_ficha->>'x')::NUMERIC; END IF;

    v_foto_princ := p_ficha->>'foto_principal';
    v_url_ficha := COALESCE(p_ficha->>'url_ficha', 'https://consultasenlinea.mincetur.gob.pe/fichaInventario/index.aspx?cod_Ficha=' || v_codigo);
    v_youtube_url := p_ficha->>'youtube_url';
    v_youtube_id := p_ficha->>'youtube_id';

    v_desc := COALESCE(p_ficha->>'descripcion', '');
    v_part := COALESCE(p_ficha->>'particularidades', '');
    v_estado := COALESCE(p_ficha->>'estado_actual', '');
    v_obs := COALESCE(p_ficha->>'observaciones', '');

    -- Resolver IDs de catálogos con tolerancia a tildes, mayúsculas y prefijos ("A. ", "2. ", etc.)
    SELECT id_categoria INTO v_id_cat 
    FROM turismo.categorias 
    WHERE public.unaccent(lower(nombre)) = public.unaccent(lower(v_cat))
       OR public.unaccent(lower(v_cat)) LIKE '%' || public.unaccent(lower(nombre)) || '%'
       OR public.unaccent(lower(nombre)) LIKE '%' || public.unaccent(lower(v_cat)) || '%'
    LIMIT 1;

    SELECT id_tipo INTO v_id_tipo 
    FROM turismo.tipos_categoria 
    WHERE (v_id_cat IS NULL OR id_categoria = v_id_cat)
      AND (
          public.unaccent(lower(nombre)) = public.unaccent(lower(v_tipo))
          OR public.unaccent(lower(v_tipo)) LIKE '%' || public.unaccent(lower(nombre)) || '%'
          OR public.unaccent(lower(nombre)) LIKE '%' || public.unaccent(lower(v_tipo)) || '%'
      )
    LIMIT 1;

    SELECT id_subtipo INTO v_id_subtipo 
    FROM turismo.subtipos_categoria 
    WHERE (v_id_tipo IS NULL OR id_tipo = v_id_tipo)
      AND (
          public.unaccent(lower(nombre)) = public.unaccent(lower(v_subtipo))
          OR public.unaccent(lower(v_subtipo)) LIKE '%' || public.unaccent(lower(nombre)) || '%'
          OR public.unaccent(lower(nombre)) LIKE '%' || public.unaccent(lower(v_subtipo)) || '%'
      )
    LIMIT 1;

    -- 1. UPSERT EN turismo.recursos
    INSERT INTO turismo.recursos (
        codigo, nombre, id_categoria, id_tipo, id_subtipo,
        categoria_nombre, tipo_categoria_nombre, subtipo_categoria_nombre,
        jerarquia, altitud, departamento, provincia, distrito,
        latitud, longitud, foto_principal, url_ficha,
        youtube_url, youtube_id, descripcion, particularidades,
        estado_actual, observaciones, is_active
    ) VALUES (
        v_codigo, v_nombre, v_id_cat, v_id_tipo, v_id_subtipo,
        v_cat, v_tipo, v_subtipo,
        v_jerarquia, v_altitud, v_dpto, v_prov, v_dist,
        v_lat, v_lon, v_foto_princ, v_url_ficha,
        v_youtube_url, v_youtube_id, v_desc, v_part,
        v_estado, v_obs, TRUE
    )
    ON CONFLICT (codigo) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        id_categoria = COALESCE(EXCLUDED.id_categoria, turismo.recursos.id_categoria),
        id_tipo = COALESCE(EXCLUDED.id_tipo, turismo.recursos.id_tipo),
        id_subtipo = COALESCE(EXCLUDED.id_subtipo, turismo.recursos.id_subtipo),
        categoria_nombre = EXCLUDED.categoria_nombre,
        tipo_categoria_nombre = EXCLUDED.tipo_categoria_nombre,
        subtipo_categoria_nombre = EXCLUDED.subtipo_categoria_nombre,
        jerarquia = EXCLUDED.jerarquia,
        altitud = EXCLUDED.altitud,
        departamento = EXCLUDED.departamento,
        provincia = EXCLUDED.provincia,
        distrito = EXCLUDED.distrito,
        latitud = COALESCE(EXCLUDED.latitud, turismo.recursos.latitud),
        longitud = COALESCE(EXCLUDED.longitud, turismo.recursos.longitud),
        foto_principal = COALESCE(EXCLUDED.foto_principal, turismo.recursos.foto_principal),
        url_ficha = EXCLUDED.url_ficha,
        youtube_url = COALESCE(EXCLUDED.youtube_url, turismo.recursos.youtube_url),
        youtube_id = COALESCE(EXCLUDED.youtube_id, turismo.recursos.youtube_id),
        descripcion = EXCLUDED.descripcion,
        particularidades = EXCLUDED.particularidades,
        estado_actual = EXCLUDED.estado_actual,
        observaciones = EXCLUDED.observaciones,
        is_active = TRUE,
        fecha_actualizacion = CURRENT_TIMESTAMP;

    -- 2. TABLAS HIJAS (Limpiar e insertar datos frescos si vienen en el JSON)
    
    -- Galería de fotos
    IF p_ficha ? 'galeria_fotos' AND jsonb_array_length(p_ficha->'galeria_fotos') > 0 THEN
        DELETE FROM turismo.ficha_fotos WHERE recurso_codigo = v_codigo;
        v_idx := 0;
        FOR v_elem_txt IN SELECT * FROM jsonb_array_elements_text(p_ficha->'galeria_fotos') LOOP
            IF v_elem_txt IS NOT NULL AND v_elem_txt <> '' THEN
                INSERT INTO turismo.ficha_fotos (recurso_codigo, url_foto, es_principal, orden)
                VALUES (v_codigo, v_elem_txt, (v_idx = 0 OR v_elem_txt = v_foto_princ), v_idx)
                ON CONFLICT (recurso_codigo, url_foto) DO NOTHING;
                v_idx := v_idx + 1;
            END IF;
        END LOOP;
    END IF;

    -- Actividades
    IF p_ficha ? 'actividades_detalle' AND jsonb_array_length(p_ficha->'actividades_detalle') > 0 THEN
        DELETE FROM turismo.ficha_actividades WHERE recurso_codigo = v_codigo;
        FOR v_elem IN SELECT * FROM jsonb_array_elements(p_ficha->'actividades_detalle') LOOP
            -- Resolver id_actividad e id_subactividad
            SELECT id_actividad INTO v_id_act
            FROM turismo.actividades
            WHERE public.unaccent(lower(nombre)) = public.unaccent(lower(COALESCE(v_elem->>'actividad', '')))
               OR public.unaccent(lower(COALESCE(v_elem->>'actividad', ''))) LIKE '%' || public.unaccent(lower(nombre)) || '%'
            LIMIT 1;

            SELECT id_subactividad INTO v_id_subact
            FROM turismo.subactividades
            WHERE (v_id_act IS NULL OR id_actividad = v_id_act)
              AND (
                  public.unaccent(lower(nombre)) = public.unaccent(lower(COALESCE(v_elem->>'tipo', '')))
                  OR public.unaccent(lower(COALESCE(v_elem->>'tipo', ''))) LIKE '%' || public.unaccent(lower(nombre)) || '%'
              )
            LIMIT 1;

            INSERT INTO turismo.ficha_actividades (recurso_codigo, id_actividad, id_subactividad, actividad, tipo, observacion, icono_url)
            VALUES (
                v_codigo,
                v_id_act,
                v_id_subact,
                COALESCE(v_elem->>'actividad', ''),
                COALESCE(v_elem->>'tipo', ''),
                v_elem->>'observacion',
                v_elem->>'icono_url'
            )
            ON CONFLICT (recurso_codigo, actividad, tipo) DO UPDATE SET
                id_actividad = COALESCE(EXCLUDED.id_actividad, turismo.ficha_actividades.id_actividad),
                id_subactividad = COALESCE(EXCLUDED.id_subactividad, turismo.ficha_actividades.id_subactividad),
                observacion = EXCLUDED.observacion,
                icono_url = EXCLUDED.icono_url,
                fecha_actualizacion = CURRENT_TIMESTAMP;
        END LOOP;
    END IF;

    -- Rutas
    IF p_ficha ? 'rutas_acceso' AND jsonb_array_length(p_ficha->'rutas_acceso') > 0 THEN
        DELETE FROM turismo.ficha_rutas WHERE recurso_codigo = v_codigo;
        v_idx := 0;
        FOR v_elem IN SELECT * FROM jsonb_array_elements(p_ficha->'rutas_acceso') LOOP
            INSERT INTO turismo.ficha_rutas (recurso_codigo, recorrido, tramo, detalle, tipo_acceso, medio_transporte, tipo_via, distancia_tiempo, orden)
            VALUES (
                v_codigo,
                COALESCE(v_elem->>'recorrido', ''),
                COALESCE(v_elem->>'tramo', ''),
                v_elem->>'detalle',
                v_elem->>'tipo_acceso',
                v_elem->>'medio_transporte',
                v_elem->>'tipo_via',
                v_elem->>'distancia_tiempo',
                v_idx
            )
            ON CONFLICT (recurso_codigo, orden, recorrido, tramo) DO UPDATE SET
                detalle = EXCLUDED.detalle,
                distancia_tiempo = EXCLUDED.distancia_tiempo,
                fecha_actualizacion = CURRENT_TIMESTAMP;
            v_idx := v_idx + 1;
        END LOOP;
    END IF;

    -- Épocas
    IF p_ficha ? 'epoca_propicia' AND jsonb_array_length(p_ficha->'epoca_propicia') > 0 THEN
        DELETE FROM turismo.ficha_epocas WHERE recurso_codigo = v_codigo;
        FOR v_elem IN SELECT * FROM jsonb_array_elements(p_ficha->'epoca_propicia') LOOP
            INSERT INTO turismo.ficha_epocas (recurso_codigo, epoca, especificacion, horario, observaciones)
            VALUES (
                v_codigo,
                COALESCE(v_elem->>'epoca', ''),
                v_elem->>'especificacion',
                COALESCE(v_elem->>'horario', ''),
                v_elem->>'observaciones'
            )
            ON CONFLICT (recurso_codigo, epoca, horario) DO NOTHING;
        END LOOP;
    END IF;

    -- Tarifas
    IF p_ficha ? 'tipo_ingreso' AND jsonb_array_length(p_ficha->'tipo_ingreso') > 0 THEN
        DELETE FROM turismo.ficha_tarifas WHERE recurso_codigo = v_codigo;
        FOR v_elem IN SELECT * FROM jsonb_array_elements(p_ficha->'tipo_ingreso') LOOP
            INSERT INTO turismo.ficha_tarifas (recurso_codigo, tipo, observaciones)
            VALUES (v_codigo, COALESCE(v_elem->>'tipo', ''), v_elem->>'observaciones')
            ON CONFLICT (recurso_codigo, tipo) DO NOTHING;
        END LOOP;
    END IF;

    -- Servicios
    IF p_ficha ? 'servicios_turisticos' AND jsonb_array_length(p_ficha->'servicios_turisticos') > 0 THEN
        DELETE FROM turismo.ficha_servicios WHERE recurso_codigo = v_codigo;
        FOR v_elem IN SELECT * FROM jsonb_array_elements(p_ficha->'servicios_turisticos') LOOP
            INSERT INTO turismo.ficha_servicios (recurso_codigo, ubicacion, instalacion, servicio, tipo_servicio, observacion)
            VALUES (
                v_codigo,
                CASE WHEN LOWER(v_elem->>'ubicacion') = 'dentro' THEN 'dentro' ELSE 'fuera' END,
                v_elem->>'instalacion',
                COALESCE(v_elem->>'servicio', ''),
                COALESCE(v_elem->>'tipo_servicio', ''),
                v_elem->>'observacion'
            )
            ON CONFLICT (recurso_codigo, ubicacion, servicio, tipo_servicio) DO NOTHING;
        END LOOP;
    END IF;

    -- Secciones
    IF p_ficha ? 'secciones' AND jsonb_array_length(p_ficha->'secciones') > 0 THEN
        DELETE FROM turismo.ficha_secciones WHERE recurso_codigo = v_codigo;
        v_idx := 0;
        FOR v_elem IN SELECT * FROM jsonb_array_elements(p_ficha->'secciones') LOOP
            INSERT INTO turismo.ficha_secciones (recurso_codigo, titulo, contenido_texto, contenido_html, orden)
            VALUES (
                v_codigo,
                COALESCE(v_elem->>'titulo', 'Sección ' || (v_idx + 1)),
                COALESCE(v_elem->>'contenido_texto', v_elem->>'contenido', ''),
                v_elem->>'contenido_html',
                v_idx
            )
            ON CONFLICT (recurso_codigo, titulo) DO UPDATE SET
                contenido_texto = EXCLUDED.contenido_texto,
                fecha_actualizacion = CURRENT_TIMESTAMP;
            v_idx := v_idx + 1;
        END LOOP;
    END IF;

END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. VISTAS Y FUNCIONES JSON PARA EL BACKEND Y FRONTEND
-- ============================================================================

-- 7.1. Vista Resumen para Catálogo y Tarjetas (/api/resources, /api/featured)
CREATE OR REPLACE VIEW turismo.vw_recursos_resumen AS
SELECT 
    r.codigo,
    r.nombre,
    COALESCE(c.nombre, r.categoria_nombre, '') AS categoria,
    COALESCE(tc.nombre, r.tipo_categoria_nombre, '') AS tipo_categoria,
    COALESCE(sc.nombre, r.subtipo_categoria_nombre, '') AS subtipo_categoria,
    r.departamento,
    r.provincia,
    r.distrito,
    r.departamento AS desdpto,
    r.provincia AS desprov,
    r.distrito AS desubigeo,
    r.longitud AS x,
    r.latitud AS y,
    json_build_object('latitud', r.latitud, 'longitud', r.longitud) AS coordenadas,
    r.url_ficha,
    COALESCE(r.url_ficha, 'https://consultasenlinea.mincetur.gob.pe/fichaInventario/index.aspx?cod_Ficha=' || r.codigo) AS url,
    r.jerarquia,
    r.jerarquia AS desjerarquia,
    r.foto_principal AS imagen,
    r.foto_principal AS foto_url,
    r.is_active,
    r.fecha_creacion,
    r.fecha_actualizacion
FROM turismo.recursos r
LEFT JOIN turismo.categorias c ON c.id_categoria = r.id_categoria
LEFT JOIN turismo.tipos_categoria tc ON tc.id_tipo = r.id_tipo
LEFT JOIN turismo.subtipos_categoria sc ON sc.id_subtipo = r.id_subtipo
WHERE r.is_active = TRUE;

-- 7.2. Función para Retornar GeoJSON FeatureCollection para Leaflet (/api/map/geojson)
CREATE OR REPLACE FUNCTION turismo.fn_get_recursos_geojson(
    p_departamento TEXT DEFAULT NULL,
    p_categoria TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(json_agg(
            json_build_object(
                'type', 'Feature',
                'geometry', public.ST_AsGeoJSON(r.geom)::json,
                'properties', json_build_object(
                    'codigo', r.codigo,
                    'nombre', r.nombre,
                    'categoria', COALESCE(c.nombre, r.categoria_nombre, ''),
                    'tipo_categoria', COALESCE(tc.nombre, r.tipo_categoria_nombre, ''),
                    'subtipo_categoria', COALESCE(sc.nombre, r.subtipo_categoria_nombre, ''),
                    'departamento', r.departamento,
                    'provincia', r.provincia,
                    'distrito', r.distrito,
                    'jerarquia', r.jerarquia,
                    'imagen', r.foto_principal,
                    'url_ficha', r.url_ficha
                )
            )
        ), '[]'::json)
    ) INTO v_result
    FROM turismo.recursos r
    LEFT JOIN turismo.categorias c ON c.id_categoria = r.id_categoria
    LEFT JOIN turismo.tipos_categoria tc ON tc.id_tipo = r.id_tipo
    LEFT JOIN turismo.subtipos_categoria sc ON sc.id_subtipo = r.id_subtipo
    WHERE r.is_active = TRUE 
      AND r.geom IS NOT NULL
      AND (p_departamento IS NULL OR public.unaccent(lower(r.departamento)) = public.unaccent(lower(p_departamento)))
      AND (p_categoria IS NULL OR public.unaccent(lower(COALESCE(c.nombre, r.categoria_nombre))) ILIKE '%' || public.unaccent(lower(p_categoria)) || '%');

    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- 7.3. Función para Obtener Detalle Completo de Ficha Técnica (/api/resources/:codFicha)
CREATE OR REPLACE FUNCTION turismo.fn_get_ficha_detalle(p_cod_ficha INT)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'cod_ficha', r.codigo,
        'url_ficha', COALESCE(r.url_ficha, 'https://consultasenlinea.mincetur.gob.pe/fichaInventario/index.aspx?cod_Ficha=' || r.codigo),
        'nombre', r.nombre,
        'departamento', r.departamento,
        'provincia', r.provincia,
        'distrito', r.distrito,
        'categoria', COALESCE(c.nombre, r.categoria_nombre, 'Recurso Turístico'),
        'tipo', COALESCE(tc.nombre, r.tipo_categoria_nombre, ''),
        'subtipo', COALESCE(sc.nombre, r.subtipo_categoria_nombre, ''),
        'jerarquia', COALESCE(r.jerarquia, 'En evaluación'),
        'altitud', COALESCE(r.altitud, ''),
        'x', r.longitud,
        'y', r.latitud,
        'coordenadas', json_build_object('latitud', r.latitud, 'longitud', r.longitud),
        'google_maps_url', CASE 
            WHEN r.latitud IS NOT NULL AND r.longitud IS NOT NULL 
            THEN 'https://www.google.com/maps?q=' || r.latitud || ',' || r.longitud
            ELSE 'https://www.google.com/maps/search/?api=1&query=' || r.nombre || ', ' || r.departamento || ' Peru'
        END,
        'foto_principal', r.foto_principal,
        'galeria_fotos', (
            SELECT COALESCE(json_agg(f.url_foto ORDER BY f.orden, f.id), '[]'::json)
            FROM turismo.ficha_fotos f 
            WHERE f.recurso_codigo = r.codigo
        ),
        'actividades_permitidas', (
            SELECT COALESCE(json_agg(DISTINCT fa.actividad), '[]'::json)
            FROM turismo.ficha_actividades fa 
            WHERE fa.recurso_codigo = r.codigo
        ),
        'actividades_detalle', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'actividad', fa.actividad,
                    'tipo', fa.tipo,
                    'observacion', fa.observacion,
                    'icono_url', fa.icono_url
                )
            ), '[]'::json)
            FROM turismo.ficha_actividades fa 
            WHERE fa.recurso_codigo = r.codigo
        ),
        'rutas_acceso', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'recorrido', fr.recorrido,
                    'tramo', fr.tramo,
                    'detalle', fr.detalle,
                    'tipo_acceso', fr.tipo_acceso,
                    'medio_transporte', fr.medio_transporte,
                    'tipo_via', fr.tipo_via,
                    'distancia_tiempo', fr.distancia_tiempo
                ) ORDER BY fr.orden, fr.id
            ), '[]'::json)
            FROM turismo.ficha_rutas fr 
            WHERE fr.recurso_codigo = r.codigo
        ),
        'epoca_propicia', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'epoca', fe.epoca,
                    'especificacion', fe.especificacion,
                    'horario', fe.horario,
                    'observaciones', fe.observaciones
                )
            ), '[]'::json)
            FROM turismo.ficha_epocas fe 
            WHERE fe.recurso_codigo = r.codigo
        ),
        'tipo_ingreso', (
            SELECT COALESCE(json_agg(
                json_build_object('tipo', ft.tipo, 'observaciones', ft.observaciones)
            ), '[]'::json)
            FROM turismo.ficha_tarifas ft 
            WHERE ft.recurso_codigo = r.codigo
        ),
        'servicios_turisticos', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'ubicacion', fs.ubicacion,
                    'instalacion', fs.instalacion,
                    'servicio', fs.servicio,
                    'tipo_servicio', fs.tipo_servicio,
                    'observacion', fs.observacion
                )
            ), '[]'::json)
            FROM turismo.ficha_servicios fs 
            WHERE fs.recurso_codigo = r.codigo
        ),
        'descripcion', COALESCE(r.descripcion, ''),
        'particularidades', COALESCE(r.particularidades, ''),
        'estado_actual', COALESCE(r.estado_actual, ''),
        'observaciones', COALESCE(r.observaciones, ''),
        'youtube_url', r.youtube_url,
        'youtube_id', r.youtube_id,
        'youtube_embed_url', CASE WHEN r.youtube_id IS NOT NULL THEN 'https://www.youtube.com/embed/' || r.youtube_id ELSE NULL END,
        'secciones', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'id', 'sec_' || fs_sec.id,
                    'titulo', fs_sec.titulo,
                    'contenido_texto', fs_sec.contenido_texto,
                    'contenido_html', COALESCE(fs_sec.contenido_html, '<p>' || fs_sec.contenido_texto || '</p>')
                ) ORDER BY fs_sec.orden, fs_sec.id
            ), '[]'::json)
            FROM turismo.ficha_secciones fs_sec 
            WHERE fs_sec.recurso_codigo = r.codigo
        ),
        'fecha_creacion', r.fecha_creacion,
        'fecha_actualizacion', r.fecha_actualizacion
    ) INTO v_result
    FROM turismo.recursos r
    LEFT JOIN turismo.categorias c ON c.id_categoria = r.id_categoria
    LEFT JOIN turismo.tipos_categoria tc ON tc.id_tipo = r.id_tipo
    LEFT JOIN turismo.subtipos_categoria sc ON sc.id_subtipo = r.id_subtipo
    WHERE r.codigo = p_cod_ficha;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- 7.4. Árbol de Categorías en formato JSON (/api/categories)
CREATE OR REPLACE VIEW turismo.vw_categorias_arbol AS
SELECT json_agg(
    json_build_object(
        'id_categoria', c.id_categoria,
        'categoria', c.nombre,
        'tipos', COALESCE((
            SELECT json_agg(
                json_build_object(
                    'id_tipo', tc.id_tipo,
                    'tipo', tc.nombre,
                    'id_categoria', tc.id_categoria,
                    'subtipos', COALESCE((
                        SELECT json_agg(
                            json_build_object(
                                'id_subtipo', sc.id_subtipo,
                                'subtipo', sc.nombre,
                                'id_tipo', sc.id_tipo
                            )
                        )
                        FROM turismo.subtipos_categoria sc 
                        WHERE sc.id_tipo = tc.id_tipo
                    ), '[]'::json)
                )
            )
            FROM turismo.tipos_categoria tc 
            WHERE tc.id_categoria = c.id_categoria
        ), '[]'::json)
    )
) AS arbol_json
FROM turismo.categorias c;

-- 7.5. Árbol de Actividades en formato JSON (/api/activities)
CREATE OR REPLACE VIEW turismo.vw_actividades_arbol AS
SELECT json_agg(
    json_build_object(
        'id', a.id_actividad,
        'id_actividad', a.id_actividad,
        'atrac_acti', a.id_actividad,
        'codigo', a.codigo,
        'nombre', a.nombre,
        'imagen', a.imagen,
        'sub_actividades', COALESCE((
            SELECT json_agg(
                json_build_object(
                    'id', sa.id_subactividad,
                    'id_subactividad', sa.id_subactividad,
                    'atrac_acti_tipo', sa.id_subactividad,
                    'id_actividad', sa.id_actividad,
                    'atrac_acti', sa.id_actividad,
                    'codigo', sa.codigo,
                    'codigo_tipo', sa.codigo_tipo,
                    'tipocate_codigo', sa.codigo_tipo,
                    'nombre', sa.nombre,
                    'imagen', sa.imagen
                )
            )
            FROM turismo.subactividades sa 
            WHERE sa.id_actividad = a.id_actividad
        ), '[]'::json)
    )
) AS arbol_json
FROM turismo.actividades a;

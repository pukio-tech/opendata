"""
Módulo de Gestión de Base de Datos PostgreSQL (Neon DB) para Museos del Perú.
Esquema: museos
"""

import json
import logging
from typing import Any, Dict, List, Optional
import psycopg2
from psycopg2.extras import Json, execute_values
from .config import Config

logger = logging.getLogger("ScraperMuseos.Database")


class DatabaseManager:
    """Gestiona conexiones, migraciones DDL y operaciones UPSERT para museos."""

    def __init__(self, database_url: Optional[str] = None):
        self.db_url = database_url or Config.DATABASE_URL

    def get_connection(self):
        """Retorna una nueva conexión con search_path 'museos, public'."""
        conn = psycopg2.connect(self.db_url)
        conn.autocommit = False
        with conn.cursor() as cur:
            cur.execute("SET search_path TO museos, public;")
        return conn

    def init_schema(self, sql_file_path: Optional[str] = None):
        """Ejecuta el script SQL DDL para inicializar el esquema y tablas si no existen."""
        if not sql_file_path:
            sql_file = Config.BASE_DIR / "db" / "museos.sql"
        else:
            from pathlib import Path
            sql_file = Path(sql_file_path)

        if not sql_file.exists():
            logger.warning(f"No se encontró el archivo DDL en {sql_file}")
            return

        with open(sql_file, "r", encoding="utf-8") as f:
            sql_script = f.read()

        conn = psycopg2.connect(self.db_url)
        conn.autocommit = True
        try:
            with conn.cursor() as cur:
                cur.execute(sql_script)
            logger.info("✅ Esquema 'museos' y tablas DDL inicializadas correctamente en PostgreSQL.")
        except Exception as e:
            logger.error(f"❌ Error al inicializar esquema DDL: {e}")
            raise
        finally:
            conn.close()

    def sync_servicios_catalogo(self, museos: List[Dict[str, Any]]):
        """Extrae y sincroniza todos los servicios únicos en museos.servicios_catalogo."""
        servicios_map: Dict[str, str] = {}
        for m in museos:
            for s in m.get("servicios", []):
                name = s.get("nombre", "").strip()
                icon = s.get("icono_url", "").strip()
                if name:
                    if name not in servicios_map or (icon and not servicios_map[name]):
                        servicios_map[name] = icon

        if not servicios_map:
            return

        rows = [(nombre, icono) for nombre, icono in servicios_map.items()]
        conn = self.get_connection()
        cur = conn.cursor()
        try:
            execute_values(
                cur,
                """
                INSERT INTO museos.servicios_catalogo (nombre, icono_url)
                VALUES %s
                ON CONFLICT (nombre) DO UPDATE SET
                    icono_url = COALESCE(NULLIF(EXCLUDED.icono_url, ''), museos.servicios_catalogo.icono_url),
                    fecha_actualizacion = CURRENT_TIMESTAMP;
                """,
                rows,
            )
            conn.commit()
            logger.info(f"✅ [DB] {len(rows)} servicios registrados en museos.servicios_catalogo.")
        except Exception as e:
            conn.rollback()
            logger.error(f"❌ [DB] Error sincronizando servicios_catalogo: {e}")
            raise
        finally:
            cur.close()
            conn.close()

    def save_museo(self, museo: Dict[str, Any]) -> int:
        """
        Inserta o actualiza un museo y sus relaciones (servicios, tarifas, enlaces de fotos).
        Retorna el id_museo insertado/actualizado.
        """
        conn = self.get_connection()
        cur = conn.cursor()
        try:
            # 1. Upsert en tabla principal museos.museos
            cur.execute(
                """
                INSERT INTO museos.museos (
                    slug, nombre, categoria, tipo_museo, administracion, estado,
                    ubigeo_texto, departamento, provincia, distrito, ubigeo, direccion,
                    latitud, longitud, horario_atencion,
                    tarifario_descripcion, telefono, email, web_url,
                    recorrido_virtual_url, coleccion_virtual_url, facebook_url,
                    instagram_url, twitter_url, youtube_url, tiktok_url,
                    imagen_portada, imagen_tarjeta, descripcion,
                    servicios_json, tarifas_json, galeria_json, raw_data, url_origen
                ) VALUES (
                    %(slug)s, %(nombre)s, %(categoria)s, %(tipo_museo)s, %(administracion)s, %(estado)s,
                    %(ubigeo_texto)s, %(departamento)s, %(provincia)s, %(distrito)s, %(ubigeo)s, %(direccion)s,
                    %(latitud)s, %(longitud)s, %(horario_atencion)s,
                    %(tarifario_descripcion)s, %(telefono)s, %(email)s, %(web_url)s,
                    %(recorrido_virtual_url)s, %(coleccion_virtual_url)s, %(facebook_url)s,
                    %(instagram_url)s, %(twitter_url)s, %(youtube_url)s, %(tiktok_url)s,
                    %(imagen_portada)s, %(imagen_tarjeta)s, %(descripcion)s,
                    %(servicios_json)s, %(tarifas_json)s, %(galeria_json)s, %(raw_data)s, %(url_origen)s
                )
                ON CONFLICT (slug) DO UPDATE SET
                    nombre = EXCLUDED.nombre,
                    categoria = EXCLUDED.categoria,
                    tipo_museo = EXCLUDED.tipo_museo,
                    administracion = EXCLUDED.administracion,
                    estado = EXCLUDED.estado,
                    ubigeo_texto = EXCLUDED.ubigeo_texto,
                    departamento = EXCLUDED.departamento,
                    provincia = EXCLUDED.provincia,
                    distrito = EXCLUDED.distrito,
                    direccion = EXCLUDED.direccion,
                    latitud = EXCLUDED.latitud,
                    longitud = EXCLUDED.longitud,
                    horario_atencion = EXCLUDED.horario_atencion,
                    tarifario_descripcion = EXCLUDED.tarifario_descripcion,
                    telefono = EXCLUDED.telefono,
                    email = EXCLUDED.email,
                    web_url = EXCLUDED.web_url,
                    recorrido_virtual_url = EXCLUDED.recorrido_virtual_url,
                    coleccion_virtual_url = EXCLUDED.coleccion_virtual_url,
                    facebook_url = EXCLUDED.facebook_url,
                    instagram_url = EXCLUDED.instagram_url,
                    twitter_url = EXCLUDED.twitter_url,
                    youtube_url = EXCLUDED.youtube_url,
                    tiktok_url = EXCLUDED.tiktok_url,
                    imagen_portada = EXCLUDED.imagen_portada,
                    imagen_tarjeta = EXCLUDED.imagen_tarjeta,
                    descripcion = EXCLUDED.descripcion,
                    servicios_json = EXCLUDED.servicios_json,
                    tarifas_json = EXCLUDED.tarifas_json,
                    galeria_json = EXCLUDED.galeria_json,
                    raw_data = EXCLUDED.raw_data,
                    url_origen = EXCLUDED.url_origen,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                RETURNING id_museo;
                """,
                {
                    "slug": museo["slug"],
                    "nombre": museo["nombre"],
                    "categoria": museo.get("categoria", "Ministerio de Cultura"),
                    "tipo_museo": museo.get("tipo_museo", "Ministerio de Cultura"),
                    "administracion": museo.get("administracion", ""),
                    "estado": museo.get("estado", "Abierto"),
                    "ubigeo_texto": museo.get("ubigeo_texto", ""),
                    "departamento": museo.get("departamento", ""),
                    "provincia": museo.get("provincia", ""),
                    "distrito": museo.get("distrito", ""),
                    "ubigeo": museo.get("ubigeo"),
                    "direccion": museo.get("direccion", ""),
                    "latitud": museo.get("latitud"),
                    "longitud": museo.get("longitud"),
                    "horario_atencion": museo.get("horario_atencion", ""),
                    "tarifario_descripcion": museo.get("tarifario_descripcion", ""),
                    "telefono": museo.get("telefono", ""),
                    "email": museo.get("email", ""),
                    "web_url": museo.get("web_url"),
                    "recorrido_virtual_url": museo.get("recorrido_virtual_url"),
                    "coleccion_virtual_url": museo.get("coleccion_virtual_url"),
                    "facebook_url": museo.get("facebook_url"),
                    "instagram_url": museo.get("instagram_url"),
                    "twitter_url": museo.get("twitter_url"),
                    "youtube_url": museo.get("youtube_url"),
                    "tiktok_url": museo.get("tiktok_url"),
                    "imagen_portada": museo.get("imagen_portada", ""),
                    "imagen_tarjeta": museo.get("imagen_tarjeta", ""),
                    "descripcion": museo.get("descripcion", ""),
                    "servicios_json": Json(museo.get("servicios", [])),
                    "tarifas_json": Json(museo.get("tarifas", [])),
                    "galeria_json": Json(museo.get("galeria", [])),
                    "raw_data": Json(museo),
                    "url_origen": museo.get("url_origen", ""),
                },
            )
            id_museo = cur.fetchone()[0]

            # 2. Relaciones de Servicios (museos.museo_servicios)
            cur.execute("DELETE FROM museos.museo_servicios WHERE id_museo = %s;", (id_museo,))
            for s in museo.get("servicios", []):
                s_name = s.get("nombre", "").strip()
                s_icon = s.get("icono_url", "").strip()
                if s_name:
                    cur.execute(
                        """
                        INSERT INTO museos.museo_servicios (id_museo, id_servicio, nombre_servicio, icono_url)
                        SELECT %s, id_servicio, %s, %s
                        FROM museos.servicios_catalogo
                        WHERE nombre = %s
                        ON CONFLICT (id_museo, id_servicio) DO NOTHING;
                        """,
                        (id_museo, s_name, s_icon, s_name),
                    )

            # 3. Tarifas normalizadas (museos.museo_tarifas)
            cur.execute("DELETE FROM museos.museo_tarifas WHERE id_museo = %s;", (id_museo,))
            tar_rows = []
            for t in museo.get("tarifas", []):
                tar_rows.append((
                    id_museo,
                    t.get("tipo", "General"),
                    t.get("descripcion", ""),
                    t.get("precio", 0.0),
                    t.get("moneda", "PEN"),
                ))
            if tar_rows:
                execute_values(
                    cur,
                    """
                    INSERT INTO museos.museo_tarifas (id_museo, tipo, descripcion, precio, moneda)
                    VALUES %s;
                    """,
                    tar_rows,
                )

            # 4. Fotos normalizadas (solo enlaces URL en museos.museo_fotos)
            cur.execute("DELETE FROM museos.museo_fotos WHERE id_museo = %s;", (id_museo,))
            foto_rows = []
            if museo.get("imagen_portada"):
                foto_rows.append((id_museo, museo["imagen_portada"], museo.get("nombre", ""), "portada", 0))
            for idx, g in enumerate(museo.get("galeria", []), start=1):
                if g.get("url"):
                    foto_rows.append((id_museo, g["url"], g.get("alt", ""), "galeria", idx))
            if foto_rows:
                execute_values(
                    cur,
                    """
                    INSERT INTO museos.museo_fotos (id_museo, url, alt, tipo, orden)
                    VALUES %s;
                    """,
                    foto_rows,
                )

            conn.commit()
            return id_museo
        except Exception as e:
            conn.rollback()
            logger.error(f"❌ [DB] Error guardando museo '{museo.get('nombre')}': {e}")
            raise
        finally:
            cur.close()
            conn.close()

    def save_all_museos(self, museos: List[Dict[str, Any]]) -> int:
        """Guarda todos los museos y sus catálogos en lote."""
        if not museos:
            return 0
        self.sync_servicios_catalogo(museos)
        count = 0
        for m in museos:
            try:
                self.save_museo(m)
                count += 1
            except Exception as e:
                logger.error(f"Error procesando museo {m.get('slug')}: {e}")
        logger.info(f"🎉 [DB] {count}/{len(museos)} museos guardados exitosamente en PostgreSQL.")
        return count

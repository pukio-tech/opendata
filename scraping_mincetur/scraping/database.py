"""
Módulo de Gestión de Base de Datos PostgreSQL (Neon DB) para MINCETUR.
Esquema: turismo
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional, Set
import psycopg2
from psycopg2.extras import execute_values
from .config import Config

logger = logging.getLogger("ScraperMINCETUR.Database")


class DatabaseManager:
    """Gestiona conexiones, operaciones de UPSERT y sincronización con PostgreSQL."""

    def __init__(self, database_url: Optional[str] = None):
        self.db_url = database_url or Config.DATABASE_URL

    def get_connection(self):
        """Retorna una nueva conexión con search_path 'turismo, public'."""
        conn = psycopg2.connect(self.db_url)
        conn.autocommit = False
        with conn.cursor() as cur:
            cur.execute("SET search_path TO turismo, public;")
        return conn

    # =========================================================================
    # 1. CATÁLOGOS
    # =========================================================================

    def save_departamentos(self, departamentos: List[Dict[str, Any]]):
        """Guarda o actualiza la lista de departamentos."""
        if not departamentos:
            return

        rows = []
        for d in departamentos:
            iddpto = str(d.get("iddpto", "")).strip().zfill(2)
            nombre = str(d.get("departamento", "")).strip().upper()
            if iddpto and nombre:
                rows.append((iddpto, nombre, None))

        if not rows:
            return

        conn = self.get_connection()
        cur = conn.cursor()
        try:
            execute_values(
                cur,
                """
                INSERT INTO turismo.departamentos (id_departamento, nombre, id_region)
                VALUES %s
                ON CONFLICT (id_departamento) DO UPDATE SET 
                    nombre = EXCLUDED.nombre,
                    fecha_actualizacion = CURRENT_TIMESTAMP;
                """,
                rows,
            )
            conn.commit()
            logger.info(f"✅ [DB] {len(rows)} departamentos sincronizados en turismo.departamentos.")
        except Exception as e:
            conn.rollback()
            logger.error(f"❌ [DB] Error guardando departamentos: {e}")
            raise
        finally:
            cur.close()
            conn.close()

    def save_provincias(self, provincias: List[Dict[str, Any]]):
        """Guarda o actualiza la lista de provincias."""
        if not provincias:
            return

        rows = []
        for p in provincias:
            idprov = str(p.get("idprov", "")).strip().zfill(4)
            iddpto = str(p.get("iddpto", "")).strip().zfill(2)
            nombre = str(p.get("provincia", "")).strip().upper()
            if idprov and iddpto and nombre:
                rows.append((idprov, iddpto, nombre))

        if not rows:
            return

        unique_rows = list({r[0]: r for r in rows}.values())
        conn = self.get_connection()
        cur = conn.cursor()
        try:
            execute_values(
                cur,
                """
                INSERT INTO turismo.provincias (id_provincia, id_departamento, nombre)
                VALUES %s
                ON CONFLICT (id_provincia) DO UPDATE SET 
                    id_departamento = EXCLUDED.id_departamento,
                    nombre = EXCLUDED.nombre,
                    fecha_actualizacion = CURRENT_TIMESTAMP;
                """,
                unique_rows,
            )
            conn.commit()
            logger.info(f"✅ [DB] {len(unique_rows)} provincias sincronizadas en turismo.provincias.")
        except Exception as e:
            conn.rollback()
            logger.error(f"❌ [DB] Error guardando provincias: {e}")
            raise
        finally:
            cur.close()
            conn.close()

    def save_distritos(self, distritos: List[Dict[str, Any]]):
        """Guarda o actualiza la lista de distritos (UBIGEO)."""
        if not distritos:
            return

        rows = []
        for d in distritos:
            ubigeo = str(d.get("ubigeo", "")).strip().zfill(6)
            idprov = str(d.get("idprov", "")).strip().zfill(4)
            nombre = str(d.get("distrito", "")).strip().upper()
            if ubigeo and idprov and nombre:
                rows.append((ubigeo, idprov, nombre))

        if not rows:
            return

        unique_rows = list({r[0]: r for r in rows}.values())
        conn = self.get_connection()
        cur = conn.cursor()
        try:
            execute_values(
                cur,
                """
                INSERT INTO turismo.distritos (ubigeo, id_provincia, nombre)
                VALUES %s
                ON CONFLICT (ubigeo) DO UPDATE SET 
                    id_provincia = EXCLUDED.id_provincia,
                    nombre = EXCLUDED.nombre,
                    fecha_actualizacion = CURRENT_TIMESTAMP;
                """,
                unique_rows,
                page_size=1000,
            )
            conn.commit()
            logger.info(f"✅ [DB] {len(unique_rows)} distritos (UBIGEO) sincronizados en turismo.distritos.")
        except Exception as e:
            conn.rollback()
            logger.error(f"❌ [DB] Error guardando distritos: {e}")
            raise
        finally:
            cur.close()
            conn.close()

    def save_categorias_tree(self, tree: List[Dict[str, Any]]):
        """Guarda o actualiza el árbol de categorías, tipos y subtipos."""
        if not tree:
            return

        cat_rows = []
        tipo_rows = []
        subtipo_rows = []

        for cat in tree:
            c_id = cat.get("id_categoria")
            c_nom = (cat.get("categoria") or "").strip()
            if not c_id or not c_nom:
                continue

            cat_rows.append((int(c_id), c_nom))

            for tp in cat.get("tipos", []):
                t_id = tp.get("id_tipo")
                t_nom = (tp.get("tipo") or "").strip()
                if not t_id or not t_nom:
                    continue

                tipo_rows.append((int(t_id), int(c_id), t_nom))

                for st in tp.get("subtipos", []):
                    s_id = st.get("id_subtipo")
                    s_nom = (st.get("subtipo") or "").strip()
                    if s_id and s_nom:
                        subtipo_rows.append((int(s_id), int(t_id), s_nom))

        conn = self.get_connection()
        cur = conn.cursor()
        try:
            if cat_rows:
                unique_cats = list({r[0]: r for r in cat_rows}.values())
                execute_values(
                    cur,
                    """
                    INSERT INTO turismo.categorias (id_categoria, nombre) VALUES %s
                    ON CONFLICT (id_categoria) DO UPDATE SET 
                        nombre = EXCLUDED.nombre,
                        fecha_actualizacion = CURRENT_TIMESTAMP;
                    """,
                    unique_cats,
                )

            if tipo_rows:
                unique_tipos = list({r[0]: r for r in tipo_rows}.values())
                execute_values(
                    cur,
                    """
                    INSERT INTO turismo.tipos_categoria (id_tipo, id_categoria, nombre) VALUES %s
                    ON CONFLICT (id_tipo) DO UPDATE SET 
                        id_categoria = EXCLUDED.id_categoria,
                        nombre = EXCLUDED.nombre,
                        fecha_actualizacion = CURRENT_TIMESTAMP;
                    """,
                    unique_tipos,
                )

            if subtipo_rows:
                unique_subtipos = list({r[0]: r for r in subtipo_rows}.values())
                execute_values(
                    cur,
                    """
                    INSERT INTO turismo.subtipos_categoria (id_subtipo, id_tipo, nombre) VALUES %s
                    ON CONFLICT (id_subtipo) DO UPDATE SET 
                        id_tipo = EXCLUDED.id_tipo,
                        nombre = EXCLUDED.nombre,
                        fecha_actualizacion = CURRENT_TIMESTAMP;
                    """,
                    unique_subtipos,
                )

            conn.commit()
            logger.info(f"✅ [DB] Categorías ({len(cat_rows)}), tipos ({len(tipo_rows)}) y subtipos ({len(subtipo_rows)}) sincronizados.")
        except Exception as e:
            conn.rollback()
            logger.error(f"❌ [DB] Error guardando categorías: {e}")
            raise
        finally:
            cur.close()
            conn.close()

    def save_actividades_tree(self, tree: List[Dict[str, Any]]):
        """Guarda o actualiza el árbol de actividades y subactividades."""
        if not tree:
            return

        act_rows = []
        subact_rows = []

        for act in tree:
            a_id = act.get("id_actividad") or act.get("id")
            a_nom = (act.get("nombre") or "").strip()
            a_cod = act.get("codigo")
            a_img = act.get("imagen")
            if not a_id or not a_nom:
                continue

            act_rows.append((int(a_id), a_cod, a_nom, a_img))

            for sa in act.get("sub_actividades", []):
                sa_id = sa.get("id_subactividad") or sa.get("id")
                sa_nom = (sa.get("nombre") or "").strip()
                sa_cod = sa.get("codigo")
                sa_tp = sa.get("codigo_tipo") or sa.get("tipocate_codigo")
                sa_img = sa.get("imagen")
                if sa_id and sa_nom:
                    subact_rows.append((int(sa_id), int(a_id), sa_cod, sa_nom, sa_tp, sa_img))

        conn = self.get_connection()
        cur = conn.cursor()
        try:
            if act_rows:
                unique_acts = list({r[0]: r for r in act_rows}.values())
                execute_values(
                    cur,
                    """
                    INSERT INTO turismo.actividades (id_actividad, codigo, nombre, imagen) VALUES %s
                    ON CONFLICT (id_actividad) DO UPDATE SET 
                        codigo = EXCLUDED.codigo,
                        nombre = EXCLUDED.nombre,
                        imagen = EXCLUDED.imagen,
                        fecha_actualizacion = CURRENT_TIMESTAMP;
                    """,
                    unique_acts,
                )

            if subact_rows:
                unique_subacts = list({r[0]: r for r in subact_rows}.values())
                execute_values(
                    cur,
                    """
                    INSERT INTO turismo.subactividades (id_subactividad, id_actividad, codigo, nombre, codigo_tipo, imagen) VALUES %s
                    ON CONFLICT (id_subactividad) DO UPDATE SET 
                        id_actividad = EXCLUDED.id_actividad,
                        codigo = EXCLUDED.codigo,
                        nombre = EXCLUDED.nombre,
                        codigo_tipo = EXCLUDED.codigo_tipo,
                        imagen = EXCLUDED.imagen,
                        fecha_actualizacion = CURRENT_TIMESTAMP;
                    """,
                    unique_subacts,
                )

            conn.commit()
            logger.info(f"✅ [DB] Actividades ({len(act_rows)}) y subactividades ({len(subact_rows)}) sincronizadas.")
        except Exception as e:
            conn.rollback()
            logger.error(f"❌ [DB] Error guardando actividades: {e}")
            raise
        finally:
            cur.close()
            conn.close()

    # =========================================================================
    # 2. CÓDIGOS OFFLINE
    # =========================================================================

    def save_offline_codes(self, codes: Set[int], log_info: bool = False):
        """Registra códigos offline en la tabla turismo.fichas_offline y los elimina de turismo.recursos."""
        if not codes:
            return

        rows = [(int(c), "Ficha no disponible o retirada de MINCETUR") for c in codes]
        int_codes = [int(c) for c in codes]
        conn = self.get_connection()
        cur = conn.cursor()
        try:
            execute_values(
                cur,
                """
                INSERT INTO turismo.fichas_offline (codigo, motivo) VALUES %s
                ON CONFLICT (codigo) DO NOTHING;
                """,
                rows,
            )
            # Eliminar inmediatamente de la tabla de recursos cualquier ficha offline
            cur.execute("""
                DELETE FROM turismo.recursos WHERE codigo = ANY(%s);
            """, (int_codes,))
            conn.commit()
            if log_info:
                logger.info(f"✅ [DB] {len(rows)} códigos offline registrados y depurados de turismo.recursos.")
        except Exception as e:
            conn.rollback()
            logger.error(f"❌ [DB] Error guardando códigos offline: {e}")
        finally:
            cur.close()
            conn.close()

    def get_offline_codes(self) -> Set[int]:
        """Obtiene el conjunto de códigos offline registrados en BD."""
        conn = self.get_connection()
        cur = conn.cursor()
        try:
            cur.execute("SELECT codigo FROM turismo.fichas_offline;")
            res = {row[0] for row in cur.fetchall()}
            return res
        except Exception as e:
            logger.warning(f"No se pudieron leer códigos offline de la BD: {e}")
            return set()
        finally:
            cur.close()
            conn.close()

    def cleanup_offline_from_recursos(self):
        """Elimina de turismo.recursos cualquier registro cuyo código esté en fichas_offline."""
        conn = self.get_connection()
        cur = conn.cursor()
        try:
            cur.execute("""
                DELETE FROM turismo.recursos 
                WHERE codigo IN (SELECT codigo FROM turismo.fichas_offline);
            """)
            deleted = cur.rowcount
            conn.commit()
            if deleted > 0:
                logger.info(f"🧹 [DB] {deleted} recursos offline eliminados de turismo.recursos.")
            return deleted
        except Exception as e:
            conn.rollback()
            logger.error(f"❌ [DB] Error en limpieza de recursos offline: {e}")
            return 0
        finally:
            cur.close()
            conn.close()

    # =========================================================================
    # 3. RECURSOS MAESTROS (GEOSERVER)
    # =========================================================================

    def save_recursos_resumen(self, recursos: List[Dict[str, Any]], offline_codes: Optional[Set[int]] = None):
        """Guarda o actualiza los recursos maestros extraídos de GeoServer (excluyendo offline)."""
        if not recursos:
            return

        db_offline = self.get_offline_codes()
        off_set = (offline_codes or set()).union(db_offline)
        rows = []

        for r in recursos:
            cod = r.get("codigo")
            if not cod or int(cod) in off_set:
                continue

            cod_int = int(cod)
            nombre = (r.get("nombre") or "").strip()
            if not nombre:
                continue

            cat = re.sub(r"^\d+\.\s*", "", (r.get("categoria") or "")).strip().upper()
            tipo = (r.get("tipo_categoria") or "").strip().upper()
            subtipo = (r.get("subtipo_categoria") or "").strip().upper()

            dpto = (r.get("departamento") or "").strip().upper()
            prov = (r.get("provincia") or "").strip().upper()
            dist = (r.get("distrito") or "").strip().upper()

            jerarquia = (r.get("jerarquia") or "").strip()

            coords = r.get("coordenadas") or {}
            lat = coords.get("latitud")
            lon = coords.get("longitud")

            url_ficha = r.get("url_ficha") or f"https://consultasenlinea.mincetur.gob.pe/fichaInventario/index.aspx?cod_Ficha={cod_int}"
            foto_url = r.get("foto_url")

            rows.append((
                cod_int, nombre, cat, tipo, subtipo, jerarquia,
                dpto, prov, dist, lat, lon, foto_url, url_ficha
            ))

        if not rows:
            return

        conn = self.get_connection()
        cur = conn.cursor()
        try:
            execute_values(
                cur,
                """
                INSERT INTO turismo.recursos (
                    codigo, nombre, categoria_nombre, tipo_categoria_nombre, subtipo_categoria_nombre,
                    jerarquia, departamento, provincia, distrito, latitud, longitud, foto_principal, url_ficha, is_active
                ) VALUES %s
                ON CONFLICT (codigo) DO UPDATE SET
                    nombre = EXCLUDED.nombre,
                    categoria_nombre = EXCLUDED.categoria_nombre,
                    tipo_categoria_nombre = EXCLUDED.tipo_categoria_nombre,
                    subtipo_categoria_nombre = EXCLUDED.subtipo_categoria_nombre,
                    jerarquia = EXCLUDED.jerarquia,
                    departamento = EXCLUDED.departamento,
                    provincia = EXCLUDED.provincia,
                    distrito = EXCLUDED.distrito,
                    latitud = COALESCE(EXCLUDED.latitud, turismo.recursos.latitud),
                    longitud = COALESCE(EXCLUDED.longitud, turismo.recursos.longitud),
                    foto_principal = COALESCE(EXCLUDED.foto_principal, turismo.recursos.foto_principal),
                    url_ficha = EXCLUDED.url_ficha,
                    is_active = TRUE,
                    fecha_actualizacion = CURRENT_TIMESTAMP;
                """,
                [(r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9], r[10], r[11], r[12], True) for r in rows],
                page_size=500
            )

            # Vincular llaves foráneas id_categoria, id_tipo, id_subtipo
            cur.execute("""
                UPDATE turismo.recursos r
                SET id_categoria = c.id_categoria
                FROM turismo.categorias c
                WHERE r.id_categoria IS NULL
                  AND (
                      public.unaccent(lower(c.nombre)) = public.unaccent(lower(REGEXP_REPLACE(r.categoria_nombre, '^\\d+\\.\\s*', '')))
                      OR public.unaccent(lower(REGEXP_REPLACE(r.categoria_nombre, '^\\d+\\.\\s*', ''))) LIKE '%' || public.unaccent(lower(c.nombre)) || '%'
                  );

                UPDATE turismo.recursos r
                SET id_tipo = tc.id_tipo,
                    id_categoria = COALESCE(r.id_categoria, tc.id_categoria)
                FROM turismo.tipos_categoria tc
                WHERE r.id_tipo IS NULL
                  AND (
                      public.unaccent(lower(tc.nombre)) = public.unaccent(lower(REGEXP_REPLACE(r.tipo_categoria_nombre, '^[A-ZÑÁÉÍÓÚ0-9]+\\.\\s*', '')))
                      OR public.unaccent(lower(REGEXP_REPLACE(r.tipo_categoria_nombre, '^[A-ZÑÁÉÍÓÚ0-9]+\\.\\s*', ''))) LIKE '%' || public.unaccent(lower(tc.nombre)) || '%'
                      OR public.unaccent(lower(tc.nombre)) LIKE '%' || public.unaccent(lower(REGEXP_REPLACE(r.tipo_categoria_nombre, '^[A-ZÑÁÉÍÓÚ0-9]+\\.\\s*', ''))) || '%'
                  );

                UPDATE turismo.recursos r
                SET id_subtipo = sc.id_subtipo
                FROM turismo.subtipos_categoria sc
                WHERE r.id_subtipo IS NULL
                  AND (r.id_tipo IS NULL OR sc.id_tipo = r.id_tipo)
                  AND (
                      public.unaccent(lower(sc.nombre)) = public.unaccent(lower(REGEXP_REPLACE(r.subtipo_categoria_nombre, '^[A-ZÑÁÉÍÓÚ0-9]+\\.\\s*', '')))
                      OR public.unaccent(lower(REGEXP_REPLACE(r.subtipo_categoria_nombre, '^[A-ZÑÁÉÍÓÚ0-9]+\\.\\s*', ''))) LIKE '%' || public.unaccent(lower(sc.nombre)) || '%'
                      OR public.unaccent(lower(sc.nombre)) LIKE '%' || public.unaccent(lower(REGEXP_REPLACE(r.subtipo_categoria_nombre, '^[A-ZÑÁÉÍÓÚ0-9]+\\.\\s*', ''))) || '%'
                  );
            """)

            conn.commit()
            logger.info(f"✅ [DB] {len(rows)} recursos maestros sincronizados y vinculados con IDs de categoría/tipo/subtipo.")
        except Exception as e:
            conn.rollback()
            logger.error(f"❌ [DB] Error guardando recursos resumen: {e}")
            raise
        finally:
            cur.close()
            conn.close()

    # =========================================================================
    # 4. FICHAS TÉCNICAS COMPLETAS (UPSERT ATÓMICO)
    # =========================================================================

    def save_ficha(self, ficha_data: Dict[str, Any]) -> bool:
        """
        Inserta o actualiza una ficha técnica completa llamando al stored procedure
        'turismo.sp_guardar_ficha_tecnica(JSONB)'.
        """
        if not ficha_data or not ficha_data.get("nombre") or not ficha_data.get("cod_ficha"):
            return False

        conn = self.get_connection()
        cur = conn.cursor()
        try:
            cur.execute("SELECT turismo.sp_guardar_ficha_tecnica(%s::jsonb);", (json.dumps(ficha_data),))
            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            logger.error(f"❌ [DB] Error guardando ficha {ficha_data.get('cod_ficha')}: {e}")
            return False
        finally:
            cur.close()
            conn.close()

    def save_fichas_batch(self, fichas_list: List[Dict[str, Any]]) -> int:
        """Guarda un lote de fichas técnicas en una sola transacción."""
        if not fichas_list:
            return 0

        conn = self.get_connection()
        cur = conn.cursor()
        saved = 0
        try:
            for f in fichas_list:
                if f and f.get("cod_ficha") and f.get("nombre"):
                    cur.execute("SELECT turismo.sp_guardar_ficha_tecnica(%s::jsonb);", (json.dumps(f),))
                    saved += 1
            conn.commit()
            logger.info(f"✅ [DB] Lote de {saved} fichas técnicas sincronizado exitosamente.")
            return saved
        except Exception as e:
            conn.rollback()
            logger.error(f"❌ [DB] Error guardando lote de fichas: {e}")
            return saved
        finally:
            cur.close()
            conn.close()

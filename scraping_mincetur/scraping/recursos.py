import json
import logging
import re
from typing import Any, Dict, List, Optional
import requests

from .config import Config

logger = logging.getLogger("ScraperMINCETUR.Recursos")


def slugify(text: str) -> str:
    """Convierte texto en slug limpio para nombres de archivos."""
    if not text:
        return "desconocido"
    t = text.lower()
    t = re.sub(r"[áàäâ]", "a", t)
    t = re.sub(r"[éèëê]", "e", t)
    t = re.sub(r"[íìïî]", "i", t)
    t = re.sub(r"[óòöô]", "o", t)
    t = re.sub(r"[úùüû]", "u", t)
    t = re.sub(r"[ñ]", "n", t)
    t = re.sub(r"[^a-z0-9]+", "_", t)
    return t.strip("_")


class RecursosScraper:
    """Extractor de la base maestra de Recursos Turísticos del Perú."""

    def __init__(self, session: Optional[requests.Session] = None):
        self.session = session or requests.Session()
        self.session.headers.update(Config.HEADERS)
        self.session.verify = False

    def fetch_all_recursos_geoserver(self) -> List[Dict[str, Any]]:
        """
        Descarga los ~4,800 recursos turísticos del Perú desde el servicio
        GeoServer WFS oficial de MINCETUR (ProduSig:SIG1GEOIRT).
        """
        logger.info("Descargando inventario completo de recursos desde GeoServer SIG1GEOIRT...")
        params = {
            "service": "WFS",
            "version": "1.0.0",
            "request": "GetFeature",
            "typeName": "ProduSig:SIG1GEOIRT",
            "outputFormat": "application/json",
        }

        resp = self.session.get(Config.GEOSERVER_URL, params=params, timeout=45)
        resp.raise_for_status()
        data = resp.json()

        raw_features = data.get("features", [])
        recursos: List[Dict[str, Any]] = []

        for feat in raw_features:
            p = feat.get("properties", {})
            geom = feat.get("geometry") or {}
            coords = geom.get("coordinates", []) if isinstance(geom, dict) else []

            cod_reg = p.get("cod_reg") or p.get("codigo") or p.get("id")
            if not cod_reg:
                continue

            try:
                cod_int = int(cod_reg)
            except (ValueError, TypeError):
                continue

            # Limpiar categoría
            cat = p.get("des_categoria1") or p.get("categoria") or ""
            cat_clean = re.sub(r"^\d+\.\s*", "", cat).strip()

            lon = coords[0] if len(coords) > 0 else (p.get("x") or None)
            lat = coords[1] if len(coords) > 1 else (p.get("y") or None)

            nombre = (p.get("des_nombre") or p.get("nombre") or f"Recurso N° {cod_int}").strip()
            dpto = (p.get("des_region") or p.get("desdpto") or "").strip().upper()
            prov = (p.get("des_provincia") or p.get("desprov") or "").strip().upper()
            dist = (p.get("des_distrito") or p.get("desubigeo") or "").strip().upper()

            recurso_item = {
                "codigo": cod_int,
                "nombre": nombre,
                "categoria": cat_clean,
                "tipo_categoria": (p.get("des_categoria2") or p.get("tipo_categoria") or "").strip(),
                "subtipo_categoria": (p.get("des_categoria3") or p.get("subtipo_categoria") or "").strip(),
                "departamento": dpto,
                "provincia": prov,
                "distrito": dist,
                "jerarquia": (p.get("des_jerarquia") or p.get("desjerarquia") or "").strip(),
                "coordenadas": {
                    "latitud": lat,
                    "longitud": lon,
                },
                "url_ficha": f"{Config.FICHA_BASE_URL}/index.aspx?cod_Ficha={cod_int}",
                "foto_url": f"{Config.FICHA_BASE_URL}/foto.aspx?cod={cod_int}",
            }
            recursos.append(recurso_item)

        # Cargar códigos offline si existen para no incluir fichas retiradas
        offline_codes = set()
        if Config.FILE_OFFLINE_CODES.exists():
            try:
                with open(Config.FILE_OFFLINE_CODES, "r", encoding="utf-8") as f:
                    offline_raw = json.load(f)
                    if isinstance(offline_raw, list):
                        offline_codes = set(int(c) for c in offline_raw)
            except Exception as e:
                logger.warning(f"No se pudo cargar offline_codes.json: {e}")

        recursos_activos = [r for r in recursos if r["codigo"] not in offline_codes]
        logger.info(f"Se procesaron {len(recursos)} recursos (Activos: {len(recursos_activos)}, Offline/Excluidos: {len(offline_codes)}).")
        return recursos_activos

    def scrape_and_save_all(self, to_db: bool = True, to_json: bool = False) -> Dict[str, Any]:
        """Extrae la lista completa y la guarda en DB o JSON consolidado."""
        recursos = self.fetch_all_recursos_geoserver()

        # 1. Guardar en Base de Datos PostgreSQL
        if to_db:
            from .database import DatabaseManager
            db = DatabaseManager()
            db.save_recursos_resumen(recursos)

        # 2. Guardar en JSON local si se solicita
        if to_json:
            Config.ensure_directories()
            with open(Config.FILE_RECURSOS_RESUMEN, "w", encoding="utf-8") as f:
                json.dump(recursos, f, ensure_ascii=False, indent=2)

            por_dpto: Dict[str, List[Dict[str, Any]]] = {}
            for r in recursos:
                dpto_nombre = r.get("departamento") or "SIN_DEPARTAMENTO"
                por_dpto.setdefault(dpto_nombre, []).append(r)

            for dpto_name, dpto_recursos in por_dpto.items():
                filename = f"{slugify(dpto_name)}.json"
                filepath = Config.RECURSOS_DEP_DIR / filename
                with open(filepath, "w", encoding="utf-8") as f:
                    json.dump(dpto_recursos, f, ensure_ascii=False, indent=2)

            logger.info(f"✅ Catálogo de recursos guardado en JSON ({len(recursos)} recursos activos en total).")

        return {
            "total_recursos": len(recursos),
        }


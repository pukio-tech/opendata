import json
import logging
import re
from typing import Any, Dict, List, Optional
import requests

from .config import Config

logger = logging.getLogger("ScraperMINCETUR.Catalogos")


class CatalogosScraper:
    """Extractor y constructor de catálogos turísticos y geo-políticos de MINCETUR."""

    def __init__(self, session: Optional[requests.Session] = None):
        self.session = session or requests.Session()
        self.session.headers.update(Config.HEADERS)
        self.session.verify = False

    def _get_text(self, url: str, params: Optional[Dict[str, Any]] = None) -> str:
        """Petición GET segura devolviendo texto decodificado sin BOM."""
        resp = self.session.get(url, params=params, timeout=Config.TIMEOUT)
        resp.raise_for_status()
        text = resp.text.replace("\ufeff", "").strip()
        return text

    # =========================================================================
    # 1. CATEGORÍAS, TIPOS Y SUBTIPOS
    # =========================================================================

    def fetch_categorias_tree(self) -> List[Dict[str, Any]]:
        """
        Descarga y construye el árbol jerárquico de Categorías -> Tipos -> Subtipos.
        """
        logger.info("Descargando catálogos de categorías, tipos y subtipos...")

        url_cat = f"{Config.SIG_BASE_URL}/resource/js/json/atractivos.AT-Categoria.json"
        url_tipo = f"{Config.SIG_BASE_URL}/resource/js/json/atractivos.AT-TipoCategria.json"
        url_subtipo = f"{Config.SIG_BASE_URL}/resource/js/json/atractivos.AT-SubTipoCategria.json"

        raw_cat = json.loads(self._get_text(url_cat))
        raw_tipo = json.loads(self._get_text(url_tipo))
        raw_subtipo = json.loads(self._get_text(url_subtipo))

        # Agrupar subtipos por ID de tipo
        subtipos_map: Dict[str, List[Dict[str, Any]]] = {}
        for st in raw_subtipo:
            tipo_id = str(st.get("COD_TIPO_CATE") or st.get("atrac_tipo") or st.get("tipo") or "")
            if not tipo_id:
                continue
            subtipos_map.setdefault(tipo_id, []).append({
                "id_subtipo": st.get("COD_SUB_TIPO_CATE") or st.get("atrac_stipo"),
                "subtipo": (st.get("DES_SUB_TIPO_CATE") or st.get("subtipo_categoria") or "").strip(),
                "id_tipo": st.get("COD_TIPO_CATE") or st.get("atrac_tipo"),
            })

        # Agrupar tipos por ID de categoría
        tipos_map: Dict[str, List[Dict[str, Any]]] = {}
        for tp in raw_tipo:
            cat_id = str(tp.get("COD_CATEGORIA") or tp.get("atrac_categ") or tp.get("categoria") or "")
            tipo_id = str(tp.get("COD_TIPO_CATE") or tp.get("atrac_tipo") or tp.get("codigo") or "")
            if not cat_id or not tipo_id:
                continue

            tipos_map.setdefault(cat_id, []).append({
                "id_tipo": tp.get("COD_TIPO_CATE") or tp.get("atrac_tipo"),
                "tipo": (tp.get("DES_TIPO_CATE") or tp.get("tipo_categoria") or "").strip(),
                "id_categoria": tp.get("COD_CATEGORIA") or tp.get("atrac_categ"),
                "subtipos": subtipos_map.get(tipo_id, []),
            })

        # Construir árbol final
        arbol: List[Dict[str, Any]] = []
        for cat in raw_cat:
            cat_id = str(cat.get("COD_CATEGORIA") or cat.get("atrac_categ") or cat.get("codigo") or "")
            if not cat_id:
                continue

            arbol.append({
                "id_categoria": cat.get("COD_CATEGORIA") or cat.get("atrac_categ"),
                "categoria": (cat.get("DES_CATEGORIA") or cat.get("categoria") or "").strip(),
                "tipos": tipos_map.get(cat_id, []),
            })

        logger.info(f"Árbol de categorías generado con {len(arbol)} categorías principales.")
        return arbol

    # =========================================================================
    # 2. ACTIVIDADES Y SUB-ACTIVIDADES TURÍSTICAS
    # =========================================================================

    def fetch_actividades_tree(self) -> List[Dict[str, Any]]:
        """
        Descarga y parsea el catálogo de Actividades y Sub-actividades desde jquery-objects.js.
        """
        logger.info("Descargando catálogo de actividades y deportes...")
        url = f"{Config.SIG_BASE_URL}/resource/js/jquery-objects.js"
        content = self._get_text(url)

        match = re.search(r"var\s+arrOpcionActividad\s*=\s*(\[.*?\])\s*;?\s*(?:var|$)", content, re.DOTALL)
        if not match:
            raise ValueError("No se pudo encontrar arrOpcionActividad en jquery-objects.js")

        js_array = match.group(1)
        # Normalizar claves a JSON válido
        json_str = re.sub(r"(\b\w+\b)\s*:", r'"\1":', js_array)
        json_str = re.sub(r",\s*([\]}])", r"\1", json_str)
        items = json.loads(json_str)

        catalogo: List[Dict[str, Any]] = []
        cat_map: Dict[int, Dict[str, Any]] = {}

        for item in items:
            nivel = item.get("num_nivel")
            atrac_acti = item.get("atrac_acti")

            if nivel == 1:
                cat_data = {
                    "id": item.get("id"),
                    "codigo": item.get("codigo"),
                    "id_actividad": atrac_acti,
                    "nombre": (item.get("tipocate_descrip") or "").strip(),
                    "imagen": f"https://sigmincetur.mincetur.gob.pe{item.get('imagen')}" if item.get("imagen") else None,
                    "sub_actividades": [],
                }
                catalogo.append(cat_data)
                if atrac_acti is not None:
                    cat_map[atrac_acti] = cat_data

            elif nivel == 2:
                sub_data = {
                    "id": item.get("id"),
                    "codigo": item.get("codigo"),
                    "id_actividad": atrac_acti,
                    "id_subactividad": item.get("atrac_acti_tipo"),
                    "nombre": (item.get("tipocate_descrip") or "").strip(),
                    "codigo_tipo": item.get("tipocate_codigo"),
                    "imagen": f"https://sigmincetur.mincetur.gob.pe{item.get('imagen')}" if item.get("imagen") else None,
                }
                if atrac_acti in cat_map:
                    cat_map[atrac_acti]["sub_actividades"].append(sub_data)

        logger.info(f"Árbol de actividades generado con {len(catalogo)} grupos principales.")
        return catalogo

    # =========================================================================
    # 3. LÍMITES POLÍTICOS GEOSERVER WFS (Departamentos, Provincias, Distritos)
    # =========================================================================

    def fetch_departamentos(self) -> List[Dict[str, Any]]:
        """Descarga la lista de Departamentos del Perú con sus códigos de UBIGEO."""
        logger.info("Consultando Departamentos desde GeoServer WFS...")
        params = {
            "service": "WFS",
            "version": "1.0.0",
            "request": "GetFeature",
            "typeName": "ProduSig:ubigeo.Departamentos",
            "outputFormat": "application/json",
        }
        try:
            resp = self.session.get(Config.GEOSERVER_URL, params=params, timeout=Config.TIMEOUT)
            resp.raise_for_status()
            data = resp.json()
            features = data.get("features", [])
            deptos = []
            for f in features:
                p = f.get("properties", {})
                iddpto = str(p.get("CODREGION") or p.get("iddpto") or p.get("idregion") or "").zfill(2)
                nombre = (p.get("NOMBRE") or p.get("departamento") or p.get("desdpto") or "").strip().upper()
                if iddpto and nombre:
                    deptos.append({
                        "iddpto": iddpto,
                        "departamento": nombre,
                    })
            deptos.sort(key=lambda d: d["iddpto"])
            if deptos:
                logger.info(f"Se obtuvieron {len(deptos)} departamentos de GeoServer.")
                return deptos
        except Exception as e:
            logger.warning(f"Error consultando GeoServer Departamentos ({e}), usando lista estándar.")

        # Fallback oficial estándar de 25 departamentos
        fallback = [
            {"iddpto": "01", "departamento": "AMAZONAS"},
            {"iddpto": "02", "departamento": "ANCASH"},
            {"iddpto": "03", "departamento": "APURIMAC"},
            {"iddpto": "04", "departamento": "AREQUIPA"},
            {"iddpto": "05", "departamento": "AYACUCHO"},
            {"iddpto": "06", "departamento": "CAJAMARCA"},
            {"iddpto": "07", "departamento": "CALLAO"},
            {"iddpto": "08", "departamento": "CUSCO"},
            {"iddpto": "09", "departamento": "HUANCAVELICA"},
            {"iddpto": "10", "departamento": "HUANUCO"},
            {"iddpto": "11", "departamento": "ICA"},
            {"iddpto": "12", "departamento": "JUNIN"},
            {"iddpto": "13", "departamento": "LA LIBERTAD"},
            {"iddpto": "14", "departamento": "LAMBAYEQUE"},
            {"iddpto": "15", "departamento": "LIMA"},
            {"iddpto": "16", "departamento": "LORETO"},
            {"iddpto": "17", "departamento": "MADRE DE DIOS"},
            {"iddpto": "18", "departamento": "MOQUEGUA"},
            {"iddpto": "19", "departamento": "PASCO"},
            {"iddpto": "20", "departamento": "PIURA"},
            {"iddpto": "21", "departamento": "PUNO"},
            {"iddpto": "22", "departamento": "SAN MARTIN"},
            {"iddpto": "23", "departamento": "TACNA"},
            {"iddpto": "24", "departamento": "TUMBES"},
            {"iddpto": "25", "departamento": "UCAYALI"},
        ]
        return fallback

    def fetch_provincias(self) -> List[Dict[str, Any]]:
        """Descarga las Provincias desde GeoServer WFS."""
        logger.info("Consultando Provincias desde GeoServer WFS...")
        params = {
            "service": "WFS",
            "version": "1.0.0",
            "request": "GetFeature",
            "typeName": "ProduSig:ubigeo.Provincias",
            "outputFormat": "application/json",
        }
        try:
            resp = self.session.get(Config.GEOSERVER_URL, params=params, timeout=Config.TIMEOUT)
            resp.raise_for_status()
            data = resp.json()
            features = data.get("features", [])
            provincias = []
            for f in features:
                p = f.get("properties", {})
                idprov = str(p.get("CODPROV") or p.get("idprov") or "").strip()
                nombre = (p.get("NOMBRE") or p.get("provincia") or p.get("desprov") or "").strip().upper()
                iddpto = str(p.get("CODREGION") or p.get("iddpto") or "").strip().zfill(2)
                if nombre:
                    provincias.append({
                        "idprov": idprov,
                        "provincia": nombre,
                        "iddpto": iddpto,
                    })
            provincias.sort(key=lambda x: (x["iddpto"], x["provincia"]))
            logger.info(f"Se obtuvieron {len(provincias)} provincias.")
            return provincias
        except Exception as e:
            logger.warning(f"No se pudieron descargar provincias de GeoServer: {e}")
            return []

    # =========================================================================
    # 4. GUARDAR TODOS LOS CATÁLOGOS EN DISCO
    # =========================================================================

    def scrape_and_save_all(self) -> Dict[str, Any]:
        """Ejecuta la extracción de todos los catálogos y los guarda en JSON."""
        Config.ensure_directories()

        categorias = self.fetch_categorias_tree()
        with open(Config.FILE_CATEGORIAS, "w", encoding="utf-8") as f:
            json.dump(categorias, f, ensure_ascii=False, indent=2)

        actividades = self.fetch_actividades_tree()
        with open(Config.FILE_ACTIVIDADES, "w", encoding="utf-8") as f:
            json.dump(actividades, f, ensure_ascii=False, indent=2)

        deptos = self.fetch_departamentos()
        with open(Config.FILE_DEPARTAMENTOS, "w", encoding="utf-8") as f:
            json.dump(deptos, f, ensure_ascii=False, indent=2)

        provincias = self.fetch_provincias()
        if provincias:
            with open(Config.FILE_PROVINCIAS, "w", encoding="utf-8") as f:
                json.dump(provincias, f, ensure_ascii=False, indent=2)

        logger.info("✅ Todos los catálogos han sido guardados exitosamente en data/catalogos/")
        return {
            "categorias_count": len(categorias),
            "actividades_count": len(actividades),
            "departamentos_count": len(deptos),
            "provincias_count": len(provincias),
        }

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MINCETUR Turismo API Client & Scraper
======================================
Cliente completo en Python para interactuar con el Sistema de Información
Georreferencial de Turismo (SIG MINCETUR) y las Fichas del Inventario Nacional.

Autor: Asistente de IA
"""

import json
import re
import ssl
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional


class MinceturAPI:
    """Cliente para consumir las APIs y recursos de SIG MINCETUR."""

    BASE_URL = "https://sigmincetur.mincetur.gob.pe/turismo"
    GEOSERVER_URL = "https://sigmincetur.mincetur.gob.pe/geoserver/ProduSig/ows"
    FICHA_BASE_URL = "https://consultasenlinea.mincetur.gob.pe/fichaInventario"

    def __init__(self):
        # Deshabilitar verificación estricta SSL si hay certificados intermedios no reconocidos
        self.ssl_ctx = ssl.create_default_context()
        self.ssl_ctx.check_hostname = False
        self.ssl_ctx.verify_mode = ssl.CERT_NONE

        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json, text/javascript, */*; q=0.01",
        }

    def _http_get(self, url: str, params: Optional[Dict[str, Any]] = None, headers: Optional[Dict[str, str]] = None) -> str:
        """Realiza una petición GET HTTP segura."""
        if params:
            query_string = urllib.parse.urlencode(params)
            sep = "&" if "?" in url else "?"
            url = f"{url}{sep}{query_string}"

        req_headers = self.headers.copy()
        if headers:
            req_headers.update(headers)

        req = urllib.request.Request(url, headers=req_headers)
        with urllib.request.urlopen(req, context=self.ssl_ctx, timeout=30) as resp:
            return resp.read().decode("utf-8", errors="ignore")

    # =========================================================================
    # 1. CATÁLOGOS DE CATEGORÍAS Y ACTIVIDADES
    # =========================================================================

    def obtener_categorias_atractivos(self) -> List[Dict[str, Any]]:
        """Obtiene las categorías principales de recursos turísticos."""
        url = f"{self.BASE_URL}/resource/js/json/atractivos.AT-Categoria.json"
        raw = self._http_get(url)
        return json.loads(raw.lstrip("\ufeff"))

    def obtener_tipos_categoria(self) -> List[Dict[str, Any]]:
        """Obtiene los tipos asociados a las categorías de atractivos."""
        url = f"{self.BASE_URL}/resource/js/json/atractivos.AT-TipoCategria.json"
        raw = self._http_get(url)
        return json.loads(raw.lstrip("\ufeff"))

    def obtener_subtipos_categoria(self) -> List[Dict[str, Any]]:
        """Obtiene los subtipos asociados a los tipos de atractivos."""
        url = f"{self.BASE_URL}/resource/js/json/atractivos.AT-SubTipoCategria.json"
        raw = self._http_get(url)
        return json.loads(raw.lstrip("\ufeff"))

    def obtener_arbol_categorias_completo(self) -> List[Dict[str, Any]]:
        """Construye el árbol jerárquico completo: Categoría -> Tipo -> Subtipo."""
        categorias = self.obtener_categorias_atractivos()
        tipos = self.obtener_tipos_categoria()
        subtipos = self.obtener_subtipos_categoria()

        # Mapear subtipos por id de tipo
        subtipos_por_tipo: Dict[Any, List[Dict[str, Any]]] = {}
        for st in subtipos:
            t_id = st.get("atrac_tipo") or st.get("tipo")
            subtipos_por_tipo.setdefault(t_id, []).append(st)

        # Mapear tipos por id de categoría
        tipos_por_cat: Dict[Any, List[Dict[str, Any]]] = {}
        for t in tipos:
            c_id = t.get("atrac_categ") or t.get("categoria")
            t_copy = dict(t)
            t_id = t.get("atrac_tipo") or t.get("codigo")
            t_copy["subtipos"] = subtipos_por_tipo.get(t_id, [])
            tipos_por_cat.setdefault(c_id, []).append(t_copy)

        arbol = []
        for cat in categorias:
            c_copy = dict(cat)
            c_id = cat.get("atrac_categ") or cat.get("codigo")
            c_copy["tipos"] = tipos_por_cat.get(c_id, [])
            arbol.append(c_copy)

        return arbol

    def obtener_actividades(self) -> List[Dict[str, Any]]:
        """
        Descarga dinámicamente el catálogo jerárquico de Actividades y Sub-actividades
        desde jquery-objects.js.
        """
        url = f"{self.BASE_URL}/resource/js/jquery-objects.js"
        content = self._http_get(url)

        match = re.search(r"var\s+arrOpcionActividad\s*=\s*(\[.*?\])\s*;?\s*(?:var|$)", content, re.DOTALL)
        if not match:
            raise ValueError("No se pudo encontrar arrOpcionActividad en jquery-objects.js")

        js_array = match.group(1)
        json_str = re.sub(r"(\b\w+\b)\s*:", r'"\1":', js_array)
        json_str = re.sub(r",\s*([\]}])", r"\1", json_str)
        items = json.loads(json_str)

        catalogo = []
        cat_map = {}

        for item in items:
            if item.get("num_nivel") == 1:
                cat = {
                    "id": item.get("id"),
                    "codigo": item.get("codigo"),
                    "atrac_acti": item.get("atrac_acti"),
                    "nombre": item.get("tipocate_descrip"),
                    "imagen": f"https://sigmincetur.mincetur.gob.pe{item.get('imagen')}" if item.get("imagen") else None,
                    "sub_actividades": [],
                }
                catalogo.append(cat)
                cat_map[item.get("atrac_acti")] = cat
            elif item.get("num_nivel") == 2:
                sub = {
                    "id": item.get("id"),
                    "codigo": item.get("codigo"),
                    "atrac_acti": item.get("atrac_acti"),
                    "atrac_acti_tipo": item.get("atrac_acti_tipo"),
                    "nombre": item.get("tipocate_descrip"),
                    "tipocate_codigo": item.get("tipocate_codigo"),
                    "imagen": f"https://sigmincetur.mincetur.gob.pe{item.get('imagen')}" if item.get("imagen") else None,
                }
                parent_id = item.get("atrac_acti")
                if parent_id in cat_map:
                    cat_map[parent_id]["sub_actividades"].append(sub)

        return catalogo

    # =========================================================================
    # 2. GEOSERVER WFS (Límites Departamentales, Provincias, Distritos)
    # =========================================================================

    def obtener_departamentos_geojson(self) -> Dict[str, Any]:
        """Obtiene el GeoJSON con la geometría y datos de todos los Departamentos del Perú."""
        params = {
            "service": "WFS",
            "version": "1.0.0",
            "request": "GetFeature",
            "typeName": "ProduSig:ubigeo.Departamentos",
            "outputFormat": "application/json",
        }
        raw = self._http_get(self.GEOSERVER_URL, params=params)
        return json.loads(raw)

    def obtener_provincias_geojson(self, cod_dpto: Optional[str] = None) -> Dict[str, Any]:
        """Obtiene las Provincias desde GeoServer WFS (con filtro CQL opcional)."""
        params = {
            "service": "WFS",
            "version": "1.0.0",
            "request": "GetFeature",
            "typeName": "ProduSig:ubigeo.Provincias",
            "outputFormat": "application/json",
        }
        if cod_dpto:
            params["CQL_FILTER"] = f"iddpto='{cod_dpto}'"
        raw = self._http_get(self.GEOSERVER_URL, params=params)
        return json.loads(raw)

    def obtener_distritos_geojson(self, cod_prov: Optional[str] = None) -> Dict[str, Any]:
        """Obtiene los Distritos desde GeoServer WFS (con filtro CQL opcional)."""
        params = {
            "service": "WFS",
            "version": "1.0.0",
            "request": "GetFeature",
            "typeName": "ProduSig:ubigeo.Distritos",
            "outputFormat": "application/json",
        }
        if cod_prov:
            params["CQL_FILTER"] = f"idprov='{cod_prov}'"
        raw = self._http_get(self.GEOSERVER_URL, params=params)
        return json.loads(raw)

    # =========================================================================
    # 3. BÚSQUEDA Y CONSULTA DE RECURSOS TURÍSTICOS
    # =========================================================================

    def buscar_recursos(
        self,
        texto_busqueda: Optional[str] = None,
        id_actividad: Optional[Any] = None,
        id_subactividad: Optional[Any] = None,
        id_categoria: Optional[Any] = None,
        id_tipo: Optional[Any] = None,
        id_subtipo: Optional[Any] = None,
        cod_ubigeo_dpto: Optional[str] = None,
        tab_operacion: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Consulta los recursos turísticos aplicando filtros de actividad, ubicación o categoría.
        Retorna la lista de GeoJSON Features con todos los atributos de cada recurso.
        """
        url = f"{self.BASE_URL}/sistema/consulta/selectData2.ashx"
        params: Dict[str, Any] = {"tabOpr": tab_operacion}

        if texto_busqueda:
            params["txtBuscar"] = texto_busqueda
        if id_actividad:
            params["atracActi"] = str(id_actividad)
        if id_subactividad:
            params["atracActiTipo"] = str(id_subactividad)
        if id_categoria:
            params["atracCateg"] = str(id_categoria)
        if id_tipo:
            params["atracTipo"] = str(id_tipo)
        if id_subtipo:
            params["atracStipo"] = str(id_subtipo)
        if cod_ubigeo_dpto:
            params["codUbigeoGeo"] = str(cod_ubigeo_dpto)

        headers = {"X-Requested-With": "XMLHttpRequest"}
        raw = self._http_get(url, params=params, headers=headers)
        data = json.loads(raw)
        return data.get("features", [])

    # =========================================================================
    # 4. EXTRACCIÓN DETALLADA DE LA FICHA DE INVENTARIO
    # =========================================================================

    def obtener_detalle_ficha(self, cod_ficha: int) -> Dict[str, Any]:
        """
        Descarga y parsea la Ficha Oficial del Inventario Nacional de Recursos Turísticos
        (ej: https://consultasenlinea.mincetur.gob.pe/fichaInventario/index.aspx?cod_Ficha=62).
        Extrae datos generales, fotos, descripción, accesos y actividades.
        """
        url = f"{self.FICHA_BASE_URL}/index.aspx?cod_Ficha={cod_ficha}"
        html = self._http_get(url)

        detalle: Dict[str, Any] = {
            "cod_ficha": cod_ficha,
            "url_ficha": url,
            "nombre": "",
            "departamento": "",
            "provincia": "",
            "distrito": "",
            "categoria": "",
            "tipo": "",
            "subtipo": "",
            "jerarquia": "",
            "altitud": "",
            "foto_principal": "",
            "galeria_fotos": [],
            "actividades_permitidas": [],
            "descripcion": "",
            "particularidades": "",
            "estado_actual": "",
            "observaciones": "",
        }

        # Extraer título / nombre
        nombre_m = re.search(r'<div class="TituloRecurso">\s*([^<]+)\s*</div>', html)
        if nombre_m:
            detalle["nombre"] = nombre_m.group(1).strip()
        else:
            og_title = re.search(r'<meta property="og:title" content="([^"]+)"', html)
            if og_title:
                detalle["nombre"] = og_title.group(1).strip()

        # Extraer descripción desde meta tag o texto
        og_desc = re.search(r'<meta property="og:description" content="([^"]+)"', html)
        if og_desc:
            detalle["descripcion"] = og_desc.group(1).strip()

        # Extraer campos de la tabla de propiedades
        field_patterns = {
            "departamento": r"Departamento:</span>\s*</td>\s*<td>\s*<span class=\"TextGris\">([^<]+)</span>",
            "provincia": r"Provincia:</span>\s*<td>\s*<span class=\"TextGris\">([^<]+)</span>",
            "distrito": r"Distrito:</span>\s*</td>\s*<td>\s*<span class=\"TextGris\">([^<]+)</span>",
            "categoria": r"Categoría:</span>\s*</td>\s*<td>\s*<span class=\"TextGris2\">([^<]+)</span>",
            "tipo": r"Tipo:</span>\s*</td>\s*<td>\s*<span class=\"TextGris2\">([^<]+)</span>",
            "subtipo": r"Subtipo:</span>\s*</td>\s*<td>\s*<span class=\"TextGris2\">([^<]+)</span>",
            "jerarquia": r"Jerarquía:</span>\s*</td>\s*<td>\s*<span class=\"TextGris2\"[^>]*>\s*([^<\s]+)\s*</span>",
            "altitud": r"Altitud:</span>\s*</td>\s*<td>\s*<span class=\"TextGris2\"[^>]*>\s*([^<\s]+)\s*</span>",
        }

        for field, pat in field_patterns.items():
            match = re.search(pat, html, re.IGNORECASE)
            if match:
                detalle[field] = match.group(1).strip()

        # Extraer foto principal
        og_img = re.search(r'<meta property="og:image" content="([^"]+)"', html)
        if og_img:
            detalle["foto_principal"] = og_img.group(1).strip()

        # Extraer todas las fotos de la galería
        fotos_ids = set(re.findall(r"foto\.aspx\?cod=(\d+)", html))
        detalle["galeria_fotos"] = [f"{self.FICHA_BASE_URL}/foto.aspx?cod={f_id}" for f_id in sorted(fotos_ids)]

        # Extraer actividades con íconos
        actividades_m = re.findall(r'<img [^>]*title="([^"]+)"\s*/>', html)
        detalle["actividades_permitidas"] = [act for act in actividades_m if act]

        return detalle


# =============================================================================
# DEMOSTRACIÓN DE USO
# =============================================================================
if __name__ == "__main__":
    import sys
    # Forzar soporte UTF-8 en consola de Windows
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    api = MinceturAPI()

    print("=" * 70)
    print("1. CATÁLOGO DE ACTIVIDADES TURÍSTICAS")
    print("=" * 70)
    actividades = api.obtener_actividades()
    for cat in actividades:
        print(f"\n[{cat['codigo']}] {cat['nombre']} (ID: {cat['atrac_acti']})")
        for sub in cat["sub_actividades"]:
            print(f"   └── [{sub['codigo']}] {sub['nombre']} (ID Tipo: {sub['atrac_acti_tipo']})")

    print("\n" + "=" * 70)
    print("2. BÚSQUEDA DE RECURSOS POR ACTIVIDAD (Ejemplo: Paseos en Bote ID: 17)")
    print("=" * 70)
    recursos = api.buscar_recursos(id_subactividad=17, cod_ubigeo_dpto="15")  # Lima
    print(f"Total recursos encontrados en Lima con Paseos en Bote: {len(recursos)}")
    if recursos:
        rec = recursos[0]["properties"]
        print(f"-> Nombre: {rec['nombre']}")
        print(f"-> Código Ficha: {rec['codigo']}")
        print(f"-> Ubicación: {rec.get('desdpto')} - {rec.get('desprov')} - {rec.get('desubigeo')}")
        print(f"-> Coordenadas: Lon={rec.get('x')}, Lat={rec.get('y')}")
        print(f"-> URL Ficha: {rec.get('url')}")

    print("\n" + "=" * 70)
    print("3. EXTRACCIÓN DE FICHA DETALLADA (Ficha N° 62: Manglares de San Pedro de Vice)")
    print("=" * 70)
    ficha = api.obtener_detalle_ficha(cod_ficha=62)
    print(f"Nombre: {ficha['nombre']}")
    print(f"Ubicación: {ficha['departamento']} / {ficha['provincia']} / {ficha['distrito']}")
    print(f"Clasificación: {ficha['categoria']} > {ficha['tipo']} > {ficha['subtipo']}")
    print(f"Jerarquía: {ficha['jerarquia']} | Altitud: {ficha['altitud']}")
    print(f"Total fotos en galería: {len(ficha['galeria_fotos'])}")
    print(f"Actividades permitidas: {', '.join(ficha['actividades_permitidas'])}")
    print(f"\nDescripción resumida:\n{ficha['descripcion'][:250]}...")


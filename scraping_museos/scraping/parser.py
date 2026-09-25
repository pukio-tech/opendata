"""
Módulo Parser para procesar el HTML de las fichas de detalle de museos.cultura.pe
Extrae información estructurada, geolocalización, tarifas, servicios y enlaces de imágenes.
"""

import html
import logging
import re
import urllib.parse
from typing import Any, Dict, List, Optional
from bs4 import BeautifulSoup
from .config import Config

logger = logging.getLogger("ScraperMuseos.Parser")


class MuseoParser:
    """Parser de fichas técnicas y páginas de detalle de museos."""

    @staticmethod
    def _clean_text(text: Optional[str]) -> str:
        """Limpia caracteres de escape y espacios sobrantes."""
        if not text:
            return ""
        # Decodificar entidades HTML (&oacute;, &aacute;, etc.)
        cleaned = html.unescape(text)
        # Normalizar espacios y saltos de línea repetidos
        lines = [re.sub(r"[ \t]+", " ", line).strip() for line in cleaned.splitlines()]
        return "\n".join(line for line in lines if line).strip()

    @classmethod
    def parse_html(cls, html_content: str, source_url: str, default_category: str = "Ministerio de Cultura", card_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Parsea el HTML completo de una página de museo y retorna un diccionario estructurado.
        """
        soup = BeautifulSoup(html_content, "html.parser")
        card_data = card_data or {}
        slug = source_url.rstrip("/").split("/")[-1]
        slug = urllib.parse.unquote(slug)

        # 1. Nombre / Título
        title_elem = soup.find(class_="field--name-node-title") or soup.find("h1")
        nombre = cls._clean_text(title_elem.get_text() if title_elem else "")
        if not nombre:
            nombre = card_data.get("nombre", slug.replace("-", " ").title())

        # 2. Estado (Abierto / Cerrado)
        estado_elem = soup.find(class_="field--name-dynamic-block-fieldnode-museo-cabecera")
        estado_raw = cls._clean_text(estado_elem.get_text() if estado_elem else "")
        estado = "Abierto"
        if "cerrado" in estado_raw.lower():
            estado = "Cerrado"
        elif "mantenimiento" in estado_raw.lower():
            estado = "En mantenimiento"
        elif estado_raw:
            estado = estado_raw

        # 3. Ubicación: Ubigeo texto, Departamento, Provincia, Distrito
        ubigeo_elem = soup.find(class_="field--name-field-museo-ubigeotexto")
        ubigeo_texto = cls._clean_text(ubigeo_elem.get_text() if ubigeo_elem else "")
        
        departamento, provincia, distrito = "", "", ""
        if ubigeo_texto and "-" in ubigeo_texto:
            parts = [p.strip() for p in ubigeo_texto.split("-")]
            if len(parts) >= 1:
                departamento = parts[0].title()
            if len(parts) >= 2:
                provincia = parts[1].title()
            if len(parts) >= 3:
                distrito = parts[2].title()

        # 4. Dirección física
        dir_elem = soup.find(class_="field--name-field-museo-direccion")
        direccion = ""
        if dir_elem:
            dir_clone = BeautifulSoup(str(dir_elem), "html.parser")
            label = dir_clone.find(class_="field__label")
            if label:
                label.decompose()
            direccion = cls._clean_text(dir_clone.get_text())

        # 5. Horarios de atención
        hor_elem = soup.find(class_="field--name-field-museo-horarioresumen")
        horario = ""
        if hor_elem:
            hor_clone = BeautifulSoup(str(hor_elem), "html.parser")
            label = hor_clone.find(class_="field__label")
            if label:
                label.decompose()
            horario = cls._clean_text(hor_clone.get_text(separator="\n"))

        # 6. Tarifario: Descripción normativa y Desglose
        tar_desc_elem = soup.find(class_="field--name-field-museo-tarifario")
        tarifario_desc = ""
        if tar_desc_elem:
            tar_clone = BeautifulSoup(str(tar_desc_elem), "html.parser")
            label = tar_clone.find(class_="field__label")
            if label:
                label.decompose()
            tarifario_desc = cls._clean_text(tar_clone.get_text(separator="\n"))

        tarifas_list: List[Dict[str, Any]] = []
        tar_items_elem = soup.find(class_="field--name-field-museo-tarifas")
        if tar_items_elem:
            for it in tar_items_elem.find_all(class_="field__item"):
                txt = cls._clean_text(it.get_text())
                if not txt:
                    continue
                # Parsear precio numérico (ej. "Adultos : S/.15.0" o "Gratuito: S/.0.0")
                m_price = re.search(r"S/\.?\s*([0-9]+(?:\.[0-9]+)?)", txt, re.IGNORECASE)
                precio = float(m_price.group(1)) if m_price else 0.0
                tipo = re.sub(r"S/\.?\s*[0-9]+(?:\.[0-9]+)?", "", txt, flags=re.IGNORECASE).strip(" :-")
                tarifas_list.append({
                    "tipo": tipo or "General",
                    "descripcion": txt,
                    "precio": precio,
                    "moneda": "PEN",
                })

        # 7. Administración
        adm_elem = soup.find(class_="field--name-field-museo-tax-administracion")
        administracion = ""
        if adm_elem:
            adm_clone = BeautifulSoup(str(adm_elem), "html.parser")
            label = adm_clone.find(class_="field__label")
            if label:
                label.decompose()
            administracion = cls._clean_text(adm_clone.get_text())
        if not administracion:
            administracion = "Ministerio de Cultura" if default_category == "Ministerio de Cultura" else "Público / Privado"

        # 8. Contacto: Teléfono y Correo Electrónico
        tel_elem = soup.find(class_="field--name-field-museo-telefono")
        telefono = ""
        if tel_elem:
            tel_clone = BeautifulSoup(str(tel_elem), "html.parser")
            label = tel_clone.find(class_="field__label")
            if label:
                label.decompose()
            telefono = cls._clean_text(tel_clone.get_text())

        em_elem = soup.find(class_="field--name-field-museo-email")
        email = ""
        if em_elem:
            em_clone = BeautifulSoup(str(em_elem), "html.parser")
            label = em_clone.find(class_="field__label")
            if label:
                label.decompose()
            email = cls._clean_text(em_clone.get_text())

        # 9. Enlaces Oficiales (Solo URLs válidas con contenido real)
        def is_valid_url(url: Optional[str]) -> bool:
            if not url or not isinstance(url, str):
                return False
            u = url.strip().lower()
            if u in ("", "#", "/", "/#", "javascript:", "javascript:void(0)", "javascript:void(0);", "mailto:"):
                return False
            if u.startswith("javascript:") or u.startswith("mailto:"):
                return False
            if u.endswith("/#") or u.endswith("#"):
                # Quitar anclas vacías
                u = u.rstrip("/#").rstrip("#")
            if not (u.startswith("http://") or u.startswith("https://") or u.startswith("/")):
                return False
            # Descartar links que sean solo la raíz genérica sin contenido específico
            if u in ("http://", "https://", "https://museos.cultura.pe", "https://museos.cultura.pe/", "http://museos.cultura.pe", "http://museos.cultura.pe/"):
                return False
            return len(u) > 10

        def get_href(cls_name: str) -> Optional[str]:
            f = soup.find(class_=cls_name)
            if f:
                a = f.find("a")
                if a and "href" in a.attrs:
                    val = a["href"].strip()
                    if is_valid_url(val):
                        if val.startswith("/"):
                            return f"{Config.BASE_URL}{val}"
                        return val
            return None

        recorrido_virtual = get_href("field--name-field-museo-recorrido-virtual")
        if not recorrido_virtual and card_data.get("recorrido_virtual_tarjeta"):
            card_rec = card_data.get("recorrido_virtual_tarjeta")
            if is_valid_url(card_rec):
                recorrido_virtual = card_rec

        coleccion_virtual = get_href("field--name-field-museo-acceso-coleccion")
        web_oficial = get_href("field--name-field-museo-web")

        # 10. Reseña Histórica / Descripción Real del Museo
        descripcion = ""
        full_node = soup.find(class_="node--view-mode-full") or soup.find(class_="layout-content")
        if full_node:
            body = full_node.find(class_="field--name-body")
            if body:
                descripcion = cls._clean_text(body.get_text(separator="\n"))

        if not descripcion:
            # Fallback buscando todos los bloques field--name-body excluyendo cabecera y pie de página
            for b in soup.find_all(class_="field--name-body"):
                if any(p.get("class") and any(c in ["cabecera_estandar", "footer_first", "footer_second", "navbar", "header_first"] for c in p.get("class")) for p in b.parents):
                    continue
                txt = cls._clean_text(b.get_text(separator="\n"))
                if len(txt) > 30 and "Patrimonio Cultural" not in txt and "Sede central" not in txt and "Síguenos en" not in txt:
                    descripcion = txt
                    break

        # 11. Geolocalización (Latitud y Longitud calculadas desde el mapa)
        map_elem = soup.find(class_="field--name-field-museo-museomapaiframe")
        latitud: Optional[float] = None
        longitud: Optional[float] = None

        if map_elem:
            ifrm = map_elem.find("iframe")
            if ifrm and "src" in ifrm.attrs:
                mapa_src = ifrm["src"].strip()
                # Extraer coordenadas de Google Maps Embed: !2d<lng>!3d<lat>
                m_coords = re.search(r"!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)", mapa_src)
                if m_coords:
                    longitud = float(m_coords.group(1))
                    latitud = float(m_coords.group(2))
                else:
                    m_q = re.search(r"q=(-?\d+\.\d+),(-?\d+\.\d+)", mapa_src)
                    if m_q:
                        latitud = float(m_q.group(1))
                        longitud = float(m_q.group(2))

        # 12. Enlaces de Imagen de Cabecera y Tarjeta (Solo URLs)
        imagen_portada = ""
        cabecera = soup.find(class_="view-museo-cabecera")
        if cabecera:
            c_img = cabecera.find("img")
            if c_img and "src" in c_img.attrs:
                src = c_img["src"].strip()
                imagen_portada = src if src.startswith("http") else f"{Config.BASE_URL}{src}"
        
        imagen_tarjeta = card_data.get("imagen_tarjeta") or imagen_portada

        # 13. Servicios / Facilidades disponibles (Extracción precisa de Íconos PNG/SVG)
        servicios_list: List[Dict[str, str]] = []
        serv_container = soup.find(class_="field--name-field-museo-servicios")
        if serv_container:
            # Buscar cada columna o bloque contenedor de servicio
            cols = serv_container.find_all(class_=re.compile(r"\bcol\b"))
            if not cols:
                cols = serv_container.find_all("div", class_="field__item")

            for col in cols:
                title_elem = col.find(class_="field--name-taxonomy-term-title") or col.find("p") or col.find(class_="field__item")
                s_name = cls._clean_text(title_elem.get_text() if title_elem else "")
                if not s_name:
                    continue
                
                # Buscar imagen del ícono
                img_item = col.find("img")
                icon_url = ""
                if img_item:
                    isrc = img_item.get("data-src") or img_item.get("src") or ""
                    if isrc and not isrc.startswith("data:"):
                        icon_url = isrc if isrc.startswith("http") else f"{Config.BASE_URL}{isrc}"
                
                servicios_list.append({
                    "nombre": s_name,
                    "icono_url": icon_url,
                })

        # 14. Galería Fotográfica (Solo URLs)
        galeria_list: List[Dict[str, str]] = []
        gal_container = soup.find(class_="slick--field-museo-galeria")
        if gal_container:
            for slide in gal_container.find_all(class_="slick__slide"):
                g_img = slide.find("img")
                if g_img:
                    g_src = g_img.get("data-src") or g_img.get("src") or ""
                    if g_src and not g_src.startswith("data:"):
                        full_src = g_src if g_src.startswith("http") else f"{Config.BASE_URL}{g_src}"
                        alt_txt = cls._clean_text(g_img.get("alt", "") or nombre)
                        galeria_list.append({
                            "url": full_src,
                            "alt": alt_txt,
                        })

        return {
            "slug": slug,
            "nombre": nombre,
            "categoria": default_category,
            "tipo_museo": default_category,
            "administracion": administracion,
            "estado": estado,
            "ubigeo_texto": ubigeo_texto,
            "departamento": departamento,
            "provincia": provincia,
            "distrito": distrito,
            "ubigeo": None,
            "direccion": direccion,
            "latitud": latitud,
            "longitud": longitud,
            "horario_atencion": horario,
            "tarifario_descripcion": tarifario_desc,
            "tarifas": tarifas_list,
            "telefono": None,
            "email": None,
            "web_url": web_oficial,
            "recorrido_virtual_url": recorrido_virtual,
            "coleccion_virtual_url": coleccion_virtual,
            "facebook_url": None,
            "instagram_url": None,
            "twitter_url": None,
            "youtube_url": None,
            "tiktok_url": None,
            "imagen_portada": imagen_portada,
            "imagen_tarjeta": imagen_tarjeta,
            "servicios": servicios_list,
            "galeria": galeria_list,
            "descripcion": descripcion,
            "url_origen": source_url,
        }

"""
Módulo Crawler para listar todos los museos de museos.cultura.pe
Soporta paginación de 'Museos del Ministerio de Cultura' y 'Museos Públicos y Privados'.
"""

import logging
import time
from typing import Dict, List, Optional
import requests
from bs4 import BeautifulSoup
from .config import Config

logger = logging.getLogger("ScraperMuseos.Crawler")


class MuseosCrawler:
    """Crawler de listados y enlaces de museos oficiales del Perú."""

    def __init__(self, session: Optional[requests.Session] = None):
        self.session = session or requests.Session()
        self.session.headers.update(Config.HEADERS)

    def _fetch_page(self, url: str) -> Optional[str]:
        """Descarga el HTML de una URL con reintentos."""
        for attempt in range(1, Config.MAX_RETRIES + 1):
            try:
                response = self.session.get(url, verify=False, timeout=Config.TIMEOUT)
                if response.status_code == 200:
                    return response.text
                elif response.status_code == 404:
                    return None
                logger.warning(f"Intento {attempt}: Estado HTTP {response.status_code} al solicitar {url}")
            except Exception as e:
                logger.warning(f"Intento {attempt}: Error al consultar {url}: {e}")
            time.sleep(1 * attempt)
        return None

    def crawl_section(self, base_url: str, category_name: str) -> List[Dict[str, str]]:
        """
        Recorre todas las páginas de una sección (ej. /museos o /museos-publicos-y-privados).
        Retorna la lista de diccionarios con {nombre, url, imagen_tarjeta, categoria}.
        """
        results = []
        page = 0
        logger.info(f"🔎 Iniciando rastreo de sección: {category_name} ({base_url})")

        while True:
            page_url = f"{base_url}?page={page}"
            html = self._fetch_page(page_url)
            if not html:
                break

            soup = BeautifulSoup(html, "html.parser")
            cards = soup.find_all("div", class_="hb-museos-contenedor")
            if not cards:
                break

            logger.info(f"   • Página {page + 1}: {len(cards)} museos encontrados.")
            for card in cards:
                # Extraer título
                title_elem = card.find("div", class_="hb-title")
                title = title_elem.get_text(strip=True) if title_elem else ""

                # Extraer enlace al detalle
                link_elem = card.find("a")
                href = link_elem.get("href", "").strip() if link_elem else ""
                if not href:
                    continue

                full_url = href if href.startswith("http") else f"{Config.BASE_URL}{href}"
                slug = href.rstrip("/").split("/")[-1]

                # Extraer imagen miniatura
                img_elem = card.find("img")
                img_src = img_elem.get("src", "").strip() if img_elem else ""
                if img_src and not img_src.startswith("http"):
                    img_src = f"{Config.BASE_URL}{img_src}"

                # Recorrido virtual rápido si existe en la tarjeta
                rv_elem = card.find("span", class_="field--name-field-museo-recorrido-virtual")
                rv_url = ""
                if rv_elem and rv_elem.find("a"):
                    rv_url = rv_elem.find("a").get("href", "").strip()

                results.append({
                    "slug": slug,
                    "nombre": title,
                    "url": full_url,
                    "imagen_tarjeta": img_src,
                    "categoria": category_name,
                    "recorrido_virtual_tarjeta": rv_url,
                })

            # Comprobar si hay botón 'siguiente' o más páginas
            pager = soup.find(class_="pager")
            if not pager or not pager.find(class_="pager__item--next"):
                # Si no hay clase explícita de next, intentar la siguiente página hasta que devuelva 0 cards
                pass

            page += 1

        logger.info(f"✅ Sección '{category_name}' finalizada: {len(results)} museos detectados.")
        return results

    def get_all_museum_listings(self, include_publicos_privados: bool = True) -> List[Dict[str, str]]:
        """
        Obtiene todos los museos de todas las secciones disponibles sin duplicados.
        """
        # 1. Museos del Ministerio de Cultura
        mincultura_items = self.crawl_section(Config.URL_MUSEOS_MINCULTURA, "Ministerio de Cultura")
        
        all_items_dict: Dict[str, Dict[str, str]] = {}
        for item in mincultura_items:
            all_items_dict[item["url"]] = item

        # 2. Museos Públicos y Privados
        if include_publicos_privados:
            pub_priv_items = self.crawl_section(Config.URL_MUSEOS_PUBLICOS_PRIVADOS, "Públicos y Privados")
            for item in pub_priv_items:
                if item["url"] in all_items_dict:
                    # Si ya existía, enriquecer categoría si correspondía
                    pass
                else:
                    all_items_dict[item["url"]] = item

        unique_list = list(all_items_dict.values())
        logger.info(f"🎉 Total de museos únicos identificados para scraping: {len(unique_list)}")
        return unique_list

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MUSEOS DEL PERÚ (MINISTERIO DE CULTURA) - CLI & Data Ingestion Engine
======================================================================
Herramienta de extracción oficial de datos abiertos y fichas técnicas de https://museos.cultura.pe
Guarda por defecto directamente en PostgreSQL (Neon DB) con soporte para exportación JSON local.

Uso:
  # 1. Scraping completo directo a la Base de Datos PostgreSQL (Default):
  python main.py -all
  python main.py --all
  python main.py

  # 2. Scraping completo guardando en archivos JSON locales:
  python main.py -all json
  python main.py --all json

  # 3. Scraping por sección:
  python main.py -mincultura          # Solo museos MinCultura (DB)
  python main.py -mincultura json     # Solo museos MinCultura (JSON)
  python main.py -publicos            # Solo museos públicos y privados (DB)
  python main.py -publicos json       # Solo museos públicos y privados (JSON)

  # 4. Un solo museo específico (slug o url):
  python main.py -museo museo-de-sitio-pachacamac
  python main.py -museo museo-de-sitio-pachacamac json

  # 5. Inicializar esquema de Base de Datos (DDL):
  python main.py -init-db

  # 6. Estadísticas:
  python main.py -stats
"""

import json
import logging
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any, Dict, List, Optional
import requests
from tqdm import tqdm

# Ajustar encoding en consolas Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from scraping.config import Config
from scraping.crawler import MuseosCrawler
from scraping.parser import MuseoParser
from scraping.database import DatabaseManager
from scraping.exporter import JsonExporter

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("ScraperMuseos")


def print_banner():
    banner = """
    ╔══════════════════════════════════════════════════════════════╗
    ║               SCRAPER MUSEOS DEL PERÚ (MINCUL)               ║
    ║      Ingesta Directa a PostgreSQL (Neon DB) / Export JSON    ║
    ║             Fuente: https://museos.cultura.pe                ║
    ╚══════════════════════════════════════════════════════════════╝
    """
    print(banner)


def show_stats():
    """Muestra un resumen de los datos en PostgreSQL y en local."""
    print("\n" + "=" * 60)
    print("📊 ESTADÍSTICAS DE DATOS - MUSEOS DEL PERÚ")
    print("=" * 60)

    # 1. Base de datos PostgreSQL
    try:
        db = DatabaseManager()
        conn = db.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM museos.museos WHERE is_active = TRUE;")
        total_db = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM museos.servicios_catalogo;")
        serv_db = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM museos.museo_fotos;")
        fotos_db = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM museos.museo_tarifas;")
        tarifas_db = cur.fetchone()[0]
        cur.close()
        conn.close()
        print("🐘 Base de Datos PostgreSQL (Neon DB):")
        print(f"   • Total de museos activos:    {total_db} museos")
        print(f"   • Servicios registrados:     {serv_db} servicios")
        print(f"   • Tarifas catalogadas:       {tarifas_db} tarifas")
        print(f"   • Fotos en galería:          {fotos_db} fotos")
    except Exception as e:
        print(f"🐘 Base de Datos PostgreSQL: No conectada o esquema no creado ({e})")

    # 2. Almacenamiento JSON local
    if Config.FILE_MUSEOS_CONSOLIDADO.exists():
        try:
            with open(Config.FILE_MUSEOS_CONSOLIDADO, "r", encoding="utf-8") as f:
                data = json.load(f)
            print("\n📁 Archivos JSON locales:")
            print(f"   • Museos consolidados:       {len(data)} museos ({Config.FILE_MUSEOS_CONSOLIDADO})")
            if Config.DATA_INDIVIDUALES_DIR.exists():
                ind_count = len(list(Config.DATA_INDIVIDUALES_DIR.glob("*.json")))
                print(f"   • Archivos individuales:     {ind_count} archivos JSON")
        except Exception as e:
            print(f"📁 Error leyendo JSON local: {e}")
    else:
        print("\n📁 Archivos JSON locales: No encontrados. Ejecuta 'python main.py -all json' para generarlos.")
    print("=" * 60 + "\n")


def scrape_single_detail(item: Dict[str, Any], session: requests.Session) -> Optional[Dict[str, Any]]:
    """Descarga y procesa un único museo."""
    url = item["url"]
    for attempt in range(1, Config.MAX_RETRIES + 1):
        try:
            res = session.get(url, verify=False, timeout=Config.TIMEOUT, headers=Config.HEADERS)
            if res.status_code == 200:
                parsed = MuseoParser.parse_html(
                    html_content=res.text,
                    source_url=url,
                    default_category=item.get("categoria", "Ministerio de Cultura"),
                    card_data=item,
                )
                return parsed
        except Exception as e:
            if attempt == Config.MAX_RETRIES:
                logger.warning(f"Error procesando {url}: {e}")
        time.sleep(0.5)
    return None


def run_full_scraping(save_to_db: bool = True, section: str = "all"):
    """Ejecuta el scraping y la persistencia de datos."""
    start_time = time.time()
    Config.ensure_directories()
    crawler = MuseosCrawler()

    # 1. Obtener listado de museos
    logger.info("🔍 Obteniendo listados de museos desde el portal oficial...")
    if section == "mincultura":
        items = crawler.crawl_section(Config.URL_MUSEOS_MINCULTURA, "Ministerio de Cultura")
    elif section == "publicos":
        items = crawler.crawl_section(Config.URL_MUSEOS_PUBLICOS_PRIVADOS, "Públicos y Privados")
    else:
        items = crawler.get_all_museum_listings(include_publicos_privados=True)

    total = len(items)
    logger.info(f"🚀 Iniciando descarga concurrente de {total} fichas técnicas de museos...")

    parsed_museos: List[Dict[str, Any]] = []
    session = requests.Session()

    with ThreadPoolExecutor(max_workers=Config.DEFAULT_WORKERS) as executor:
        futures = {executor.submit(scrape_single_detail, it, session): it for it in items}
        with tqdm(total=total, desc="Descargando museos", unit="museo") as pbar:
            for fut in as_completed(futures):
                res = fut.result()
                if res:
                    parsed_museos.append(res)
                pbar.update(1)

    logger.info(f"✅ Descarga completada: {len(parsed_museos)}/{total} museos procesados con éxito.")

    # 2. Guardar en Base de Datos PostgreSQL si aplica
    if save_to_db:
        logger.info("🐘 Guardando datos en PostgreSQL (Neon DB)...")
        try:
            db = DatabaseManager()
            db.init_schema()
            db.save_all_museos(parsed_museos)
            logger.info("✅ Sincronización con PostgreSQL completada exitosamente.")
        except Exception as e:
            logger.error(f"❌ Error al guardar en PostgreSQL: {e}")
            logger.info("ℹ️ Guardando respaldo en archivos JSON locales...")

    # 3. Exportar siempre a archivos JSON locales
    logger.info("📁 Exportando a archivos JSON locales estructurados...")
    JsonExporter.export(parsed_museos)

    elapsed = time.time() - start_time
    logger.info(f"✨ Proceso finalizado en {elapsed:.2f} segundos.")


def scrape_single_museum_cli(target: str, save_to_db: bool = True):
    """Descarga y procesa un solo museo dado su slug o URL completa."""
    if not target.startswith("http"):
        url = f"https://museos.cultura.pe/museos/{target}"
    else:
        url = target

    logger.info(f"🔍 Consultando museo: {url}")
    session = requests.Session()
    item = {"url": url, "categoria": "Ministerio de Cultura"}
    data = scrape_single_detail(item, session)
    if not data:
        logger.error(f"❌ No se pudo obtener la información de {url}")
        return

    print("\n" + "=" * 60)
    print(f"🏛️ MUSEO: {data['nombre']}")
    print(f"   • Categoría:      {data['categoria']}")
    print(f"   • Administración: {data['administracion']}")
    print(f"   • Ubicación:      {data['ubigeo_texto']} | {data['direccion']}")
    print(f"   • Coordenadas:    Lat: {data['latitud']}, Lng: {data['longitud']}")
    print(f"   • Horario:        {data['horario_atencion']}")
    print(f"   • Servicios:      {len(data['servicios'])} registrados")
    print(f"   • Fotos galería:  {len(data['galeria'])} fotos")
    print("=" * 60 + "\n")

    if save_to_db:
        try:
            db = DatabaseManager()
            db.init_schema()
            db.sync_servicios_catalogo([data])
            id_museo = db.save_museo(data)
            logger.info(f"✅ Museo guardado en PostgreSQL con id_museo = {id_museo}")
        except Exception as e:
            logger.error(f"❌ Error guardando en PostgreSQL: {e}")

    Config.ensure_directories()
    slug = data["slug"]
    ind_path = Config.DATA_INDIVIDUALES_DIR / f"{slug}.json"
    with open(ind_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    logger.info(f"📁 Guardado en archivo JSON: {ind_path}")


def main():
    print_banner()
    args = sys.argv[1:]

    # Sin argumentos o -all -> Scraping completo a DB
    if not args or args[0] in ["-all", "--all"]:
        save_db = not ("json" in args)
        run_full_scraping(save_to_db=save_db, section="all")

    elif args[0] in ["-mincultura", "--mincultura"]:
        save_db = not ("json" in args)
        run_full_scraping(save_to_db=save_db, section="mincultura")

    elif args[0] in ["-publicos", "--publicos"]:
        save_db = not ("json" in args)
        run_full_scraping(save_to_db=save_db, section="publicos")

    elif args[0] in ["-museo", "--museo"]:
        if len(args) < 2:
            print("❌ Debe especificar el slug o URL del museo. Ej: python main.py -museo museo-de-sitio-pachacamac")
            sys.exit(1)
        save_db = not ("json" in args)
        scrape_single_museum_cli(args[1], save_to_db=save_db)

    elif args[0] in ["-init-db", "--init-db"]:
        logger.info("Inicializando esquema DDL en PostgreSQL...")
        db = DatabaseManager()
        db.init_schema()

    elif args[0] in ["-stats", "--stats"]:
        show_stats()

    elif args[0] in ["-help", "--help", "-h"]:
        print(__doc__)

    else:
        print(f"❌ Comando no reconocido: {args[0]}")
        print("Usa 'python main.py -help' para ver la lista de comandos disponibles.")


if __name__ == "__main__":
    main()

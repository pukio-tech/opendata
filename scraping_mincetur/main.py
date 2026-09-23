#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MINCETUR Data Scraper CLI & Database Ingestion Engine
====================================================
Herramienta de extracción oficial de datos abiertos y fichas turísticas de MINCETUR.
Guarda por defecto directamente en PostgreSQL (Neon DB) con soporte para JSON local.

Uso:
  # 1. Scraping completo directo a la Base de Datos PostgreSQL (Default):
  python main.py -all
  python main.py --all

  # 2. Scraping completo guardando en archivos JSON locales:
  python main.py -all json
  python main.py --all json

  # 3. Scraping por partes:
  python main.py -catalogos        # Solo catálogos (DB)
  python main.py -catalogos json   # Solo catálogos (JSON)
  python main.py -recursos         # Solo recursos maestros GeoServer (DB)
  python main.py -recursos json    # Solo recursos maestros GeoServer (JSON)
  python main.py -fichas           # Solo fichas técnicas (DB)
  python main.py -fichas json      # Solo fichas técnicas (JSON)
  python main.py -ficha 100        # Una sola ficha técnica (DB)
  python main.py -ficha 100 json   # Una sola ficha técnica (JSON)

  # 4. Estadísticas:
  python main.py -stats
"""

import json
import logging
import sys
import time
from pathlib import Path

# Ajustar encoding en consolas Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from scraping.config import Config
from scraping.catalogos import CatalogosScraper
from scraping.recursos import RecursosScraper
from scraping.fichas import FichasScraper
from scraping.database import DatabaseManager

# Configurar logging con formato limpio
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("ScraperMINCETUR")


def print_banner():
    banner = """
    ╔══════════════════════════════════════════════════════════════╗
    ║                 SCRAPER MINCETUR TURISMO PERÚ                ║
    ║      Ingesta Directa a PostgreSQL (Neon DB) / Export JSON    ║
    ╚══════════════════════════════════════════════════════════════╝
    """
    print(banner)


def show_stats():
    """Muestra un resumen de los datos almacenados en PostgreSQL y en local."""
    print("\n" + "=" * 60)
    print("📊 ESTADÍSTICAS DE DATOS")
    print("=" * 60)

    # 1. Base de datos PostgreSQL
    try:
        db = DatabaseManager()
        conn = db.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM turismo.recursos WHERE is_active = TRUE;")
        rec_db = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM turismo.fichas_offline;")
        off_db = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM turismo.ficha_fotos;")
        fotos_db = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM turismo.categorias;")
        cats_db = cur.fetchone()[0]
        cur.close()
        conn.close()
        print(f"🐘 Base de Datos PostgreSQL (Neon DB):")
        print(f"   • Recursos activos:          {rec_db} atractivos")
        print(f"   • Fichas offline omitidas:   {off_db} códigos")
        print(f"   • Fotos registradas:         {fotos_db} fotos")
        print(f"   • Categorías registradas:    {cats_db} categorías")
    except Exception as e:
        print(f"🐘 Base de Datos PostgreSQL: No conectada ({e})")

    # 2. Almacenamiento JSON local
    if Config.DATA_DIR.exists():
        fichas_indiv = list(Config.FICHAS_INDIVIDUALES_DIR.glob("ficha_*.json")) if Config.FICHAS_INDIVIDUALES_DIR.exists() else []
        print(f"\n📁 Archivos JSON Locales (data/):")
        print(f"   • Fichas individuales:       {len(fichas_indiv)} archivos")
        print(f"   • Archivo consolidado:       {'Sí' if Config.FILE_FICHAS_CONSOLIDADAS.exists() else 'No'}")
    print("=" * 60 + "\n")


def run_catalogos(to_db: bool = True, to_json: bool = False):
    """Descarga y guarda catálogos."""
    mode_str = "PostgreSQL" if to_db else "JSON Local"
    print(f"\n--- 1. EXTRACCIÓN DE CATÁLOGOS ({mode_str}) ---")
    scraper = CatalogosScraper()
    res = scraper.scrape_and_save_all(to_db=to_db, to_json=to_json)
    print(f"✅ Catálogos completados: {res}")


def run_recursos(to_db: bool = True, to_json: bool = False):
    """Descarga el catálogo de recursos desde GeoServer para enriquecer coordenadas."""
    mode_str = "PostgreSQL" if to_db else "JSON Local"
    print(f"\n--- 2. PROCESANDO CATÁLOGO GEOSERVER CON COORDENADAS ({mode_str}) ---")
    scraper = RecursosScraper()
    recursos = scraper.fetch_all_recursos_geoserver()
    # Guardar en archivo de referencia para que el scraper de fichas pueda cruzar coordenadas
    Config.ensure_directories()
    with open(Config.FILE_RECURSOS_RESUMEN, "w", encoding="utf-8") as f:
        json.dump(recursos, f, ensure_ascii=False, indent=2)

    if to_json:
        scraper.scrape_and_save_all(to_db=False, to_json=True)

    print(f"✅ Catálogo GeoServer listo: {len(recursos)} recursos indexados para cruce con fichas.")


def run_single_ficha(cod_ficha: int, to_db: bool = True, to_json: bool = False):
    """Descarga y guarda una sola ficha."""
    mode_str = "PostgreSQL" if to_db else "JSON Local"
    print(f"\n--- CONSULTANDO FICHA OFICIAL N° {cod_ficha} ({mode_str}) ---")
    scraper = FichasScraper()
    ficha = scraper.scrape_single_ficha(cod_ficha, to_db=to_db, to_json=to_json)
    if not ficha:
        print(f"❌ La ficha N° {cod_ficha} no existe, está dada de baja o redirige a gob.pe (omitida).")
        return

    print(f"✅ Ficha N° {cod_ficha} procesada exitosamente:")
    print(f"   • Nombre:        {ficha.get('nombre')}")
    print(f"   • Ubicación:     {ficha.get('departamento')} / {ficha.get('provincia')} / {ficha.get('distrito')}")
    print(f"   • Categoría:     {ficha.get('categoria')} > {ficha.get('tipo')}")
    print(f"   • Fotos:         {len(ficha.get('galeria_fotos', []))} fotos")
    print(f"   • Actividades:   {len(ficha.get('actividades_detalle', []))} actividades")
    print(f"   • Destino:       {'Guardado en PostgreSQL (Neon DB)' if to_db else f'data/fichas/individuales/ficha_{cod_ficha}.json'}")


def run_fichas(
    workers: int = Config.DEFAULT_WORKERS,
    start_id: int = 1,
    end_id: int = 5000,
    from_recursos: bool = True,
    to_db: bool = True,
    to_json: bool = False,
):
    """Descarga masiva de fichas técnicas."""
    mode_str = "PostgreSQL (Neon DB)" if to_db else "Archivos JSON Locales"
    print(f"\n--- 3. EXTRACCIÓN MASIVA DE FICHAS (Destino: {mode_str} | Workers: {workers}) ---")
    scraper = FichasScraper(workers=workers)

    codes_to_scrape: list[int] = []

    # Obtener códigos desde los recursos de GeoServer
    if from_recursos:
        rec_scraper = RecursosScraper()
        recursos = rec_scraper.fetch_all_recursos_geoserver()
        codes_to_scrape = [r["codigo"] for r in recursos if "codigo" in r]
        print(f"📋 Se encontraron {len(codes_to_scrape)} recursos en el catálogo nacional de MINCETUR.")
    else:
        codes_to_scrape = list(range(start_id, end_id + 1))
        print(f"📋 Extrayendo rango numérico de códigos: {start_id} a {end_id} ({len(codes_to_scrape)} fichas).")

    try:
        from tqdm import tqdm
        pbar = tqdm(total=len(codes_to_scrape), desc="Scraping Fichas", unit="ficha")

        def update_progress(cod):
            pbar.update(1)

        fichas = scraper.scrape_batch(codes_to_scrape, progress_callback=update_progress, to_db=to_db, to_json=to_json)
        pbar.close()
    except ImportError:
        fichas = scraper.scrape_batch(codes_to_scrape, to_db=to_db, to_json=to_json)

    if to_json:
        print("\n📦 Generando archivo consolidado unificado...")
        total_consolidadas = scraper.consolidate_all_to_single_json()
        print(f"✅ Archivo consolidado JSON listo con {total_consolidadas} fichas.")
    else:
        print(f"✅ Ingesta en PostgreSQL finalizada. Total fichas procesadas en esta ejecución: {len(fichas)}")


def main():
    print_banner()

    args_raw = sys.argv[1:]
    if not args_raw or "-help" in args_raw or "--help" in args_raw or "-h" in args_raw:
        print("""
Uso de Comandos:
  python main.py -all               # Ejecuta scraping completo y guarda DIRECTO en PostgreSQL
  python main.py -all json          # Ejecuta scraping completo y guarda en archivos JSON locales

  python main.py -catalogos         # Extrae catálogos (Departamentos, Categorías, Actividades) en DB
  python main.py -catalogos json    # Extrae catálogos en JSON
  python main.py -recursos          # Extrae recursos maestros en DB
  python main.py -recursos json     # Extrae recursos maestros en JSON
  python main.py -fichas            # Extrae todas las fichas técnicas en DB
  python main.py -fichas json       # Extrae todas las fichas técnicas en JSON
  python main.py -ficha <CODIGO>    # Extrae una sola ficha (ej: python main.py -ficha 100)
  python main.py -stats             # Muestra estadísticas de la BD y archivos locales
""")
        show_stats()
        return

    # Detectar formato de salida: 'json' o 'db' (default)
    args_lower = [a.lower().lstrip("-") for a in args_raw]
    to_json = "json" in args_lower or "--json" in args_raw or "-json" in args_raw
    to_db = not to_json

    start_time = time.time()

    # 1. Estadísticas
    if "stats" in args_lower or "-stats" in args_raw:
        show_stats()
        return

    # 2. Ficha individual
    if "ficha" in args_lower or "-ficha" in args_raw:
        # Encontrar el código numérico
        cod_target = None
        for a in args_raw:
            if a.isdigit():
                cod_target = int(a)
                break
        if cod_target:
            run_single_ficha(cod_target, to_db=to_db, to_json=to_json)
        else:
            print("❌ Debe especificar el código de la ficha. Ejemplo: python main.py -ficha 100")
        return

    # 3. Scraping Completo (-all / --all)
    if "all" in args_lower or "-all" in args_raw or "--all" in args_raw:
        print(f"🚀 Iniciando proceso integral de scraping (Destino: {'PostgreSQL' if to_db else 'JSON Local'})...")
        run_catalogos(to_db=to_db, to_json=to_json)
        run_recursos(to_db=to_db, to_json=to_json)
        run_fichas(from_recursos=True, to_db=to_db, to_json=to_json)
        elapsed = time.time() - start_time
        print(f"\n⏱️ Proceso completo finalizado en {elapsed:.2f} segundos.")
        show_stats()
        return

    # 4. Scraping por partes
    if "catalogos" in args_lower:
        run_catalogos(to_db=to_db, to_json=to_json)

    if "recursos" in args_lower:
        run_recursos(to_db=to_db, to_json=to_json)

    if "fichas" in args_lower:
        run_fichas(from_recursos=True, to_db=to_db, to_json=to_json)

    elapsed = time.time() - start_time
    print(f"\n⏱️ Ejecución finalizada en {elapsed:.2f} segundos.")
    show_stats()


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MINCETUR Data Scraper & JSON Generator CLI
==========================================
Herramienta integral de extracción de datos abiertos y fichas turísticas del Perú.

Uso:
  python main.py --all
  python main.py --catalogos
  python main.py --recursos
  python main.py --fichas --workers 15
  python main.py --ficha 62
  python main.py --start 1 --end 100
  python main.py --consolidate
  python main.py --stats
"""

import argparse
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

from scraper.config import Config
from scraper.catalogos import CatalogosScraper
from scraper.recursos import RecursosScraper
from scraper.fichas import FichasScraper

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
    ║        Extracción y Generación Local de Archivos JSON        ║
    ╚══════════════════════════════════════════════════════════════╝
    """
    print(banner)


def show_stats():
    """Muestra un resumen de los datos descargados en disco."""
    Config.ensure_directories()
    print("\n" + "=" * 60)
    print("📊 ESTADÍSTICAS DEL ALMACENAMIENTO LOCAL JSON")
    print("=" * 60)

    # 1. Catálogos
    cats_count = "No descargado"
    if Config.FILE_CATEGORIAS.exists():
        with open(Config.FILE_CATEGORIAS, "r", encoding="utf-8") as f:
            cats_count = f"{len(json.load(f))} categorías principales"

    actis_count = "No descargado"
    if Config.FILE_ACTIVIDADES.exists():
        with open(Config.FILE_ACTIVIDADES, "r", encoding="utf-8") as f:
            actis_count = f"{len(json.load(f))} grupos de actividades"

    deptos_count = "No descargado"
    if Config.FILE_DEPARTAMENTOS.exists():
        with open(Config.FILE_DEPARTAMENTOS, "r", encoding="utf-8") as f:
            deptos_count = f"{len(json.load(f))} departamentos"

    print(f"📁 Catálogos:")
    print(f"   • Categorías:   {cats_count}")
    print(f"   • Actividades:  {actis_count}")
    print(f"   • Ubigeo/Dptos: {deptos_count}")

    # 2. Recursos
    recursos_count = "No descargado"
    if Config.FILE_RECURSOS_RESUMEN.exists():
        with open(Config.FILE_RECURSOS_RESUMEN, "r", encoding="utf-8") as f:
            recursos_count = f"{len(json.load(f))} atractivos registrados"

    dptos_files = list(Config.RECURSOS_DEP_DIR.glob("*.json"))
    print(f"\n📁 Recursos Turísticos:")
    print(f"   • Catálogo Nacional: {recursos_count}")
    print(f"   • Archivos por Dpto: {len(dptos_files)} archivos generados")

    # 3. Fichas
    fichas_indiv = list(Config.FICHAS_INDIVIDUALES_DIR.glob("ficha_*.json"))
    offline_count = 0
    if Config.FILE_OFFLINE_CODES.exists():
        try:
            with open(Config.FILE_OFFLINE_CODES, "r", encoding="utf-8") as f:
                offline_count = len(json.load(f))
        except Exception:
            pass

    consolidated_exists = "Sí" if Config.FILE_FICHAS_CONSOLIDADAS.exists() else "No"

    print(f"\n📁 Fichas Técnicas Detalladas:")
    print(f"   • Fichas guardadas en local:   {len(fichas_indiv)} fichas")
    print(f"   • Fichas offline / retiradas:  {offline_count}")
    print(f"   • Archivo consolidado unificado: {consolidated_exists}")
    print("=" * 60 + "\n")


def run_catalogos():
    """Descarga y guarda los catálogos."""
    print("\n--- 1. EXTRACCIÓN DE CATÁLOGOS Y UBIGEO ---")
    scraper = CatalogosScraper()
    res = scraper.scrape_and_save_all()
    print(f"✅ Catálogos completados: {res}")


def run_recursos():
    """Descarga y guarda los recursos turísticos."""
    print("\n--- 2. EXTRACCIÓN DE RECURSOS TURÍSTICOS (NACIONAL) ---")
    scraper = RecursosScraper()
    res = scraper.scrape_and_save_all()
    print(f"✅ Recursos completados: {res}")


def run_single_ficha(cod_ficha: int):
    """Descarga y muestra el detalle de una sola ficha."""
    print(f"\n--- CONSULTANDO FICHA OFICIAL N° {cod_ficha} ---")
    scraper = FichasScraper()
    ficha = scraper.scrape_single_ficha(cod_ficha)
    if not ficha:
        print(f"❌ La ficha N° {cod_ficha} no existe o no tiene datos disponibles en MINCETUR.")
        return

    print(f"✅ Ficha N° {cod_ficha} descargada y guardada:")
    print(f"   • Nombre:        {ficha.get('nombre')}")
    print(f"   • Ubicación:     {ficha.get('departamento')} / {ficha.get('provincia')} / {ficha.get('distrito')}")
    print(f"   • Categoría:     {ficha.get('categoria')} > {ficha.get('tipo')} > {ficha.get('subtipo')}")
    print(f"   • Jerarquía:     {ficha.get('jerarquia')} | Altitud: {ficha.get('altitud')}")
    print(f"   • Fotos:         {len(ficha.get('galeria_fotos', []))} fotos disponibles")
    print(f"   • Actividades:   {len(ficha.get('actividades_detalle', []))} actividades registradas")
    print(f"   • Rutas acceso:  {len(ficha.get('rutas_acceso', []))} tramos")
    print(f"   • Archivo JSON:  data/fichas/individuales/ficha_{cod_ficha}.json")


def run_fichas(
    workers: int = Config.DEFAULT_WORKERS,
    start_id: int = 1,
    end_id: int = 5000,
    from_recursos: bool = True,
):
    """Descarga el lote de fichas con barra de progreso y concurrencia."""
    print(f"\n--- 3. EXTRACCIÓN MASIVA DE FICHAS TÉCNICAS (Workers: {workers}) ---")
    scraper = FichasScraper(workers=workers)

    codes_to_scrape: list[int] = []

    if from_recursos and Config.FILE_RECURSOS_RESUMEN.exists():
        with open(Config.FILE_RECURSOS_RESUMEN, "r", encoding="utf-8") as f:
            recursos = json.load(f)
            codes_to_scrape = [r["codigo"] for r in recursos if "codigo" in r]
        print(f"📋 Se encontraron {len(codes_to_scrape)} códigos de recursos en el catálogo nacional.")
    else:
        codes_to_scrape = list(range(start_id, end_id + 1))
        print(f"📋 Extrayendo rango numérico de códigos: {start_id} a {end_id} ({len(codes_to_scrape)} fichas).")

    try:
        from tqdm import tqdm
        pbar = tqdm(total=len(codes_to_scrape), desc="Scraping Fichas", unit="ficha")

        def update_progress(cod):
            pbar.update(1)

        scraper.scrape_batch(codes_to_scrape, progress_callback=update_progress)
        pbar.close()
    except ImportError:
        scraper.scrape_batch(codes_to_scrape)

    print("\n📦 Generando archivo consolidado unificado...")
    total_consolidadas = scraper.consolidate_all_to_single_json()
    print(f"✅ Proceso finalizado. Total fichas consolidadas: {total_consolidadas}")


def main():
    parser = argparse.ArgumentParser(
        description="Scraper de Datos Turísticos de MINCETUR a formato JSON local.",
        formatter_class=argparse.RawTextHelpFormatter,
    )

    parser.add_argument(
        "--all", "-a",
        action="store_true",
        help="Ejecuta el flujo completo: catálogos, recursos y todas las fichas oficiales.",
    )
    parser.add_argument(
        "--catalogos", "-c",
        action="store_true",
        help="Extrae únicamente los catálogos de categorías, actividades y ubigeo.",
    )
    parser.add_argument(
        "--recursos", "-r",
        action="store_true",
        help="Extrae el catálogo maestro de atractivos turísticos (~4,800 recursos).",
    )
    parser.add_argument(
        "--fichas", "-f",
        action="store_true",
        help="Extrae las fichas técnicas detalladas de todos los recursos.",
    )
    parser.add_argument(
        "--ficha",
        type=int,
        metavar="COD",
        help="Extrae una única ficha por su código numérico (ej: --ficha 62).",
    )
    parser.add_argument(
        "--start",
        type=int,
        default=None,
        help="Código inicial para rango personalizado (usado con --fichas).",
    )
    parser.add_argument(
        "--end",
        type=int,
        default=None,
        help="Código final para rango personalizado (usado con --fichas).",
    )
    parser.add_argument(
        "--workers", "-w",
        type=int,
        default=Config.DEFAULT_WORKERS,
        help=f"Número de hilos concurrentes para descarga (default: {Config.DEFAULT_WORKERS}).",
    )
    parser.add_argument(
        "--consolidate",
        action="store_true",
        help="Reconstruye el archivo fichas_consolidadas.json a partir de las fichas individuales.",
    )
    parser.add_argument(
        "--stats", "-s",
        action="store_true",
        help="Muestra las estadísticas de archivos descargados localmente.",
    )

    args = parser.parse_args()
    print_banner()

    if len(sys.argv) == 1:
        # Si no se pasan argumentos, mostrar ayuda y estadísticas
        parser.print_help()
        show_stats()
        return

    start_time = time.time()

    if args.stats:
        show_stats()
        return

    if args.ficha:
        run_single_ficha(args.ficha)
        return

    if args.consolidate:
        scraper = FichasScraper()
        scraper.consolidate_all_to_single_json()
        show_stats()
        return

    if args.catalogos or args.all:
        run_catalogos()

    if args.recursos or args.all:
        run_recursos()

    is_custom_range = (args.start is not None) or (args.end is not None)
    if args.fichas or args.all or is_custom_range:
        start_val = args.start if args.start is not None else 1
        end_val = args.end if args.end is not None else 5000
        use_recursos = (not is_custom_range) and (not args.all or args.fichas)
        if args.all:
            use_recursos = True

        run_fichas(
            workers=args.workers,
            start_id=start_val,
            end_id=end_val,
            from_recursos=use_recursos,
        )

    elapsed = time.time() - start_time
    print(f"\n⏱️ Tiempo total de ejecución: {elapsed:.2f} segundos.")
    show_stats()


if __name__ == "__main__":
    main()

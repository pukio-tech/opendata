from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import logging
import time
from typing import Any, Dict, List, Optional, Set
import requests

from .config import Config
from .parser import FichaParser

logger = logging.getLogger("ScraperMINCETUR.Fichas")


class FichasScraper:
    """Motor de scraping masivo y concurrente para las Fichas de Inventario de MINCETUR."""

    def __init__(self, workers: int = Config.DEFAULT_WORKERS):
        self.workers = workers
        self.offline_codes: Set[int] = set()
        self.processed_codes: Set[int] = set()
        self.failed_codes: Set[int] = set()
        self.recursos_map: Dict[int, Dict[str, Any]] = {}

        self._load_state()
        self._load_recursos_map()

    def _load_recursos_map(self):
        """Carga metadatos y coordenadas del catálogo nacional para enriquecer fichas."""
        if Config.FILE_RECURSOS_RESUMEN.exists():
            try:
                with open(Config.FILE_RECURSOS_RESUMEN, "r", encoding="utf-8") as f:
                    recursos = json.load(f)
                    for r in recursos:
                        cod = r.get("codigo")
                        if cod:
                            self.recursos_map[int(cod)] = r
            except Exception as e:
                logger.debug(f"No se pudo precargar recursos_resumen: {e}")

    def _get_session(self) -> requests.Session:
        """Crea una sesión HTTP optimizada con reintentos y pool de conexiones."""
        s = requests.Session()
        s.headers.update(Config.HEADERS)
        s.verify = False
        adapter = requests.adapters.HTTPAdapter(
            pool_connections=self.workers * 2,
            pool_maxsize=self.workers * 2,
            max_retries=Config.MAX_RETRIES,
        )
        s.mount("https://", adapter)
        s.mount("http://", adapter)
        return s

    def _load_state(self):
        """Carga el estado previo de progreso y códigos offline guardados."""
        Config.ensure_directories()

        if Config.FILE_OFFLINE_CODES.exists():
            try:
                with open(Config.FILE_OFFLINE_CODES, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.offline_codes = set(data if isinstance(data, list) else [])
            except Exception:
                pass

        if Config.FILE_PROGRESS.exists():
            try:
                with open(Config.FILE_PROGRESS, "r", encoding="utf-8") as f:
                    prog = json.load(f)
                    self.processed_codes = set(prog.get("processed", []))
                    self.failed_codes = set(prog.get("failed", []))
            except Exception:
                pass

        # También verificar archivos individuales ya existentes en disco
        for json_file in Config.FICHAS_INDIVIDUALES_DIR.glob("ficha_*.json"):
            try:
                cod = int(json_file.stem.replace("ficha_", ""))
                self.processed_codes.add(cod)
            except ValueError:
                pass

        # Cargar códigos offline registrados en PostgreSQL
        try:
            from .database import DatabaseManager
            db_offline = DatabaseManager().get_offline_codes()
            if db_offline:
                self.offline_codes.update(db_offline)
        except Exception:
            pass

    def _save_state(self):
        """Guarda el estado actual en disco para posibilitar reanudación."""
        with open(Config.FILE_OFFLINE_CODES, "w", encoding="utf-8") as f:
            json.dump(sorted(list(self.offline_codes)), f, indent=2)

        with open(Config.FILE_PROGRESS, "w", encoding="utf-8") as f:
            json.dump({
                "processed_count": len(self.processed_codes),
                "offline_count": len(self.offline_codes),
                "failed_count": len(self.failed_codes),
                "processed": sorted(list(self.processed_codes)),
                "failed": sorted(list(self.failed_codes)),
            }, f, indent=2)

    def scrape_single_ficha(
        self,
        cod_ficha: int,
        session: Optional[requests.Session] = None,
        force_refresh: bool = False,
        to_db: bool = True,
        to_json: bool = False,
    ) -> Optional[Dict[str, Any]]:
        """
        Descarga y parsea una ficha individual.
        Guarda directamente en PostgreSQL (UPSERT) y/o en archivo JSON local.
        """
        if cod_ficha in self.offline_codes and not force_refresh:
            return None

        target_path = Config.FICHAS_INDIVIDUALES_DIR / f"ficha_{cod_ficha}.json"
        if not force_refresh and to_json and target_path.exists() and cod_ficha in self.processed_codes:
            try:
                with open(target_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass

        s = session or self._get_session()
        url = f"{Config.FICHA_BASE_URL}/index.aspx?cod_Ficha={cod_ficha}"

        try:
            resp = s.get(url, timeout=Config.TIMEOUT, allow_redirects=False)

            # 302 Redirección suele indicar ficha retirada/inactiva
            if resp.status_code in (301, 302, 303, 307) or "Object moved" in resp.text:
                self.offline_codes.add(cod_ficha)
                if to_db:
                    from .database import DatabaseManager
                    DatabaseManager().save_offline_codes({cod_ficha}, log_info=False)
                return None

            if resp.status_code == 404:
                self.offline_codes.add(cod_ficha)
                if to_db:
                    from .database import DatabaseManager
                    DatabaseManager().save_offline_codes({cod_ficha}, log_info=False)
                return None

            resp.raise_for_status()
            html = resp.text

            ficha_data = FichaParser.parse_html(html, cod_ficha)
            if not ficha_data:
                self.offline_codes.add(cod_ficha)
                if to_db:
                    from .database import DatabaseManager
                    DatabaseManager().save_offline_codes({cod_ficha}, log_info=False)
                return None

            # Enriquecer con coordenadas y datos del GeoServer si existen
            rec_meta = self.recursos_map.get(cod_ficha, {})
            coords = rec_meta.get("coordenadas", {})
            lat = coords.get("latitud")
            lon = coords.get("longitud")

            ficha_data["coordenadas"] = {
                "latitud": lat,
                "longitud": lon,
            }
            if lat and lon:
                ficha_data["google_maps_url"] = f"https://www.google.com/maps?q={lat},{lon}"
            else:
                ficha_data["google_maps_url"] = None

            # 1. Guardar en Base de Datos PostgreSQL (Neon DB)
            if to_db:
                from .database import DatabaseManager
                DatabaseManager().save_ficha(ficha_data)

            # 2. Guardar JSON individual si se solicita
            if to_json:
                Config.ensure_directories()
                with open(target_path, "w", encoding="utf-8") as f:
                    json.dump(ficha_data, f, ensure_ascii=False, indent=2)

            self.processed_codes.add(cod_ficha)
            if cod_ficha in self.failed_codes:
                self.failed_codes.remove(cod_ficha)

            return ficha_data

        except Exception as e:
            logger.debug(f"Ficha {cod_ficha} error: {e}")
            self.failed_codes.add(cod_ficha)
            return None

    def scrape_batch(
        self,
        codes: List[int],
        progress_callback: Optional[Any] = None,
        to_db: bool = True,
        to_json: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        Scrapea un lote de códigos de fichas de forma concurrente con reanudación automática.
        """
        if to_json:
            Config.ensure_directories()

        self._load_recursos_map()
        pending_codes = [c for c in codes if c not in self.offline_codes]

        logger.info(f"Total códigos a procesar: {len(codes)} (Pendientes: {len(pending_codes)}, Offline conocidos: {len(self.offline_codes)})")

        if not pending_codes:
            logger.info("Todos los códigos solicitados ya han sido procesados previamente.")
            return []

        results: List[Dict[str, Any]] = []
        last_save_time = time.time()

        with ThreadPoolExecutor(max_workers=self.workers) as executor:
            future_to_code = {
                executor.submit(self.scrape_single_ficha, cod, None, False, to_db, to_json): cod
                for cod in pending_codes
            }

            for future in as_completed(future_to_code):
                cod = future_to_code[future]
                try:
                    res = future.result()
                    if res:
                        results.append(res)
                except Exception as e:
                    logger.debug(f"Error procesando ficha {cod}: {e}")
                    self.failed_codes.add(cod)

                if progress_callback:
                    progress_callback(cod)

                # Checkpoint periódico cada 30 segundos si guarda a json
                if to_json and (time.time() - last_save_time > 30):
                    self._save_state()
                    last_save_time = time.time()

        if to_json:
            self._save_state()

        if to_db:
            try:
                from .database import DatabaseManager
                DatabaseManager().cleanup_offline_from_recursos()
            except Exception:
                pass

        logger.info(f"Lote finalizado. Fichas procesadas exitosamente en esta corrida: {len(results)}")
        return results

    def load_all_saved_fichas(self, target_codes: Optional[List[int]] = None) -> List[Dict[str, Any]]:
        """Carga todas las fichas guardadas en disco en una lista en memoria."""
        fichas = []
        codes_filter = set(target_codes) if target_codes else None

        for json_file in sorted(Config.FICHAS_INDIVIDUALES_DIR.glob("ficha_*.json")):
            try:
                cod = int(json_file.stem.replace("ficha_", ""))
                if codes_filter and cod not in codes_filter:
                    continue
                with open(json_file, "r", encoding="utf-8") as f:
                    fichas.append(json.load(f))
            except Exception:
                pass

        fichas.sort(key=lambda x: x.get("cod_ficha", 0))
        return fichas

    def consolidate_all_to_single_json(self) -> int:
        """
        Lee todas las fichas individuales de data/fichas/individuales/
        y genera el archivo consolidado general data/fichas/fichas_consolidadas.json.
        """
        fichas = self.load_all_saved_fichas()
        with open(Config.FILE_FICHAS_CONSOLIDADAS, "w", encoding="utf-8") as f:
            json.dump(fichas, f, ensure_ascii=False, indent=2)

        logger.info(f"✅ Archivo consolidado generado en {Config.FILE_FICHAS_CONSOLIDADAS} con {len(fichas)} fichas.")
        return len(fichas)

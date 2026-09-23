import os
from pathlib import Path
import urllib3

# Suprimir advertencias SSL de certificados no verificados de MINCETUR
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class Config:
    """Configuración global y rutas del scraper de MINCETUR."""

    # Directorio base del proyecto
    BASE_DIR = Path(__file__).resolve().parent.parent
    DATA_DIR = BASE_DIR / "data"

    # Directorios de salida de datos
    CATALOGOS_DIR = DATA_DIR / "catalogos"
    RECURSOS_DIR = DATA_DIR / "recursos"
    RECURSOS_DEP_DIR = RECURSOS_DIR / "por_departamento"
    FICHAS_DIR = DATA_DIR / "fichas"
    FICHAS_INDIVIDUALES_DIR = FICHAS_DIR / "individuales"

    # Archivos clave de salida
    FILE_CATEGORIAS = CATALOGOS_DIR / "categorias_arbol.json"
    FILE_ACTIVIDADES = CATALOGOS_DIR / "actividades_arbol.json"
    FILE_DEPARTAMENTOS = CATALOGOS_DIR / "departamentos.json"
    FILE_PROVINCIAS = CATALOGOS_DIR / "provincias.json"
    FILE_DISTRITOS = CATALOGOS_DIR / "distritos.json"

    FILE_RECURSOS_RESUMEN = RECURSOS_DIR / "recursos_resumen.json"
    FILE_FICHAS_CONSOLIDADAS = FICHAS_DIR / "fichas_consolidadas.json"
    FILE_OFFLINE_CODES = FICHAS_DIR / "offline_codes.json"
    FILE_PROGRESS = FICHAS_DIR / "progress.json"

    # URLs Oficiales de MINCETUR
    SIG_BASE_URL = "https://sigmincetur.mincetur.gob.pe/turismo"
    GEOSERVER_URL = "https://sigmincetur.mincetur.gob.pe/geoserver/ProduSig/ows"
    FICHA_BASE_URL = "https://consultasenlinea.mincetur.gob.pe/fichaInventario"

    # Base de Datos PostgreSQL (Neon DB)
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql://neondb_owner:npg_F3mJO2YWCcIX@ep-little-heart-b5n0hrdb-pooler.c-7.us-east-2.aws.neon.tech/opendata?sslmode=require",
    )

    # Configuración de Red y Headers
    TIMEOUT = 25
    MAX_RETRIES = 3
    DEFAULT_WORKERS = 10

    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json, text/javascript, text/html, */*; q=0.01",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    }

    @classmethod
    def ensure_directories(cls):
        """Crea todos los directorios requeridos si no existen."""
        for path in [
            cls.DATA_DIR,
            cls.CATALOGOS_DIR,
            cls.RECURSOS_DIR,
            cls.RECURSOS_DEP_DIR,
            cls.FICHAS_DIR,
            cls.FICHAS_INDIVIDUALES_DIR,
        ]:
            path.mkdir(parents=True, exist_ok=True)

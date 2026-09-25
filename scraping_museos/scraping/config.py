import os
from pathlib import Path
import urllib3

# Suprimir advertencias SSL de certificados no verificados
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class Config:
    """Configuración global y rutas del scraper de Museos del Perú."""

    # Directorio base del proyecto
    BASE_DIR = Path(__file__).resolve().parent.parent
    DATA_DIR = BASE_DIR / "data"

    # Directorios de salida
    DATA_INDIVIDUALES_DIR = DATA_DIR / "individuales"
    DATA_CATALOGOS_DIR = DATA_DIR / "catalogos"
    DATA_POR_DEPARTAMENTO_DIR = DATA_DIR / "por_departamento"

    # Archivos clave de salida
    FILE_MUSEOS_CONSOLIDADO = DATA_DIR / "museos_consolidados.json"
    FILE_SERVICIOS_CATALOGO = DATA_CATALOGOS_DIR / "servicios.json"
    FILE_ESTADISTICAS = DATA_DIR / "estadisticas_resumen.json"

    # URLs Oficiales de Museos en Línea
    BASE_URL = "https://museos.cultura.pe"
    URL_MUSEOS_MINCULTURA = "https://museos.cultura.pe/museos"
    URL_MUSEOS_PUBLICOS_PRIVADOS = "https://museos.cultura.pe/museos-publicos-y-privados"

    # Base de Datos PostgreSQL (Neon DB)
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql://neondb_owner:npg_F3mJO2YWCcIX@ep-little-heart-b5n0hrdb-pooler.c-7.us-east-2.aws.neon.tech/opendata?sslmode=require",
    )

    # Configuración de Red
    TIMEOUT = 25
    MAX_RETRIES = 3
    DEFAULT_WORKERS = 8

    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    }

    @classmethod
    def ensure_directories(cls):
        """Crea todos los directorios requeridos si no existen."""
        for path in [
            cls.DATA_DIR,
            cls.DATA_INDIVIDUALES_DIR,
            cls.DATA_CATALOGOS_DIR,
            cls.DATA_POR_DEPARTAMENTO_DIR,
        ]:
            path.mkdir(parents=True, exist_ok=True)

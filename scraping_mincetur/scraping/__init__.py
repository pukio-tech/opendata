"""
Módulo scraper para datos de turismo de MINCETUR.
"""

from .config import Config
from .catalogos import CatalogosScraper
from .recursos import RecursosScraper
from .parser import FichaParser
from .fichas import FichasScraper

__all__ = [
    "Config",
    "CatalogosScraper",
    "RecursosScraper",
    "FichaParser",
    "FichasScraper",
]

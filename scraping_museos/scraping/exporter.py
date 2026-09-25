"""
Módulo Exporter para exportar y estructurar datos de museos en JSON locales.
"""

import json
import logging
from collections import defaultdict
from typing import Any, Dict, List
from .config import Config

logger = logging.getLogger("ScraperMuseos.Exporter")


class JsonExporter:
    """Exporta los datos de museos en archivos JSON consolidados, individuales y por departamento."""

    @classmethod
    def export(cls, museos: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Ejecuta la exportación completa a disco."""
        Config.ensure_directories()

        if not museos:
            logger.warning("No hay museos para exportar.")
            return {}

        # 1. Guardar archivo consolidado principal
        with open(Config.FILE_MUSEOS_CONSOLIDADO, "w", encoding="utf-8") as f:
            json.dump(museos, f, indent=2, ensure_ascii=False)
        logger.info(f"📁 Consolidado guardado: {Config.FILE_MUSEOS_CONSOLIDADO} ({len(museos)} museos)")

        # 2. Guardar archivos individuales
        for m in museos:
            slug = m.get("slug") or "museo"
            ind_path = Config.DATA_INDIVIDUALES_DIR / f"{slug}.json"
            with open(ind_path, "w", encoding="utf-8") as f:
                json.dump(m, f, indent=2, ensure_ascii=False)

        # 3. Guardar por departamento
        by_dep = defaultdict(list)
        for m in museos:
            dep = m.get("departamento") or "Sin_Especificar"
            dep_clean = dep.replace(" ", "_").upper()
            by_dep[dep_clean].append(m)

        for dep_name, items in by_dep.items():
            dep_path = Config.DATA_POR_DEPARTAMENTO_DIR / f"{dep_name}.json"
            with open(dep_path, "w", encoding="utf-8") as f:
                json.dump(items, f, indent=2, ensure_ascii=False)

        # 4. Catálogo de Servicios
        servicios_map = {}
        for m in museos:
            for s in m.get("servicios", []):
                name = s.get("nombre", "").strip()
                icon = s.get("icono_url", "").strip()
                if name:
                    if name not in servicios_map or (icon and not servicios_map[name]):
                        servicios_map[name] = {"nombre": name, "icono_url": icon}
        
        servicios_list = list(servicios_map.values())
        with open(Config.FILE_SERVICIOS_CATALOGO, "w", encoding="utf-8") as f:
            json.dump(servicios_list, f, indent=2, ensure_ascii=False)

        # 5. Resumen de Estadísticas
        stats = {
            "total_museos": len(museos),
            "departamentos_cubiertos": len(by_dep),
            "total_servicios_unicos": len(servicios_list),
            "con_recorrido_virtual": len([m for m in museos if m.get("recorrido_virtual_url")]),
            "con_coordenadas": len([m for m in museos if m.get("latitud") is not None]),
            "por_departamento": {k: len(v) for k, v in sorted(by_dep.items())},
        }
        with open(Config.FILE_ESTADISTICAS, "w", encoding="utf-8") as f:
            json.dump(stats, f, indent=2, ensure_ascii=False)

        logger.info("✅ Exportación JSON completada con éxito.")
        return stats

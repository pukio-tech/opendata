# 🏛️ Scraping de Museos del Perú (Ministerio de Cultura)

Proyecto de extracción, estructuración e ingesta directa de datos de museos del Perú desde el portal oficial [https://museos.cultura.pe](https://museos.cultura.pe) hacia **PostgreSQL (Neon DB)** con soporte para exportación en **JSON**.

---

## 🚀 Características

- **Rastreo Automático y Concurrente:** Extrae tanto los museos administrados directamente por el Ministerio de Cultura como los museos públicos y privados a nivel nacional.
- **Extracción Enriquecida:**
  - Identificación y normalización geográfica: Departamento, Provincia, Distrito, Ubigeo y Dirección.
  - Geolocalización precisa (Latitud, Longitud) y mapa embebido.
  - Reseña histórica y descripción detallada.
  - Horarios y plan de visita.
  - Tarifario oficial y desglose por categorías (Adulto, Estudiante, Gratuito, etc.).
  - Enlaces a **Recorrido Virtual / Visita 360°**, **Colecciones en línea**, sitio web oficial y redes sociales.
  - Catálogo de servicios disponibles con sus respectivos íconos oficiales (SSHH, Estacionamiento, Guiado, Silla de ruedas, Cafetería, etc.).
  - Galería fotográfica completa en alta resolución.
- **Base de Datos PostgreSQL de Alta Eficiencia:**
  - Esquema dedicado `museos`.
  - Columna espacial `geometry(Point, 4326)` con soporte **PostGIS** y trigger automático de sincronización.
  - Índices GIN con `pg_trgm` para autocompletado y búsqueda difusa (Fuzzy Search).
  - Vistas optimizadas para backend NestJS / Frontend (`museos.v_museos_listado`, `museos.v_museos_geojson`, `museos.v_estadisticas_departamento`).
- **Exportación JSON Multiformato:** Genera archivos consolidados, individuales por museo, agrupados por departamento y catálogo de servicios.

---

## 📁 Estructura del Proyecto

```text
scraping_museos/
├── data/                               # Archivos JSON generados
│   ├── catalogos/                      # Servicios y catálogos
│   ├── individuales/                   # Un JSON por cada museo
│   ├── por_departamento/               # Museos agrupados por región
│   ├── museos_consolidados.json        # Consolidado maestro
│   └── estadisticas_resumen.json       # Métricas de cobertura
├── db/
│   └── museos.sql                      # DDL de PostgreSQL (tablas, triggers, vistas, índices)
├── scraping/
│   ├── __init__.py
│   ├── config.py                       # Configuración y URLs
│   ├── crawler.py                      # Rastreador y paginador
│   ├── database.py                     # Conector y motor UPSERT PostgreSQL
│   ├── exporter.py                     # Exportador de archivos JSON
│   └── parser.py                       # Parser de detalle HTML y multimedia
├── main.py                             # CLI de ejecución rápida
├── requirements.txt                    # Dependencias Python
└── README.md
```

---

## 🛠️ Instalación

1. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configuración de Base de Datos:**
   Por defecto utiliza la conexión a Neon DB configurada en `scraping/config.py`. Puedes sobrescribirla mediante la variable de entorno `DATABASE_URL`:
   ```bash
   set DATABASE_URL=postgresql://usuario:password@host/opendata?sslmode=require
   ```

---

## 💻 Modos de Uso

### 1. Iniciar Base de Datos (Crear Esquema y Tablas)
```bash
python main.py -init-db
```

### 2. Scraping Completo e Ingesta Directa a PostgreSQL (Recomendado)
```bash
python main.py -all
```
*(También se puede ejecutar simplemente con `python main.py`)*

### 3. Scraping Completo solo a JSON Local (Sin DB)
```bash
python main.py -all json
```

### 4. Scraping por Categorías
```bash
# Solo Museos del Ministerio de Cultura
python main.py -mincultura
python main.py -mincultura json

# Solo Museos Públicos y Privados
python main.py -publicos
python main.py -publicos json
```

### 5. Scraping de un Solo Museo
```bash
python main.py -museo museo-de-sitio-pachacamac
python main.py -museo museo-nacional-de-arqueología-antropología-e-historia-del-perú
```

### 6. Ver Estadísticas
```bash
python main.py -stats
```

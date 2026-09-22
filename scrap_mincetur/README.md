# Scraper de Datos Turísticos de MINCETUR (Perú) 🇵🇪

Proyecto independiente en Python para extraer, estructurar y almacenar localmente en formato **JSON** todos los datos abiertos del **Sistema de Información Georreferencial de Turismo (SIG MINCETUR)** y las **Fichas del Inventario Nacional de Recursos Turísticos**.

---

## 🚀 Características

- **Catálogos Oficiales**:
  - Árbol jerárquico de **Categorías**, **Tipos** y **Subtipos**.
  - Catálogo de **Actividades** y **Sub-actividades** con sus iconos oficiales.
  - División política de **Departamentos**, **Provincias** y **Distritos** con códigos de Ubigeo.
- **Catálogo Nacional de Recursos Turísticos**:
  - Extracción de más de **4,800 recursos turísticos** registrados en el GeoServer oficial.
  - Coordenadas geográficas exactas (Latitud / Longitud), jerarquías y clasificación.
  - Exportación global consolidada y particionada por departamento (ej: `lima.json`, `cusco.json`, etc.).
- **Fichas Técnicas Detalladas**:
  - Extracción HTML completa de cada ficha oficial (`datos generales`, `descripción`, `particularidades`, `estado actual`, `observaciones`).
  - Tablas de **Actividades Desarrolladas** con íconos oficiales y observaciones.
  - Tablas de **Rutas y Medios de Acceso** (tramos, transporte, tipo de vía, distancias/tiempos).
  - Tablas de **Época Propicia de Visita** (temporadas recomendadas, horarios y especificaciones).
  - Galería de todas las **Fotografías Oficiales**.
  - Enlaces a videos promocionales de **YouTube**.
- **Scraping Concurrente de Alta Velocidad**:
  - Motor multihilo con soporte para definir el número de workers (`--workers 15`).
  - Sistema de **reanudación automática (Checkpoints)**: si se interrumpe el proceso, continúa automáticamente donde se quedó.
  - Detección y registro de fichas dadas de baja / redirecciones 302 (`offline_codes.json`).

---

## 📦 Instalación

1. Clona o navega al directorio del proyecto:
   ```bash
   cd scrap_mincetur
   ```

2. Instala las dependencias necesarias:
   ```bash
   pip install -r requirements.txt
   ```

---

## 💻 Guía de Uso (CLI)

El archivo `main.py` incluye una interfaz de línea de comandos lista para usar:

### 1. Ejecutar el Scraping Completo (Catálogos + Recursos + Fichas)
```bash
python main.py --all
```

### 2. Extraer Únicamente Catálogos y Ubigeos
```bash
python main.py --catalogos
```
*Genera los archivos en `data/catalogos/`: `categorias_arbol.json`, `actividades_arbol.json`, `departamentos.json`, `provincias.json`.*

### 3. Extraer el Catálogo de Recursos Turísticos Nacional
```bash
python main.py --recursos
```
*Genera el archivo maestro `data/recursos/recursos_resumen.json` y los archivos por región en `data/recursos/por_departamento/`.*

### 4. Extraer Fichas Técnicas con Concurrencia Acelerada
```bash
# Extraer fichas de todos los recursos usando 15 hilos en paralelo
python main.py --fichas --workers 15

# Extraer solo un rango de IDs (ej: de la ficha 1 a la 100)
python main.py --fichas --start 1 --end 100 --workers 10
```

### 5. Consultar y Extraer una Sola Ficha
```bash
python main.py --ficha 62
```

### 6. Ver Estadísticas del Almacenamiento Local
```bash
python main.py --stats
```

### 7. Reconstruir el Archivo Consolidado
```bash
python main.py --consolidate
```

---

## 📂 Estructura de Salida (`data/`)

```text
data/
├── catalogos/
│   ├── categorias_arbol.json      # Jerarquía Categoría -> Tipo -> Subtipo
│   ├── actividades_arbol.json     # Actividades y sub-actividades con iconos
│   ├── departamentos.json         # 25 Departamentos con códigos UBIGEO
│   └── provincias.json            # Provincias del Perú
│
├── recursos/
│   ├── recursos_resumen.json      # Catálogo maestro con 4,800+ recursos y coordenadas
│   └── por_departamento/          # Separado por región (cusco.json, lima.json, piura.json...)
│
└── fichas/
    ├── individuales/              # Cada ficha en su propio JSON (ficha_62.json, ficha_154.json...)
    ├── fichas_consolidadas.json   # Base de datos completa en un solo archivo unificado
    ├── offline_codes.json         # Registro de códigos que fueron dados de baja por MINCETUR
    └── progress.json              # Estado de checkpoints para reanudación automática
```

---

## 📝 Estructura del JSON de una Ficha Técnica (`ficha_*.json`)

```json
{
  "cod_ficha": 62,
  "url_ficha": "https://consultasenlinea.mincetur.gob.pe/fichaInventario/index.aspx?cod_Ficha=62",
  "nombre": "MANGLARES SAN PEDRO DE VICE",
  "departamento": "PIURA",
  "provincia": "SECHURA",
  "distrito": "VICE",
  "categoria": "SITIOS NATURALES",
  "tipo": "Costas",
  "subtipo": "Manglares",
  "jerarquia": "2",
  "altitud": "2 m.s.n.m.",
  "foto_principal": "https://consultasenlinea.mincetur.gob.pe/fichaInventario/foto.aspx?cod=298073",
  "galeria_fotos": [
    "https://consultasenlinea.mincetur.gob.pe/fichaInventario/foto.aspx?cod=298073",
    "https://consultasenlinea.mincetur.gob.pe/fichaInventario/foto.aspx?cod=298074"
  ],
  "actividades_permitidas": [
    "Paseos - En Bote",
    "Naturaleza - Observación de Aves"
  ],
  "actividades_detalle": [
    {
      "actividad": "Paseos",
      "tipo": "En Bote",
      "observacion": "Paseos guiados por los canales del manglar.",
      "icono_url": "https://consultasenlinea.mincetur.gob.pe/fichaInventario/iconos/bote.png"
    }
  ],
  "rutas_acceso": [
    {
      "recorrido": "Piura - Vice",
      "tramo": "1",
      "medio_transporte": "Automóvil / Bus",
      "tipo_via": "Asfaltado",
      "distancia_tiempo": "45 km / 50 min"
    }
  ],
  "epoca_propicia": [
    {
      "epoca": "Todo el año",
      "especificacion": "Preferible en horas de la mañana",
      "horario": "08:00 - 17:00",
      "observaciones": "Llevar bloqueador y repelente"
    }
  ],
  "descripcion": "Extenso humedal costero de manglar considerado el más austral del Pacífico suramericano...",
  "particularidades": "Refugio de aves migratorias y sitio Ramsar de importancia internacional.",
  "estado_actual": "Bueno, administrado por la Municipalidad Distrital de Vice.",
  "observaciones": "Ingreso libre previa coordinación con guardaparques locales.",
  "youtube_url": null,
  "secciones": [...]
}
```

---

## 🛡️ Robustez y Resiliencia

1. **Reintentos automáticos**: Si una petición falla por microcortes de red, reintenta hasta 3 veces automáticamente con backoff exponencial.
2. **Control de Errores SSL**: Integra contexto seguro de certificados sin interrumpir la extracción en conexiones corporativas o gubernamentales.
3. **Persistencia Progresiva**: Cada ficha procesada se guarda inmediatamente en disco, por lo que nunca se pierde el trabajo avanzado.

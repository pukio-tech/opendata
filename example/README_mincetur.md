# Documentación de Usuario: API de Recursos Turísticos (MINCETUR)

Esta guía explica paso a paso cómo consultar, filtrar y acceder al detalle de los **Recursos Turísticos del Perú** usando los endpoints de **MINCETUR**, desde la selección de filtros hasta la ficha técnica final de cada atractivo.

---

## Flujo General de Consulta

```
[ PASO 1: Obtener Filtros ] 
       │  ├── 1.1 Categorías, Tipos y Subtipos
       │  ├── 1.2 Actividades y Sub-actividades
       │  └── 1.3 Departamentos y Ubigeo
       ▼
[ PASO 2: Filtrar Sitios Turísticos ]
       │  └── API de Búsqueda (selectData2.ashx)
       │      ➔ Devuelve lista de atractivos con ID de Ficha y coordenadas
       ▼
[ PASO 3: Ingresar al Sitio Turístico ]
       └── Ficha Técnica Oficial (fichaInventario/index.aspx)
           ➔ Descripción, fotos oficiales, accesos y actividades permitidas
```

---

## Paso 1: Obtener los Catálogos y Filtros

Antes de realizar una búsqueda, necesitas los identificadores (`ID` o códigos) de lo que deseas filtrar.

### 1.1 Categorías, Tipos y Subtipos de Atractivo

* **Categorías Principales:**
  * **Método:** `GET`
  * **URL:** `https://sigmincetur.mincetur.gob.pe/turismo/resource/js/json/atractivos.AT-Categoria.json`
  * **IDs Clave:** `1` (Sitios Naturales), `2` (Manifestaciones Culturales), `3` (Folclore), `4` (Realizaciones Contemporáneas), `5` (Acontecimientos Programados).

* **Tipos de Atractivo (dependen de la Categoría):**
  * **Método:** `GET`
  * **URL:** `https://sigmincetur.mincetur.gob.pe/turismo/resource/js/json/atractivos.AT-TipoCategria.json`

* **Subtipos de Atractivo (dependen del Tipo):**
  * **Método:** `GET`
  * **URL:** `https://sigmincetur.mincetur.gob.pe/turismo/resource/js/json/atractivos.AT-SubTipoCategria.json`

---

### 1.2 Actividades y Deportes Turísticos

* **Método:** `GET`
* **URL:** `https://sigmincetur.mincetur.gob.pe/turismo/resource/js/jquery-objects.js`
* **Variable:** `arrOpcionActividad`

| ID Actividad Principal (`atracActi`) | Nombre | Ejemplos de Sub-actividades (`atracActiTipo`) |
| :--- | :--- | :--- |
| `1` | **Paseos** | Paseos en Bote (`17`), Caballito de Totora (`5`), Bicicleta (`50`) |
| `3` | **Deportes Acuáticos** | Buceo (`6`), Canotaje (`12`), Surf (`46`), Natación (`32`) |
| `5` | **Naturaleza** | Observación de Aves (`15`), Fauna (`33`), Flora (`34`), Paisaje (`35`) |
| `7` | **Folclore** | Fiestas Patronales (`3`), Ferias (`23`), Gastronomía (`25`) |
| `8` | **Deportes / Aventura** | Caminata / Trekking (`8`), Escalada en Roca (`21`), Parapente (`38`) |
| `99` | **Otros** | Artesanías (`13`), Fotografías (`45`), Eventos (`41`) |

---

### 1.3 Departamentos y Ubigeo (GeoServer)

* **Método:** `GET`
* **URL:** `https://sigmincetur.mincetur.gob.pe/geoserver/ProduSig/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ProduSig:ubigeo.Departamentos&outputFormat=application/json`
* **Códigos de Departamento frecuentes:** `15` (Lima), `08` (Cusco), `04` (Arequipa), `20` (Piura), `02` (Áncash), `16` (Loreto), `21` (Puno).

---

## Paso 2: Filtrar Sitios Turísticos

Este endpoint ejecuta la búsqueda combinando los filtros de ubicación, actividad o categoría.

* **Método:** `GET`
* **URL:** `https://sigmincetur.mincetur.gob.pe/turismo/sistema/consulta/selectData2.ashx`
* **Headers requeridos:**
  * `X-Requested-With`: `XMLHttpRequest`
  * `User-Agent`: `Mozilla/5.0`

### Parámetros de Consulta (`Query Params`):

| Parámetro | Tipo | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- |
| `tabOpr` | Entero | Modo de búsqueda (`0` = Por Región/Actividad) | `0` |
| `codUbigeoGeo` | String | Código de Departamento (2 dígitos) | `15` (Lima) |
| `atracActi` | String | ID de Actividad Principal (separar con `\|` si son varias) | `1` o `1\|8` |
| `atracActiTipo` | String | ID de Sub-actividad específica | `17` (Paseos en Bote) |
| `atracCateg` | String | ID de Categoría del recurso | `1` (Sitios Naturales) |
| `txtBuscar` | String | Búsqueda por texto / nombre | `Manglares` |

---

### Ejemplo de Petición en Postman / cURL:

```bash
curl -X GET "https://sigmincetur.mincetur.gob.pe/turismo/sistema/consulta/selectData2.ashx?atracActi=1&atracActiTipo=17&codUbigeoGeo=20&tabOpr=0" \
     -H "X-Requested-With: XMLHttpRequest"
```

### Ejemplo de Respuesta JSON:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-80.8872, -5.5186]
      },
      "properties": {
        "codigo": 62,
        "nombre": "Manglares San Pedro De Vice",
        "categoria": "1. SITIOS NATURALES",
        "tipo_categoria": "l. Costas",
        "subtipo_categoria": "Manglares",
        "desdpto": "Piura",
        "desprov": "Sechura",
        "desubigeo": "VICE",
        "x": -80.8872,
        "y": -5.5186,
        "url": "https://consultasenlinea.mincetur.gob.pe/fichaInventario/index.aspx?cod_Ficha=62",
        "desjerarquia": "2"
      }
    }
  ]
}
```

> **Dato Clave:** El campo `properties.codigo` (en este ejemplo `62`) es el **Código de Ficha** necesario para el Paso 3.

---

## Paso 3: Ingresar al Sitio Turístico (Detalle de la Ficha)

Una vez obtenido el `codigo` del atractivo, puedes ingresar a su ficha técnica oficial para consultar toda su información descriptiva, fotos y accesos.

### 3.1 Ficha Oficial del Recurso
* **Método:** `GET`
* **URL:** `https://consultasenlinea.mincetur.gob.pe/fichaInventario/index.aspx?cod_Ficha={codigo}`
* **Ejemplo:** `https://consultasenlinea.mincetur.gob.pe/fichaInventario/index.aspx?cod_Ficha=62`

**Datos que contiene la ficha:**
1. **Datos Generales:** Nombre, Departamento, Provincia, Distrito, Categoría, Tipo, Subtipo, Altitud y Jerarquía.
2. **Descripción y Particularidades:** Reseña histórica, ecológica y características del atractivo.
3. **Actividades Permitidas:** Lista de actividades con sus íconos (Trekking, Fotografía, Kayak, etc.).
4. **Galería de Fotos:** Enlaces a las fotos oficiales en alta resolución.
5. **Ruta y Medios de Acceso:** Distancias, estado de carreteras y medios de transporte.
6. **Época Propicia de Visita:** Meses y horarios recomendados.

### 3.2 Obtener Fotos Oficiales
* **Método:** `GET`
* **URL:** `https://consultasenlinea.mincetur.gob.pe/fichaInventario/foto.aspx?cod={id_foto}`
* **Ejemplo:** `https://consultasenlinea.mincetur.gob.pe/fichaInventario/foto.aspx?cod=298073`

---

## Ejemplo Completo en Python

El archivo [`mincetur_api.py`](mincetur_api.py) contiene el cliente listo para ejecutar este flujo completo:

```python
from mincetur_api import MinceturAPI

api = MinceturAPI()

# 1. Obtener actividades disponibles
actividades = api.obtener_actividades()
print("Actividades disponibles:", len(actividades))

# 2. Filtrar sitios turísticos en Piura (20) que tengan Paseos en Bote (17)
sitios = api.buscar_recursos(id_subactividad=17, cod_ubigeo_dpto="20")
print(f"Sitios encontrados: {len(sitios)}")

# 3. Ingresar al primer sitio encontrado y obtener su ficha completa
primer_sitio = sitios[0]["properties"]
cod_ficha = primer_sitio["codigo"]

ficha = api.obtener_detalle_ficha(cod_ficha=cod_ficha)

print(f"\n--- FICHA OFICIAL N° {cod_ficha} ---")
print(f"Nombre: {ficha['nombre']}")
print(f"Ubicación: {ficha['departamento']} / {ficha['provincia']} / {ficha['distrito']}")
print(f"Clasificación: {ficha['categoria']} > {ficha['subtipo']}")
print(f"Fotos disponibles: {len(ficha['galeria_fotos'])}")
print(f"Actividades: {', '.join(ficha['actividades_permitidas'])}")
print(f"Descripción: {ficha['descripcion'][:200]}...")
```

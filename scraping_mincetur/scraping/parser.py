import re
from typing import Any, Dict, List, Optional
from bs4 import BeautifulSoup

from .config import Config


def clean_text(text: Optional[str]) -> str:
    """Limpia saltos de línea innecesarios, retornos de carro y espacios múltiples."""
    if not text:
        return ""
    # Reemplazar retornos y tabulaciones por espacios
    t = re.sub(r"[\r\n\t]+", " ", text)
    # Reemplazar múltiples espacios por uno solo
    t = re.sub(r" +", " ", t)
    return t.strip()


def clean_multiline_text(text: Optional[str]) -> str:
    """Limpia textos preservando párrafos lógicos."""
    if not text:
        return ""
    lines = [clean_text(line) for line in text.split("\n")]
    cleaned_lines = [l for l in lines if l]
    return "\n".join(cleaned_lines)


class FichaParser:
    """Parser especializado para procesar el HTML de las Fichas de Inventario de MINCETUR."""

    @staticmethod
    def parse_html(html: str, cod_ficha: int) -> Optional[Dict[str, Any]]:
        """
        Parsea el contenido HTML de una Ficha Oficial y retorna una estructura JSON detallada y limpia.
        Retorna None si la ficha no existe o está fuera de servicio (302/404/baja).
        """
        if not html or len(html) < 500:
            return None

        # Detección estricta de redirecciones a gob.pe o páginas vacías
        if "Object moved" in html or "www.mincetur.gob.pe" in html or "gob.pe/mincetur" in html:
            return None

        soup = BeautifulSoup(html, "html.parser")

        # 1. Nombre / Título
        titulo_div = soup.find("div", class_="TituloRecurso")
        if titulo_div and titulo_div.get_text(strip=True):
            nombre = clean_text(titulo_div.get_text())
        else:
            og_title = soup.find("meta", property="og:title")
            if og_title and og_title.get("content"):
                nombre = clean_text(og_title["content"])
            else:
                return None  # Sin título oficial = página inválida/redirección

        # 2. Descripción base (meta)
        og_desc = soup.find("meta", property="og:description")
        descripcion_meta = clean_text(og_desc["content"]) if og_desc and og_desc.get("content") else ""

        # 3. Datos Generales de la Tabla Principal
        datos_generales: Dict[str, str] = {
            "departamento": "",
            "provincia": "",
            "distrito": "",
            "categoria": "",
            "tipo": "",
            "subtipo": "",
            "jerarquia": "",
            "altitud": "",
        }

        for tr in soup.find_all("tr"):
            text = tr.get_text()
            val_span = tr.find("span", class_=["TextGris", "TextGris2"])
            val = clean_text(val_span.get_text()) if val_span else ""

            if "Departamento:" in text and not datos_generales["departamento"]:
                datos_generales["departamento"] = val
            elif "Provincia:" in text and not datos_generales["provincia"]:
                datos_generales["provincia"] = val
            elif "Distrito:" in text and not datos_generales["distrito"]:
                datos_generales["distrito"] = val
            elif "Categoría:" in text and not datos_generales["categoria"]:
                datos_generales["categoria"] = val
            elif "Tipo:" in text and not datos_generales["tipo"]:
                datos_generales["tipo"] = val
            elif "Subtipo:" in text and not datos_generales["subtipo"]:
                datos_generales["subtipo"] = val
            elif "Jerarquía:" in text and not datos_generales["jerarquia"]:
                datos_generales["jerarquia"] = val
            elif "Altitud:" in text and not datos_generales["altitud"]:
                datos_generales["altitud"] = val

        # Si no tiene departamento ni categoría oficial, es una página vacía o redirección
        if not datos_generales["departamento"] and not datos_generales["categoria"]:
            return None

        # 4. Galería de Fotos Oficiales
        fotos_ids: List[str] = []
        for tag in soup.find_all(["a", "img"], href=True) + soup.find_all("img", src=True):
            attr_val = tag.get("href") or tag.get("src") or ""
            match = re.search(r"foto\.aspx\?cod=(\d+)", attr_val)
            if match:
                f_id = match.group(1)
                if f_id not in fotos_ids:
                    fotos_ids.append(f_id)

        galeria_fotos = [
            f"{Config.FICHA_BASE_URL}/foto.aspx?cod={fid}"
            for fid in fotos_ids
        ]

        foto_principal = galeria_fotos[0] if galeria_fotos else f"{Config.FICHA_BASE_URL}/foto.aspx?cod={cod_ficha}"

        # 5. Secciones Descriptivas (Acordeón)
        secciones: List[Dict[str, str]] = []
        descripcion_completa = descripcion_meta
        particularidades = ""
        estado_actual = ""
        observaciones = ""

        accordion = soup.find(id="accordionContent") or soup
        for h3 in accordion.find_all("h3"):
            header_title = clean_text(h3.get_text())
            content_div = h3.find_next_sibling("div")
            if not content_div:
                continue

            content_text = clean_multiline_text(content_div.get_text("\n"))
            secciones.append({
                "titulo": header_title,
                "contenido": content_text,
            })

            h_lower = header_title.lower()
            if "descripción" in h_lower or "descripcion" in h_lower:
                descripcion_completa = content_text or descripcion_meta
            elif "particularidades" in h_lower:
                particularidades = content_text
            elif "estado actual" in h_lower:
                estado_actual = content_text
            elif "observaciones" in h_lower:
                observaciones = content_text

        # 6. Actividades Desarrolladas (Tabla estructurada con íconos)
        actividades_detalle: List[Dict[str, Any]] = []
        actividades_permitidas: List[str] = []

        for h3 in soup.find_all("h3"):
            if "actividades" in h3.get_text().lower():
                content_div = h3.find_next_sibling("div")
                if content_div:
                    for r_idx, row in enumerate(content_div.find_all("tr")):
                        if r_idx == 0:
                            continue  # Cabecera
                        tds = row.find_all("td")
                        if len(tds) >= 3:
                            act_nom = clean_text(tds[0].get_text())
                            act_tipo = clean_text(tds[1].get_text())
                            act_obs = clean_text(tds[2].get_text())

                            icono_url = None
                            if len(tds) >= 4:
                                img = tds[3].find("img")
                                if img and img.get("src"):
                                    src = img["src"]
                                    if "vineta" not in src and not src.endswith("/resource"):
                                        if not src.startswith("http"):
                                            src = f"{Config.FICHA_BASE_URL}/{src.lstrip('/')}"
                                        icono_url = re.sub(r"([^:])//+", r"\1/", src)

                            if act_nom or act_tipo:
                                actividades_detalle.append({
                                    "actividad": act_nom,
                                    "tipo": act_tipo,
                                    "observacion": act_obs,
                                    "icono_url": icono_url,
                                })
                                display_name = f"{act_nom} - {act_tipo}" if act_tipo else act_nom
                                if display_name not in actividades_permitidas:
                                    actividades_permitidas.append(display_name)

        # 7. Rutas y Medios de Acceso
        rutas_acceso: List[Dict[str, str]] = []
        for h3 in soup.find_all("h3"):
            if "acceso" in h3.get_text().lower() or "rutas" in h3.get_text().lower():
                content_div = h3.find_next_sibling("div")
                if content_div:
                    for r_idx, row in enumerate(content_div.find_all("tr")):
                        if r_idx == 0:
                            continue
                        tds = row.find_all("td")
                        if len(tds) >= 5:
                            rutas_acceso.append({
                                "recorrido": clean_text(tds[0].get_text()),
                                "tramo": clean_text(tds[1].get_text()),
                                "detalle": clean_text(tds[2].get_text()) if len(tds) >= 6 else "",
                                "tipo_acceso": clean_text(tds[3].get_text()) if len(tds) >= 6 else clean_text(tds[2].get_text()),
                                "medio_transporte": clean_text(tds[4].get_text()) if len(tds) >= 6 else clean_text(tds[2].get_text()),
                                "tipo_via": clean_text(tds[5].get_text()) if len(tds) >= 6 else clean_text(tds[3].get_text()),
                                "distancia_tiempo": clean_text(tds[-1].get_text()),
                            })

        # 8. Época Propicia de Visita
        epoca_propicia: List[Dict[str, str]] = []
        for h3 in soup.find_all("h3"):
            h_text = h3.get_text().lower()
            if "propicia" in h_text or "visita" in h_text or "horario" in h_text:
                content_div = h3.find_next_sibling("div")
                if content_div:
                    for r_idx, row in enumerate(content_div.find_all("tr")):
                        if r_idx == 0:
                            continue
                        tds = row.find_all("td")
                        if len(tds) >= 4:
                            epoca_propicia.append({
                                "epoca": clean_text(tds[0].get_text()),
                                "especificacion": clean_text(tds[1].get_text()),
                                "horario": clean_text(tds[2].get_text()),
                                "observaciones": clean_text(tds[3].get_text()),
                            })

        # 9. Tipo de Ingreso / Tarifas
        tipo_ingreso: List[Dict[str, str]] = []
        for h3 in soup.find_all("h3"):
            if "ingreso" in h3.get_text().lower():
                content_div = h3.find_next_sibling("div")
                if content_div:
                    for r_idx, row in enumerate(content_div.find_all("tr")):
                        if r_idx == 0:
                            continue
                        tds = row.find_all("td")
                        if len(tds) >= 2:
                            tipo_ingreso.append({
                                "tipo": clean_text(tds[0].get_text()),
                                "observaciones": clean_text(tds[1].get_text()),
                            })

        # 10. Servicios Turísticos Actuales
        servicios_turisticos: List[Dict[str, str]] = []
        for h3 in soup.find_all("h3"):
            if "servicios turísticos" in h3.get_text().lower() or "servicios turisticos" in h3.get_text().lower():
                ubicacion = "dentro" if "dentro" in h3.get_text().lower() else "fuera"
                content_div = h3.find_next_sibling("div")
                if content_div:
                    for r_idx, row in enumerate(content_div.find_all("tr")):
                        if r_idx == 0:
                            continue
                        tds = row.find_all("td")
                        if len(tds) >= 3:
                            servicios_turisticos.append({
                                "ubicacion": ubicacion,
                                "instalacion": clean_text(tds[0].get_text()) if len(tds) >= 4 else "",
                                "servicio": clean_text(tds[1].get_text()) if len(tds) >= 4 else clean_text(tds[0].get_text()),
                                "tipo_servicio": clean_text(tds[2].get_text()) if len(tds) >= 4 else clean_text(tds[1].get_text()),
                                "observacion": clean_text(tds[-1].get_text()),
                            })

        # 11. Videos de YouTube (si existen embebidos)
        youtube_url = None
        for iframe in soup.find_all("iframe", src=True):
            src = iframe["src"]
            if "youtube.com" in src or "youtu.be" in src:
                youtube_url = src
                break

        # Construir Estructura de Ficha Detallada
        ficha_data = {
            "cod_ficha": cod_ficha,
            "url_ficha": f"{Config.FICHA_BASE_URL}/index.aspx?cod_Ficha={cod_ficha}",
            "nombre": nombre,
            "departamento": datos_generales["departamento"],
            "provincia": datos_generales["provincia"],
            "distrito": datos_generales["distrito"],
            "categoria": datos_generales["categoria"],
            "tipo": datos_generales["tipo"],
            "subtipo": datos_generales["subtipo"],
            "jerarquia": datos_generales["jerarquia"],
            "altitud": datos_generales["altitud"],
            "foto_principal": foto_principal,
            "galeria_fotos": galeria_fotos,
            "actividades_permitidas": actividades_permitidas,
            "actividades_detalle": actividades_detalle,
            "rutas_acceso": rutas_acceso,
            "epoca_propicia": epoca_propicia,
            "tipo_ingreso": tipo_ingreso,
            "servicios_turisticos": servicios_turisticos,
            "descripcion": descripcion_completa,
            "particularidades": particularidades,
            "estado_actual": estado_actual,
            "observaciones": observaciones,
            "youtube_url": youtube_url,
            "secciones": secciones,
        }

        return ficha_data

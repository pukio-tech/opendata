import sys
from pathlib import Path
import pandas as pd

# Asegurar compatibilidad de salida UTF-8 en terminales Windows
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Diccionario para traducir todas las columnas de inglés a español
MAPEO_COLUMNAS_ESPANOL = {
    "taxpayer_id": "id_contribuyente",
    "document_type": "tipo_documento",
    "document_number": "numero_documento",
    "full_name": "razon_social",
    "first_name": "nombres",
    "last_name_father": "apellido_paterno",
    "last_name_mother": "apellido_materno",
    "taxpayer_status": "estado_contribuyente",
    "address_condition": "condicion_domicilio",
    "ubigeo_code": "codigo_ubigeo",
    "dni": "dni",
    "trade_name": "nombre_comercial",
    "registration_date": "fecha_inscripcion",
    "activity_start_date": "fecha_inicio_actividades",
    "company_url": "url_empresa",
    "economic_activity": "actividad_economica",
    "ciiu_code": "codigo_ciiu",
    "taxpayer_type": "tipo_contribuyente",
    "deactivation_date": "fecha_baja",
    "email": "correo_electronico",
    "website": "sitio_web",
    "phone": "telefono",
    "street_address": "direccion",
    "department_name": "departamento",
    "province_name": "provincia",
    "district_name": "distrito",
    "updated_at": "fecha_actualizacion",
    "created_at": "fecha_creacion",
}


def cargar_empresas(
    ruta_csv: str | Path | None = None,
    renombrar_espanol: bool = True,
) -> pd.DataFrame:
    """
    Carga el archivo CSV de empresas con tipos de datos adecuados
    y renombra las columnas a español de forma predeterminada.
    """
    if ruta_csv is None:
        ruta_csv = Path(__file__).parent / "empresas.csv"
    else:
        ruta_csv = Path(ruta_csv)

    if not ruta_csv.exists():
        raise FileNotFoundError(f"No se encontro el archivo en: {ruta_csv.resolve()}")

    print(f"[INFO] Cargando archivo: {ruta_csv.resolve()} ...")

    # Columnas que deben conservarse como texto para no perder ceros iniciales
    columnas_texto = {
        "document_type": str,
        "document_number": str,
        "ubigeo_code": str,
        "ciiu_code": str,
        "phone": str,
        "dni": str,
    }

    # 'NULL' en el CSV representa valores nulos
    df = pd.read_csv(
        ruta_csv,
        dtype=columnas_texto,
        na_values=["NULL", ""],
        low_memory=False,
        encoding="utf-8",
    )

    if renombrar_espanol:
        df = df.rename(columns=MAPEO_COLUMNAS_ESPANOL)

    return df


def mostrar_resumen(df: pd.DataFrame) -> None:
    """
    Muestra un resumen descriptivo del DataFrame en consola con nombres en español.
    """
    pd.set_option("display.max_columns", None)
    pd.set_option("display.width", 1000)

    print("\n" + "=" * 70)
    print(" RESUMEN DEL DATASET DE EMPRESAS (COLUMNAS EN ESPAÑOL)")
    print("=" * 70)
    print(f"Total de registros: {len(df):,}")
    print(f"Total de columnas:  {len(df.columns)}")

    print("\n[-] Columnas disponibles y tipos:")
    for i, col in enumerate(df.columns, 1):
        n_nulos = df[col].isna().sum()
        print(f"  {i:2d}. {col:<26} | Tipo: {str(df[col].dtype):<10} | Nulos: {n_nulos:,}")

    print("\n" + "-" * 70)
    print("[*] Primeras 5 filas (columnas principales):")
    print("-" * 70)
    columnas_clave = [
        col
        for col in [
            "numero_documento",
            "razon_social",
            "estado_contribuyente",
            "condicion_domicilio",
            "departamento",
            "provincia",
            "actividad_economica",
        ]
        if col in df.columns
    ]
    print(df[columnas_clave].head())

    if "estado_contribuyente" in df.columns:
        print("\n[*] Distribucion por Estado de Contribuyente (estado_contribuyente):")
        print(df["estado_contribuyente"].value_counts(dropna=False).head(5))

    if "departamento" in df.columns:
        print("\n[*] Top 5 Departamentos con mas empresas:")
        print(df["departamento"].value_counts(dropna=False).head(5))

    print("\n" + "=" * 70)


if __name__ == "__main__":
    df = cargar_empresas(renombrar_espanol=True)
    mostrar_resumen(df)

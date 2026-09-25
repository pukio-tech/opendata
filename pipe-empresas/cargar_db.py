import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

from leer_empresas import cargar_empresas

# Asegurar compatibilidad UTF-8 en consola Windows
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def obtener_database_url() -> str:
    """Busca la variable DATABASE_URL en el entorno o en bk_opendata/.env"""
    # Intentar cargar desde el entorno actual
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        return db_url

    # Intentar cargar desde ../bk_opendata/.env
    env_bk = Path(__file__).resolve().parent.parent / "bk_opendata" / ".env"
    if env_bk.exists():
        load_dotenv(env_bk)
        db_url = os.getenv("DATABASE_URL")
        if db_url:
            return db_url

    raise ValueError(
        f"No se encontró DATABASE_URL ni en variables de entorno ni en {env_bk}"
    )


def ejecutar_ddl(conn, ruta_sql: Path) -> None:
    """Ejecuta el archivo DDL para asegurar que esquema y tablas existan."""
    print(f"[1/4] Aplicando DDL de esquema y tablas desde: {ruta_sql.name} ...")
    with open(ruta_sql, "r", encoding="utf-8") as f:
        ddl = f.read()

    with conn.cursor() as cur:
        cur.execute(ddl)
    conn.commit()
    print("      Esquema 'empresas', tablas, índices y vistas verificados con éxito.")


def poblar_catalogos(conn, df: pd.DataFrame) -> None:
    """Inserta o actualiza los catálogos auxiliares (CIIU y Tipo Contribuyente)."""
    print("[2/4] Poblando catálogos auxiliares (CIIU y Tipo Contribuyente) ...")

    # Catálogo CIIU
    ciiu_df = (
        df[["codigo_ciiu", "actividad_economica"]]
        .dropna(subset=["codigo_ciiu"])
        .drop_duplicates(subset=["codigo_ciiu"])
    )
    ciiu_records = [
        (row["codigo_ciiu"].strip(), row["actividad_economica"].strip() if pd.notna(row["actividad_economica"]) else "SIN DESCRIPCION")
        for _, row in ciiu_df.iterrows()
        if str(row["codigo_ciiu"]).strip()
    ]

    with conn.cursor() as cur:
        query_ciiu = """
            INSERT INTO empresas.actividades_ciiu (codigo_ciiu, descripcion)
            VALUES %s
            ON CONFLICT (codigo_ciiu) DO UPDATE 
            SET descripcion = EXCLUDED.descripcion;
        """
        execute_values(cur, query_ciiu, ciiu_records)

        # Catálogo Tipos Contribuyente
        tipos_unicos = [
            (t.strip(),)
            for t in df["tipo_contribuyente"].dropna().unique()
            if str(t).strip()
        ]
        query_tipos = """
            INSERT INTO empresas.tipos_contribuyente (nombre)
            VALUES %s
            ON CONFLICT (nombre) DO NOTHING;
        """
        execute_values(cur, query_tipos, tipos_unicos)

    conn.commit()
    print(f"      {len(ciiu_records)} actividades CIIU y {len(tipos_unicos)} tipos de contribuyente registrados.")


def limpiar_y_preparar_datos(df: pd.DataFrame) -> list[tuple]:
    """Limpia los campos y genera las tuplas listas para inserción masiva."""
    print("[3/4] Preparando y convirtiendo datos (fechas, nulos y tipos) ...")

    # Parsear fechas DD/MM/YYYY a YYYY-MM-DD
    for col in ["fecha_inscripcion", "fecha_inicio_actividades", "fecha_baja"]:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], format="%d/%m/%Y", errors="coerce").dt.strftime("%Y-%m-%d")

    # Parsear timestamps ISO
    for col in ["fecha_creacion", "fecha_actualizacion"]:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce").dt.strftime("%Y-%m-%d %H:%M:%S%z")

    # Reemplazar NaN y NaT con None para que psycopg2 envíe NULL a PostgreSQL
    df_clean = df.astype(object).where(pd.notna(df), None)

    filas = []
    for _, row in df_clean.iterrows():
        filas.append((
            int(row["id_contribuyente"]),
            row["tipo_documento"] or "20",
            row["numero_documento"],
            row["razon_social"],
            row["nombre_comercial"],
            row["estado_contribuyente"] or "ACTIVO",
            row["condicion_domicilio"] or "HABIDO",
            row["tipo_contribuyente"],
            row["actividad_economica"],
            row["codigo_ciiu"],
            row["fecha_inscripcion"],
            row["fecha_inicio_actividades"],
            row["fecha_baja"],
            row["url_empresa"],
            row["codigo_ubigeo"],
            row["direccion"],
            row["departamento"],
            row["provincia"],
            row["distrito"],
            row["dni"],
            row["nombres"],
            row["apellido_paterno"],
            row["apellido_materno"],
            row["telefono"],
            row["correo_electronico"],
            row["sitio_web"],
            row["fecha_actualizacion"],  # fecha_actualizacion_fuente
            row["fecha_creacion"],       # fecha_creacion_fuente
        ))

    return filas


def cargar_empresas_en_db(
    conn,
    filas: list[tuple],
    batch_size: int = 5000,
) -> None:
    """Inserta las empresas por lotes con UPSERT (ON CONFLICT)."""
    print(f"[4/4] Insertando {len(filas):,} empresas por lotes de {batch_size:,}...")

    query_upsert = """
        INSERT INTO empresas.empresas (
            id_contribuyente,
            tipo_documento,
            numero_documento,
            razon_social,
            nombre_comercial,
            estado_contribuyente,
            condicion_domicilio,
            tipo_contribuyente,
            actividad_economica,
            codigo_ciiu,
            fecha_inscripcion,
            fecha_inicio_actividades,
            fecha_baja,
            url_empresa,
            codigo_ubigeo,
            direccion,
            departamento,
            provincia,
            distrito,
            dni,
            nombres,
            apellido_paterno,
            apellido_materno,
            telefono,
            correo_electronico,
            sitio_web,
            fecha_actualizacion_fuente,
            fecha_creacion_fuente
        ) VALUES %s
        ON CONFLICT (numero_documento) DO UPDATE SET
            razon_social = EXCLUDED.razon_social,
            nombre_comercial = EXCLUDED.nombre_comercial,
            estado_contribuyente = EXCLUDED.estado_contribuyente,
            condicion_domicilio = EXCLUDED.condicion_domicilio,
            tipo_contribuyente = EXCLUDED.tipo_contribuyente,
            actividad_economica = EXCLUDED.actividad_economica,
            codigo_ciiu = EXCLUDED.codigo_ciiu,
            fecha_inscripcion = EXCLUDED.fecha_inscripcion,
            fecha_inicio_actividades = EXCLUDED.fecha_inicio_actividades,
            url_empresa = EXCLUDED.url_empresa,
            codigo_ubigeo = EXCLUDED.codigo_ubigeo,
            direccion = EXCLUDED.direccion,
            departamento = EXCLUDED.departamento,
            provincia = EXCLUDED.provincia,
            distrito = EXCLUDED.distrito,
            fecha_actualizacion_fuente = EXCLUDED.fecha_actualizacion_fuente;
    """

    total_insertadas = 0
    t_inicio = time.time()

    with conn.cursor() as cur:
        for i in range(0, len(filas), batch_size):
            lote = filas[i : i + batch_size]
            execute_values(cur, query_upsert, lote, page_size=batch_size)
            conn.commit()
            total_insertadas += len(lote)
            porcentaje = (total_insertadas / len(filas)) * 100
            print(f"      Progreso: {total_insertadas:,}/{len(filas):,} registros ({porcentaje:.1f}%)")

    t_fin = time.time()
    print(f"\n Carga finalizada con éxito en {t_fin - t_inicio:.2f} segundos.")


def verificar_carga(conn) -> None:
    """Consulta la base de datos para mostrar un conteo y verificar la vista."""
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM empresas.empresas;")
        total = cur.fetchone()[0]

        cur.execute("SELECT departamento, total_empresas FROM empresas.vw_estadisticas_departamento LIMIT 5;")
        top_deptos = cur.fetchall()

    print("\n" + "=" * 60)
    print("  VERIFICACIÓN EN BASE DE DATOS")
    print("=" * 60)
    print(f"Total registros en tabla empresas.empresas: {total:,}")
    print("\nTop 5 departamentos registrados:")
    for depto, cant in top_deptos:
        print(f"  - {depto:<18}: {cant:,} empresas")
    print("=" * 60)


def main():
    db_url = obtener_database_url()
    # Ocultar la contraseña en el log
    host_info = db_url.split("@")[-1] if "@" in db_url else db_url
    print(f"[INFO] Conectando a PostgreSQL: {host_info}")

    conn = psycopg2.connect(db_url)
    try:
        # 1. Aplicar DDL
        ruta_ddl = Path(__file__).resolve().parent.parent / "bk_opendata" / "db" / "empresas.sql"
        if not ruta_ddl.exists():
            raise FileNotFoundError(f"No se encontró el DDL en {ruta_ddl}")
        ejecutar_ddl(conn, ruta_ddl)

        # 2. Cargar CSV con pandas
        df = cargar_empresas(renombrar_espanol=True)

        # 3. Poblar catálogos
        poblar_catalogos(conn, df)

        # 4. Preparar tuplas y cargar empresas
        filas = limpiar_y_preparar_datos(df)
        cargar_empresas_en_db(conn, filas, batch_size=5000)

        # 5. Verificación
        verificar_carga(conn)

    finally:
        conn.close()


if __name__ == "__main__":
    main()

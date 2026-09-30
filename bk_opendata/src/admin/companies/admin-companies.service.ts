import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { QueryCompanyDto } from './dto/query-company.dto';
import { resolveLocation } from '../shared/location.helper';

/**
 * Gestión de empresas sobre empresas.empresas (la misma tabla que alimenta
 * el pipeline de carga del padrón y la web pública).
 *
 * - origen = 'importado': registros del padrón. El pipeline hace upsert por
 *   numero_documento y sobrescribe razón social, estado, actividad y
 *   dirección; teléfono, correo, web, representante e is_active se conservan.
 * - origen = 'manual': creados desde el panel, con ids >= 9000000000
 *   (empresas.empresas_manual_id_seq).
 */

/** Campos que el pipeline sobrescribe en su ON CONFLICT DO UPDATE. */
const PIPELINE_MANAGED: (keyof UpdateCompanyDto)[] = [
  'ruc',
  'businessName',
  'tradeName',
  'taxpayerStatus',
  'domicileCondition',
  'taxpayerType',
  'ciiuCode',
  'activityStartDate',
  'address',
  'ubigeo',
];

const SELECT_COMPANY = Prisma.sql`
  SELECT
    e.id_contribuyente::text                          AS id,
    e.numero_documento                                AS ruc,
    e.tipo_documento                                  AS "documentType",
    e.razon_social                                    AS "businessName",
    e.nombre_comercial                                AS "tradeName",
    e.estado_contribuyente                            AS "taxpayerStatus",
    e.condicion_domicilio                             AS "domicileCondition",
    e.tipo_contribuyente                              AS "taxpayerType",
    e.actividad_economica                             AS "economicActivity",
    e.codigo_ciiu                                     AS "ciiuCode",
    to_char(e.fecha_inscripcion, 'YYYY-MM-DD')        AS "registrationDate",
    to_char(e.fecha_inicio_actividades, 'YYYY-MM-DD') AS "activityStartDate",
    to_char(e.fecha_baja, 'YYYY-MM-DD')               AS "deregistrationDate",
    e.url_empresa                                     AS "companyUrl",
    e.direccion                                       AS address,
    e.codigo_ubigeo                                   AS ubigeo,
    e.departamento                                    AS department,
    e.provincia                                       AS province,
    e.distrito                                        AS district,
    e.dni                                             AS "representativeDni",
    e.nombres                                         AS "representativeFirstName",
    e.apellido_paterno                                AS "representativeLastName1",
    e.apellido_materno                                AS "representativeLastName2",
    e.telefono                                        AS phone,
    e.correo_electronico                              AS email,
    e.sitio_web                                       AS website,
    COALESCE(e.is_active, TRUE)                       AS "isActive",
    e.origen                                          AS source,
    e.fecha_creacion                                  AS "createdAt",
    e.fecha_actualizacion                             AS "updatedAt"
  FROM empresas.empresas e
`;

@Injectable()
export class AdminCompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  private async rucExists(ruc: string, excludeId?: string): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id_contribuyente::text AS id FROM empresas.empresas
      WHERE numero_documento = ${ruc}
        ${excludeId ? Prisma.sql`AND id_contribuyente <> ${excludeId}::bigint` : Prisma.empty}
      LIMIT 1`;
    return rows.length > 0;
  }

  /** Devuelve la descripción del código CIIU (valida que exista). */
  private async resolveCiiuDescription(code: string): Promise<string> {
    const rows = await this.prisma.$queryRaw<{ descripcion: string }[]>`
      SELECT descripcion FROM empresas.actividades_ciiu WHERE codigo_ciiu = ${code}`;
    if (!rows.length) {
      throw new BadRequestException(`El código CIIU "${code}" no existe`);
    }
    return rows[0].descripcion;
  }

  /** '20' para personas jurídicas (RUC 20…), '10' para el resto. */
  private documentType(ruc: string): string {
    return ruc.startsWith('20') ? '20' : '10';
  }

  async findAll(query: QueryCompanyDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: Prisma.Sql[] = [];

    if (query.search?.trim()) {
      const term = query.search.trim();
      conditions.push(Prisma.sql`(
        turismo.f_unaccent(lower(e.razon_social)) LIKE '%' || turismo.f_unaccent(lower(${term})) || '%'
        OR turismo.f_unaccent(lower(COALESCE(e.nombre_comercial, ''))) LIKE '%' || turismo.f_unaccent(lower(${term})) || '%'
        OR e.numero_documento LIKE ${term} || '%'
      )`);
    }
    if (query.department) {
      conditions.push(Prisma.sql`
        turismo.f_unaccent(lower(e.departamento)) = turismo.f_unaccent(lower(${query.department}))`);
    }
    if (query.taxpayerType) {
      conditions.push(Prisma.sql`e.tipo_contribuyente = ${query.taxpayerType}`);
    }
    if (query.domicileCondition) {
      conditions.push(Prisma.sql`e.condicion_domicilio = ${query.domicileCondition}`);
    }
    if (query.source) {
      conditions.push(Prisma.sql`e.origen = ${query.source}`);
    }
    if (query.isActive !== undefined) {
      conditions.push(Prisma.sql`COALESCE(e.is_active, TRUE) = ${query.isActive}`);
    }

    const where = conditions.length
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;

    const [countRows, items] = await Promise.all([
      this.prisma.$queryRaw<{ total: bigint }[]>`
        SELECT count(*) AS total FROM empresas.empresas e ${where}`,
      this.prisma.$queryRaw`
        ${SELECT_COMPANY} ${where}
        ORDER BY e.fecha_actualizacion DESC NULLS LAST, e.id_contribuyente DESC
        LIMIT ${limit} OFFSET ${offset}`,
    ]);

    const total = Number(countRows[0]?.total ?? 0);

    return {
      success: true,
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const rows = await this.prisma.$queryRaw<{ id: string; source: string }[]>`
      ${SELECT_COMPANY} WHERE e.id_contribuyente = ${id}::bigint`;

    if (!rows.length) {
      throw new NotFoundException(`Empresa con id "${id}" no encontrada`);
    }

    return {
      success: true,
      data: rows[0],
    };
  }

  /** Tipos de contribuyente, condiciones de domicilio y departamentos para los selects del panel. */
  async getOptions() {
    const [taxpayerTypes, conditionRows, departments] = await Promise.all([
      this.prisma.$queryRaw`
        SELECT id_tipo_contribuyente AS id, nombre AS name
        FROM empresas.tipos_contribuyente ORDER BY nombre`,
      this.prisma.$queryRaw<{ value: string }[]>`
        SELECT DISTINCT condicion_domicilio AS value FROM empresas.empresas
        WHERE condicion_domicilio IS NOT NULL ORDER BY 1`,
      this.prisma.$queryRaw`
        SELECT id_departamento AS id, nombre AS name FROM turismo.departamentos ORDER BY nombre`,
    ]);
    return {
      success: true,
      data: {
        taxpayerTypes,
        domicileConditions: conditionRows.map((r) => r.value),
        departments,
      },
    };
  }

  /** Búsqueda de actividades CIIU por prefijo de código o descripción (máx. 20). */
  async searchCiiu(search?: string) {
    const term = search?.trim();
    const where = term
      ? Prisma.sql`WHERE codigo_ciiu LIKE ${term} || '%'
          OR turismo.f_unaccent(lower(descripcion)) LIKE '%' || turismo.f_unaccent(lower(${term})) || '%'`
      : Prisma.empty;
    const data = await this.prisma.$queryRaw`
      SELECT codigo_ciiu AS code, descripcion AS description
      FROM empresas.actividades_ciiu ${where}
      ORDER BY codigo_ciiu
      LIMIT 20`;
    return { success: true, data };
  }

  async create(dto: CreateCompanyDto) {
    if (await this.rucExists(dto.ruc)) {
      throw new ConflictException(`La empresa con RUC ${dto.ruc} ya existe`);
    }

    const location = dto.ubigeo ? await resolveLocation(this.prisma, dto.ubigeo) : null;
    const activity = dto.ciiuCode ? await this.resolveCiiuDescription(dto.ciiuCode) : null;

    const [{ id }] = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT nextval('empresas.empresas_manual_id_seq')::text AS id`;

    await this.prisma.$executeRaw`
      INSERT INTO empresas.empresas (
        id_contribuyente, tipo_documento, numero_documento,
        razon_social, nombre_comercial,
        estado_contribuyente, condicion_domicilio, tipo_contribuyente,
        actividad_economica, codigo_ciiu, fecha_inicio_actividades,
        direccion, codigo_ubigeo, departamento, provincia, distrito,
        dni, nombres, apellido_paterno, apellido_materno,
        telefono, correo_electronico, sitio_web,
        is_active, origen
      ) VALUES (
        ${id}::bigint, ${this.documentType(dto.ruc)}, ${dto.ruc},
        ${dto.businessName.trim()}, ${dto.tradeName?.trim() || null},
        ${dto.taxpayerStatus?.trim() || 'ACTIVO'}, ${dto.domicileCondition?.trim() || 'HABIDO'},
        ${dto.taxpayerType?.trim() || null},
        ${activity}, ${dto.ciiuCode ?? null}, ${dto.activityStartDate ?? null}::date,
        ${dto.address?.trim() || null}, ${location?.ubigeo ?? null},
        ${location?.department ?? null}, ${location?.province ?? null}, ${location?.district ?? null},
        ${dto.representativeDni ?? null}, ${dto.representativeFirstName?.trim() || null},
        ${dto.representativeLastName1?.trim() || null}, ${dto.representativeLastName2?.trim() || null},
        ${dto.phone?.trim() || null}, ${dto.email ?? null}, ${dto.website ?? null},
        ${dto.isActive ?? true}, 'manual'
      )`;

    const { data } = await this.findOne(id);
    return {
      success: true,
      message: 'Empresa creada correctamente',
      data,
    };
  }

  async update(id: string, dto: UpdateCompanyDto) {
    const { data: current } = await this.findOne(id);

    const sets: Prisma.Sql[] = [];

    if (dto.businessName !== undefined) sets.push(Prisma.sql`razon_social = ${dto.businessName.trim()}`);
    if (dto.tradeName !== undefined) sets.push(Prisma.sql`nombre_comercial = ${dto.tradeName?.trim() || null}`);
    if (dto.taxpayerStatus !== undefined) sets.push(Prisma.sql`estado_contribuyente = ${dto.taxpayerStatus?.trim() || null}`);
    if (dto.domicileCondition !== undefined) sets.push(Prisma.sql`condicion_domicilio = ${dto.domicileCondition?.trim() || null}`);
    if (dto.taxpayerType !== undefined) sets.push(Prisma.sql`tipo_contribuyente = ${dto.taxpayerType?.trim() || null}`);
    if (dto.activityStartDate !== undefined) sets.push(Prisma.sql`fecha_inicio_actividades = ${dto.activityStartDate || null}::date`);
    if (dto.address !== undefined) sets.push(Prisma.sql`direccion = ${dto.address?.trim() || null}`);
    if (dto.representativeDni !== undefined) sets.push(Prisma.sql`dni = ${dto.representativeDni || null}`);
    if (dto.representativeFirstName !== undefined) sets.push(Prisma.sql`nombres = ${dto.representativeFirstName?.trim() || null}`);
    if (dto.representativeLastName1 !== undefined) sets.push(Prisma.sql`apellido_paterno = ${dto.representativeLastName1?.trim() || null}`);
    if (dto.representativeLastName2 !== undefined) sets.push(Prisma.sql`apellido_materno = ${dto.representativeLastName2?.trim() || null}`);
    if (dto.phone !== undefined) sets.push(Prisma.sql`telefono = ${dto.phone?.trim() || null}`);
    if (dto.email !== undefined) sets.push(Prisma.sql`correo_electronico = ${dto.email || null}`);
    if (dto.website !== undefined) sets.push(Prisma.sql`sitio_web = ${dto.website || null}`);
    if (dto.isActive !== undefined) sets.push(Prisma.sql`is_active = ${dto.isActive}`);

    if (dto.ruc !== undefined && dto.ruc !== null) {
      if (await this.rucExists(dto.ruc, id)) {
        throw new ConflictException(`La empresa con RUC ${dto.ruc} ya existe`);
      }
      sets.push(Prisma.sql`numero_documento = ${dto.ruc}, tipo_documento = ${this.documentType(dto.ruc)}`);
    }

    if (dto.ciiuCode !== undefined) {
      if (dto.ciiuCode) {
        const activity = await this.resolveCiiuDescription(dto.ciiuCode);
        sets.push(Prisma.sql`codigo_ciiu = ${dto.ciiuCode}, actividad_economica = ${activity}`);
      } else {
        sets.push(Prisma.sql`codigo_ciiu = NULL, actividad_economica = NULL`);
      }
    }

    if (dto.ubigeo !== undefined) {
      if (dto.ubigeo) {
        const loc = await resolveLocation(this.prisma, dto.ubigeo);
        sets.push(Prisma.sql`
          codigo_ubigeo = ${loc.ubigeo}, departamento = ${loc.department},
          provincia = ${loc.province}, distrito = ${loc.district}`);
      } else {
        sets.push(Prisma.sql`
          codigo_ubigeo = NULL, departamento = NULL, provincia = NULL, distrito = NULL`);
      }
    }

    if (sets.length) {
      await this.prisma.$executeRaw`
        UPDATE empresas.empresas SET ${Prisma.join(sets, ', ')}
        WHERE id_contribuyente = ${id}::bigint`;
    }

    const warnings =
      current.source === 'importado' &&
      PIPELINE_MANAGED.some((k) => dto[k] !== undefined)
        ? ['Esta empresa proviene del padrón importado: razón social, estado, actividad y dirección se sobrescribirán en la próxima carga.']
        : [];

    const { data } = await this.findOne(id);
    return {
      success: true,
      message: 'Empresa actualizada correctamente',
      warnings,
      data,
    };
  }

  async remove(id: string) {
    const { data } = await this.findOne(id);

    if (data.source !== 'manual') {
      throw new ConflictException(
        'Las empresas importadas no se pueden eliminar (la próxima carga las volvería a crear). Desactívala con isActive=false.',
      );
    }

    await this.prisma.$executeRaw`
      DELETE FROM empresas.empresas WHERE id_contribuyente = ${id}::bigint AND origen = 'manual'`;

    return {
      success: true,
      message: 'Empresa eliminada correctamente',
    };
  }
}

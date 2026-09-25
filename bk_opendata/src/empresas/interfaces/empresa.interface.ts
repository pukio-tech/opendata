export interface EmpresaItem {
  id_contribuyente: number;
  tipo_documento: string;
  numero_documento: string; // RUC o DNI
  razon_social: string;
  nombre_comercial?: string | null;
  estado_contribuyente: string;
  condicion_domicilio: string;
  tipo_contribuyente?: string | null;
  actividad_economica?: string | null;
  codigo_ciiu?: string | null;
  fecha_inscripcion?: string | null;
  fecha_inicio_actividades?: string | null;
  fecha_baja?: string | null;
  url_empresa?: string | null;
  codigo_ubigeo?: string | null;
  direccion?: string | null;
  departamento?: string | null;
  provincia?: string | null;
  distrito?: string | null;
  dni?: string | null;
  nombres?: string | null;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  telefono?: string | null;
  correo_electronico?: string | null;
  sitio_web?: string | null;
  fecha_actualizacion_fuente?: string | null;
  fecha_creacion_fuente?: string | null;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface EmpresaListItem {
  id_contribuyente: number;
  ruc: string;
  razon_social: string;
  nombre_comercial?: string | null;
  estado_contribuyente: string;
  condicion_domicilio: string;
  tipo_contribuyente?: string | null;
  codigo_ciiu?: string | null;
  actividad_economica?: string | null;
  codigo_ubigeo?: string | null;
  departamento?: string | null;
  provincia?: string | null;
  distrito?: string | null;
  direccion?: string | null;
  fecha_inicio_actividades?: string | null;
  url_empresa?: string | null;
}

export interface EmpresaSuggestion {
  ruc: string;
  razon_social: string;
  nombre_comercial?: string | null;
  departamento?: string | null;
  actividad_economica?: string | null;
  url_empresa?: string | null;
}

export interface EmpresasQueryParams {
  search?: string;
  ruc?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  estado?: string;
  condicion?: string;
  ciiu?: string;
  tipo?: string;
  sortBy?: 'recent' | 'name' | 'ruc';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedEmpresasResponse {
  success: boolean;
  data: EmpresaListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface EmpresasStatsResponse {
  total_empresas: number;
  total_activas: number;
  total_habidas: number;
  porcentaje_activas: number;
  top_departamentos: Array<{
    departamento: string;
    total_empresas: number;
    total_activas: number;
  }>;
  top_actividades: Array<{
    codigo_ciiu: string;
    actividad_economica: string;
    total_empresas: number;
  }>;
  distribucion_tipos: Array<{
    tipo_contribuyente: string;
    total_empresas: number;
  }>;
}

export interface CatalogsResponse {
  departamentos: Array<{ departamento: string; total: number }>;
  actividades: Array<{ codigo_ciiu: string; actividad_economica: string; total: number }>;
  tipos_contribuyente: Array<{ tipo_contribuyente: string; total: number }>;
  estados: string[];
  condiciones: string[];
}

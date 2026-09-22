export interface ActivityItem {
  id: number;
  codigo: string;
  atrac_acti: number;
  atrac_acti_tipo?: number | null;
  nombre: string;
  tipocate_codigo?: string;
  imagen?: string | null;
  sub_actividades?: ActivityItem[];
}

export interface CategoryItem {
  atrac_categ: number;
  categoria: string;
  tipos?: {
    atrac_tipo: number;
    tipo_categoria: string;
    subtipos?: {
      atrac_stipo: number;
      subtipo_categoria: string;
    }[];
  }[];
}

export interface DepartmentItem {
  iddpto: string;
  departamento: string;
  idregion?: string;
}

export interface ResourceItem {
  codigo: number;
  nombre: string;
  categoria?: string;
  tipo_categoria?: string;
  subtipo_categoria?: string;
  desdpto?: string;
  departamento?: string;
  desprov?: string;
  provincia?: string;
  desubigeo?: string;
  distrito?: string;
  x?: number;
  y?: number;
  url?: string;
  url_ficha?: string;
  desjerarquia?: string;
  jerarquia?: string;
  imagen?: string | null;
  foto_url?: string | null;
  coordenadas?: {
    latitud?: number;
    longitud?: number;
  };
  lstActiGeo?: {
    atrac_acti: number;
    atrac_acti_descrip: string;
    imagen?: string;
  }[];
  lstTipoActiGeo?: {
    atrac_acti: number;
    atrac_acti_descrip: string;
    atrac_acti_tipo: number;
    atrac_acti_tipo_descrip: string;
    imagen?: string;
  }[];
}

export interface FichaSection {
  id: string;
  titulo: string;
  contenido_texto: string;
  contenido_html: string;
}

export interface FichaActivity {
  actividad: string;
  tipo: string;
  observacion: string;
  icono_url?: string;
}

export interface FichaRutaAcceso {
  recorrido?: string;
  tramo?: string;
  detalle?: string;
  tipo_acceso?: string;
  medio_transporte?: string;
  tipo_via?: string;
  distancia_tiempo?: string;
}

export interface FichaEpocaPropicia {
  epoca?: string;
  especificacion?: string;
  horario?: string;
  observaciones?: string;
}

export interface FichaDetail {
  cod_ficha: number;
  url_ficha: string;
  nombre: string;
  departamento: string;
  provincia: string;
  distrito: string;
  categoria: string;
  tipo: string;
  subtipo: string;
  jerarquia: string;
  altitud: string;
  x?: number;
  y?: number;
  google_maps_url?: string;
  foto_principal: string;
  galeria_fotos: string[];
  actividades_permitidas: string[];
  actividades_detalle?: FichaActivity[];
  rutas_acceso?: FichaRutaAcceso[];
  epoca_propicia?: FichaEpocaPropicia[];
  descripcion: string;
  particularidades?: string;
  estado_actual?: string;
  observaciones?: string;
  youtube_url?: string;
  youtube_id?: string;
  youtube_embed_url?: string;
  secciones?: FichaSection[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}



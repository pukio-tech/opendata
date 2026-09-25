export interface MuseoServicio {
  nombre: string;
  icono_url?: string;
}

export interface MuseoTarifa {
  tipo: string;
  descripcion: string;
  precio: number;
  moneda: string;
}

export interface MuseoFoto {
  url: string;
  alt?: string;
}

export interface MuseoItem {
  id_museo: number;
  slug: string;
  nombre: string;
  categoria?: string;
  tipo_museo?: string;
  administracion?: string;
  estado?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  ubigeo_texto?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  horario_atencion?: string;
  tarifario_descripcion?: string;
  telefono?: string;
  email?: string;
  web_url?: string;
  recorrido_virtual_url?: string;
  coleccion_virtual_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
  imagen_portada?: string;
  imagen_tarjeta?: string;
  descripcion?: string;
  servicios?: MuseoServicio[];
  tarifas?: MuseoTarifa[];
  galeria?: MuseoFoto[];
  total_fotos?: number;
  url_origen?: string;
  fecha_actualizacion?: string;
}

export interface MuseoDepartment {
  departamento: string;
  count: number;
}

export interface MuseoCategory {
  categoria: string;
  count: number;
}

export interface MuseoServiceItem {
  id_servicio: number;
  nombre: string;
  icono_url: string;
}

export interface MuseoPaginatedResponse {
  data: MuseoItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MuseoStats {
  total_museos: number;
  total_abiertos: number;
  total_mincultura: number;
  total_virtuales: number;
  total_georreferenciados: number;
  departamentos_cubiertos: number;
}

export interface PapaActivityCoordinates {
  latitud: number;
  longitud: number;
}

export interface PapaActivity {
  id: string;
  fecha: string;
  dia_semana: string;
  hora: string;
  departamento: string;
  provincia: string;
  distrito: string;
  lugar: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  coordenadas?: PapaActivityCoordinates;
}

export interface PapaDepartment {
  departamento: string;
  slug: string;
  total_actividades: number;
  centro_mapa?: {
    latitud: number;
    longitud: number;
    zoom: number;
  };
  cronograma: PapaActivity[];
}

export interface PapaCronogramaResponse {
  visita_apostolica: {
    pontifice: string;
    titulo: string;
    pais: string;
    lema_evento: string;
    fecha_inicio: string;
    fecha_fin: string;
    total_departamentos: number;
    total_actividades: number;
    enlace_oficial: string;
    fuente: string;
  };
  por_departamento: PapaDepartment[];
}

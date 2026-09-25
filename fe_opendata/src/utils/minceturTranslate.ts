import { Language } from '../context/LanguageContext';
import { ResourceItem } from '../types/mincetur';

/**
 * Limpia y normaliza texto eliminando prefijos numéricos ("1.", "a)"), guiones y símbolos
 */
export function cleanLabel(text: string | null | undefined): string {
  if (!text) return '';
  let cleaned = text
    .replace(/^[0-9a-zA-Z]{1,3}[\.\)\-]\s*/, '')
    .replace(/^[\.\-\/\s]+/, '')
    .trim();

  if (!cleaned) cleaned = text.trim();

  const prepositions = ['de', 'del', 'la', 'las', 'el', 'los', 'en', 'y', 'a', 'e', 'o', 'u', 'por', 'con', 'al'];
  return cleaned
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index > 0 && prepositions.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// Diccionario de traducciones oficiales de MINCETUR para categorías, tipos y subtipos
const DICTIONARY: Record<string, { EN: string; QU: string }> = {
  'SITIOS NATURALES': {
    EN: 'Natural Sites',
    QU: 'Sallqa Kitiykuna',
  },
  'MANIFESTACIONES CULTURALES': {
    EN: 'Cultural Manifestations',
    QU: 'Kultura Kawsay',
  },
  'FOLCLORE': {
    EN: 'Folklore & Traditions',
    QU: 'Folclore / Ñawpa Kawsay',
  },
  'FOLKLORE': {
    EN: 'Folklore & Traditions',
    QU: 'Folclore / Ñawpa Kawsay',
  },
  'ACONTECIMIENTOS PROGRAMADOS': {
    EN: 'Scheduled Events',
    QU: 'Tarpusqa Raymikuna',
  },
  'REALIZACIONES TECNICAS, CIENTIFICAS U ARTISTICAS CONTEMPORANEAS': {
    EN: 'Contemporary Technical & Artistic Achievements',
    QU: 'Musuq Ruwaykuna',
  },
  'REALIZACIONES TECNICAS': {
    EN: 'Technical Achievements',
    QU: 'Musuq Ruwaykuna',
  },
  'COSTUMBRES': {
    EN: 'Customs & Traditions',
    QU: 'Ñawpa Yachaykuna',
  },
  'ARQUITECTURA Y ESPACIOS URBANOS': {
    EN: 'Architecture & Urban Spaces',
    QU: 'Wasichakuy & Llaqta Kitiykuna',
  },
  'SITIOS ARQUEOLOGICOS': {
    EN: 'Archaeological Sites',
    QU: 'Ñawpa Wasi / Raqaykuna',
  },
  'SITIOS ARQUEOLÓGICOS': {
    EN: 'Archaeological Sites',
    QU: 'Ñawpa Wasi / Raqaykuna',
  },
  'MONUMENTOS ARQUEOLOGICOS': {
    EN: 'Archaeological Monuments',
    QU: 'Ñawpa Monumentokuna',
  },
  'MUSEOS Y OTROS': {
    EN: 'Museums & Exhibitions',
    QU: 'Museokuna',
  },
  'MUSEOS': {
    EN: 'Museums',
    QU: 'Museokuna',
  },
  'MUSEO': {
    EN: 'Museum',
    QU: 'Museo',
  },
  'PUEBLOS': {
    EN: 'Historic Towns',
    QU: 'Ñawpa Llaqtakuna',
  },
  'CENTROS HISTORICOS': {
    EN: 'Historic Centers',
    QU: 'Ñawpa Llaqtakuna',
  },
  'CENTRO HISTORICO': {
    EN: 'Historic Center',
    QU: 'Ñawpa Llaqta',
  },
  'LUGARES HISTORICOS': {
    EN: 'Historic Places',
    QU: 'Wiñaykawsay Kitiykuna',
  },
  'IGLESIAS Y CONVENTOS': {
    EN: 'Churches & Convents',
    QU: 'Inlisiyakuna & Wasiyachaykuna',
  },
  'IGLESIAS': {
    EN: 'Churches & Temples',
    QU: 'Inlisiyakuna',
  },
  'IGLESIA': {
    EN: 'Church / Temple',
    QU: 'Inlisiya',
  },
  'TEMPLO': {
    EN: 'Temple / Sanctuary',
    QU: 'Willka Wasi',
  },
  'TEMPLOS': {
    EN: 'Temples & Sanctuaries',
    QU: 'Willka Wasikuna',
  },
  'SANTUARIOS': {
    EN: 'Sanctuaries',
    QU: 'Wak\'akuna',
  },
  'BOSQUES': {
    EN: 'Forests & Woods',
    QU: 'Sach\'asach\'akuna',
  },
  'BOSQUE': {
    EN: 'Forest',
    QU: 'Sach\'asach\'a',
  },
  'VALLES': {
    EN: 'Valleys',
    QU: 'Wayq\'ukuna',
  },
  'VALLE': {
    EN: 'Valley',
    QU: 'Wayq\'u',
  },
  'QUEBRADAS': {
    EN: 'Ravines & Gorges',
    QU: 'Wayq\'ukuna',
  },
  'QUEBRADA': {
    EN: 'Ravine / Gorge',
    QU: 'Wayq\'u',
  },
  'RIOS': {
    EN: 'Rivers',
    QU: 'Mayukuna',
  },
  'RÍOS': {
    EN: 'Rivers',
    QU: 'Mayukuna',
  },
  'RIO': {
    EN: 'River',
    QU: 'Mayu',
  },
  'LAGOS Y LAGUNAS': {
    EN: 'Lakes & Lagoons',
    QU: 'Quchakuna',
  },
  'LAGUNAS': {
    EN: 'Lagoons',
    QU: 'Quchakuna',
  },
  'LAGUNA': {
    EN: 'Lagoon / Lake',
    QU: 'Qucha',
  },
  'CATARATAS Y CASCADAS': {
    EN: 'Waterfalls & Cascades',
    QU: 'Phaqchakuna',
  },
  'CATARATAS': {
    EN: 'Waterfalls',
    QU: 'Phaqchakuna',
  },
  'CATARATA': {
    EN: 'Waterfall',
    QU: 'Phaqcha',
  },
  'CASCADAS': {
    EN: 'Cascades',
    QU: 'Phaqchakuna',
  },
  'PLAYAS': {
    EN: 'Beaches & Coastlines',
    QU: 'Playakuna / Mama Qucha Patan',
  },
  'PLAYA': {
    EN: 'Beach',
    QU: 'Playa',
  },
  'MANANTIALES': {
    EN: 'Springs & Thermal Waters',
    QU: 'Pukyukuna',
  },
  'AGUAS TERMALES': {
    EN: 'Thermal / Hot Springs',
    QU: 'Qoñi Yakukuna',
  },
  'MONTAÑAS': {
    EN: 'Mountains',
    QU: 'Urqukuna',
  },
  'CERROS': {
    EN: 'Hills & Mountains',
    QU: 'Urqukuna',
  },
  'CERRO': {
    EN: 'Hill / Mountain',
    QU: 'Urqu',
  },
  'CORDILLERAS': {
    EN: 'Mountain Ranges',
    QU: 'Wallankakuna',
  },
  'CAVERNAS Y CUEVAS': {
    EN: 'Caves & Caverns',
    QU: 'Mach\'aykuna',
  },
  'CUEVAS': {
    EN: 'Caves',
    QU: 'Mach\'aykuna',
  },
  'CUEVA': {
    EN: 'Cave',
    QU: 'Mach\'ay',
  },
  'ISLAS': {
    EN: 'Islands',
    QU: 'Wat\'akuna',
  },
  'ISLA': {
    EN: 'Island',
    QU: 'Wat\'a',
  },
  'MIRADORES': {
    EN: 'Viewpoints & Lookouts',
    QU: 'Qhawanakuna',
  },
  'MIRADOR': {
    EN: 'Viewpoint / Lookout',
    QU: 'Qhawana',
  },
  'PARQUES NACIONALES': {
    EN: 'National Parks',
    QU: 'Amachasqa Suyukuna',
  },
  'AREAS PROTEGIDAS': {
    EN: 'Protected Areas',
    QU: 'Amachasqa Kitiykuna',
  },
  'FIESTAS RELIGIOSAS': {
    EN: 'Religious Festivals',
    QU: 'Iñiy Raymikuna',
  },
  'GASTRONOMIA': {
    EN: 'Gastronomy & Culinary Heritage',
    QU: 'Mikhuy Kawsay',
  },
  'GASTRONOMÍA': {
    EN: 'Gastronomy & Culinary Heritage',
    QU: 'Mikhuy Kawsay',
  },
  'ARTESANIA': {
    EN: 'Handicrafts & Folk Art',
    QU: 'Maki Ruraykuna',
  },
  'ARTESANÍA': {
    EN: 'Handicrafts & Folk Art',
    QU: 'Maki Ruraykuna',
  },
  'DANZAS': {
    EN: 'Traditional Dances',
    QU: 'Ñawpa Tusuykuna',
  },
  'DANZA': {
    EN: 'Traditional Dance',
    QU: 'Ñawpa Tusuy',
  },
  'MUSICA': {
    EN: 'Traditional Music',
    QU: 'Ñawpa Taki',
  },
  'MÚSICA': {
    EN: 'Traditional Music',
    QU: 'Ñawpa Taki',
  },
  'FERIAS': {
    EN: 'Fairs & Markets',
    QU: 'Qhatukuna',
  },
};

/**
 * Normaliza y traduce un término oficial de MINCETUR al idioma seleccionado
 */
export function translateMinceturText(text: string | null | undefined, lang: Language = 'ES'): string {
  if (!text) return '';
  const cleaned = cleanLabel(text);
  if (lang === 'ES') return cleaned;

  const upper = text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // 1. Coincidencia exacta en diccionario
  if (DICTIONARY[upper] && DICTIONARY[upper][lang]) {
    return DICTIONARY[upper][lang];
  }

  // 2. Coincidencia por palabra clave contenida
  for (const [key, val] of Object.entries(DICTIONARY)) {
    const normKey = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (upper.includes(normKey) || normKey.includes(upper)) {
      if (val[lang]) return val[lang];
    }
  }

  return cleaned;
}

/**
 * Genera la estructura de descripción de la tarjeta según el idioma activo
 */
export function formatResourceCardDescription(resource: ResourceItem, lang: Language): string {
  const categoryTranslated = translateMinceturText(resource.categoria, lang);
  const categoryHeader = categoryTranslated ? `${categoryTranslated.toUpperCase()}.` : '';
  const distrito = cleanLabel(resource.desubigeo);
  const provincia = cleanLabel(resource.desprov);

  if (lang === 'EN') {
    const parts: string[] = [];
    if (categoryHeader) parts.push(categoryHeader);
    if (distrito && provincia) {
      parts.push(`District of ${distrito}, ${provincia} province.`);
    } else if (distrito) {
      parts.push(`District of ${distrito}.`);
    } else if (provincia) {
      parts.push(`${provincia} province.`);
    } else {
      parts.push('Officially cataloged in Peru open data inventory.');
    }
    return parts.join(' ');
  }

  if (lang === 'QU') {
    const parts: string[] = [];
    if (categoryHeader) parts.push(categoryHeader);
    if (distrito && provincia) {
      parts.push(`${distrito} kitipi, ${provincia} suyupi.`);
    } else if (distrito) {
      parts.push(`${distrito} kitipi.`);
    } else if (provincia) {
      parts.push(`${provincia} suyupi.`);
    } else {
      parts.push('Piruw mamallaqtapa kichasqa willakuyninpi qillqasqa.');
    }
    return parts.join(' ');
  }

  // Español (Por defecto)
  const parts: string[] = [];
  if (categoryHeader) parts.push(categoryHeader);
  if (distrito && provincia) {
    parts.push(`Distrito de ${distrito}, provincia de ${provincia}.`);
  } else if (distrito) {
    parts.push(`Distrito de ${distrito}.`);
  } else if (provincia) {
    parts.push(`provincia de ${provincia}.`);
  } else {
    parts.push('Registrado oficialmente en el catálogo nacional.');
  }
  return parts.join(' ');
}

const DAYS_DICT: Record<string, { EN: string; QU: string }> = {
  LUNES: { EN: 'Monday', QU: 'Killachaw' },
  MARTES: { EN: 'Tuesday', QU: 'Atipachaw' },
  MIERCOLES: { EN: 'Wednesday', QU: 'Qullqachaw' },
  MIÉRCOLES: { EN: 'Wednesday', QU: 'Qullqachaw' },
  JUEVES: { EN: 'Thursday', QU: 'Illapachaw' },
  VIERNES: { EN: 'Friday', QU: 'Ch\'askachaw' },
  SABADO: { EN: 'Saturday', QU: 'K\'uychichaw' },
  SÁBADO: { EN: 'Saturday', QU: 'K\'uychichaw' },
  DOMINGO: { EN: 'Sunday', QU: 'Intichaw' },
};

/**
 * Traduce el día de la semana según el idioma
 */
export function translateDayOfWeek(day: string | null | undefined, lang: Language = 'ES'): string {
  if (!day) return '';
  if (lang === 'ES') return day;
  const upper = day.toUpperCase().trim();
  if (DAYS_DICT[upper] && DAYS_DICT[upper][lang]) {
    return DAYS_DICT[upper][lang];
  }
  return day;
}

const PAPA_TYPES_DICT: Record<string, { EN: string; QU: string }> = {
  PROTOCOLAR: { EN: 'Protocol', QU: 'Kamachiy Ruray' },
  OFICIAL: { EN: 'Official', QU: 'Chiqap Ruray' },
  'INSTITUCIONAL / DIPLOMÁTICO': { EN: 'Institutional / Diplomatic', QU: 'Llaqta Kamachiy' },
  'INSTITUCIONAL / DIPLOMATICO': { EN: 'Institutional / Diplomatic', QU: 'Llaqta Kamachiy' },
  'SANTA MISA MASIVA': { EN: 'Massive Holy Mass', QU: 'Hatun Misa Raymi' },
  'MISA MASIVA': { EN: 'Massive Holy Mass', QU: 'Hatun Misa Raymi' },
  MISA: { EN: 'Holy Mass', QU: 'Misa Raymi' },
  'ENCUENTRO PASTORAL': { EN: 'Pastoral Gathering', QU: 'Michiqwan Tupanaku' },
  'VIGILIA JUVENIL': { EN: 'Youth Vigil', QU: 'Waynakunapa Willka Tutay' },
  'VUELO / TRASLADO': { EN: 'Flight / Transfer', QU: 'Pawaq Puriy / Astakuy' },
  TRASLADO: { EN: 'Transfer', QU: 'Astakuy' },
  'ACADÉMICO / CULTURAL': { EN: 'Academic / Cultural', QU: 'Yachay Kawsay' },
  'ACADEMICO / CULTURAL': { EN: 'Academic / Cultural', QU: 'Yachay Kawsay' },
};

/**
 * Traduce el tipo de actividad de la Ruta del Papa
 */
export function translatePapaActivityType(type: string | null | undefined, lang: Language = 'ES'): string {
  if (!type) return '';
  if (lang === 'ES') return type;
  const upper = type.toUpperCase().trim();
  if (PAPA_TYPES_DICT[upper] && PAPA_TYPES_DICT[upper][lang]) {
    return PAPA_TYPES_DICT[upper][lang];
  }
  return type;
}


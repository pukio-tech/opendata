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

/**
 * Normaliza y formatea un término oficial de MINCETUR
 */
export function translateMinceturText(text: string | null | undefined, _lang?: Language): string {
  if (!text) return '';
  return cleanLabel(text);
}

/**
 * Genera la estructura de descripción de la tarjeta según el idioma activo
 */
export function formatResourceCardDescription(resource: ResourceItem, lang: Language): string {
  const categoryRaw = cleanLabel(resource.categoria);
  const distrito = resource.desubigeo;
  const provincia = resource.desprov;

  if (lang === 'EN') {
    const parts: string[] = [];
    if (categoryRaw) parts.push(`${categoryRaw.toUpperCase()}.`);
    if (distrito && provincia) {
      parts.push(`District of ${distrito}, ${provincia} province.`);
    } else if (distrito) {
      parts.push(`District of ${distrito}.`);
    } else if (provincia) {
      parts.push(`${provincia} province.`);
    }
    return parts.join(' ');
  }

  if (lang === 'QU') {
    const parts: string[] = [];
    if (categoryRaw) parts.push(`${categoryRaw.toUpperCase()}.`);
    if (distrito && provincia) {
      parts.push(`${distrito} kitipi, ${provincia} suyupi.`);
    } else if (distrito) {
      parts.push(`${distrito} kitipi.`);
    } else if (provincia) {
      parts.push(`${provincia} suyupi.`);
    }
    return parts.join(' ');
  }

  // Español (Por defecto)
  const parts: string[] = [];
  if (categoryRaw) parts.push(`${categoryRaw.toUpperCase()}.`);
  if (distrito && provincia) {
    parts.push(`Distrito de ${distrito}, provincia de ${provincia}.`);
  } else if (distrito) {
    parts.push(`Distrito de ${distrito}.`);
  } else if (provincia) {
    parts.push(`provincia de ${provincia}.`);
  }
  return parts.join(' ');
}

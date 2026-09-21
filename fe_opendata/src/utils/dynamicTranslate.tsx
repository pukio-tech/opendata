'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage, Language } from '../context/LanguageContext';

// Cache en memoria para la sesión
const memoryCache: Record<string, string> = {};

/**
 * Traduce texto de forma dinámica y en tiempo real usando el servicio de traducción
 */
export async function translateDynamicText(
  text: string | null | undefined,
  targetLang: Language
): Promise<string> {
  if (!text || !text.trim()) return '';
  if (targetLang === 'ES') return text;

  const trimmed = text.trim();
  const langCode = targetLang === 'EN' ? 'en' : 'qu';
  const cacheKey = `dt_${langCode}_${trimmed}`;

  // 1. Verificar cache en memoria
  if (memoryCache[cacheKey]) {
    return memoryCache[cacheKey];
  }

  // 2. Verificar cache en localStorage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        memoryCache[cacheKey] = stored;
        return stored;
      }
    } catch {
      // ignore
    }
  }

  // 3. Petición a la API de traducción dinámica
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=${langCode}&dt=t&q=${encodeURIComponent(
      trimmed
    )}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);

    const data = await response.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0].map((item: any) => item[0]).join('');
      if (translated) {
        memoryCache[cacheKey] = translated;
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(cacheKey, translated);
          } catch {
            // ignore quota exceeded
          }
        }
        return translated;
      }
    }
  } catch (err) {
    console.warn(`Error en traducción dinámica (${targetLang}):`, err);
  }

  return trimmed;
}

/**
 * Hook de React para traducir cualquier texto dinámico proveniente del API
 */
export function useDynamicTranslation(text: string | null | undefined): string {
  const { language } = useLanguage();
  const [translated, setTranslated] = useState<string>(() => {
    if (!text) return '';
    if (language === 'ES') return text;
    const langCode = language === 'EN' ? 'en' : 'qu';
    const cacheKey = `dt_${langCode}_${text.trim()}`;
    return memoryCache[cacheKey] || text;
  });

  useEffect(() => {
    if (!text || !text.trim()) {
      setTranslated('');
      return;
    }

    if (language === 'ES') {
      setTranslated(text);
      return;
    }

    let isMounted = true;
    translateDynamicText(text, language).then((res) => {
      if (isMounted) {
        setTranslated(res);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [text, language]);

  return translated;
}

/**
 * Componente React para renderizar cualquier texto con traducción dinámica automática
 */
export const DynamicText: React.FC<{
  text: string | null | undefined;
  className?: string;
  as?: React.ElementType;
}> = ({ text, className, as: Component = 'span' }) => {
  const translated = useDynamicTranslation(text);
  return <Component className={className}>{translated || text}</Component>;
};

/**
 * OpenData Turismo Perú — Design Tokens Oficiales
 * Estilo institucional: gob.pe / datos.gob
 * 
 * Centraliza la paleta, tipografía, bordes y espaciados del portal
 * para transmitir seriedad, veracidad y confiabilidad pública.
 */

export const TOKENS = {
  colors: {
    // 1. Color de marca institucional primario (Azul Institucional Escudo / gob.pe)
    primary: {
      DEFAULT: '#0B3B60',
      hover: '#082C48',
      light: '#124B78',
      surface: '#F0F5FA',
      border: '#C3D7EB',
      darkSurface: '#0D2136',
    },
    // 2. Color de acento único oficial (Rojo Bandera Peruana)
    accent: {
      DEFAULT: '#D91023',
      hover: '#B70C1C',
      light: '#F87171',
      surface: '#FEF2F2',
      border: '#FECACA',
    },
    // Acento temático reservado exclusivamente para la sección histórica Ruta del Papa
    papa: {
      DEFAULT: '#B45309',
      hover: '#92400E',
      light: '#D97706',
      surface: '#FFFBEB',
      border: '#FDE68A',
      darkSurface: '#2D1F07',
    },
    // 3. Neutrales institucionales (Escala de grises sobria, sin negro puro)
    neutral: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
      950: '#0B0F19',
    },
    // 4. Colores semánticos reales (SOLO para estados, nunca como decoración)
    semantic: {
      success: {
        text: '#15803D',
        darkText: '#4ADE80',
        bg: '#F0FDF4',
        darkBg: '#052E16',
        border: '#BBF7D0',
        darkBorder: '#166534',
      },
      warning: {
        text: '#B45309',
        darkText: '#FBBF24',
        bg: '#FFFBEB',
        darkBg: '#451A03',
        border: '#FDE68A',
        darkBorder: '#92400E',
      },
      danger: {
        text: '#B91C1C',
        darkText: '#F87171',
        bg: '#FEF2F2',
        darkBg: '#450A0A',
        border: '#FECACA',
        darkBorder: '#991B1B',
      },
    },
  },
  typography: {
    fontSans: 'var(--font-montserrat), Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  radius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    full: '9999px', // Reservado estrictamente para tags de estado (ACTIVO / HABIDO / PENDIENTE)
  },
  borders: {
    subtle: '1px solid var(--border-color)',
    card: '1px solid var(--border-card)',
  },
} as const;

export type DesignTokens = typeof TOKENS;

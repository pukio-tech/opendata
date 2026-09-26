'use client';

import React from 'react';

export type BadgeVariant = 'code' | 'activo' | 'habido' | 'pendiente' | 'nohabido' | 'baja' | 'neutral' | 'papa';

interface OfficialBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  title?: string;
}

/**
 * OfficialBadge — Badge estandarizado institucional.
 * Mantiene la misma tipografía mono, padding, y radius (6px salvo status que es pill).
 */
export const OfficialBadge: React.FC<OfficialBadgeProps> = ({
  children,
  variant = 'code',
  className = '',
  title,
}) => {
  if (variant === 'activo' || variant === 'habido') {
    return (
      <span
        title={title}
        className={`gov-badge-status-activo ${className}`}
      >
        {children}
      </span>
    );
  }

  if (variant === 'pendiente') {
    return (
      <span
        title={title}
        className={`gov-badge-status-pendiente ${className}`}
      >
        {children}
      </span>
    );
  }

  if (variant === 'nohabido' || variant === 'baja') {
    return (
      <span
        title={title}
        className={`gov-badge-status-nohabido ${className}`}
      >
        {children}
      </span>
    );
  }

  if (variant === 'papa') {
    return (
      <span
        title={title}
        className={`font-mono text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 ${className}`}
      >
        {children}
      </span>
    );
  }

  // Variant 'code' o 'neutral' por defecto
  return (
    <span
      title={title}
      className={`gov-badge-code ${className}`}
    >
      {children}
    </span>
  );
};

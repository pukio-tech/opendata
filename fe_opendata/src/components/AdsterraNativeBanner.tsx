'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AdsterraNativeBannerProps {
  className?: string;
  label?: string;
}

export const AdsterraNativeBanner: React.FC<AdsterraNativeBannerProps> = ({
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    // Limpiar cualquier nodo previo
    currentContainer.innerHTML = '';

    // Crear el div contenedor con el ID requerido por Adsterra
    const adContainer = document.createElement('div');
    adContainer.id = 'container-79d32db6a63a12e5f3aac99fe6ea4f56';
    currentContainer.appendChild(adContainer);

    // Crear y adjuntar el script invoke.js
    const script = document.createElement('script');
    script.src = 'https://pl31508083.profitableratecpmnetwork.com/79d32db6a63a12e5f3aac99fe6ea4f56/invoke.js';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');

    // Detectar si el navegador o Brave bloquea el script
    script.onerror = () => {
      setIsBlocked(true);
    };

    script.onload = () => {
      // Verificar si Adsterra inyectó contenido dentro del contenedor
      setTimeout(() => {
        const adDiv = currentContainer.querySelector('#container-79d32db6a63a12e5f3aac99fe6ea4f56');
        if (adDiv && adDiv.children.length > 0) {
          setIsLoaded(true);
        } else {
          setIsBlocked(true);
        }
      }, 400);
    };

    currentContainer.appendChild(script);

    // Timeout de seguridad: si en 2.5s no cargó contenido, ocultar por completo
    const timer = setTimeout(() => {
      setIsLoaded((prev) => {
        if (!prev) setIsBlocked(true);
        return prev;
      });
    }, 2500);

    return () => {
      clearTimeout(timer);
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, []);

  if (isBlocked) return null;

  return (
    <div
      className={isLoaded ? `w-full my-6 flex justify-center items-center overflow-x-auto ${className}` : 'overflow-hidden'}
      style={
        isLoaded
          ? undefined
          : { position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }
      }
      aria-label="Publicidad"
    >
      <div ref={containerRef} className="w-full flex justify-center items-center" />
    </div>
  );
};

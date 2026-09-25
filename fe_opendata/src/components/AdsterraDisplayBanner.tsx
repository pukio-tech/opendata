'use client';

import React, { useState, useEffect } from 'react';

export const ADSTERRA_BANNERS = {
  '728x90': {
    key: '1eb08a6f1bb3acfbb5f4dac2c5ef280b',
    width: 728,
    height: 90,
  },
  '468x60': {
    key: 'a829506430513a2ea5c1a78f94585d4f',
    width: 468,
    height: 60,
  },
  '300x250': {
    key: '06c14cbb866a6f88c40a02bdd44f8ac8',
    width: 300,
    height: 250,
  },
  '160x600': {
    key: '37af092b7b20871963bffa3ae8e15ebc',
    width: 160,
    height: 600,
  },
  '160x300': {
    key: '12b01eacc1b73502c90d1f514828f712',
    width: 160,
    height: 300,
  },
  '320x50': {
    key: 'ad5bbe32c30dbf6bf4bb42dc18d0a3cc',
    width: 320,
    height: 50,
  },
} as const;

export type BannerSize = keyof typeof ADSTERRA_BANNERS;

interface AdsterraDisplayBannerProps {
  size: BannerSize;
  className?: string;
}

export const AdsterraDisplayBanner: React.FC<AdsterraDisplayBannerProps> = ({
  size,
  className = '',
}) => {
  const config = ADSTERRA_BANNERS[size];
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (!config) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'adsterra-loaded' && event.data?.key === config.key) {
        setIsLoaded(true);
      }
      if (event.data?.type === 'adsterra-error' && event.data?.key === config.key) {
        setIsBlocked(true);
      }
    };

    window.addEventListener('message', handleMessage);

    // Si en 2.5s no ha cargado (ej. bloqueador silencioso o red caída), se oculta por completo
    const timer = setTimeout(() => {
      setIsLoaded((prev) => {
        if (!prev) setIsBlocked(true);
        return prev;
      });
    }, 2500);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timer);
    };
  }, [config]);

  if (!config || isBlocked) return null;

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <base target="_blank">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: transparent;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  </style>
  <script type="text/javascript">
    function notifySuccess() {
      try { window.parent.postMessage({ type: 'adsterra-loaded', key: '${config.key}' }, '*'); } catch(e) {}
    }
    function notifyError() {
      try { window.parent.postMessage({ type: 'adsterra-error', key: '${config.key}' }, '*'); } catch(e) {}
    }
  </script>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key' : '${config.key}',
      'format' : 'iframe',
      'height' : ${config.height},
      'width' : ${config.width},
      'params' : {}
    };
  </script>
  <script
    type="text/javascript"
    src="https://www.highrevenueformat.com/${config.key}/invoke.js"
    onload="setTimeout(notifySuccess, 100)"
    onerror="notifyError()"
  ></script>
</body>
</html>`;

  return (
    <div
      className={isLoaded ? `flex justify-center items-center my-4 overflow-hidden ${className}` : 'overflow-hidden'}
      style={
        isLoaded
          ? undefined
          : { position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }
      }
      aria-label="Publicidad"
    >
      <iframe
        title={`Ad ${size}`}
        width={config.width}
        height={config.height}
        srcDoc={htmlContent}
        style={{
          width: `${config.width}px`,
          height: `${config.height}px`,
          border: 0,
          overflow: 'hidden',
        }}
        scrolling="no"
        loading="lazy"
      />
    </div>
  );
};

/**
 * Banner responsivo que muestra Leaderboard (728x90) en pantallas medianas/grandes
 * y Mobile Banner (320x50) en dispositivos móviles sin desbordar la pantalla.
 * Si está bloqueado o no carga, no muestra ningún contenedor ni espacio en blanco.
 */
export const ResponsiveLeaderboard: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  return (
    <div className={`w-full flex justify-center ${className}`}>
      {/* Móvil (< 768px): 320x50 */}
      <div className="block md:hidden">
        <AdsterraDisplayBanner size="320x50" />
      </div>
      {/* Tablet y Desktop (>= 768px): 728x90 */}
      <div className="hidden md:block">
        <AdsterraDisplayBanner size="728x90" />
      </div>
    </div>
  );
};

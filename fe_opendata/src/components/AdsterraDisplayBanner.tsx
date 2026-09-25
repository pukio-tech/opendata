'use client';

import React from 'react';

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
  bordered?: boolean;
  darkVariant?: boolean;
}

export const AdsterraDisplayBanner: React.FC<AdsterraDisplayBannerProps> = ({
  size,
  className = '',
  bordered = true,
  darkVariant = false,
}) => {
  const config = ADSTERRA_BANNERS[size];
  if (!config) return null;

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
  <script type="text/javascript" src="https://www.highrevenueformat.com/${config.key}/invoke.js"></script>
</body>
</html>`;

  return (
    <div
      className={`flex flex-col items-center justify-center my-4 overflow-hidden ${className}`}
      aria-label="Publicidad"
    >
      {bordered ? (
        <div
          className={`rounded-xl p-2 sm:p-3 flex flex-col items-center max-w-full ${
            darkVariant
              ? 'bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-lg'
              : 'bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-xs'
          }`}
        >
          <div
            className={`w-full flex items-center justify-between pb-1.5 mb-1.5 border-b text-[10px] font-mono uppercase tracking-wider ${
              darkVariant
                ? 'border-slate-800 text-slate-400'
                : 'border-slate-100 dark:border-slate-800 text-slate-400'
            }`}
          >
            <span>Recomendado</span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                darkVariant
                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              Anuncio
            </span>
          </div>
          <div className="overflow-x-auto max-w-full flex justify-center">
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
        </div>
      ) : (
        <div className="overflow-x-auto max-w-full flex justify-center">
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
      )}
    </div>
  );
};

/**
 * Banner responsivo que muestra Leaderboard (728x90) en pantallas medianas/grandes
 * y Mobile Banner (320x50) en dispositivos móviles sin desbordar la pantalla.
 */
export const ResponsiveLeaderboard: React.FC<{
  className?: string;
  bordered?: boolean;
  darkVariant?: boolean;
}> = ({ className = '', bordered = true, darkVariant = false }) => {
  return (
    <div className={`w-full flex justify-center ${className}`}>
      {/* Móvil (< 768px): 320x50 */}
      <div className="block md:hidden">
        <AdsterraDisplayBanner size="320x50" bordered={bordered} darkVariant={darkVariant} />
      </div>
      {/* Tablet y Desktop (>= 768px): 728x90 */}
      <div className="hidden md:block">
        <AdsterraDisplayBanner size="728x90" bordered={bordered} darkVariant={darkVariant} />
      </div>
    </div>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

interface ShareBarProps {
  url?: string;
  title?: string;
  text?: string;
  label?: string;
  sublabel?: string;
  className?: string;
}

export const ShareBar: React.FC<ShareBarProps> = ({
  url,
  title = 'OpenData Perú',
  text,
  label = 'Compartir:',
  sublabel = 'Difunde la información oficial del Perú',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url || 'https://opendata.pukio.lat');

  useEffect(() => {
    if (url) {
      setCurrentUrl(url);
    } else if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, [url]);

  const shareText = text || `Descubre ${title} en OpenData Perú:`;
  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedText = encodeURIComponent(shareText);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${currentUrl}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const input = document.createElement('input');
      input.value = currentUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <section
      className={`border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-3.5 px-4 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
          <Icons.Share className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span className="font-semibold text-slate-900 dark:text-white">{label}</span>
          {sublabel && <span className="hidden sm:inline text-slate-500">{sublabel}</span>}
        </div>

        <div className="flex items-center gap-2">
          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartir en WhatsApp"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors font-semibold"
          >
            <Icons.WhatsApp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline">WhatsApp</span>
          </a>

          {/* Twitter / X */}
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartir en X (Twitter)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-semibold"
          >
            <Icons.Twitter className="w-3.5 h-3.5" />
            <span className="hidden md:inline">X (Twitter)</span>
          </a>

          {/* LinkedIn */}
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartir en LinkedIn"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors font-semibold"
          >
            <Icons.LinkedIn className="w-3.5 h-3.5 text-[#0A66C2]" />
            <span className="hidden md:inline">LinkedIn</span>
          </a>

          {/* Facebook */}
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartir en Facebook"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors font-semibold"
          >
            <Icons.Facebook className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden md:inline">Facebook</span>
          </a>

          {/* Copiar Enlace */}
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copiar enlace"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold cursor-pointer"
          >
            {copied ? (
              <>
                <Icons.Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">¡Copiado!</span>
              </>
            ) : (
              <>
                <Icons.Copy className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Copiar Enlace</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};

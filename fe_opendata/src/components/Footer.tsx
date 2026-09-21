'use client';

import React from 'react';
import Link from 'next/link';
import { Icons } from './Icons';

export const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 pt-16 pb-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
          {/* Column 1 & 2: Brand Info & Socials */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/25 group-hover:scale-105 transition-transform">
                <Icons.Compass className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                OPEN<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-amber-300 to-orange-400">DATA</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Plataforma nacional de datos abiertos para la consulta, georreferenciación y exploración interactiva de los recursos y atractivos turísticos del Perú.
            </p>

            {/* Redes Sociales */}
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">
                Conéctate con Nosotros
              </span>
              <div className="flex items-center gap-2.5">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500 hover:bg-sky-500/10 text-slate-400 hover:text-sky-400 flex items-center justify-center transition-all"
                >
                  <Icons.Facebook className="w-4 h-4" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-pink-500 hover:bg-pink-500/10 text-slate-400 hover:text-pink-400 flex items-center justify-center transition-all"
                >
                  <Icons.Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter / X"
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-400 hover:bg-sky-400/10 text-slate-400 hover:text-sky-400 flex items-center justify-center transition-all"
                >
                  <Icons.Twitter className="w-4 h-4" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-red-500 hover:bg-red-500/10 text-slate-400 hover:text-red-400 flex items-center justify-center transition-all"
                >
                  <Icons.YouTube className="w-4 h-4" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500 hover:bg-blue-500/10 text-slate-400 hover:text-blue-400 flex items-center justify-center transition-all"
                >
                  <Icons.LinkedIn className="w-4 h-4" />
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-400 hover:bg-slate-700/30 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                >
                  <Icons.GitHub className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Column 3: Navegación */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Navegación</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-sky-400 transition-colors">
                  Inicio (Portal General)
                </Link>
              </li>
              <li>
                <Link href="/turismo" className="hover:text-sky-400 transition-colors">
                  Turismo y Explorador
                </Link>
              </li>
              <li>
                <Link href="/turismo#mapa" className="hover:text-sky-400 transition-colors">
                  Mapa de Regiones
                </Link>
              </li>
              <li>
                <Link href="/turismo#listado-atractivos" className="hover:text-sky-400 transition-colors">
                  Catálogo Georreferenciado
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Datos y API */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Datos Abiertos & API</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5">
                <Icons.Database className="w-3.5 h-3.5 text-sky-400" />
                <span>API REST Pública</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Icons.Code className="w-3.5 h-3.5 text-amber-400" />
                <span>Formato JSON / GeoJSON</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Icons.Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Estándar OGC & EPSG:4326</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Icons.Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Licencia Abierta CC-BY</span>
              </li>
            </ul>
          </div>

          {/* Column 5: Marco Legal & Políticas */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Transparencia</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/terminos-y-condiciones" className="hover:text-amber-400 transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/politicas-de-privacidad" className="hover:text-sky-400 transition-colors">
                  Políticas de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/terminos-y-condiciones#licencia" className="hover:text-slate-300 transition-colors">
                  Licencia de Datos Abiertos
                </Link>
              </li>
              <li>
                <span className="cursor-pointer hover:text-sky-400 transition-colors">
                  Libro de Reclamaciones
                </span>
              </li>
              <li>
                <span className="cursor-pointer hover:text-sky-400 transition-colors">
                  Preguntas Frecuentes (FAQ)
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Indicators */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-400">
              OpenData © {new Date().getFullYear()} • Repositorio Nacional de Datos de Turismo del Perú
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>25 Departamentos</span>
            <span>•</span>
            <span>5,000+ Recursos</span>
            <span>•</span>
            <span>100% Abierto</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

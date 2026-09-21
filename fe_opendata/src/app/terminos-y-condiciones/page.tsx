'use client';

import React from 'react';
import Link from 'next/link';
import { Icons } from '../../components/Icons';

export default function TerminosYCondicionesPage() {
  return (
    <main className="flex-1 bg-slate-950 text-slate-100 min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
            <Icons.Compass className="w-4 h-4" />
            <span>Inicio</span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-200 font-semibold">Términos y Condiciones</span>
        </nav>

        {/* Header Hero Card */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900/90 border border-slate-800 p-8 sm:p-12 shadow-2xl backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Icons.Shield className="w-4 h-4 text-amber-400" />
            <span>Transparencia y Uso de Datos Abiertos</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Términos y <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">Condiciones</span>
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            OpenData Perú es un portal de consulta pública que visualiza la información oficial del Inventario Nacional de Recursos Turísticos del MINCETUR sin manipulación de datos ni recolección de información de los usuarios.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Section 1 */}
          <section className="bg-slate-900/80 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-black text-sm">
                01
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Origen Oficial de la Información</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Todos los datos, fichas técnicas, códigos de registro, ubicaciones departamentales, clasificaciones, descripciones y material fotográfico mostrados en este portal son obtenidos directamente de la plataforma oficial del Estado Peruano:
            </p>
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block mb-1">
                  Fuente Oficial Gubernamental
                </span>
                <span className="text-xs sm:text-sm font-bold text-white break-all">
                  https://sigmincetur.mincetur.gob.pe/turismo/
                </span>
              </div>
              <a
                href="https://sigmincetur.mincetur.gob.pe/turismo/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0"
              >
                <span>Acceder a SIGMINCETUR</span>
                <Icons.ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              El Ministerio de Comercio Exterior y Turismo (MINCETUR) es la entidad rectora y titular de la base de datos del Inventario Turístico Nacional del Perú.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-slate-900/80 rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm">
                02
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Sin Manipulación de Datos</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              OpenData Perú actúa como un visualizador de datos abiertos. <strong>No alteramos, no modificamos, no editamos y no manipulamos</strong> las descripciones técnicas, jerarquías, estados ni coordenadas oficiales registradas por las autoridades de turismo.
            </p>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Cada ficha técnica incluye su enlace directo a la fuente oficial original para que cualquier ciudadano u operador pueda contrastar la información en todo momento.
            </p>
          </section>

          {/* Section 3 */}
          <section className="bg-slate-900/80 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm">
                03
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Propósito: Mayor Legibilidad y Experiencia de Usuario</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              La plataforma ha sido desarrollada con la finalidad exclusiva de presentar los datos públicos de una forma más intuitiva, moderna, accesible y rápida para los usuarios finales:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <h4 className="text-xs font-bold text-amber-400 mb-1">Búsqueda Rápida</h4>
                <p className="text-[11px] text-slate-400">Filtros claros por región, categoría, actividad o código único de ficha.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <h4 className="text-xs font-bold text-sky-400 mb-1">Diseño Legible</h4>
                <p className="text-[11px] text-slate-400">Estructura visual limpia, tipografía optimizada y galerías fotográficas oficiales.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <h4 className="text-xs font-bold text-emerald-400 mb-1">Acceso Abierto</h4>
                <p className="text-[11px] text-slate-400">Libre disponibilidad sin registros ni barreras para la ciudadanía.</p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-slate-900/80 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-sm">
                04
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Cero Recolección de Datos de Usuarios</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Reiteramos nuestro compromiso de no recolectar, almacenar ni comercializar información personal de los visitantes. El uso del sitio es 100% libre y anónimo.
            </p>
          </section>
        </div>

        {/* Action Button Back */}
        <div className="text-center pt-4">
          <Link
            href="/turismo"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-500/25 transition-all hover:scale-105"
          >
            <Icons.Compass className="w-4 h-4" />
            <span>Volver al Catálogo de Turismo</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

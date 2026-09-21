'use client';

import React from 'react';
import Link from 'next/link';
import { Icons } from '../../components/Icons';

export default function PoliticasDePrivacidadPage() {
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
          <span className="text-slate-200 font-semibold">Políticas de Privacidad</span>
        </nav>

        {/* Header Hero Card */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900/90 border border-slate-800 p-8 sm:p-12 shadow-2xl backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Icons.Shield className="w-4 h-4 text-sky-400" />
            <span>Privacidad y Transparencia Total</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Políticas de <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-300">Privacidad</span>
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            En OpenData Perú garantizamos un entorno 100% libre, anónimo y seguro. Nuestro único propósito es facilitar la lectura y consulta visual de los datos oficiales públicos del MINCETUR.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Section 1 */}
          <section className="bg-slate-900/80 rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm">
                01
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">No Recopilamos Datos Personales</h2>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-xs sm:text-sm text-emerald-300 leading-relaxed font-medium">
              Esta plataforma <strong>NO solicita, NO almacena, NO procesa y NO recopila ningún tipo de información personal</strong> ni datos de contacto de los visitantes.
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Puedes navegar libremente, filtrar por departamentos, buscar por categorías, actividades o códigos de ficha sin necesidad de registrarte, iniciar sesión o proporcionar nombres, correos electrónicos, teléfonos ni ubicaciones privadas.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-slate-900/80 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-black text-sm">
                02
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Fuente Oficial y Sin Manipulación de Datos</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Toda la información turística presentada proviene exclusivamente de la plataforma y servicios oficiales del <strong>Ministerio de Comercio Exterior y Turismo (MINCETUR)</strong>:
            </p>
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-widest block mb-1">
                  Portal Fuente Oficial
                </span>
                <span className="text-xs sm:text-sm font-bold text-white break-all">
                  https://sigmincetur.mincetur.gob.pe/turismo/
                </span>
              </div>
              <a
                href="https://sigmincetur.mincetur.gob.pe/turismo/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0"
              >
                <span>Visitar SIGMINCETUR</span>
                <Icons.ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Los nombres, descripciones, categorías, departamentos, provincias, distritos, actividades registradas y fotografías se muestran de manera fiel y transparente según el registro original del Estado Peruano, sin alteraciones ni manipulación de su contenido técnico.
            </p>
          </section>

          {/* Section 3 */}
          <section className="bg-slate-900/80 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm">
                03
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Objetivo: Máxima Legibilidad y Accesibilidad</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              El único fin de este portal es brindar una interfaz moderna, ágil, accesible y fácil de interpretar para que turistas, estudiantes, investigadores y ciudadanos puedan explorar el patrimonio turístico nacional de una manera mucho más visual, interactiva y comprensible.
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-slate-900/80 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-sm">
                04
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Sin Rastreo Comercial ni Publicidad</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              No utilizamos herramientas de rastreo publicitario, cookies invasivas de terceros ni comercializamos con el historial de navegación de los usuarios. La experiencia de consulta es limpia, abierta y orientada estrictamente al acceso a datos públicos.
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

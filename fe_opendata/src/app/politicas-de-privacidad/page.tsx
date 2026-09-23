'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Icons } from '../../components/Icons';

export default function PoliticasDePrivacidadPage() {
  useEffect(() => {
    document.title = 'Políticas de Privacidad | OpenData Perú';
  }, []);

  return (
    <main className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen pt-20 pb-20 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex items-center gap-1.5">
            <Icons.Compass className="w-4 h-4" />
            <span>Inicio</span>
          </Link>
          <span className="text-slate-400 dark:text-slate-600">/</span>
          <span className="text-slate-800 dark:text-slate-200 font-semibold">Políticas de Privacidad</span>
        </nav>

        {/* Header Hero Card */}
        <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm dark:shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-4">
            <Icons.Shield className="w-4 h-4" />
            <span>Privacidad y Anonimato Garantizado</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-3">
            Políticas de Privacidad
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
            En OpenData Perú garantizamos un entorno 100% libre, anónimo y seguro. Nuestro único propósito es facilitar la lectura y consulta visual de los datos oficiales públicos del inventario nacional.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Section 1 */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono font-bold text-sm">
                01
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">No Recopilamos Datos Personales</h2>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs sm:text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed font-medium">
              Esta plataforma <strong>NO solicita, NO almacena, NO procesa y NO recopila ningún tipo de información personal</strong> ni datos de contacto de los visitantes.
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Puedes navegar libremente, filtrar por departamentos, buscar por categorías, actividades o códigos de ficha sin necesidad de registrarte, iniciar sesión o proporcionar nombres, correos electrónicos, teléfonos ni ubicaciones privadas.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-mono font-bold text-sm">
                02
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Fuente Oficial y Sin Manipulación de Datos</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Toda la información turística presentada proviene exclusivamente de servicios y catálogos de datos abiertos del Estado Peruano:
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Los nombres, descripciones, categorías, departamentos, provincias, distritos, actividades registradas y fotografías se muestran de manera fiel y transparente según el registro oficial, sin alteraciones ni manipulación de su contenido técnico.
            </p>
          </section>

          {/* Section 3 */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-mono font-bold text-sm">
                03
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Objetivo: Máxima Legibilidad y Accesibilidad</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              El único fin de este portal es brindar una interfaz moderna, ágil, accesible y fácil de interpretar para que turistas, estudiantes, investigadores y ciudadanos puedan explorar el patrimonio turístico nacional de una manera mucho más visual, interactiva y comprensible.
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-mono font-bold text-sm">
                04
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Sin Rastreo Comercial ni Publicidad</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              No utilizamos herramientas de rastreo publicitario invasivas ni comercializamos con el historial de navegación de los usuarios. La experiencia de consulta es limpia, abierta y orientada estrictamente al acceso a datos públicos.
            </p>
          </section>
        </div>

        {/* Action Button Back */}
        <div className="text-center pt-2">
          <Link
            href="/turismo"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs uppercase tracking-wider transition-colors shadow-sm"
          >
            <Icons.Compass className="w-4 h-4" />
            <span>Volver al Catálogo de Turismo</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

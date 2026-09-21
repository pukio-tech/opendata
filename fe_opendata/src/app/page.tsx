'use client';

import React from 'react';
import Link from 'next/link';
import { Icons } from '../components/Icons';

export default function HomePage() {
  return (
    <main className="flex-1 bg-slate-950 text-slate-100">
      {/* 1. Hero Section */}
      <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden">
        {/* Background Full Width Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=1920&auto=format&fit=crop"
            alt="Machu Picchu Perú"
            className="w-full h-full object-cover scale-105"
          />
          {/* Subtle Dark Gradient Overlay for high text contrast */}
          <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[1px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center py-20">
          {/* Massive Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-6 leading-tight drop-shadow-lg">
            Descubre los Recursos Turísticos del <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200">Perú</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-200 font-normal max-w-2xl mx-auto leading-relaxed drop-shadow">
            Explora las maravillas arqueológicas, sitios naturales, rutas oficiales y patrimonio de las 25 regiones con datos técnicos verificados en tiempo real.
          </p>
        </div>
      </section>

      {/* 2. "¿Por Qué Usar OpenData?" / Plataforma Oficial */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column: Text & 2x2 Feature Box */}
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
                <Icons.Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Ventajas de la Plataforma</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-4">
                ¿Por Qué Elegir <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-sky-400">OpenData</span>?
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Somos el visualizador de datos abiertos y georreferenciación turística más intuitivo del país. Conectamos a ciudadanos, viajeros, estudiantes, investigadores y operadores con información 100% oficial de manera rápida, limpia y sin fricciones.
              </p>
            </div>

            {/* 2x2 Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Feature 1 */}
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800/90 hover:border-amber-500/40 transition-all group shadow-lg">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Icons.Award className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1.5">Datos 100% Oficiales</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Información técnica y fotográfica sincronizada directamente con el inventario del MINCETUR sin manipulación.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800/90 hover:border-sky-500/40 transition-all group shadow-lg">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Icons.Shield className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1.5">Acceso Libre y Seguro</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Consulta ilimitada sin registros obligatorios, sin recopilación de datos personales ni rastreo publicitario.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800/90 hover:border-emerald-500/40 transition-all group shadow-lg">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Icons.Navigation className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1.5">Rutas e Itinerarios</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Detalle paso a paso para llegar a cada destino con medios de transporte, tipos de vía y tiempos estimados.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800/90 hover:border-indigo-500/40 transition-all group shadow-lg">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Icons.Sliders className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1.5">Búsqueda Inteligente</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Filtros dinámicos por región, categoría, actividad o código único de ficha para encontrar tu destino al instante.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: 4-Photo Collage Mosaic with Stats Overlay */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 h-[440px] sm:h-[480px]">
              <div className="space-y-4">
                <div className="h-3/5 rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-800 group">
                  <img
                    src="https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=600&auto=format&fit=crop"
                    alt="Machu Picchu"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="h-2/5 rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-800 group">
                  <img
                    src="https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=600&auto=format&fit=crop"
                    alt="Cusco Calles"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-8">
                <div className="h-2/5 rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-800 group">
                  <img
                    src="https://images.unsplash.com/photo-1589802829985-817e51171b92?q=80&w=600&auto=format&fit=crop"
                    alt="Montaña de Colores"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="h-3/5 rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-800 group">
                  <img
                    src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop"
                    alt="Costa y Playa"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl text-center">
              <div>
                <span className="text-xl sm:text-2xl font-black text-amber-400 block">+5,000</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Atractivos</span>
              </div>
              <div className="border-x border-slate-800">
                <span className="text-xl sm:text-2xl font-black text-sky-400 block">25</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Regiones</span>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 block">100%</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Abierto</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Bottom CTA Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-8 sm:p-14 text-center shadow-2xl">
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
              ¿Listo para Explorar el Perú?
            </h2>
            <p className="text-sm sm:text-base font-semibold text-slate-900 max-w-xl mx-auto">
              Accede al catálogo completo de OpenData con más de 5,000 atractivos turísticos georreferenciados, fotos oficiales y videos en vivo.
            </p>
            <Link
              href="/turismo"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-black text-sm uppercase tracking-wider shadow-2xl transition-all hover:scale-105"
            >
              <Icons.Compass className="w-5 h-5 text-amber-400" />
              <span>Explorar el Catálogo Ahora</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

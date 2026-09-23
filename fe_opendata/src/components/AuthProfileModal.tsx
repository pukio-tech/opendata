'use client';

import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

interface AuthProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthProfileModal: React.FC<AuthProfileModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'citizen' | 'operator' | 'developer'>('citizen');
  const [email, setEmail] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const mockApiKey = 'opendata_pk_live_948fbc20e43ab7190e21a';

  const handleCopyKey = () => {
    navigator.clipboard.writeText(mockApiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden animate-scaleUp text-white"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header decoration */}
        <div className="h-2 w-full bg-gradient-to-r from-sky-500 via-emerald-400 to-amber-400" />

        {/* Modal Header */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Icons.Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Portal OpenData Perú</h3>
              <p className="text-xs text-slate-400">Acceso a servicios, validaciones y datos abiertos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-1 bg-slate-950/60 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('citizen')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'citizen'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ciudadano / Viajero
          </button>
          <button
            onClick={() => setActiveTab('operator')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'operator'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Operador Turístico
          </button>
          <button
            onClick={() => setActiveTab('developer')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'developer'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Desarrollador API
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-4">
          {activeTab === 'citizen' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-200">
                Guarda tus rutas favoritas, consulta el estado de las vías y accede a datos georreferenciados sin costo alguno.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu.correo@ejemplo.com"
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  DNI o Pasaporte (Opcional)
                </label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="Número de documento"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-sky-500/20 transition-all"
              >
                Ingresar al Portal
              </button>
            </div>
          )}

          {activeTab === 'operator' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                Consulta y valida el Registro Nacional de Prestadores de Servicios Turísticos Calificados (DIRCETUR).
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  RUC de la Agencia u Operador
                </label>
                <input
                  type="text"
                  placeholder="20XXXXXXXXX"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all"
              >
                Verificar Habilitación Oficial
              </button>
            </div>
          )}

          {activeTab === 'developer' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200">
                Acceso público e irrestricto a los endpoints REST y GeoJSON de OpenData Turismo.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tu API Key Pública Instantánea
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={mockApiKey}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 select-all"
                  />
                  <button
                    onClick={handleCopyKey}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs transition-colors shrink-0"
                    title="Copiar API Key"
                  >
                    {copiedKey ? <Icons.Check className="w-4 h-4 text-emerald-400" /> : <Icons.Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <span className="text-slate-500 block">// Endpoint de ejemplo:</span>
                <span className="text-sky-400 block truncate">GET /api/resources?department=08&limit=10</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/60 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500">
            Plataforma de Datos Abiertos de Turismo del Perú • 100% Gratuito y Libre
          </p>
        </div>
      </div>
    </div>
  );
};

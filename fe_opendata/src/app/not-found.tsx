import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl font-black text-amber-400 shadow-xl shadow-amber-500/10">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white">Recurso no encontrado</h1>
          <p className="text-sm text-slate-400">
            La página o recurso turístico que estás buscando no existe o ha sido reubicado.
          </p>
        </div>
        <Link
          href="/turismo"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-sm hover:opacity-95 transition-opacity shadow-lg shadow-sky-500/20"
        >
          Explorar Recursos Turísticos
        </Link>
      </div>
    </div>
  );
}

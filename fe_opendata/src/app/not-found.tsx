import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="w-16 h-16 mx-auto rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 flex items-center justify-center text-2xl font-bold text-sky-600 dark:text-sky-400 shadow-sm">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Recurso no encontrado</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            La página o recurso turístico que está buscando no existe o ha sido reubicado.
          </p>
        </div>
        <Link
          href="/turismo"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-sm"
        >
          Explorar Recursos Turísticos
        </Link>
      </div>
    </div>
  );
}

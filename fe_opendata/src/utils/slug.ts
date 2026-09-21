export function createResourceSlug(nombre: string, codigo: number | string): string {
  const cleanName = (nombre || 'recurso')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar tildes y diacríticos
    .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales y espacios con guiones
    .replace(/^-+|-+$/g, ''); // Eliminar guiones al inicio y al final
  return `${cleanName}-${codigo}`;
}

export function extractCodeFromSlug(slug: string): number | null {
  if (!slug) return null;
  const match = slug.match(/(\d+)$/);
  return match ? Number(match[1]) : null;
}

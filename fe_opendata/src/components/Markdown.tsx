import React from 'react';

/**
 * Renderizador Markdown mínimo y seguro para los artículos del blog.
 * Genera elementos React (sin dangerouslySetInnerHTML), así que el contenido
 * nunca puede inyectar HTML/JS. Soporta: ## títulos, párrafos, **negrita**,
 * _cursiva_, `código`, [enlaces](url), listas, citas (>) y tablas.
 */

const SAFE_URL = /^(https?:\/\/|mailto:|\/|#)/i;

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\)|_[^_\s][^_]*_|\*[^*\s][^*]*\*)/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;

    if (token.startsWith('**')) {
      out.push(
        <strong key={key} className="font-semibold text-slate-900 dark:text-white">
          {renderInline(token.slice(2, -2), key)}
        </strong>,
      );
    } else if (token.startsWith('`')) {
      out.push(
        <code key={key} className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[0.9em]">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('[')) {
      const [, label, url] = token.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/) ?? [];
      if (url && SAFE_URL.test(url)) {
        const external = /^https?:\/\//i.test(url);
        out.push(
          <a
            key={key}
            href={url}
            className="font-medium text-[#0B3B60] dark:text-sky-400 underline underline-offset-2 hover:no-underline"
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {label}
          </a>,
        );
      } else {
        out.push(label ?? token);
      }
    } else {
      out.push(<em key={key}>{renderInline(token.slice(1, -1), key)}</em>);
    }
    last = match.index + token.length;
  }

  if (last < text.length) out.push(text.slice(last));
  return out;
}

const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim());

export function Markdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const key = `b${i}`;

    if (!line.trim()) {
      i++;
      continue;
    }

    // Títulos
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const text = renderInline(heading[2], key);
      if (level <= 2) {
        blocks.push(
          <h2 key={key} className="mt-10 mb-4 text-2xl sm:text-[1.7rem] font-bold tracking-tight text-slate-900 dark:text-white scroll-mt-24">
            {text}
          </h2>,
        );
      } else {
        blocks.push(
          <h3 key={key} className="mt-8 mb-3 text-xl font-bold text-slate-900 dark:text-white">
            {text}
          </h3>,
        );
      }
      i++;
      continue;
    }

    // Tabla (fila de cabecera + separador |---|)
    if (line.trim().startsWith('|') && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1] ?? '')) {
      const header = splitRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push(
        <div key={key} className="my-6 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                {header.map((h, c) => (
                  <th key={c} className="px-4 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-200">
                    {renderInline(h, `${key}h${c}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((cell, c) => (
                    <td key={c} className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                      {renderInline(cell, `${key}r${ri}c${c}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // Cita
    if (line.startsWith('>')) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quote.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push(
        <blockquote
          key={key}
          className="my-6 border-l-4 border-[#0B3B60] dark:border-sky-500 bg-slate-50 dark:bg-slate-900/60 rounded-r-lg px-5 py-4 text-slate-700 dark:text-slate-300"
        >
          {renderInline(quote.join(' '), key)}
        </blockquote>,
      );
      continue;
    }

    // Listas
    const isUl = /^\s*[-*]\s+/.test(line);
    const isOl = /^\s*\d+\.\s+/.test(line);
    if (isUl || isOl) {
      const itemRe = isUl ? /^\s*[-*]\s+/ : /^\s*\d+\.\s+/;
      const items: string[] = [];
      while (i < lines.length && itemRe.test(lines[i])) {
        items.push(lines[i].replace(itemRe, ''));
        i++;
      }
      const ListTag = isUl ? 'ul' : 'ol';
      blocks.push(
        <ListTag
          key={key}
          className={`my-5 space-y-2 pl-6 text-slate-700 dark:text-slate-300 ${isUl ? 'list-disc marker:text-[#0B3B60] dark:marker:text-sky-400' : 'list-decimal marker:font-semibold'}`}
        >
          {items.map((it, n) => (
            <li key={n} className="pl-1 leading-relaxed">
              {renderInline(it, `${key}-${n}`)}
            </li>
          ))}
        </ListTag>,
      );
      continue;
    }

    // Párrafo: líneas consecutivas hasta una línea en blanco u otro bloque
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4}\s|>|\s*[-*]\s+|\s*\d+\.\s+|\s*\|)/.test(lines[i])
    ) {
      para.push(lines[i].trim());
      i++;
    }
    if (para.length === 0) {
      // Línea que no encaja en ningún bloque: se trata como párrafo suelto
      para.push(line.trim());
      i++;
    }
    blocks.push(
      <p key={key} className="my-5 leading-[1.8] text-slate-700 dark:text-slate-300">
        {renderInline(para.join(' '), key)}
      </p>,
    );
  }

  return <div className="text-[1.05rem]">{blocks}</div>;
}

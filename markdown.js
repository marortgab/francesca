/** Renderizador Markdown local y pequeño, sin dependencias de CDN. */
export function escapeHTML(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }
function safeURL(raw) {
  const s = String(raw || '').trim().replace(/^<|>$/g,'');
  if (!s || /[\x00-\x1f\\]/.test(s) || /^(?:javascript|data|vbscript|file):/i.test(s) || /^\/\//.test(s)) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(s) && !/^(?:https?:|mailto:)/i.test(s)) return '';
  return s;
}
export function inlineMD(source) {
  const tokens = [];
  let s = escapeHTML(source);
  function token(value) { const id = tokens.push(value) - 1; return `\u0001${id}\u0002`; }
  // Replace escaped images and links with safe HTML placeholders.
  s = s.replace(/(!?)\[([^\]]*)\]\(([^)]+)\)/g, (_m, img, label, raw) => {
    const url = safeURL(raw.replace(/\s+&quot;.*?&quot;$/, ''));
    if (!url) return escapeHTML(label);
    const href = escapeHTML(url);
    if (img) return token(`<img src="${href}" alt="${escapeHTML(label)}" loading="lazy" class="md-image" data-image-url="${href}">`);
    const external = /^https?:/i.test(url);
    return token(`<a href="${href}" ${external ? 'target="_blank" rel="noopener noreferrer"' : ''}>${escapeHTML(label)}</a>`);
  });
  s = s.replace(/`([^`]+)`/g, (_m, code) => token(`<code>${code}</code>`));
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/__(.+?)__/g, '<strong>$1</strong>');
  s = s.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  s = s.replace(/~~([^~]+)~~/g, '<s>$1</s>');
  return s.replace(/\u0001(\d+)\u0002/g, (_, i) => tokens[Number(i)]);
}
export function renderMarkdown(md) {
  if (!md) return '<p class="muted">Todavía no hay información.</p>';
  const lines = String(md).replace(/\r\n?/g,'\n').split('\n');
  const out = [];
  let i = 0;
  const isSep = s => /^\s*\|?\s*:?-{3,}:?\s*\|/.test(s) || /^\s*\|?\s*:?-{3,}:?\s*$/.test(s);
  function cells(line) { return line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(x => x.trim()); }
  function paragraphBoundary(x) { return /^\s*$|^#{1,6}\s|^\s*(?:[-*+] |\d+\. )|^\s*>\s*|^\s*```|^\s*---\s*$/.test(x) || x.trim().startsWith('|'); }
  while (i < lines.length) {
    let s = lines[i];
    if (!s.trim()) { i++; continue; }
    const disclosure = s.trim().match(/^:::(respuesta|explicacion|pista)$/i);
    if (disclosure) { const chunk=[]; i++; while(i < lines.length && lines[i].trim() !== ':::') chunk.push(lines[i++]); if(i < lines.length)i++; const label = disclosure[1].toLowerCase() === 'respuesta' ? 'Mostrar respuesta' : disclosure[1].toLowerCase() === 'pista' ? 'Mostrar pista' : 'Ver explicación'; out.push(`<details class="md-disclosure"><summary>${label}</summary><div>${renderMarkdown(chunk.join('\n'))}</div></details>`); continue; }
    if (/^\s*```/.test(s)) { const language = s.trim().slice(3).replace(/[^\w-]/g,''); const code = []; i++; while (i < lines.length && !/^\s*```/.test(lines[i])) code.push(lines[i++]); i++; out.push(`<pre><code data-language="${escapeHTML(language)}">${escapeHTML(code.join('\n'))}</code></pre>`); continue; }
    if (/^\s*---+\s*$/.test(s)) { out.push('<hr>'); i++; continue; }
    const h = s.match(/^(#{1,6})\s+(.+)$/);
    if (h) { const lev = Math.min(h[1].length + 1, 6); out.push(`<h${lev}>${inlineMD(h[2])}</h${lev}>`); i++; continue; }
    if (s.trim().startsWith('|') && i + 1 < lines.length && isSep(lines[i+1])) {
      const header = cells(s), tbody=[]; i+=2;
      while (i < lines.length && lines[i].trim().startsWith('|')) tbody.push(cells(lines[i++]));
      out.push(`<div class="table-scroll"><table><thead><tr>${header.map(c => `<th>${inlineMD(c)}</th>`).join('')}</tr></thead><tbody>${tbody.map(row => `<tr>${header.map((_c,j) => `<td>${inlineMD(row[j] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (/^\s*>\s?/.test(s)) { const chunk=[]; while (i < lines.length && /^\s*>\s?/.test(lines[i])) chunk.push(lines[i++].replace(/^\s*>\s?/, '')); out.push(`<blockquote>${chunk.map(inlineMD).join(' ')}</blockquote>`); continue; }
    if (/^\s*[-*+]\s+/.test(s) || /^\s*\d+\.\s+/.test(s)) {
      const ordered = /^\s*\d+\./.test(s), list=[];
      const re = ordered ? /^\s*\d+\.\s+(.*)/ : /^\s*[-*+]\s+(.*)/;
      while (i < lines.length && re.test(lines[i])) { list.push(lines[i++].match(re)[1]); }
      const tag=ordered?'ol':'ul'; out.push(`<${tag}>${list.map(x => `<li>${inlineMD(x)}</li>`).join('')}</${tag}>`); continue;
    }
    const part=[s.trim()]; i++;
    while (i < lines.length && !paragraphBoundary(lines[i])) part.push(lines[i++].trim());
    out.push(`<p>${inlineMD(part.join(' '))}</p>`);
  }
  return out.join('\n');
}
export { safeURL };

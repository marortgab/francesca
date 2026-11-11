/** Adaptador genérico para roadmaps extensos en Markdown. Mantiene intacta la fuente. */
const HEADING_CLASS = /^#{3,6}\s+(?:CLASE\s+(?:N\.?º?\.?\s*)?)(\d+[A-Za-z]?)\s*[—–:-]\s*(.+?)\s*$/gim;
const HEADING_STAGE = /^###\s+Etapa\s+(\d+)\s*[—–:-]\s*(.+?)(?:\s+\(([^)]+)\))?\s*$/gim;
const SECTION_RX = /^##\s+(PARTE\s+[A-F]|ANEXO)\s*[—–:-]\s*(.+)$/gim;
const STATUS_RULES = [
  [/\bREPASO\s+PENDIENTE\b/i, 'review'],
  [/\bEN\s+PROGRESO\b/i, 'progress'],
  [/\bVISTO\b|\bCOMPLETADA\b|\bCOMPLETADO\b/i, 'seen'],
  [/\bPENDIENTE\b/i, 'pending']
];

function normalized(text) { return String(text || '').replace(/\r\n?/g, '\n').replace(/^\uFEFF/, ''); }
function mdUnmark(x) { return (x || '').replace(/\*\*/g, '').replace(/`/g, '').trim(); }
function findTagged(body, name) {
  const safe = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // One field per Markdown paragraph. Prevents capturing the next field.
  const re = new RegExp('^\\*\\*' + safe + ':\\*\\*\\s*([^\\n]+)', 'im');
  const m = body.match(re);
  return m ? mdUnmark(m[1]) : '';
}
function fieldInLine(body, label) {
  const line = body.split('\n').find(x => x.startsWith('**Estado:**')) || '';
  const re = new RegExp('\\*\\*' + label + ':\\*\\*\\s*([^·\\n]+)', 'i');
  return (line.match(re)?.[1] || '').trim();
}
function parseStatus(statusLine) {
  const s = statusLine.replace(/[✅🟡⬜🔄]/gu, '').trim();
  for (const [re, key] of STATUS_RULES) if (re.test(s)) return key;
  return 'unknown';
}
function parseMaterials(body, classId) {
  const output = [], unique = new Set();
  // Ignore examples in fenced code blocks.
  const clean = body.replace(/```[\s\S]*?```/g, '');
  const markdownLink = /(!?)\[([^\]]*)\]\((<?[^)]+>?)\)/g;
  for (const hit of clean.matchAll(markdownLink)) {
    const url = hit[3].replace(/^<|>$/g, '').split(/\s+"/)[0].trim();
    const label = hit[2].trim() || url.split('/').pop();
    const kind = hit[1] === '!' || /\.(?:png|jpe?g|webp|svg|gif)(?:[?#]|$)/i.test(url) ? 'image' :
      /\.pdf(?:[?#]|$)/i.test(url) ? 'pdf' : 'link';
    // Omit the planning placeholders (user must upload real files first).
    if (/sin registrar|sin adjuntar|ejemplo|placeholder/i.test(url)) continue;
    const key = kind + ':' + url;
    if (!unique.has(key)) { unique.add(key); output.push({ label, url, kind, classId }); }
  }
  return output;
}
export function parseRoadmap(source) {
  const markdown = normalized(source);
  const stageHeaders = [...markdown.matchAll(HEADING_STAGE)].map(m => ({
    index: m.index, number: Number(m[1]), title: m[2].trim(), level: m[3] || '', classes: []
  }));
  const classHeaders = [...markdown.matchAll(HEADING_CLASS)];
  const classes = classHeaders.map((m, ix) => {
    const start = m.index + m[0].length;
    const end = ix + 1 < classHeaders.length ? classHeaders[ix + 1].index : markdown.search(/^##\s+PARTE\s+D\s+/m) > start ? markdown.search(/^##\s+PARTE\s+D\s+/m) : markdown.length;
    let body = markdown.slice(start, end).trim().replace(/\n---\s*$/, '').trim();
    const preceding = [...stageHeaders].reverse().find(h => h.index <= m.index);
    const id = m[1].toUpperCase();
    const statusLine = fieldInLine(body, 'Estado');
    const status = parseStatus(statusLine);
    const level = fieldInLine(body, 'Nivel de referencia') || preceding?.level || '';
    const record = {
      id, title: m[2].trim(), stage: preceding?.number || 0, stageTitle: preceding?.title || 'Unidades',
      level, status, statusLabel: statusLine || 'SIN CONFIRMAR', body,
      objective: findTagged(body, 'Objetivo comunicativo'),
      grammar: findTagged(body, 'Gramática'),
      vocabulary: findTagged(body, 'Vocabulario (8–15 unidades para introducir o reciclar)') || findTagged(body, 'Vocabulario'),
      communication: findTagged(body, 'Comunicación y conversación'),
      listening: findTagged(body, 'Comprensión oral o escrita (material por seleccionar, NO adjuntado)'),
      expected: findTagged(body, 'Resultado esperado y evidencia observable'),
      materials: parseMaterials(body, id)
    };
    return record;
  });
  const stages = stageHeaders.map((s, ix) => {
    const end = stageHeaders[ix + 1]?.index ?? markdown.search(/^##\s+PARTE\s+D\s+/m);
    const intro = markdown.slice(s.index + markdown.slice(s.index).indexOf('\n') + 1, end > 0 ? end : markdown.length)
      .split(/^####\s+Fichas individuales/m)[0].trim();
    const stageClasses = classes.filter(c => c.stage === s.number);
    const result = { ...s, intro, classes: stageClasses };
    delete result.index;
    return result;
  });
  const sections = [...markdown.matchAll(SECTION_RX)].map((m, ix, all) => m);
  const pageSections = {};
  sections.forEach((m, ix) => {
    const end = sections[ix + 1]?.index ?? markdown.length;
    pageSections[m[1].toUpperCase()] = { title: m[2], content: markdown.slice(m.index + m[0].length, end).trim() };
  });
  const totals = { all: classes.length, seen: 0, progress: 0, pending: 0, review: 0, unknown: 0 };
  classes.forEach(c => totals[c.status]++);
  const materials = classes.flatMap(c => c.materials);
  return { markdown, stages, classes, sections: pageSections, totals, materials };
}

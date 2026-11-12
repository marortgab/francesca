
import { parseRoadmap } from './parser.js';
import { escapeHTML as E, renderMarkdown, safeURL } from './markdown.js';

const ROOT = new URL('./', import.meta.url);
const q = (s, base = document) => base.querySelector(s);

let DATA = null;
let GENERAL_MATERIALS = [];
let CONFIG = {};
let route = 'inicio';
let search = '';
let filterStatus = 'all';
let filterLevel = 'all';

const expanded = new Set([1]);

const LABELS = {
  seen: 'VISTO',
  progress: 'EN PROGRESO',
  pending: 'PENDIENTE',
  review: 'REPASO PENDIENTE',
  unknown: 'SIN CONFIRMAR'
};

const ICONS = {
  seen: '✓',
  progress: '◌',
  pending: '○',
  review: '↻',
  unknown: '?'
};

const NAV = {
  inicio: 'Inicio',
  perfil: 'Mi perfil',
  roadmap: 'Mi roadmap',
  historial: 'Clases vistas',
  proximas: 'Próximas clases',
  biblioteca: 'Biblioteca general',
  materiales: 'Materiales de clase',
  progreso: 'Mi progreso'
};

const pct = (n, d) => d ? Math.round(100 * n / d) : 0;

const normalize = s => String(s || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const studentName = () => String(CONFIG.studentName || '').trim();

const brand = () => studentName()
  ? `hola ${studentName()}`
  : 'hola';

function iconMarkup() {
  return `<svg class="hero-art" viewBox="0 0 320 255"
    role="img"
    aria-label="Ilustración de un libro abierto con flores y estrellas"
    xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="165" cy="230" rx="105" ry="12"
      fill="#B69964" opacity=".13"/>
    <circle cx="230" cy="85" r="70"
      fill="#F3DFAF" opacity=".8"/>
    <circle cx="79" cy="173" r="50"
      fill="#F8DCA3" opacity=".65"/>
    <g transform="rotate(-11 162 168)">
      <rect x="73" y="114" width="178" height="107"
        rx="16" fill="#D59C48" opacity=".23"/>
      <path d="M78 111q45-21 87 4v101q-43-25-87-6Z"
        fill="#fffdf5" stroke="#355D67" stroke-width="4"/>
      <path d="M165 115q42-25 87-4v99q-44-18-87 6Z"
        fill="#fff5d9" stroke="#355D67" stroke-width="4"/>
      <path d="M165 115v101"
        stroke="#9F2B2C" stroke-width="4"/>
      <path d="M93 137q28-8 57 4M93 151q26-8 57 4M93 165q27-8 57 4M181 141q25-12 54-5M181 155q25-12 54-5M181 169q25-12 54-5"
        fill="none" stroke="#D8CDB4"
        stroke-width="4" stroke-linecap="round"/>
    </g>
    <path d="M237 139c-6-18-2-42 9-58"
      fill="none" stroke="#54766C"
      stroke-width="4" stroke-linecap="round"/>
    <g transform="translate(250 70)">
      <circle r="12" fill="#9F2B2C"/>
      <circle cx="0" cy="-17" r="12" fill="#E0A03F"/>
      <circle cx="16" cy="-5" r="12" fill="#E0A03F"/>
      <circle cx="10" cy="14" r="12" fill="#E0A03F"/>
      <circle cx="-10" cy="14" r="12" fill="#E0A03F"/>
      <circle cx="-16" cy="-5" r="12" fill="#E0A03F"/>
      <circle r="9" fill="#FEF3B1"/>
    </g>
    <path d="M237 126q-19-24-23-8q0 16 23 8"
      fill="#6F9A78"/>
    <path d="M237 113q19-22 25-7q-2 16-25 7"
      fill="#6F9A78"/>
    <path d="M81 82l5 13 14 4-14 5-5 13-5-13-14-5 14-4Z"
      fill="#E0A03F"/>
    <path d="M189 39l4 9 10 4-10 4-4 9-4-9-10-4 10-4Z"
      fill="#9F2B2C"/>
    <circle cx="48" cy="145" r="4" fill="#9F2B2C"/>
    <circle cx="283" cy="159" r="4" fill="#E0A03F"/>
    <rect x="110" y="49" width="66" height="40"
      rx="17" fill="#355D67"/>
    <path d="M126 89l6-9h14" fill="#355D67"/>
    <text x="143" y="75" text-anchor="middle"
      font-family="sans-serif" fill="#FEF3B1"
      font-size="24">¡!</text>
  </svg>`;
}

function stateTag(status) {
  const s = LABELS[status] ? status : 'unknown';
  return `<span class="state-tag state-${s}">
    ${ICONS[s]} ${LABELS[s]}
  </span>`;
}

function nameForDisplay() {
  return studentName() ? E(studentName()) : 'tu';
}

function applyConfig() {
  const name = brand();

  for (const id of [
    'brand-sidebar',
    'brand-header',
    'brand-footer'
  ]) {
    const element = q('#' + id);
    if (element) element.textContent = name;
  }

  q('#student-mini-name').textContent =
    studentName() || 'Estudiante';

  q('#student-avatar').textContent =
    studentName()
      ? studentName()[0].toUpperCase()
      : '✿';

  document.title = studentName()
    ? `${name} · ${CONFIG.siteTitle || 'Mi aventura en español'}`
    : CONFIG.siteTitle || 'Mi aventura en español';

  const map = {
    hunyadiYellow: '--color-hunyadi',
    auburn: '--color-auburn',
    vanilla: '--color-vanilla',
    slateGray: '--color-slate'
  };

  Object.entries(map).forEach(([key, property]) => {
    const val = CONFIG.themeColors?.[key];
    if (/^#[0-9a-f]{6}$/i.test(val || '')) {
      document.documentElement.style.setProperty(property, val);
    }
  });
}

function totalClassCount(stage) {
  return stage.classes.length;
}

function totalSeen(stage) {
  return stage.classes.filter(c => c.status === 'seen').length;
}

function nextLesson() {
  return DATA.classes.find(c => c.status === 'progress')
    || DATA.classes.find(c => c.status === 'pending')
    || DATA.classes.find(c => c.status === 'review');
}

function stageCard(s) {
  const seen = totalSeen(s);
  const total = totalClassCount(s);

  return `<button class="stage-card"
    data-stage-focus="${s.number}"
    type="button"
    aria-label="Abrir etapa ${s.number}: ${E(s.title)}">

    <span class="stage-number">
      ${String(s.number).padStart(2, '0')}
    </span>

    <span class="stage-copy">
      <strong>${E(s.title)}</strong>
      <span class="level-label">
        ${E(s.level)} · ${total} clases
      </span>
      <span class="stage-progress-line">
        <span style="--value:${pct(seen, total)}%"></span>
      </span>
      <span class="stage-meta">
        <span>${seen} temas vistos</span>
        <span>${pct(seen, total)}%</span>
      </span>
    </span>
  </button>`;
}

function lessonCard(c) {
  return `<button type="button"
    class="lesson-card"
    data-open="${E(c.id)}"
    data-state="${c.status}"
    aria-label="Abrir clase ${E(c.id)}, ${E(c.title)}">

    <span class="lesson-number">${E(c.id)}</span>
    <span class="lesson-info">
      <strong>${E(c.title)}</strong>
      <span class="lesson-sub">
        ${E(c.level)} · Etapa ${c.stage}
      </span>
      ${stateTag(c.status)}
    </span>
  </button>`;
}

function heroStats() {
  const t = DATA.totals;

  return `<div class="stats">
    <div class="stat-card">
      <span class="stat-icon sun">✦</span>
      <div class="stat-number">${t.all}</div>
      <div class="stat-label">Clases en el mapa</div>
      <div class="stat-desc">Tu recorrido completo</div>
    </div>

    <div class="stat-card">
      <span class="stat-icon blue">✓</span>
      <div class="stat-number">${t.seen}</div>
      <div class="stat-label">Temas vistos</div>
      <div class="stat-desc">Confirmados por la profesora</div>
    </div>

    <div class="stat-card">
      <span class="stat-icon rose">↗</span>
      <div class="stat-number">${t.pending}</div>
      <div class="stat-label">Pendientes</div>
      <div class="stat-desc">Por explorar</div>
    </div>

    <div class="stat-card">
      <span class="stat-icon grey">◷</span>
      <div class="stat-number">${t.review}</div>
      <div class="stat-label">Repasos previstos</div>
      <div class="stat-desc">Para consolidar</div>
    </div>
  </div>`;
}

function showHome() {
  const t = DATA.totals;
  const percentage = pct(t.seen, t.all);
  const next = nextLesson();

  return `<section class="hero">
    <div class="hero-content">
      <div class="kicker">✳ TU AVENTURA EN ESPAÑOL</div>
      <h1>
        ¡Hola, <span>${nameForDisplay()}</span>!
        <span aria-hidden="true">☀</span>
      </h1>
      <p>${E(
        CONFIG.welcomeMessage ||
        'Un espacio para aprender español a tu ritmo.'
      )}</p>
      <button class="primary-btn"
        data-route="roadmap" type="button">
        Explorar mi roadmap <span aria-hidden="true">↗</span>
      </button>
    </div>
    ${iconMarkup()}
  </section>

  ${heroStats()}

  <div class="section-header">
    <div>
      <div class="kicker">SIGUE SUMANDO</div>
      <h2>Tu camino, a tu ritmo ✿</h2>
      <p>Cada etapa es una oportunidad para comunicarte mejor.</p>
    </div>
  </div>

  <div class="grid-two">
    <section class="card progress-feature">
      <div class="donut" style="--p:${percentage}">
        <div class="donut-inside">
          <strong>${percentage}%</strong>
          <small>temas vistos</small>
        </div>
      </div>
      <div>
        <h3>¡Mira lo que has recorrido!</h3>
        <p>
          De ${t.all} temas del plan,
          ${t.seen} están confirmados como estudiados.
        </p>
        <button class="text-link"
          data-route="progreso" type="button">
          Ver mi progreso ↗
        </button>
      </div>
    </section>

    <section class="card tip-card">
      <span class="tip-flower" aria-hidden="true">✳</span>
      <span class="tip-label">EL SIGUIENTE PASITO</span>
      <h3>${
        next
          ? `Clase ${E(next.id)} · ${E(next.title)}`
          : '¡Qué recorrido!'
      }</h3>
      <p>${
        next
          ? 'Primer contenido pendiente del mapa. Tu profesora decide cuándo trabajarlo.'
          : 'No quedan clases pendientes en este mapa.'
      }</p>
      <button class="text-link"
        ${next
          ? `data-open="${E(next.id)}"`
          : 'data-route="roadmap"'}
        type="button">
        ${next ? 'Ver clase ↗' : 'Ver roadmap ↗'}
      </button>
    </section>
  </div>

  <div class="section-header">
    <div>
      <div class="kicker">UNA AVENTURA POR ETAPAS</div>
      <h2>Explora tus niveles</h2>
      <p>Abre una etapa y descubre las clases que contiene.</p>
    </div>
    <button class="text-link"
      data-route="roadmap" type="button">
      Ver todo el camino ↗
    </button>
  </div>

  <div class="stages-grid">
    ${DATA.stages.map(stageCard).join('')}
  </div>

  <div class="section-header">
    <div>
      <h2>Aprender no es una carrera</h2>
    </div>
  </div>
  <div class="notice">
    Las clases aparecen en orden pedagógico, no cronológico.
    «Visto» significa que el tema se trabajó,
    no que esté dominado.
  </div>`;
}

function stagePanel(s, matched, open = false) {
  const count = s.classes.length;
  const seen = totalSeen(s);

  return `<details class="stage-panel"
    data-stage="${s.number}"
    ${open ? 'open' : ''}>

    <summary class="stage-panel-head">
      <span class="stage-number">
        ${String(s.number).padStart(2, '0')}
      </span>

      <span class="stage-main">
        <strong>${E(s.title)}</strong>
        <small>
          ${E(s.level)} · ${count} clases · ${seen} vistas
        </small>
      </span>

      <span class="stage-stats">
        ${pct(seen, count)}% visto
      </span>

      <span class="chevron" aria-hidden="true">⌄</span>
    </summary>

    <div class="stage-panel-body">
      ${matched.length
        ? `<div class="lesson-grid">
            ${matched.map(lessonCard).join('')}
          </div>`
        : '<div class="stage-empty">No hay clases con estos filtros en esta etapa.</div>'
      }
    </div>
  </details>`;
}

function matches(c) {
  if (
    filterStatus === 'future'
      ? !['pending', 'progress', 'review', 'unknown'].includes(c.status)
      : filterStatus !== 'all' && c.status !== filterStatus
  ) return false;

  if (
    filterLevel !== 'all' &&
    !c.level.split(/[–—/\s]+/).includes(filterLevel) &&
    c.level !== filterLevel
  ) return false;

  const find = normalize([
    c.id,
    c.title,
    c.level,
    c.stageTitle,
    c.objective,
    c.grammar,
    c.vocabulary,
    c.communication,
    c.body
  ].join(' '));

  return !search || find.includes(normalize(search));
}

function filterResults() {
  const items = DATA.classes.filter(matches);

  q('#result-count').textContent =
    `${items.length} de ${DATA.classes.length} clases`;

  q('#roadmap-results').innerHTML = items.length
    ? DATA.stages
      .filter(s => s.classes.some(c => items.includes(c)))
      .map(s => stagePanel(
        s,
        items.filter(c => c.stage === s.number),
        expanded.has(s.number) ||
        Boolean(search) ||
        filterStatus !== 'all' ||
        filterLevel !== 'all'
      )).join('')
    : `<div class="empty-state">
        <div class="empty-icon">⌕</div>
        <h3>No encontramos clases con esos filtros</h3>
        <p>Prueba con otra palabra, nivel o estado.</p>
        <button type="button"
          class="secondary-btn" id="reset-filters">
          Quitar filtros
        </button>
      </div>`;

  q('#roadmap-results')
    .querySelectorAll('details[data-stage]')
    .forEach(d => d.addEventListener('toggle', () => {
      if (d.open) expanded.add(Number(d.dataset.stage));
      else expanded.delete(Number(d.dataset.stage));
    }));

  const reset = q('#reset-filters');

  if (reset) {
    reset.addEventListener('click', () => {
      search = '';
      filterStatus = 'all';
      filterLevel = 'all';
      showRoadmap(true);
    });
  }
}

function showRoadmap(reset = false) {
  if (reset) {
    search = '';
    filterStatus = 'all';
    filterLevel = 'all';
  }

  const levels = [...new Set(
    DATA.classes.flatMap(c =>
      c.level.split(/[–—/\s]+/)
        .filter(v => /^(A0|A1|A2|B1|B2|C1|C2)$/i.test(v))
    )
  )];

  q('#view').innerHTML = `
    <div class="chapter-header">
      <div>
        <div class="kicker">TU MAPA DE APRENDIZAJE</div>
        <h1>Un camino lleno de español ✧</h1>
        <p>Descubre temas vistos y futuros aprendizajes.</p>
      </div>
      <span class="small-pill">
        ✿ ${DATA.stages.length} etapas
      </span>
    </div>

    <div class="toolbar">
      <label class="search-field">
        <span aria-hidden="true">⌕</span>
        <input id="roadmap-search" type="search"
          placeholder="Buscar gramática, vocabulario, temas…"
          autocomplete="off"
          aria-label="Buscar clases"
          value="${E(search)}">
      </label>

      <select id="status-filter" class="filter-control">
        <option value="all">Todos los estados</option>
        <option value="seen">Vistas</option>
        <option value="progress">En progreso</option>
        <option value="pending">Pendientes</option>
        <option value="review">Repasos</option>
        <option value="unknown">Sin confirmar</option>
      </select>

      <select id="level-filter" class="filter-control">
        <option value="all">Todos los niveles</option>
        ${levels.map(l =>
          `<option value="${E(l)}">${E(l)}</option>`
        ).join('')}
      </select>

      <span class="result-counter" id="result-count"></span>
    </div>

    <div class="notice">
      El progreso se construye con los estados del roadmap.
      Una clase marcada «VISTO» no significa
      que el contenido esté dominado.
    </div>

    <div id="roadmap-results"></div>
  `;

  q('#status-filter').value = filterStatus;
  q('#level-filter').value = filterLevel;

  q('#roadmap-search').addEventListener('input', e => {
    search = e.target.value;
    filterResults();
  });

  q('#status-filter').addEventListener('change', e => {
    filterStatus = e.target.value;
    filterResults();
  });

  q('#level-filter').addEventListener('change', e => {
    filterLevel = e.target.value;
    filterResults();
  });

  filterResults();
}

function filteredList(title, subtitle, statuses, emptyText) {
  const lessons = DATA.classes.filter(
    c => statuses.includes(c.status)
  );

  q('#view').innerHTML = `
    <div class="chapter-header">
      <div>
        <div class="kicker">TU HISTORIA CON EL ESPAÑOL</div>
        <h1>${E(title)}</h1>
        <p>${E(subtitle)}</p>
      </div>
      <span class="small-pill">${lessons.length} temas</span>
    </div>

    <div class="notice">
      Las fechas y los materiales históricos aparecerán
      cuando tu profesora los incorpore al archivo.
    </div>

    ${lessons.length
      ? `<div class="lesson-grid">
          ${lessons.map(lessonCard).join('')}
        </div>`
      : `<div class="empty-state">
          <div class="empty-icon">✿</div>
          <h3>${E(emptyText)}</h3>
        </div>`
    }
  `;
}

// =============================================
// BIBLIOTECA GENERAL
// =============================================

function showGeneralLibrary() {
  const resources = GENERAL_MATERIALS.filter(
    r => r && typeof r === 'object' && safeURL(r.url)
  );

  const categories = [...new Set(
    resources.map(r => String(r.category || 'General'))
  )].sort((a, b) => a.localeCompare(b, 'es'));

  q('#view').innerHTML = `
    <div class="chapter-header">
      <div>
        <div class="kicker">RECURSOS PARA APRENDER</div>
        <h1>Biblioteca general ✿</h1>
        <p>
          Vocabulario, gramática, lecturas y ejercicios
          para practicar español a tu ritmo.
        </p>
      </div>
      <span class="small-pill">
        ${resources.length} recursos
      </span>
    </div>

    <div class="toolbar">
      <label class="search-field">
        <span aria-hidden="true">⌕</span>
        <input
          id="general-library-search"
          type="search"
          placeholder="Buscar materiales…"
          aria-label="Buscar materiales generales">
      </label>

      <select class="filter-control"
        id="general-library-category"
        aria-label="Filtrar por categoría">

        <option value="">Todas las categorías</option>

        ${categories.map(c =>
          `<option value="${E(c)}">${E(c)}</option>`
        ).join('')}
      </select>
    </div>

    <div id="general-library-results"></div>
  `;

  const paint = () => {
    const term = normalize(
      q('#general-library-search').value
    );

    const category =
      q('#general-library-category').value;

    const matches = resources.filter(r =>
      (!category || String(r.category || 'General') === category)
      &&
      (!term || normalize([
        r.title,
        r.category,
        r.level,
        r.description
      ].join(' ')).includes(term))
    );

    q('#general-library-results').innerHTML =
      matches.length
        ? `<div class="library-list">
            ${matches.map(r => {
              const kind =
                r.kind === 'image'
                  ? 'image'
                  : r.kind === 'pdf'
                    ? 'pdf'
                    : 'link';

              const label = String(r.title || 'Recurso');

              return `
                <div class="resource-card">
                  <span class="resource-icon">
                    ${kind === 'image'
                      ? '▧'
                      : kind === 'pdf'
                        ? '▤'
                        : '↗'}
                  </span>

                  <span>
                    <strong>${E(label)}</strong>
                    <small>
                      ${E(r.category || 'General')} ·
                      ${E(r.level || 'Todos los niveles')}
                    </small>
                    ${
                      r.description
                        ? `<small>${E(r.description)}</small>`
                        : ''
                    }
                  </span>

                  <button type="button"
                    data-resource="${E(safeURL(r.url))}"
                    data-kind="${kind}"
                    data-resource-label="${E(label)}">
                    Abrir ↗
                  </button>
                </div>`;
            }).join('')}
          </div>`

        : `<div class="empty-state">
            <div class="empty-icon">✿</div>
            <h3>
              ${resources.length
                ? 'No encontramos materiales con esos filtros'
                : 'Tu biblioteca está lista para crecer'}
            </h3>
            <p>
              ${resources.length
                ? 'Prueba con otra palabra o categoría.'
                : 'Los materiales generales aparecerán aquí.'}
            </p>
          </div>`;
  };

  q('#general-library-search').addEventListener(
    'input', paint
  );

  q('#general-library-category').addEventListener(
    'change', paint
  );

  paint();
}

// =============================================
// MATERIALES DE CLASE
// =============================================

function showMaterials() {
  const resources = DATA.materials.filter(
    r => safeURL(r.url)
  );

  q('#view').innerHTML = `
    <div class="chapter-header">
      <div>
        <div class="kicker">RECURSOS DE TUS CLASES</div>
        <h1>Materiales de clase ✳</h1>
        <p>
          Encuentra imágenes, lecturas, PDF y enlaces
          compartidos durante tus clases.
        </p>
      </div>

      <span class="small-pill">
        ${resources.length} recursos
      </span>
    </div>

    ${resources.length
      ? `<div class="library-list">
          ${resources.map(r => `
            <div class="resource-card">
              <span class="resource-icon">
                ${r.kind === 'image'
                  ? '▧'
                  : r.kind === 'pdf'
                    ? '▤'
                    : '↗'}
              </span>

              <span>
                <strong>${E(r.label)}</strong>
                <small>
                  Clase ${E(r.classId)} ·
                  ${r.kind === 'pdf'
                    ? 'PDF'
                    : r.kind === 'image'
                      ? 'Imagen'
                      : 'Enlace'}
                </small>
              </span>

              <button type="button"
                data-resource="${E(r.url)}"
                data-kind="${E(r.kind)}"
                data-resource-label="${E(r.label)}">
                Abrir ↗
              </button>
            </div>
          `).join('')}
        </div>`

      : `<div class="empty-state">
          <div class="empty-icon">✳</div>
          <h3>Tu biblioteca está lista para crecer</h3>
          <p>
            Todavía no se han adjuntado materiales
            reales a las clases.
            Cuando tu profesora agregue imágenes,
            PDF o enlaces a roadmap.md,
            aparecerán aquí automáticamente.
          </p>
          <button class="secondary-btn"
            data-route="roadmap" type="button">
            Explorar las clases ↗
          </button>
        </div>`
    }

    <div class="section-header">
      <div>
        <h2>Todo en un mismo lugar</h2>
      </div>
    </div>

    <div class="card">
      <p class="muted" style="line-height:1.8;margin:0">
        Después de cada sesión, tu profesora puede añadir
        explicaciones, tareas y recursos dentro de la clase.
        Los materiales seguirán disponibles para repasar.
      </p>
    </div>
  `;
}

function showProgress() {
  const t = DATA.totals;
  const percentage = pct(t.seen, t.all);

  q('#view').innerHTML = `
    <div class="chapter-header">
      <div>
        <div class="kicker">TUS LOGROS, PASO A PASO</div>
        <h1>Mi progreso ✺</h1>
        <p>
          Un resumen de los contenidos registrados
          como vistos y de lo que queda por descubrir.
        </p>
      </div>
      <span class="small-pill">
        ${percentage}% de temas vistos
      </span>
    </div>

    <div class="grid-two">
      <div class="card progress-feature">
        <div class="donut" style="--p:${percentage}">
          <div class="donut-inside">
            <strong>${percentage}%</strong>
            <small>vistos</small>
          </div>
        </div>

        <div>
          <div class="kicker">EL CAMINO COMPLETO</div>
          <h3>${t.seen} de ${t.all} temas</h3>
          <p>
            Esta cifra mide temas cubiertos,
            no conocimientos evaluados.
          </p>
        </div>
      </div>

      <div class="card tip-card">
        <div class="tip-label">TU PUNTO DE PARTIDA</div>
        <h3>${E(CONFIG.currentLevel || 'Por evaluar')}</h3>
        <p>
          El nivel actual debe comprobarse
          mediante la comprensión y producción real.
        </p>

        <div class="tip-label">META</div>
        <h3>
          ${E(CONFIG.targetLevel || 'Un recorrido flexible')}
        </h3>
      </div>
    </div>

    ${heroStats()}

    <div class="section-header">
      <div>
        <div class="kicker">ETAPA POR ETAPA</div>
        <h2>Así avanza el recorrido</h2>
      </div>
    </div>

    <div class="card">
      <div class="stage-bars">
        ${DATA.stages.map(s => {
          const seen = totalSeen(s);
          return `<div class="bar-line">
            <strong>
              Etapa ${s.number} · ${E(s.level)}
            </strong>

            <div class="progress-track">
              <span style="--value:${pct(seen, s.classes.length)}%">
              </span>
            </div>

            <span>${seen}/${s.classes.length}</span>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="section-header">
      <div>
        <div class="kicker">CÓMO SE EVALÚA</div>
        <h2>Más allá de los porcentajes</h2>
      </div>
    </div>

    <article class="card markdown-body">
      ${renderMarkdown(
        DATA.sections['PARTE D']?.content ||
        'Los objetivos se revisan en clase.'
      )}
    </article>
  `;
}

function showProfile() {
  q('#view').innerHTML = `
    <div class="chapter-header">
      <div>
        <div class="kicker">ACERCA DE TU CAMINO</div>
        <h1>Tu perfil de aprendizaje</h1>
        <p>Objetivos, motivaciones y observaciones del plan.</p>
      </div>

      <a class="secondary-btn"
        href="./roadmap.md" download>
        ↓ Roadmap original
      </a>
    </div>

    <div class="card markdown-body profile-panel">
      ${renderMarkdown(
        DATA.sections['PARTE A']?.content ||
        'Aún no hay perfil disponible.'
      )}
    </div>

    <div class="section-header">
      <div>
        <div class="kicker">INFORMACIÓN ADICIONAL</div>
        <h2>Mapa curricular original</h2>
      </div>
    </div>

    <div class="card markdown-body">
      ${renderMarkdown(
        DATA.sections['PARTE B']?.content || ''
      )}
    </div>
  `;
}

function render() {
  if (!DATA) return;

  document.querySelectorAll('[data-route]').forEach(b => {
    if (b.classList.contains('nav-btn')) {
      const active = b.dataset.route === route;

      b.classList.toggle('active', active);

      if (active) {
        b.setAttribute('aria-current', 'page');
      } else {
        b.removeAttribute('aria-current');
      }
    }
  });

  q('#current-section').textContent =
    NAV[route] || 'Inicio';

  if (route === 'inicio') {
    q('#view').innerHTML = showHome();
  } else if (route === 'roadmap') {
    showRoadmap();
  } else if (route === 'historial') {
    filteredList(
      'Lo que ya has visto ✦',
      'Tus temas estudiados siempre disponibles para repasar.',
      ['seen'],
      'Aún no hay clases registradas como vistas'
    );
  } else if (route === 'proximas') {
    filteredList(
      'Todo lo que viene ✿',
      'Explora los contenidos pendientes y los repasos.',
      ['pending', 'progress', 'review', 'unknown'],
      'No hay clases pendientes'
    );
  } else if (route === 'biblioteca') {
    showGeneralLibrary();
  } else if (route === 'materiales') {
    showMaterials();
  } else if (route === 'progreso') {
    showProgress();
  } else {
    showProfile();
  }
}

function navigate(to, stageFocus) {
  route = Object.hasOwn(NAV, to) ? to : 'inicio';

  if (stageFocus) {
    expanded.add(Number(stageFocus));
  }

  if (location.hash !== `#${route}`) {
    history.replaceState(null, '', `#${route}`);
  }

  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
  closeMenu();

  if (stageFocus) {
    const detail = q(
      `details[data-stage="${stageFocus}"]`
    );

    if (detail) {
      detail.open = true;
      detail.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
}

function openLesson(id) {
  const lesson = DATA.classes.find(
    c => c.id === String(id).toUpperCase()
  );

  if (!lesson) return;

  const ix = DATA.classes.indexOf(lesson);
  const prev = DATA.classes[ix - 1];
  const next = DATA.classes[ix + 1];

  q('#lesson-modal-content').innerHTML = `
    <div class="modal-header">
      <button type="button"
        class="close-modal"
        data-close-lesson
        aria-label="Cerrar detalle">×</button>

      <div class="modal-eyebrow">
        ETAPA ${lesson.stage} · ${E(lesson.stageTitle)}
      </div>

      <h2 id="lesson-modal-title">
        Clase ${E(lesson.id)} · ${E(lesson.title)}
      </h2>

      <div class="modal-pills">
        ${stateTag(lesson.status)}
        <span class="small-pill">${E(lesson.level)}</span>
        <span class="small-pill">50 minutos</span>
      </div>
    </div>

    <div class="modal-body">
      <div class="notice">
        La ficha refleja una planificación curricular.
        Las actividades propuestas no constituyen
        necesariamente un registro literal de la sesión.
      </div>

      <div class="markdown-body">
        ${renderMarkdown(lesson.body)}
      </div>
    </div>

    <div class="modal-footer">
      <button type="button"
        ${!prev ? 'disabled' : ''}
        ${prev ? `data-open="${E(prev.id)}"` : ''}>
        ← Anterior
      </button>

      <button type="button"
        ${!next ? 'disabled' : ''}
        ${next ? `data-open="${E(next.id)}"` : ''}>
        Siguiente →
      </button>
    </div>
  `;

  const d = q('#lesson-dialog');
  if (!d.open) d.showModal();

  const section = q('#lesson-modal-title');
  if (section) section.focus?.({ preventScroll: true });

  d.scrollTop = 0;
}

function openResource(url, kind, label) {
  const safe = safeURL(url);
  if (!safe) return;

  if (kind === 'image') {
    q('#lightbox-image').src = safe;
    q('#lightbox-image').alt = label || 'Imagen';
    q('#lightbox-caption').textContent = label || '';
    q('#image-dialog').showModal();
  } else {
    window.open(safe, '_blank', 'noopener,noreferrer');
  }
}

function closeMenu() {
  q('#sidebar').classList.remove('open');
  q('#mobile-overlay').hidden = true;
  q('#menu-toggle').setAttribute('aria-expanded', 'false');
}

function eventListeners() {
  document.addEventListener('click', e => {
    const target = e.target.closest(
      '[data-open],[data-route],[data-stage-focus],' +
      '[data-close-lesson],[data-close-info],[data-resource]'
    );

    if (target) {
      if (target.dataset.open) {
        openLesson(target.dataset.open);
      } else if (target.dataset.route) {
        navigate(target.dataset.route);
      } else if (target.dataset.stageFocus) {
        navigate('roadmap', target.dataset.stageFocus);
      } else if (target.hasAttribute('data-close-lesson')) {
        q('#lesson-dialog').close();
      } else if (target.hasAttribute('data-close-info')) {
        q('#info-dialog').close();
      } else if (target.hasAttribute('data-resource')) {
        openResource(
          target.dataset.resource,
          target.dataset.kind,
          target.dataset.resourceLabel
        );
      }
    }

    const img = e.target.closest('.md-image');

    if (img && !target) {
      openResource(
        img.getAttribute('src'),
        'image',
        img.getAttribute('alt')
      );
    }
  });

  q('#menu-toggle').addEventListener('click', () => {
    const isOpen = q('#sidebar').classList.toggle('open');
    q('#mobile-overlay').hidden = !isOpen;
    q('#menu-toggle').setAttribute(
      'aria-expanded', String(isOpen)
    );
  });

  q('#mobile-overlay').addEventListener('click', closeMenu);

  q('#help-button').addEventListener('click', () => {
    q('#info-dialog').showModal();
  });

  q('#lightbox-close').addEventListener('click', () => {
    q('#image-dialog').close();
  });

  [
    '#lesson-dialog',
    '#image-dialog',
    '#info-dialog'
  ].forEach(sel => {
    q(sel).addEventListener('click', e => {
      if (e.target === e.currentTarget) {
        e.currentTarget.close();
      }
    });
  });

  window.addEventListener('hashchange', () => {
    const hash = location.hash.replace(/^#/, '');

    if (Object.hasOwn(NAV, hash)) {
      route = hash;
      render();
    }
  });
}

async function main() {
  eventListeners();

  try {
    const [
      configResponse,
      markdownResponse,
      libraryResponse
    ] = await Promise.all([
      fetch(new URL('config.json', ROOT), {
        cache: 'no-store'
      }),
      fetch(new URL('roadmap.md', ROOT), {
        cache: 'no-store'
      }),
      fetch(new URL('biblioteca.json', ROOT), {
        cache: 'no-store'
      })
    ]);

    if (libraryResponse.ok) {
      try {
        const libraryData = await libraryResponse.json();

        GENERAL_MATERIALS = Array.isArray(libraryData)
          ? libraryData
          : [];
      } catch (error) {
        console.warn(
          'biblioteca.json no contiene un JSON válido:',
          error
        );
        GENERAL_MATERIALS = [];
      }
    } else if (libraryResponse.status !== 404) {
      console.warn(
        'No se pudo cargar biblioteca.json:',
        libraryResponse.status
      );
    }

    if (!configResponse.ok || !markdownResponse.ok) {
      throw new Error(
        `No se pudo cargar ${
          !configResponse.ok
            ? 'config.json'
            : 'roadmap.md'
        }. Comprueba que está en la raíz del repositorio.`
      );
    }

    CONFIG = await configResponse.json();
    DATA = parseRoadmap(await markdownResponse.text());

    if (!DATA.classes.length) {
      throw new Error(
        'No se detectaron clases en roadmap.md. ' +
        'Comprueba los encabezados del documento.'
      );
    }

    applyConfig();

    const incoming = location.hash.replace(/^#/, '');
    route = Object.hasOwn(NAV, incoming)
      ? incoming
      : 'inicio';

    render();

  } catch (error) {
    q('#view').innerHTML = `
      <section class="empty-state">
        <div class="empty-icon">!</div>
        <h1>No se pudo abrir el roadmap</h1>

        <p>${E(error.message)}</p>

        <p>
          Comprueba que los archivos estén publicados
          correctamente en GitHub Pages.
        </p>

        <a class="secondary-btn" href="./roadmap.md">
          Comprobar el Markdown
        </a>
      </section>
    `;

    console.error(
      'Error inicializando la plataforma:',
      error
    );
  }
}

main();

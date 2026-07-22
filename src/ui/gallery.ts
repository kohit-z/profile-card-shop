import { SKILL_CATALOG, SKILL_IDS } from '../data/skills.js'
import {
  AVATAR_EFFECT_NAMES,
  CARD_EFFECT_NAMES,
  EFFECT_CATALOG,
  SECTION_EFFECT_NAMES,
  type EffectName,
} from '../effects/index.js'
import {
  CARD_SECTION_NAMES,
  type CardSectionName,
} from '../lib/query.js'
import { THEME_NAMES } from '../themes/index.js'

const DEFAULT_SKILLS = ['typescript', 'react', 'nodejs', 'docker', 'github'] as const

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function effectButtons(
  names: readonly EffectName[],
  scope: 'card' | 'avatar' | CardSectionName,
  selected: EffectName = 'none',
): string {
  return names
    .map((name) => {
      const meta = EFFECT_CATALOG[name]
      return `<button type="button" class="chip${name === selected ? ' on' : ''}" data-effect-scope="${scope}" data-effect="${name}" title="${escapeHtml(meta.description)}" aria-pressed="${name === selected}">${escapeHtml(meta.label)}</button>`
    })
    .join('')
}

export function renderGalleryPage(origin: string): string {
  const pageOrigin = origin.replace(/\/$/, '')
  const skillButtons = SKILL_IDS.map((id) => {
    const selected = DEFAULT_SKILLS.includes(id as (typeof DEFAULT_SKILLS)[number])
    return `<button type="button" class="chip${selected ? ' on' : ''}" data-skill="${id}" aria-pressed="${selected}">${escapeHtml(SKILL_CATALOG[id].label)}</button>`
  }).join('')
  const sectionButtons = CARD_SECTION_NAMES.map(
    (name) =>
      `<button type="button" class="chip on" data-section="${name}" aria-pressed="true">${name}</button>`,
  ).join('')
  const themeButtons = THEME_NAMES.map(
    (name, index) =>
      `<button type="button" class="chip${index === 0 ? ' on' : ''}" data-theme="${name}" aria-pressed="${index === 0}">${name}</button>`,
  ).join('')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GitHub Deco — composable README cards</title>
  <meta name="description" content="Build one SVG card from profile, stats, skills, and extensible sections." />
  <style>
    :root { color-scheme: light; --ink:#15231d; --muted:#53645c; --paper:#edf4ef; --panel:#ffffffd9; --line:#cad8d0; --accent:#087c5d; --soft:#dff1e9; }
    * { box-sizing:border-box; }
    body { margin:0; color:var(--ink); font:15px/1.5 system-ui,sans-serif; background:radial-gradient(circle at 15% 0,#cfeadd 0,transparent 38%),var(--paper); }
    main { width:min(1120px,calc(100% - 2rem)); margin:auto; padding:3rem 0 5rem; }
    header { display:grid; gap:.5rem; margin-bottom:1.5rem; }
    h1 { margin:0; font-size:clamp(2.5rem,7vw,5rem); letter-spacing:-.055em; line-height:1; }
    header p { color:var(--muted); font-size:1.1rem; max-width:48rem; margin:0; }
    .layout { display:grid; grid-template-columns:minmax(280px,360px) minmax(0,1fr); gap:1rem; align-items:start; }
    .panel { background:var(--panel); border:1px solid var(--line); border-radius:18px; box-shadow:0 18px 50px #1a392b18; }
    .controls { padding:1.1rem; display:grid; gap:1.15rem; max-height:calc(100vh - 2rem); overflow:auto; position:sticky; top:1rem; }
    .field { display:grid; gap:.45rem; }
    label,.label { font-size:.74rem; font-weight:750; color:var(--muted); letter-spacing:.08em; text-transform:uppercase; }
    input { width:100%; border:1px solid var(--line); border-radius:10px; padding:.7rem .8rem; font:500 .9rem ui-monospace,monospace; background:white; }
    .chips { display:flex; flex-wrap:wrap; gap:.38rem; }
    .chip { border:1px solid var(--line); border-radius:99px; background:white; color:var(--ink); padding:.35rem .68rem; cursor:pointer; font:600 .78rem system-ui,sans-serif; }
    .chip.on { color:white; background:var(--accent); border-color:var(--accent); }
    .workspace { padding:1rem; display:grid; gap:1rem; }
    .preview { min-height:270px; border:1px dashed var(--line); border-radius:13px; padding:1rem; overflow:auto; display:grid; place-items:center; background:linear-gradient(135deg,var(--soft),#fff); }
    .preview img { display:block; max-width:100%; height:auto; filter:drop-shadow(0 12px 24px #183c2b22); }
    .preview.loading img { opacity:.5; }
    .embed { display:grid; gap:.5rem; }
    .embed-head { display:flex; align-items:center; justify-content:space-between; }
    button.copy { border:0; border-radius:99px; padding:.45rem .8rem; background:var(--ink); color:white; cursor:pointer; }
    pre { margin:0; padding:.8rem; border-radius:10px; overflow:auto; white-space:pre-wrap; word-break:break-all; background:#132019; color:#d9eee4; font:12px/1.5 ui-monospace,monospace; }
    .note { color:var(--muted); font-size:.82rem; margin:0; }
    @media (max-width:820px) { .layout{grid-template-columns:1fr}.controls{position:static;max-height:none} }
  </style>
</head>
<body>
<main>
  <header>
    <h1>Compose one card.</h1>
    <p>Add and order reusable sections, then apply effects to the whole card, its avatar, or an individual section.</p>
  </header>
  <section id="playground" class="layout" aria-label="Composable card playground">
    <div class="panel controls">
      <div class="field"><span class="label">Sections</span><div class="chips">${sectionButtons}</div></div>
      <div class="field"><label for="username">GitHub username</label><input id="username" value="octocat" autocomplete="off" spellcheck="false" /></div>
      <div class="field"><span class="label">Skills</span><div class="chips">${skillButtons}</div></div>
      <div class="field"><span class="label">Theme</span><div class="chips">${themeButtons}</div></div>
      <div class="field"><span class="label">Card effect</span><div class="chips">${effectButtons(CARD_EFFECT_NAMES, 'card')}</div></div>
      <div class="field"><span class="label">Avatar effect</span><div class="chips">${effectButtons(AVATAR_EFFECT_NAMES, 'avatar', 'pulse')}</div></div>
      <div class="field"><span class="label">Stats section effect</span><div class="chips">${effectButtons(SECTION_EFFECT_NAMES, 'stats')}</div></div>
      <div class="field"><span class="label">Skills section effect</span><div class="chips">${effectButtons(SECTION_EFFECT_NAMES, 'skills')}</div></div>
      <p class="note">The renderer also accepts custom programmatic sections through <code>defineCardSection</code>. Legacy <code>/api/profile</code> and <code>/api/skills</code> URLs remain available as wrappers.</p>
    </div>
    <div class="panel workspace">
      <div class="preview" id="preview" aria-live="polite"><img id="card-img" alt="Composable GitHub card preview" width="842" /></div>
      <div class="embed">
        <div class="embed-head"><span class="label">Markdown</span><button type="button" class="copy" id="copy">Copy</button></div>
        <pre id="markdown"></pre>
      </div>
    </div>
  </section>
</main>
<script>
(() => {
  const origin = ${JSON.stringify(pageOrigin)};
  const state = {
    username: "octocat",
    sections: new Set(["profile", "stats", "skills"]),
    skills: new Set(${JSON.stringify([...DEFAULT_SKILLS])}),
    theme: "default",
    effects: { card: "none", avatar: "pulse", stats: "none", skills: "none" }
  };
  const image = document.getElementById("card-img");
  const preview = document.getElementById("preview");
  const output = document.getElementById("markdown");
  let timer = 0;

  function cardUrl() {
    const sections = [...state.sections];
    const params = new URLSearchParams({ sections: sections.join(","), theme: state.theme });
    if (sections.includes("profile") || sections.includes("stats")) params.set("username", state.username || "octocat");
    if (sections.includes("skills")) {
      const skills = [...state.skills];
      params.set("skills", (skills.length ? skills : ["typescript"]).join(","));
    }
    const effects = [];
    if (state.effects.card !== "none") effects.push("card:" + state.effects.card);
    if (sections.includes("profile") && state.effects.avatar !== "none") effects.push("avatar:" + state.effects.avatar);
    for (const section of ["stats", "skills"]) {
      if (sections.includes(section) && state.effects[section] !== "none") effects.push(section + ":" + state.effects[section]);
    }
    if (effects.length) params.set("effects", effects.join(","));
    return origin + "/api/card?" + params.toString();
  }

  function refresh() {
    const url = cardUrl();
    preview.classList.add("loading");
    image.onload = image.onerror = () => preview.classList.remove("loading");
    image.src = url;
    output.textContent = "![GitHub card](" + url + ")";
  }

  function exclusive(button, selector) {
    document.querySelectorAll(selector).forEach((candidate) => {
      const active = candidate === button;
      candidate.classList.toggle("on", active);
      candidate.setAttribute("aria-pressed", String(active));
    });
  }

  document.getElementById("username").addEventListener("input", (event) => {
    state.username = event.target.value.trim().toLowerCase();
    clearTimeout(timer);
    timer = setTimeout(refresh, 300);
  });
  document.querySelectorAll("[data-section]").forEach((button) => button.addEventListener("click", () => {
    const name = button.dataset.section;
    if (state.sections.has(name)) {
      if (state.sections.size === 1) return;
      state.sections.delete(name);
    } else state.sections.add(name);
    button.classList.toggle("on", state.sections.has(name));
    button.setAttribute("aria-pressed", String(state.sections.has(name)));
    refresh();
  }));
  document.querySelectorAll("[data-skill]").forEach((button) => button.addEventListener("click", () => {
    const name = button.dataset.skill;
    if (state.skills.has(name)) state.skills.delete(name); else if (state.skills.size < 20) state.skills.add(name);
    button.classList.toggle("on", state.skills.has(name));
    button.setAttribute("aria-pressed", String(state.skills.has(name)));
    refresh();
  }));
  document.querySelectorAll("[data-theme]").forEach((button) => button.addEventListener("click", () => {
    state.theme = button.dataset.theme;
    exclusive(button, "[data-theme]");
    refresh();
  }));
  document.querySelectorAll("[data-effect-scope]").forEach((button) => button.addEventListener("click", () => {
    const scope = button.dataset.effectScope;
    state.effects[scope] = button.dataset.effect;
    exclusive(button, '[data-effect-scope="' + scope + '"]');
    refresh();
  }));
  document.getElementById("copy").addEventListener("click", async (event) => {
    await navigator.clipboard.writeText(output.textContent || "");
    event.currentTarget.textContent = "Copied";
    setTimeout(() => { event.currentTarget.textContent = "Copy"; }, 1200);
  });
  refresh();
})();
</script>
</body>
</html>`
}

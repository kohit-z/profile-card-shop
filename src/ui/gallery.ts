import { SKILL_IDS, SKILL_CATALOG } from '../data/skills.js'
import {
  DEFAULT_EFFECT_NAME,
  EFFECT_CATALOG,
  EFFECT_NAMES,
} from '../effects/index.js'
import { THEME_NAMES } from '../themes/index.js'

const DEFAULT_USERNAME = 'octocat'
const DEFAULT_SKILLS = ['typescript', 'react', 'nodejs', 'docker', 'github'] as const

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function renderGalleryPage(origin: string): string {
  const skillOptions = SKILL_IDS.map((id) => {
    const skill = SKILL_CATALOG[id]
    const selected = DEFAULT_SKILLS.includes(
      id as (typeof DEFAULT_SKILLS)[number],
    )
    return `<button type="button" class="skill-chip${selected ? ' is-on' : ''}" data-skill="${escapeHtml(id)}" aria-pressed="${selected}">${escapeHtml(skill.label)}</button>`
  }).join('')

  const themeOptions = THEME_NAMES.map(
    (theme, index) =>
      `<button type="button" class="theme-pill${index === 0 ? ' is-on' : ''}" data-theme="${escapeHtml(theme)}" aria-pressed="${index === 0}">${escapeHtml(theme)}</button>`,
  ).join('')

  const effectOptions = EFFECT_NAMES.map((effect) => {
    const meta = EFFECT_CATALOG[effect]
    const selected = effect === DEFAULT_EFFECT_NAME
    return `<button type="button" class="theme-pill${selected ? ' is-on' : ''}" data-effect="${escapeHtml(effect)}" title="${escapeHtml(meta.description)}" aria-pressed="${selected}">${escapeHtml(meta.label)}</button>`
  }).join('')

  const skillCatalogJson = JSON.stringify(SKILL_IDS)
  const pageOrigin = origin.replace(/\/$/, '')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GitHub Deco — SVG cards for READMEs</title>
  <meta name="description" content="Preview and build embeddable GitHub profile and skills SVG cards." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,560;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    :root {
      --ink: #14201c;
      --muted: #4d6058;
      --paper: #f3f7f4;
      --panel: rgba(255, 255, 255, 0.72);
      --line: rgba(20, 32, 28, 0.12);
      --accent: #0f8a6a;
      --accent-deep: #0a5c48;
      --glow: rgba(15, 138, 106, 0.18);
      --shadow: 0 24px 60px rgba(16, 36, 28, 0.12);
      --radius: 18px;
      --font-display: "Fraunces", Georgia, serif;
      --font-body: "IBM Plex Sans", system-ui, sans-serif;
      --font-mono: "IBM Plex Mono", ui-monospace, monospace;
    }

    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      color: var(--ink);
      font-family: var(--font-body);
      background:
        radial-gradient(1200px 600px at 12% -10%, rgba(15, 138, 106, 0.16), transparent 55%),
        radial-gradient(900px 500px at 90% 8%, rgba(36, 99, 140, 0.12), transparent 50%),
        linear-gradient(180deg, #eef5f1 0%, var(--paper) 42%, #e7efe9 100%);
      min-height: 100vh;
    }

    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      opacity: 0.35;
      background-image:
        linear-gradient(rgba(20, 32, 28, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(20, 32, 28, 0.04) 1px, transparent 1px);
      background-size: 48px 48px;
      mask-image: linear-gradient(180deg, rgba(0,0,0,0.55), transparent 70%);
    }

    a { color: var(--accent-deep); }

    .wrap {
      width: min(1080px, calc(100% - 2rem));
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }

    .hero {
      padding: clamp(3.5rem, 10vw, 6.5rem) 0 2.5rem;
      animation: rise 0.7s ease both;
    }

    .brand {
      font-family: var(--font-display);
      font-size: clamp(2.8rem, 8vw, 5.4rem);
      line-height: 0.95;
      letter-spacing: -0.03em;
      margin: 0 0 1rem;
      font-weight: 700;
    }

    .brand span {
      display: inline-block;
      background: linear-gradient(120deg, var(--ink) 40%, var(--accent) 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .lede {
      max-width: 34rem;
      font-size: 1.1rem;
      line-height: 1.55;
      color: var(--muted);
      margin: 0 0 1.5rem;
    }

    .cta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
    }

    .btn {
      appearance: none;
      border: 0;
      border-radius: 999px;
      padding: 0.8rem 1.2rem;
      font: 600 0.95rem var(--font-body);
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    }

    .btn:hover { transform: translateY(-1px); }
    .btn:active { transform: translateY(0); }

    .btn-primary {
      background: var(--ink);
      color: #f4faf7;
      box-shadow: 0 10px 24px rgba(20, 32, 28, 0.22);
    }

    .btn-ghost {
      background: transparent;
      color: var(--ink);
      border: 1px solid var(--line);
    }

    .stage {
      display: grid;
      gap: 1.25rem;
      padding-bottom: 4rem;
    }

    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      backdrop-filter: blur(14px);
      box-shadow: var(--shadow);
      overflow: hidden;
      animation: rise 0.8s ease both;
    }

    .panel:nth-child(2) { animation-delay: 0.08s; }
    .panel:nth-child(3) { animation-delay: 0.16s; }

    .panel-head {
      padding: 1.25rem 1.35rem 0.85rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem 1rem;
      justify-content: space-between;
      align-items: end;
    }

    .panel-head h2 {
      margin: 0;
      font-family: var(--font-display);
      font-size: 1.65rem;
      letter-spacing: -0.02em;
    }

    .panel-head p {
      margin: 0.25rem 0 0;
      color: var(--muted);
      font-size: 0.95rem;
    }

    .controls {
      padding: 0 1.35rem 1.1rem;
      display: grid;
      gap: 0.85rem;
    }

    .field {
      display: grid;
      gap: 0.4rem;
    }

    label {
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--muted);
    }

    input[type="text"] {
      width: 100%;
      max-width: 20rem;
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 0.7rem 0.85rem;
      font: 500 0.95rem var(--font-mono);
      background: rgba(255,255,255,0.9);
      color: var(--ink);
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    input[type="text"]:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 4px var(--glow);
    }

    .theme-row, .skill-row, .toggle-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .theme-pill, .skill-chip, .toggle {
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.8);
      color: var(--ink);
      border-radius: 999px;
      padding: 0.45rem 0.8rem;
      font: 500 0.85rem var(--font-body);
      cursor: pointer;
      transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
    }

    .theme-pill:hover, .skill-chip:hover, .toggle:hover {
      transform: translateY(-1px);
    }

    .theme-pill.is-on, .skill-chip.is-on, .toggle.is-on {
      background: var(--accent);
      border-color: transparent;
      color: #f4faf7;
    }

    .preview {
      margin: 0 1.35rem 1.35rem;
      border-radius: 14px;
      border: 1px dashed rgba(20, 32, 28, 0.16);
      background:
        linear-gradient(135deg, rgba(15,138,106,0.08), transparent 40%),
        repeating-linear-gradient(
          -45deg,
          rgba(20,32,28,0.03) 0 8px,
          transparent 8px 16px
        );
      min-height: 160px;
      display: grid;
      place-items: center;
      padding: 1rem;
      overflow: auto;
    }

    .preview img {
      max-width: 100%;
      height: auto;
      display: block;
      filter: drop-shadow(0 12px 28px rgba(16, 36, 28, 0.14));
      transition: opacity 0.25s ease, transform 0.35s ease;
    }

    .preview.is-loading img {
      opacity: 0.45;
      transform: scale(0.985);
    }

    .embed {
      margin: 0 1.35rem 1.35rem;
      display: grid;
      gap: 0.55rem;
    }

    .embed-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
    }

    .embed-bar span {
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--muted);
    }

    .copy-btn {
      border: 1px solid var(--line);
      background: #fff;
      border-radius: 999px;
      padding: 0.4rem 0.75rem;
      font: 600 0.8rem var(--font-body);
      cursor: pointer;
      color: var(--ink);
    }

    .copy-btn.is-copied {
      background: var(--accent);
      border-color: transparent;
      color: #fff;
    }

    pre {
      margin: 0;
      padding: 0.9rem 1rem;
      border-radius: 12px;
      background: #13201b;
      color: #d8ebe3;
      overflow-x: auto;
      font: 500 0.78rem/1.45 var(--font-mono);
      white-space: pre-wrap;
      word-break: break-all;
    }

    .foot {
      padding: 0 0 3rem;
      color: var(--muted);
      font-size: 0.9rem;
      animation: rise 0.9s ease both;
      animation-delay: 0.2s;
    }

    .foot code {
      font-family: var(--font-mono);
      font-size: 0.82em;
      background: rgba(255,255,255,0.7);
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 0.1rem 0.35rem;
    }

    @keyframes rise {
      from { opacity: 0; transform: translateY(14px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 720px) {
      .panel-head { align-items: start; flex-direction: column; }
      input[type="text"] { max-width: none; }
    }
  </style>
</head>
<body>
  <main class="wrap">
    <header class="hero">
      <h1 class="brand"><span>GitHub Deco</span></h1>
      <p class="lede">
        Embeddable SVG cards for GitHub Markdown. Tune a profile or skills card here, then copy the markdown into your README.
      </p>
      <div class="cta-row">
        <a class="btn btn-primary" href="#playground">Open playground</a>
        <a class="btn btn-ghost" href="/meta">API metadata</a>
      </div>
    </header>

    <section id="playground" class="stage" aria-label="Card playground">
      <article class="panel" id="profile-panel">
        <div class="panel-head">
          <div>
            <h2>Profile card</h2>
            <p>Icons for stats, plus live effect candidates from <code>/api/profile</code></p>
          </div>
        </div>
        <div class="controls">
          <div class="field">
            <label for="username">GitHub username</label>
            <input id="username" type="text" value="${DEFAULT_USERNAME}" autocomplete="off" spellcheck="false" />
          </div>
          <div class="field">
            <label>Theme</label>
            <div class="theme-row" data-group="profile-theme" role="group" aria-label="Profile theme">
              ${themeOptions}
            </div>
          </div>
          <div class="field">
            <label>Effect</label>
            <div class="theme-row" data-group="profile-effect" role="group" aria-label="Profile effect">
              ${effectOptions}
            </div>
          </div>
        </div>
        <div class="preview" id="profile-preview" aria-live="polite">
          <img id="profile-img" alt="Profile card preview" width="842" height="236" />
        </div>
        <div class="embed">
          <div class="embed-bar">
            <span>Markdown</span>
            <button type="button" class="copy-btn" data-copy="profile">Copy</button>
          </div>
          <pre id="profile-md"></pre>
        </div>
      </article>

      <article class="panel" id="skills-panel">
        <div class="panel-head">
          <div>
            <h2>Skills card</h2>
            <p>Pick icons, theme, and labels</p>
          </div>
        </div>
        <div class="controls">
          <div class="field">
            <label>Skills</label>
            <div class="skill-row" id="skill-chips" role="group" aria-label="Skills">
              ${skillOptions}
            </div>
          </div>
          <div class="field">
            <label>Theme</label>
            <div class="theme-row" data-group="skills-theme" role="group" aria-label="Skills theme">
              ${THEME_NAMES.map(
                (theme, index) =>
                  `<button type="button" class="theme-pill${index === 2 ? ' is-on' : ''}" data-theme="${escapeHtml(theme)}" aria-pressed="${index === 2}">${escapeHtml(theme)}</button>`,
              ).join('')}
            </div>
          </div>
          <div class="field">
            <label>Labels</label>
            <div class="toggle-row" role="group" aria-label="Labels">
              <button type="button" class="toggle is-on" data-labels="true" aria-pressed="true">Show labels</button>
              <button type="button" class="toggle" data-labels="false" aria-pressed="false">Icons only</button>
            </div>
          </div>
        </div>
        <div class="preview" id="skills-preview" aria-live="polite">
          <img id="skills-img" alt="Skills card preview" />
        </div>
        <div class="embed">
          <div class="embed-bar">
            <span>Markdown</span>
            <button type="button" class="copy-btn" data-copy="skills">Copy</button>
          </div>
          <pre id="skills-md"></pre>
        </div>
      </article>
    </section>

    <footer class="foot">
      <p>
        Health check at <code>/health</code>. Programmatic service metadata at <code>/meta</code>.
        Cards are SVG responses you can hotlink from GitHub Markdown.
      </p>
    </footer>
  </main>

  <script>
    (() => {
      const ORIGIN = ${JSON.stringify(pageOrigin)};
      const SKILL_IDS = ${skillCatalogJson};
      const state = {
        username: ${JSON.stringify(DEFAULT_USERNAME)},
        profileTheme: "default",
        profileEffect: ${JSON.stringify(DEFAULT_EFFECT_NAME)},
        skillsTheme: "ocean",
        labels: true,
        skills: new Set(${JSON.stringify([...DEFAULT_SKILLS])}),
      };

      const profileImg = document.getElementById("profile-img");
      const skillsImg = document.getElementById("skills-img");
      const profilePreview = document.getElementById("profile-preview");
      const skillsPreview = document.getElementById("skills-preview");
      const profileMd = document.getElementById("profile-md");
      const skillsMd = document.getElementById("skills-md");
      const usernameInput = document.getElementById("username");

      let profileTimer = 0;

      function profileUrl() {
        const params = new URLSearchParams({ username: state.username || "octocat" });
        if (state.profileTheme !== "default") params.set("theme", state.profileTheme);
        if (state.profileEffect !== ${JSON.stringify(DEFAULT_EFFECT_NAME)}) {
          params.set("effect", state.profileEffect);
        }
        return ORIGIN + "/api/profile?" + params.toString();
      }

      function skillsUrl() {
        const skills = [...state.skills];
        if (skills.length === 0) skills.push("typescript");
        const params = new URLSearchParams({
          skills: skills.join(","),
          theme: state.skillsTheme,
          labels: state.labels ? "true" : "false",
        });
        return ORIGIN + "/api/skills?" + params.toString();
      }

      function markdown(alt, url) {
        return "![" + alt + "](" + url + ")";
      }

      function refreshProfile() {
        profilePreview.classList.add("is-loading");
        const url = profileUrl();
        profileImg.onload = () => profilePreview.classList.remove("is-loading");
        profileImg.onerror = () => profilePreview.classList.remove("is-loading");
        profileImg.src = url;
        profileMd.textContent = markdown("GitHub profile", url);
      }

      function refreshSkills() {
        skillsPreview.classList.add("is-loading");
        const url = skillsUrl();
        skillsImg.onload = () => skillsPreview.classList.remove("is-loading");
        skillsImg.onerror = () => skillsPreview.classList.remove("is-loading");
        skillsImg.src = url;
        skillsMd.textContent = markdown("Skills", url);
      }

      function setActive(group, button) {
        group.querySelectorAll("button").forEach((el) => {
          el.classList.toggle("is-on", el === button);
          el.setAttribute("aria-pressed", el === button ? "true" : "false");
        });
      }

      usernameInput.addEventListener("input", () => {
        state.username = usernameInput.value.trim().toLowerCase() || "octocat";
        window.clearTimeout(profileTimer);
        profileTimer = window.setTimeout(refreshProfile, 350);
      });

      document.querySelectorAll('[data-group="profile-theme"] .theme-pill').forEach((btn) => {
        btn.addEventListener("click", () => {
          state.profileTheme = btn.dataset.theme;
          setActive(btn.parentElement, btn);
          refreshProfile();
        });
      });

      document.querySelectorAll('[data-group="profile-effect"] .theme-pill').forEach((btn) => {
        btn.addEventListener("click", () => {
          state.profileEffect = btn.dataset.effect;
          setActive(btn.parentElement, btn);
          refreshProfile();
        });
      });

      document.querySelectorAll('[data-group="skills-theme"] .theme-pill').forEach((btn) => {
        btn.addEventListener("click", () => {
          state.skillsTheme = btn.dataset.theme;
          setActive(btn.parentElement, btn);
          refreshSkills();
        });
      });

      document.querySelectorAll(".toggle").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.labels = btn.dataset.labels === "true";
          setActive(btn.parentElement, btn);
          refreshSkills();
        });
      });

      document.querySelectorAll(".skill-chip").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.skill;
          if (state.skills.has(id)) {
            if (state.skills.size === 1) return;
            state.skills.delete(id);
            btn.classList.remove("is-on");
            btn.setAttribute("aria-pressed", "false");
          } else if (state.skills.size < 20) {
            state.skills.add(id);
            btn.classList.add("is-on");
            btn.setAttribute("aria-pressed", "true");
          }
          refreshSkills();
        });
      });

      document.querySelectorAll(".copy-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const target = btn.dataset.copy === "profile" ? profileMd : skillsMd;
          try {
            await navigator.clipboard.writeText(target.textContent || "");
            btn.classList.add("is-copied");
            btn.textContent = "Copied";
            window.setTimeout(() => {
              btn.classList.remove("is-copied");
              btn.textContent = "Copy";
            }, 1400);
          } catch {
            btn.textContent = "Select & copy";
          }
        });
      });

      // Keep skill chip order stable against catalog changes.
      void SKILL_IDS;
      refreshProfile();
      refreshSkills();
    })();
  </script>
</body>
</html>`
}

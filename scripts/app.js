const form = document.querySelector("#cvForm");
const preview = document.querySelector("#cvPreview");
const previewMeta = document.querySelector("#previewMeta");
const atsHint = document.querySelector("#atsHint");
const saveStatus = document.querySelector("#saveStatus");

const experienceList = document.querySelector("#experienceList");
const educationList = document.querySelector("#educationList");
const languageList = document.querySelector("#languageList");

const experienceTemplate = document.querySelector("#experienceTemplate");
const educationTemplate = document.querySelector("#educationTemplate");
const languageTemplate = document.querySelector("#languageTemplate");

const STORAGE_KEY = "cv_builder_draft_v1";
const FONT_PRESETS = {
  manrope: {
    label: "Manrope",
    stack: '"Manrope", "Segoe UI", sans-serif'
  },
  montserrat: {
    label: "Montserrat",
    stack: '"Montserrat", "Segoe UI", sans-serif'
  },
  poppins: {
    label: "Poppins",
    stack: '"Poppins", "Segoe UI", sans-serif'
  },
  sourceSans: {
    label: "Source Sans 3",
    stack: '"Source Sans 3", "Segoe UI", sans-serif'
  },
  nunito: {
    label: "Nunito",
    stack: '"Nunito", "Segoe UI", sans-serif'
  },
  firaSans: {
    label: "Fira Sans",
    stack: '"Fira Sans", "Segoe UI", sans-serif'
  },
  merriweather: {
    label: "Merriweather",
    stack: '"Merriweather", Georgia, serif'
  },
  lora: {
    label: "Lora",
    stack: '"Lora", Georgia, serif'
  },
  robotoSlab: {
    label: "Roboto Slab",
    stack: '"Roboto Slab", Georgia, serif'
  },
  playfair: {
    label: "Playfair Display",
    stack: '"Playfair Display", Georgia, serif'
  }
};
const DEFAULT_FONT_PRESET = "manrope";
let autoSaveTimer = null;

function getFontPreset(preset) {
  return FONT_PRESETS[preset] ? preset : DEFAULT_FONT_PRESET;
}

function getFontStack(preset) {
  return FONT_PRESETS[getFontPreset(preset)].stack;
}

function getFontLabel(preset) {
  return FONT_PRESETS[getFontPreset(preset)].label;
}

function markSaveStatus(text, isSaved = false) {
  if (!saveStatus) {
    return;
  }

  saveStatus.textContent = text;
  saveStatus.classList.toggle("saved", isSaved);
}

function scheduleAutoSave() {
  markSaveStatus("Guardando...");

  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }

  autoSaveTimer = setTimeout(() => {
    saveDraft();
  }, 350);
}

function createRepeatItem(template, listEl) {
  const clone = template.content.firstElementChild.cloneNode(true);

  clone.querySelector(".remove-btn").addEventListener("click", () => {
    clone.remove();
    runAtsHint();
    scheduleAutoSave();
  });

  listEl.appendChild(clone);
  return clone;
}

function getFieldValue(name) {
  return (form.elements[name]?.value || "").trim();
}

function splitCommaList(text) {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitLines(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function collectRepeats(selector, mapper) {
  return [...document.querySelectorAll(selector)].map(mapper);
}

function getFormData() {
  const data = {
    basics: {
      fullName: getFieldValue("fullName"),
      headline: getFieldValue("headline"),
      city: getFieldValue("city"),
      email: getFieldValue("email"),
      phone: getFieldValue("phone"),
      linkedin: getFieldValue("linkedin")
    },
    summary: getFieldValue("summary"),
    skills: splitCommaList(getFieldValue("skills")),
    jobKeywords: splitCommaList(getFieldValue("jobKeywords")),
    layout: form.elements.layout.value,
    fontPreset: getFontPreset(form.elements.fontPreset?.value),
    experiences: collectRepeats(".experience-item", (item) => ({
      role: item.querySelector('[data-field="role"]').value.trim(),
      company: item.querySelector('[data-field="company"]').value.trim(),
      location: item.querySelector('[data-field="location"]').value.trim(),
      start: item.querySelector('[data-field="start"]').value.trim(),
      end: item.querySelector('[data-field="end"]').value.trim(),
      bullets: splitLines(item.querySelector('[data-field="bullets"]').value)
    })),
    education: collectRepeats(".education-item", (item) => ({
      degree: item.querySelector('[data-field="degree"]').value.trim(),
      institution: item.querySelector('[data-field="institution"]').value.trim(),
      start: item.querySelector('[data-field="start"]').value.trim(),
      end: item.querySelector('[data-field="end"]').value.trim()
    })),
    languages: collectRepeats(".language-item", (item) => ({
      name: item.querySelector('[data-field="name"]').value.trim(),
      level: item.querySelector('[data-field="level"]').value.trim()
    }))
  };

  return data;
}

function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderExperience(list) {
  if (!list.length) {
    return "<p class=\"muted\">Completa al menos una experiencia.</p>";
  }

  return list
    .map((exp) => {
      const bullets = exp.bullets.length
        ? `<ul>${exp.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`
        : "";

      return `
        <article class="exp-item">
          <div class="title-row">
            <h3>${escapeHtml(exp.role)} - ${escapeHtml(exp.company)}</h3>
            <p class="muted">${escapeHtml(exp.start)} - ${escapeHtml(exp.end)}</p>
          </div>
          <p class="muted">${escapeHtml(exp.location)}</p>
          ${bullets}
        </article>
      `;
    })
    .join("");
}

function renderEducation(list) {
  if (!list.length) {
    return "<p class=\"muted\">Agrega tu formacion academica.</p>";
  }

  return list
    .map(
      (edu) => `
        <article class="edu-item">
          <div class="title-row">
            <h3>${escapeHtml(edu.degree)}</h3>
            <p class="muted">${escapeHtml(edu.start)} - ${escapeHtml(edu.end)}</p>
          </div>
          <p class="muted">${escapeHtml(edu.institution)}</p>
        </article>
      `
    )
    .join("");
}

function renderLanguages(list) {
  if (!list.length) {
    return "<p class=\"muted\">Sin idiomas cargados.</p>";
  }

  return list
    .map((lang) => `<li>${escapeHtml(lang.name)} - ${escapeHtml(lang.level)}</li>`)
    .join("");
}

function renderAtsCv(data) {
  return `
    <header class="cv-header">
      <h1>${escapeHtml(data.basics.fullName || "Tu nombre")}</h1>
      <p class="headline">${escapeHtml(data.basics.headline || "Tu titular profesional")}</p>
      <p class="meta">
        ${escapeHtml(data.basics.city)} | ${escapeHtml(data.basics.email)} | ${escapeHtml(
    data.basics.phone
  )} | ${escapeHtml(data.basics.linkedin)}
      </p>
    </header>

    <section class="cv-body">
      <section>
        <h2>Resumen profesional</h2>
        <p>${escapeHtml(data.summary || "Describe tu experiencia y logros clave.")}</p>
      </section>

      <section>
        <h2>Experiencia</h2>
        ${renderExperience(data.experiences)}
      </section>

      <section>
        <h2>Educacion</h2>
        ${renderEducation(data.education)}
      </section>

      <section>
        <h2>Habilidades</h2>
        <p>${escapeHtml(data.skills.join(", ") || "SQL, Power BI, Excel, Python")}</p>
      </section>

      <section>
        <h2>Idiomas</h2>
        <ul>${renderLanguages(data.languages)}</ul>
      </section>
    </section>
  `;
}

function renderPersonalCv(data) {
  return `
    <header class="cv-header">
      <h1>${escapeHtml(data.basics.fullName || "Tu nombre")}</h1>
      <p class="headline">${escapeHtml(data.basics.headline || "Tu titular profesional")}</p>
      <p class="meta">
        ${escapeHtml(data.basics.city)} | ${escapeHtml(data.basics.email)} | ${escapeHtml(
    data.basics.phone
  )}
      </p>
      <p class="meta">${escapeHtml(data.basics.linkedin)}</p>
    </header>

    <section class="cv-body">
      <aside>
        <section>
          <h2>Habilidades</h2>
          <div class="pill-list">
            ${(data.skills.length ? data.skills : ["Agrega habilidades"]).map(
              (skill) => `<span class="pill">${escapeHtml(skill)}</span>`
            ).join("")}
          </div>
        </section>

        <section>
          <h2>Idiomas</h2>
          <ul>${renderLanguages(data.languages)}</ul>
        </section>

        <section>
          <h2>Educacion</h2>
          ${renderEducation(data.education)}
        </section>
      </aside>

      <section>
        <section>
          <h2>Resumen profesional</h2>
          <p>${escapeHtml(data.summary || "Describe tu experiencia y logros clave.")}</p>
        </section>

        <section>
          <h2>Experiencia</h2>
          ${renderExperience(data.experiences)}
        </section>
      </section>
    </section>
  `;
}

function renderCv(data) {
  const isAts = data.layout === "ats";
  const fontPreset = getFontPreset(data.fontPreset);
  preview.classList.toggle("cv-ats", isAts);
  preview.classList.toggle("cv-personal", !isAts);
  preview.style.setProperty("--cv-font-family", getFontStack(fontPreset));
  previewMeta.textContent = `Formato actual: ${isAts ? "ATS" : "Personal"} | Tipografia: ${getFontLabel(
    fontPreset
  )}`;

  preview.innerHTML = isAts ? renderAtsCv(data) : renderPersonalCv(data);
}

function getAllCvText(data) {
  const experienceText = data.experiences
    .flatMap((exp) => [exp.role, exp.company, exp.location, ...exp.bullets])
    .join(" ");

  const educationText = data.education
    .flatMap((edu) => [edu.degree, edu.institution, edu.start, edu.end])
    .join(" ");

  const languageText = data.languages.flatMap((lang) => [lang.name, lang.level]).join(" ");

  return [
    data.basics.fullName,
    data.basics.headline,
    data.summary,
    data.skills.join(" "),
    experienceText,
    educationText,
    languageText
  ]
    .join(" ")
    .toLowerCase();
}

function runAtsHint() {
  const data = getFormData();
  const keywords = data.jobKeywords;

  if (!keywords.length) {
    atsHint.textContent =
      "Sugerencia ATS: pega keywords del aviso para medir cobertura antes de postular.";
    return;
  }

  const cvText = getAllCvText(data);
  const matched = keywords.filter((k) => cvText.includes(k.toLowerCase()));
  const missing = keywords.filter((k) => !cvText.includes(k.toLowerCase()));
  const score = Math.round((matched.length / keywords.length) * 100);

  atsHint.textContent = `Cobertura estimada: ${score}% | Coinciden: ${matched.join(", ") || "-"} | Faltan: ${
    missing.join(", ") || "-"
  }`;
}

function saveDraft() {
  const data = getFormData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  markSaveStatus("Cambios guardados automaticamente en este navegador.", true);
}

function setRepeatValue(root, field, value) {
  const el = root.querySelector(`[data-field="${field}"]`);
  if (el) {
    el.value = value || "";
  }
}

function loadDraft() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    addDefaultItems();
    runAtsHint();
    markSaveStatus("Sin borrador previo. Los cambios se guardaran automaticamente.");
    return;
  }

  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    addDefaultItems();
    runAtsHint();
    markSaveStatus("No se pudo leer el borrador anterior. Se reinicio el formulario.");
    return;
  }

  [
    "fullName",
    "headline",
    "city",
    "email",
    "phone",
    "linkedin",
    "summary",
    "jobKeywords"
  ].forEach((field) => {
    form.elements[field].value = field === "jobKeywords" ? (data.jobKeywords || []).join(", ") : data.basics?.[field] || data[field] || "";
  });

  form.elements.skills.value = (data.skills || []).join(", ");
  form.elements.layout.value = data.layout || "ats";
  form.elements.fontPreset.value = getFontPreset(data.fontPreset);

  experienceList.innerHTML = "";
  educationList.innerHTML = "";
  languageList.innerHTML = "";

  (data.experiences?.length ? data.experiences : [{}]).forEach((exp) => {
    const card = createRepeatItem(experienceTemplate, experienceList);
    setRepeatValue(card, "role", exp.role);
    setRepeatValue(card, "company", exp.company);
    setRepeatValue(card, "location", exp.location);
    setRepeatValue(card, "start", exp.start);
    setRepeatValue(card, "end", exp.end);
    setRepeatValue(card, "bullets", (exp.bullets || []).join("\n"));
  });

  (data.education?.length ? data.education : [{}]).forEach((edu) => {
    const card = createRepeatItem(educationTemplate, educationList);
    setRepeatValue(card, "degree", edu.degree);
    setRepeatValue(card, "institution", edu.institution);
    setRepeatValue(card, "start", edu.start);
    setRepeatValue(card, "end", edu.end);
  });

  (data.languages?.length ? data.languages : [{}]).forEach((lang) => {
    const card = createRepeatItem(languageTemplate, languageList);
    setRepeatValue(card, "name", lang.name);
    setRepeatValue(card, "level", lang.level);
  });

  runAtsHint();
  markSaveStatus("Borrador recuperado. Los cambios se guardan automaticamente.", true);
}

function addDefaultItems() {
  createRepeatItem(experienceTemplate, experienceList);
  createRepeatItem(educationTemplate, educationList);
  createRepeatItem(languageTemplate, languageList);
}

function buildStandaloneHtml(data) {
  const css = [...document.querySelectorAll('link[rel="stylesheet"]')]
    .map((link) => link.href)
    .map((href) => `<link rel="stylesheet" href="${href}">`)
    .join("\n");

  const bodyClass = data.layout === "ats" ? "cv-template cv-ats" : "cv-template cv-personal";
  const fontStack = getFontStack(data.fontPreset);

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CV ${escapeHtml(data.basics.fullName || "export")}</title>
  ${css}
  <style>body{margin:16px;background:#fff}.cv-template{max-width:900px;margin:0 auto;--cv-font-family:${fontStack}}</style>
</head>
<body>
  <article class="${bodyClass}">
    ${data.layout === "ats" ? renderAtsCv(data) : renderPersonalCv(data)}
  </article>
</body>
</html>`;
}

function downloadHtml() {
  const data = getFormData();
  const html = buildStandaloneHtml(data);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(data.basics.fullName || "cv").replace(/\s+/g, "_")}_${data.layout}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function printPdf() {
  window.print();
}

document.querySelector("#addExperience").addEventListener("click", () => {
  createRepeatItem(experienceTemplate, experienceList);
  scheduleAutoSave();
});

document.querySelector("#addEducation").addEventListener("click", () => {
  createRepeatItem(educationTemplate, educationList);
  scheduleAutoSave();
});

document.querySelector("#addLanguage").addEventListener("click", () => {
  createRepeatItem(languageTemplate, languageList);
  scheduleAutoSave();
});

document.querySelector("#saveDraft").addEventListener("click", () => {
  saveDraft();
  runAtsHint();
  alert("Borrador guardado en este navegador.");
});

document.querySelector("#downloadHtml").addEventListener("click", downloadHtml);
document.querySelector("#printPdf").addEventListener("click", printPdf);

form.addEventListener("input", () => {
  runAtsHint();
  scheduleAutoSave();
});

form.addEventListener("change", scheduleAutoSave);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = getFormData();
  renderCv(data);
  saveDraft();
});

loadDraft();
renderCv(getFormData());

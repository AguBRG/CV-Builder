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

function createDefaultOptionalFields() {
  return {
    fullName: true,
    headline: true,
    city: true,
    email: true,
    phone: true,
    linkedin: true,
    summary: true,
    skills: true,
    notes: true,
    jobKeywords: true
  };
}

function createDefaultExperienceOptionalFields() {
  return {
    role: true,
    company: true,
    location: true,
    start: true,
    end: true,
    referenceContact: true,
    bullets: true
  };
}

function createDefaultEducationOptionalFields() {
  return {
    degree: true,
    institution: true,
    start: true,
    end: true,
    inProgress: true
  };
}

function createDefaultLanguageOptionalFields() {
  return {
    name: true,
    level: true
  };
}

function isFieldEnabled(optionalFields, field) {
  return optionalFields?.[field] !== false;
}

function getEnabledValue(record, field) {
  return isFieldEnabled(record.optionalFields, field) ? record[field] || "" : "";
}

function getOptionalValue(optionalFields, field, value) {
  return isFieldEnabled(optionalFields, field) ? value || "" : "";
}

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

function getOptionalToggleId(control) {
  if (control.name) {
    return `name:${control.name}`;
  }

  return `data:${control.dataset.field}`;
}

function setControlEnabledState(control, enabled) {
  control.dataset.enabled = enabled ? "true" : "false";
  control.disabled = !enabled;
  control.closest("label")?.classList.toggle("field-is-off", !enabled);
}

function enhanceOptionalLabel(label) {
  if (!label || label.dataset.optionalEnhanced === "true") {
    return;
  }

  const control = label.querySelector("input, textarea, select");

  if (!control || control.type === "radio" || control.type === "checkbox") {
    return;
  }

  const nodesBeforeControl = [];
  let currentNode = label.firstChild;

  while (currentNode && currentNode !== control) {
    const nextNode = currentNode.nextSibling;
    nodesBeforeControl.push(currentNode);
    currentNode = nextNode;
  }

  const header = document.createElement("span");
  header.className = "field-label-head";

  const text = document.createElement("span");
  text.className = "field-label-text";
  nodesBeforeControl.forEach((node) => text.appendChild(node));

  const toggle = document.createElement("span");
  toggle.className = "field-include-toggle";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = true;
  checkbox.dataset.optionalToggleFor = getOptionalToggleId(control);

  const toggleText = document.createElement("span");
  toggleText.textContent = "Incluir";

  toggle.append(checkbox, toggleText);
  header.append(text, toggle);
  label.insertBefore(header, control);
  label.dataset.optionalEnhanced = "true";

  checkbox.addEventListener("change", () => {
    setControlEnabledState(control, checkbox.checked);
    runAtsHint();
    scheduleAutoSave();
  });

  setControlEnabledState(control, true);
}

function enhanceOptionalFields(root = document) {
  root.querySelectorAll("label").forEach((label) => {
    enhanceOptionalLabel(label);
  });
}

function setControlOptionalState(control, enabled) {
  const toggleId = getOptionalToggleId(control);
  const checkbox = control
    .closest("label")
    ?.querySelector(`[data-optional-toggle-for="${toggleId}"]`);

  if (checkbox) {
    checkbox.checked = enabled;
  }

  setControlEnabledState(control, enabled);
}

function getControlValue(control, includeDisabled = false) {
  if (!control) {
    return "";
  }

  if (!includeDisabled && control.dataset.enabled === "false") {
    return "";
  }

  return control.value.trim();
}

function getNamedFieldOptionalStates() {
  const defaults = createDefaultOptionalFields();

  Object.keys(defaults).forEach((field) => {
    const control = form.elements[field];
    if (control) {
      defaults[field] = control.dataset.enabled !== "false";
    }
  });

  return defaults;
}

function collectRepeatOptionalStates(item, defaults) {
  return Object.fromEntries(
    Object.keys(defaults).map((field) => {
      const control = item.querySelector(`[data-field="${field}"]`);
      return [field, control ? control.dataset.enabled !== "false" : true];
    })
  );
}

function updateEducationInProgressState(card) {
  const inProgressCheckbox = card.querySelector('[data-field="inProgress"]');
  const endInput = card.querySelector('[data-field="end"]');

  if (!inProgressCheckbox || !endInput) {
    return;
  }

  if (inProgressCheckbox.checked) {
    if (endInput.value.trim() && endInput.value.trim().toLowerCase() !== "en curso") {
      endInput.dataset.previousEndValue = endInput.value;
    }

    endInput.value = "En curso";
    endInput.readOnly = true;
  } else {
    if (endInput.value.trim().toLowerCase() === "en curso") {
      endInput.value = endInput.dataset.previousEndValue || "";
    }

    endInput.readOnly = false;
    delete endInput.dataset.previousEndValue;
  }
}

function bindEducationInProgressToggle(card) {
  if (!card.classList.contains("education-item")) {
    return;
  }

  const inProgressCheckbox = card.querySelector('[data-field="inProgress"]');
  if (!inProgressCheckbox) {
    return;
  }

  inProgressCheckbox.addEventListener("change", () => {
    updateEducationInProgressState(card);
    runAtsHint();
    scheduleAutoSave();
  });

  updateEducationInProgressState(card);
}

function createRepeatItem(template, listEl) {
  const clone = template.content.firstElementChild.cloneNode(true);
  enhanceOptionalFields(clone);
  bindEducationInProgressToggle(clone);

  clone.querySelector(".remove-btn").addEventListener("click", () => {
    clone.remove();
    runAtsHint();
    scheduleAutoSave();
  });

  listEl.appendChild(clone);
  return clone;
}

function getFieldValue(name) {
  return getControlValue(form.elements[name]);
}

function getRawFieldValue(name) {
  return getControlValue(form.elements[name], true);
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
      fullName: getRawFieldValue("fullName"),
      headline: getRawFieldValue("headline"),
      city: getRawFieldValue("city"),
      email: getRawFieldValue("email"),
      phone: getRawFieldValue("phone"),
      linkedin: getRawFieldValue("linkedin")
    },
    summary: getRawFieldValue("summary"),
    skills: splitCommaList(getRawFieldValue("skills")),
    notes: getRawFieldValue("notes"),
    jobKeywords: splitCommaList(getRawFieldValue("jobKeywords")),
    layout: form.elements.layout.value,
    fontPreset: getFontPreset(form.elements.fontPreset?.value),
    optionalFields: getNamedFieldOptionalStates(),
    experiences: collectRepeats(".experience-item", (item) => ({
      role: getControlValue(item.querySelector('[data-field="role"]'), true),
      company: getControlValue(item.querySelector('[data-field="company"]'), true),
      location: getControlValue(item.querySelector('[data-field="location"]'), true),
      start: getControlValue(item.querySelector('[data-field="start"]'), true),
      end: getControlValue(item.querySelector('[data-field="end"]'), true),
      referenceContact: getControlValue(item.querySelector('[data-field="referenceContact"]'), true),
      bullets: splitLines(getControlValue(item.querySelector('[data-field="bullets"]'), true)),
      optionalFields: collectRepeatOptionalStates(item, createDefaultExperienceOptionalFields())
    })),
    education: collectRepeats(".education-item", (item) => ({
      degree: getControlValue(item.querySelector('[data-field="degree"]'), true),
      institution: getControlValue(item.querySelector('[data-field="institution"]'), true),
      start: getControlValue(item.querySelector('[data-field="start"]'), true),
      end: getControlValue(item.querySelector('[data-field="end"]'), true),
      inProgress: item.querySelector('[data-field="inProgress"]')?.checked || false,
      optionalFields: collectRepeatOptionalStates(item, createDefaultEducationOptionalFields())
    })),
    languages: collectRepeats(".language-item", (item) => ({
      name: getControlValue(item.querySelector('[data-field="name"]'), true),
      level: getControlValue(item.querySelector('[data-field="level"]'), true),
      optionalFields: collectRepeatOptionalStates(item, createDefaultLanguageOptionalFields())
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
  const visibleItems = list
    .map((exp) => ({
      role: getEnabledValue(exp, "role"),
      company: getEnabledValue(exp, "company"),
      location: getEnabledValue(exp, "location"),
      start: getEnabledValue(exp, "start"),
      end: getEnabledValue(exp, "end"),
      referenceContact: getEnabledValue(exp, "referenceContact"),
      bullets: isFieldEnabled(exp.optionalFields, "bullets") ? exp.bullets : []
    }))
    .filter(
      (exp) =>
        exp.role ||
        exp.company ||
        exp.location ||
        exp.start ||
        exp.end ||
        exp.referenceContact ||
        exp.bullets.length
    );

  if (!visibleItems.length) {
    return "<p class=\"muted\">Completa al menos una experiencia.</p>";
  }

  return visibleItems
    .map((exp) => {
      const bullets = exp.bullets.length
        ? `<ul>${exp.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`
        : "";
      const title = [exp.role, exp.company].filter(Boolean).join(" - ");
      const period = [exp.start, exp.end].filter(Boolean).join(" - ");
      const location = exp.location ? `<p class="muted">${escapeHtml(exp.location)}</p>` : "";
      const reference = exp.referenceContact
        ? `<p class="muted exp-reference"><strong>Referencia:</strong> ${escapeHtml(exp.referenceContact)}</p>`
        : "";

      return `
        <article class="exp-item">
          <div class="title-row">
            <h3>${escapeHtml(title || "Experiencia")}</h3>
            <p class="muted">${escapeHtml(period)}</p>
          </div>
          ${location}
          ${reference}
          ${bullets}
        </article>
      `;
    })
    .join("");
}

function renderEducation(list) {
  const visibleItems = list
    .map((edu) => ({
      degree: getEnabledValue(edu, "degree"),
      institution: getEnabledValue(edu, "institution"),
      start: getEnabledValue(edu, "start"),
      end: edu.inProgress ? "En curso" : getEnabledValue(edu, "end"),
      inProgress: edu.inProgress
    }))
    .filter((edu) => edu.degree || edu.institution || edu.start || edu.end || edu.inProgress);

  if (!visibleItems.length) {
    return "<p class=\"muted\">Agrega tu formación académica.</p>";
  }

  return visibleItems
    .map(
      (edu) => {
        const period = [edu.start, edu.end].filter(Boolean).join(" - ");
        const institution = edu.institution
          ? `<p class="muted">${escapeHtml(edu.institution)}</p>`
          : "";

        return `
        <article class="edu-item">
          <div class="title-row">
            <h3>${escapeHtml(edu.degree || "Formación")}</h3>
            <p class="muted">${escapeHtml(period)}</p>
          </div>
          ${institution}
        </article>
      `;
      }
    )
    .join("");
}

function renderLanguages(list) {
  const visibleItems = list
    .map((lang) => ({
      name: getEnabledValue(lang, "name"),
      level: getEnabledValue(lang, "level")
    }))
    .filter((lang) => lang.name || lang.level);

  if (!visibleItems.length) {
    return "<p class=\"muted\">Sin idiomas cargados.</p>";
  }

  return visibleItems
    .map((lang) => `<li>${escapeHtml([lang.name, lang.level].filter(Boolean).join(" - "))}</li>`)
    .join("");
}

function normalizeLinkedinUrl(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function renderContactValue(type, value) {
  const safeValue = escapeHtml(value);

  if (type === "email") {
    return `<a href="mailto:${safeValue}">${safeValue}</a>`;
  }

  if (type === "phone") {
    const phoneHref = value.replace(/[^\d+]/g, "");
    return phoneHref ? `<a href="tel:${escapeHtml(phoneHref)}">${safeValue}</a>` : safeValue;
  }

  if (type === "linkedin") {
    const linkedinUrl = normalizeLinkedinUrl(value);
    return `<a href="${escapeHtml(linkedinUrl)}" target="_blank" rel="noreferrer noopener">${safeValue}</a>`;
  }

  return safeValue;
}

function renderContactLines(basics, includeLinkedin = true) {
  const contactLines = [
    { type: "text", value: getEnabledValue(basics, "city") },
    { type: "email", value: getEnabledValue(basics, "email") },
    { type: "phone", value: getEnabledValue(basics, "phone") }
  ];

  if (includeLinkedin) {
    contactLines.push({ type: "linkedin", value: getEnabledValue(basics, "linkedin") });
  }

  return contactLines
    .filter((item) => item.value)
    .map((item) => `<p class="meta">${renderContactValue(item.type, item.value)}</p>`)
    .join("");
}

function renderAtsCv(data) {
  const fullName = getOptionalValue(data.optionalFields, "fullName", data.basics.fullName) || "Tu nombre";
  const headline = getOptionalValue(data.optionalFields, "headline", data.basics.headline);
  const summary = getOptionalValue(data.optionalFields, "summary", data.summary);
  const skills = getOptionalValue(data.optionalFields, "skills", data.skills.join(", "));
  const notes = getOptionalValue(data.optionalFields, "notes", data.notes);
  const summarySection = isFieldEnabled(data.optionalFields, "summary")
    ? `<section>
        <h2>Resumen profesional</h2>
        <p>${escapeHtml(summary || "Describe tu experiencia y logros clave.")}</p>
      </section>`
    : "";
  const skillsSection = isFieldEnabled(data.optionalFields, "skills")
    ? `<section>
        <h2>Habilidades</h2>
        <p>${escapeHtml(skills || "SQL, Power BI, Excel, Python")}</p>
      </section>`
    : "";
  const notesSection = isFieldEnabled(data.optionalFields, "notes") && notes
    ? `<section>
        <h2>Observaciones adicionales</h2>
        <p>${escapeHtml(notes)}</p>
      </section>`
    : "";
  const headlineMarkup = headline
    ? `<p class="headline">${escapeHtml(headline)}</p>`
    : "";

  return `
    <header class="cv-header">
      <h1>${escapeHtml(fullName)}</h1>
      ${headlineMarkup}
      ${renderContactLines({ ...data.basics, optionalFields: data.optionalFields })}
    </header>

    <section class="cv-body">
      ${summarySection}

      <section>
        <h2>Experiencia</h2>
        ${renderExperience(data.experiences)}
      </section>

      <section>
        <h2>Educación</h2>
        ${renderEducation(data.education)}
      </section>

      ${skillsSection}

      ${notesSection}

      <section>
        <h2>Idiomas</h2>
        <ul>${renderLanguages(data.languages)}</ul>
      </section>
    </section>
  `;
}

function renderPersonalCv(data) {
  const fullName = getOptionalValue(data.optionalFields, "fullName", data.basics.fullName) || "Tu nombre";
  const headline = getOptionalValue(data.optionalFields, "headline", data.basics.headline);
  const summary = getOptionalValue(data.optionalFields, "summary", data.summary);
  const notes = getOptionalValue(data.optionalFields, "notes", data.notes);
  const visibleSkills = isFieldEnabled(data.optionalFields, "skills")
    ? data.skills.length
      ? data.skills
      : ["Agrega habilidades"]
    : [];
  const headlineMarkup = headline
    ? `<p class="headline">${escapeHtml(headline)}</p>`
    : "";
  const skillsSection = isFieldEnabled(data.optionalFields, "skills")
    ? `<section>
          <h2>Habilidades</h2>
          <div class="pill-list">
            ${visibleSkills.map(
              (skill) => `<span class="pill">${escapeHtml(skill)}</span>`
            ).join("")}
          </div>
        </section>`
    : "";
  const summarySection = isFieldEnabled(data.optionalFields, "summary")
    ? `<section>
          <h2>Resumen profesional</h2>
          <p>${escapeHtml(summary || "Describe tu experiencia y logros clave.")}</p>
        </section>`
    : "";
  const notesSection = isFieldEnabled(data.optionalFields, "notes") && notes
    ? `<section>
          <h2>Observaciones adicionales</h2>
          <p>${escapeHtml(notes)}</p>
        </section>`
    : "";

  return `
    <header class="cv-header">
      <h1>${escapeHtml(fullName)}</h1>
      ${headlineMarkup}
      ${renderContactLines({ ...data.basics, optionalFields: data.optionalFields })}
    </header>

    <section class="cv-body">
      <aside>
        ${skillsSection}

        <section>
          <h2>Idiomas</h2>
          <ul>${renderLanguages(data.languages)}</ul>
        </section>

        <section>
          <h2>Educación</h2>
          ${renderEducation(data.education)}
        </section>
      </aside>

      <section>
        ${summarySection}

        <section>
          <h2>Experiencia</h2>
          ${renderExperience(data.experiences)}
        </section>

        ${notesSection}
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
  previewMeta.textContent = `Formato actual: ${isAts ? "ATS" : "Personal"} | Tipografía: ${getFontLabel(
    fontPreset
  )}`;

  preview.innerHTML = isAts ? renderAtsCv(data) : renderPersonalCv(data);
}

function getAllCvText(data) {
  const experienceText = data.experiences
    .flatMap((exp) => [
      getEnabledValue(exp, "role"),
      getEnabledValue(exp, "company"),
      getEnabledValue(exp, "location"),
      getEnabledValue(exp, "start"),
      getEnabledValue(exp, "end"),
      getEnabledValue(exp, "referenceContact"),
      ...(isFieldEnabled(exp.optionalFields, "bullets") ? exp.bullets : [])
    ])
    .join(" ");

  const educationText = data.education
    .flatMap((edu) => [
      getEnabledValue(edu, "degree"),
      getEnabledValue(edu, "institution"),
      getEnabledValue(edu, "start"),
      edu.inProgress ? "en curso" : getEnabledValue(edu, "end")
    ])
    .join(" ");

  const languageText = data.languages
    .flatMap((lang) => [getEnabledValue(lang, "name"), getEnabledValue(lang, "level")])
    .join(" ");

  return [
    getOptionalValue(data.optionalFields, "fullName", data.basics.fullName),
    getOptionalValue(data.optionalFields, "headline", data.basics.headline),
    getOptionalValue(data.optionalFields, "city", data.basics.city),
    getOptionalValue(data.optionalFields, "email", data.basics.email),
    getOptionalValue(data.optionalFields, "phone", data.basics.phone),
    getOptionalValue(data.optionalFields, "linkedin", data.basics.linkedin),
    getOptionalValue(data.optionalFields, "summary", data.summary),
    getOptionalValue(data.optionalFields, "skills", data.skills.join(" ")),
    getOptionalValue(data.optionalFields, "notes", data.notes),
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
  markSaveStatus("Cambios guardados automáticamente en este navegador.", true);
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
    markSaveStatus("Sin borrador previo. Los cambios se guardarán automáticamente.");
    return;
  }

  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    addDefaultItems();
    runAtsHint();
    markSaveStatus("No se pudo leer el borrador anterior. Se reinició el formulario.");
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
    "notes",
    "jobKeywords"
  ].forEach((field) => {
    form.elements[field].value = field === "jobKeywords" ? (data.jobKeywords || []).join(", ") : data.basics?.[field] || data[field] || "";
  });

  form.elements.skills.value = (data.skills || []).join(", ");
  form.elements.layout.value = data.layout || "ats";
  form.elements.fontPreset.value = getFontPreset(data.fontPreset);

  const namedOptionalFields = { ...createDefaultOptionalFields(), ...(data.optionalFields || {}) };
  Object.entries(namedOptionalFields).forEach(([field, enabled]) => {
    const control = form.elements[field];
    if (control) {
      setControlOptionalState(control, enabled);
    }
  });

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
    setRepeatValue(card, "referenceContact", exp.referenceContact);
    setRepeatValue(card, "bullets", (exp.bullets || []).join("\n"));

    const optionalFields = { ...createDefaultExperienceOptionalFields(), ...(exp.optionalFields || {}) };
    Object.entries(optionalFields).forEach(([field, enabled]) => {
      const control = card.querySelector(`[data-field="${field}"]`);
      if (control) {
        setControlOptionalState(control, enabled);
      }
    });
  });

  (data.education?.length ? data.education : [{}]).forEach((edu) => {
    const card = createRepeatItem(educationTemplate, educationList);
    setRepeatValue(card, "degree", edu.degree);
    setRepeatValue(card, "institution", edu.institution);
    setRepeatValue(card, "start", edu.start);
    setRepeatValue(card, "end", edu.end);
    const inProgressCheckbox = card.querySelector('[data-field="inProgress"]');
    if (inProgressCheckbox) {
      inProgressCheckbox.checked = Boolean(edu.inProgress);
      updateEducationInProgressState(card);
    }

    const optionalFields = { ...createDefaultEducationOptionalFields(), ...(edu.optionalFields || {}) };
    Object.entries(optionalFields).forEach(([field, enabled]) => {
      const control = card.querySelector(`[data-field="${field}"]`);
      if (control) {
        setControlOptionalState(control, enabled);
      }
    });
  });

  (data.languages?.length ? data.languages : [{}]).forEach((lang) => {
    const card = createRepeatItem(languageTemplate, languageList);
    setRepeatValue(card, "name", lang.name);
    setRepeatValue(card, "level", lang.level);

    const optionalFields = { ...createDefaultLanguageOptionalFields(), ...(lang.optionalFields || {}) };
    Object.entries(optionalFields).forEach(([field, enabled]) => {
      const control = card.querySelector(`[data-field="${field}"]`);
      if (control) {
        setControlOptionalState(control, enabled);
      }
    });
  });

  runAtsHint();
  markSaveStatus("Borrador recuperado. Los cambios se guardan automáticamente.", true);
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

document.querySelectorAll('[data-action="save-draft"]').forEach((button) => {
  button.addEventListener("click", () => {
    saveDraft();
    runAtsHint();
    alert("Borrador guardado en este navegador.");
  });
});

document.querySelectorAll('[data-action="download-html"]').forEach((button) => {
  button.addEventListener("click", downloadHtml);
});

document.querySelectorAll('[data-action="print-pdf"]').forEach((button) => {
  button.addEventListener("click", printPdf);
});

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

enhanceOptionalFields(form);
loadDraft();
renderCv(getFormData());


// ======================================
// FN13 - EDITOR UNIVERSAL
// ======================================

const SUPABASE_URL = "https://raoysuocwwtozjpssjrt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_dItOD0QWY26RTctAwRD9Lw_AJDilFJo";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ======================================
// CONFIGURACIÓN DE SECCIONES
// ======================================

const sections = {
  profile: {
    name: "Perfil del piloto",
    description: "Información personal y presentación de Franco.",
    fields: [
      { key: "name", label: "Nombre del piloto", type: "text" },
      { key: "number", label: "Número de piloto", type: "text" },
      { key: "country", label: "País", type: "text" },
      { key: "biography", label: "Biografía", type: "textarea" },
      { key: "photo", label: "URL de fotografía", type: "url" }
    ]
  },

  career: {
    name: "Trayectoria",
    description: "Campeonatos, temporadas, categorías y resultados.",
    fields: [
      { key: "championship", label: "Campeonato", type: "text" },
      { key: "category", label: "Categoría", type: "text" },
      { key: "season", label: "Temporada / Año", type: "text" },
      { key: "position", label: "Posición / Resultado", type: "text" },
      { key: "description", label: "Descripción", type: "textarea" }
    ]
  },

  calendar: {
    name: "Calendario",
    description: "Próximas carreras, circuitos y eventos.",
    fields: [
      { key: "event", label: "Nombre del evento", type: "text" },
      { key: "date", label: "Fecha", type: "date" },
      { key: "circuit", label: "Circuito", type: "text" },
      { key: "location", label: "Ubicación", type: "text" },
      { key: "description", label: "Descripción", type: "textarea" }
    ]
  },

  sponsors: {
    name: "Patrocinadores",
    description: "Empresas y marcas que apoyan FN13.",
    fields: [
      { key: "company", label: "Nombre de la empresa", type: "text" },
      { key: "logo", label: "URL del logotipo", type: "url" },
      { key: "website", label: "Página web", type: "url" },
      { key: "description", label: "Descripción", type: "textarea" }
    ]
  },

  gallery: {
    name: "Galería",
    description: "Fotografías de carreras, entrenamientos y eventos.",
    fields: [
      { key: "image", label: "URL de la fotografía", type: "url" },
      { key: "category", label: "Categoría de fotografía", type: "text" },
      { key: "alt", label: "Descripción de la imagen", type: "text" }
    ]
  },

  news: {
    name: "Noticias",
    description: "Publicaciones y novedades del piloto.",
    fields: [
      { key: "headline", label: "Titular", type: "text" },
      { key: "date", label: "Fecha", type: "date" },
      { key: "image", label: "URL de imagen", type: "url" },
      { key: "body", label: "Contenido de la noticia", type: "textarea" }
    ]
  },

  statistics: {
    name: "Estadísticas",
    description: "Datos deportivos y estadísticas del piloto.",
    fields: [
      { key: "statistic", label: "Nombre de la estadística", type: "text" },
      { key: "value", label: "Valor", type: "text" },
      { key: "season", label: "Temporada", type: "text" },
      { key: "description", label: "Descripción", type: "textarea" }
    ]
  },

  custom: {
    name: "Sección personalizada",
    description: "Crea contenido para una sección propia.",
    fields: [
      { key: "subtitle", label: "Subtítulo", type: "text" },
      { key: "body", label: "Contenido", type: "textarea" },
      { key: "image", label: "URL de imagen", type: "url" },
      { key: "link", label: "Enlace", type: "url" }
    ]
  }
};

// ======================================
// ELEMENTOS
// ======================================

const sectionSelect = document.getElementById("section-select");
const form = document.getElementById("content-form");
const titleInput = document.getElementById("title");
const recordIdInput = document.getElementById("record-id");
const dynamicFields = document.getElementById("dynamic-fields");
const publishedInput = document.getElementById("is-published");
const recordsList = document.getElementById("records-list");
const message = document.getElementById("message");
const saveButton = document.getElementById("save-btn");
const cancelButton = document.getElementById("cancel-btn");

let currentRecords = [];

// ======================================
// SEGURIDAD Y SESIÓN
// ======================================

async function checkAccess() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error || !data.session) {
    window.location.href = "../index.html";
    return false;
  }

  const user = data.session.user;

  // IMPORTANTE:
  // Usamos "id", igual que en admin.js.
  const { data: profile, error: profileError } =
    await supabaseClient
      .from("admin_profiles")
      .select("id, display_name, role")
      .eq("id", user.id)
      .maybeSingle();

  if (profileError) {
    console.error("Error verificando perfil:", profileError);
    alert("No se pudo verificar tu perfil: " + profileError.message);
    return false;
  }

  if (!profile || !["owner", "admin", "editor"].includes(profile.role)) {
    alert("No tienes permisos para utilizar este editor.");
    await supabaseClient.auth.signOut();
    window.location.href = "../index.html";
    return false;
  }

  document.getElementById("user-label").textContent =
    profile.display_name || user.email || "Administrador";

  return true;
}

// ======================================
// MENSAJES
// ======================================

function showMessage(text, type = "") {
  message.textContent = text;
  message.className = "message " + type;
}

// ======================================
// GENERAR CAMPOS DINÁMICOS
// ======================================

function renderFields(values = {}) {
  dynamicFields.replaceChildren();

  const section = sections[sectionSelect.value];

  section.fields.forEach((field) => {
    const label = document.createElement("label");
    label.className = "dynamic-field";
    label.textContent = field.label;

    let input;

    if (field.type === "textarea") {
      input = document.createElement("textarea");
      input.rows = 4;
    } else {
      input = document.createElement("input");
      input.type = field.type;
    }

    input.id = "field-" + field.key;
    input.name = field.key;
    input.value = values[field.key] || "";

    input.addEventListener("input", updatePreview);

    label.appendChild(input);
    dynamicFields.appendChild(label);
  });

  document.getElementById("section-description").textContent =
    section.description;

  document.getElementById("preview-category").textContent =
    section.name.toUpperCase();

  document.getElementById("records-title").textContent =
    "Registros de " + section.name;

  updatePreview();
}

// ======================================
// LEER CAMPOS
// ======================================

function getFieldValues() {
  const values = {};
  const section = sections[sectionSelect.value];

  section.fields.forEach((field) => {
    const input = document.getElementById("field-" + field.key);
    values[field.key] = input ? input.value.trim() : "";
  });

  return values;
}

// ======================================
// VISTA PREVIA
// ======================================

function updatePreview() {
  const previewTitle = document.getElementById("preview-title");
  const previewFields = document.getElementById("preview-fields");
  const previewStatus = document.getElementById("preview-status");

  previewTitle.textContent =
    titleInput.value.trim() || "Título del contenido";

  previewFields.replaceChildren();

  const values = getFieldValues();

  Object.entries(values).forEach(([key, value]) => {
    if (!value) return;

    if (
      ["photo", "logo", "image"].includes(key) &&
      isValidImageUrl(value)
    ) {
      const image = document.createElement("img");
      image.src = value;
      image.alt = "Vista previa";
      image.referrerPolicy = "no-referrer";

      image.addEventListener("error", () => {
        image.remove();
      });

      previewFields.appendChild(image);
      return;
    }

    const paragraph = document.createElement("p");
    paragraph.textContent = value;
    previewFields.appendChild(paragraph);
  });

  previewStatus.textContent =
    publishedInput.checked ? "PUBLICADO AL GUARDAR" : "BORRADOR";

  previewStatus.className =
    publishedInput.checked
      ? "preview-status published"
      : "preview-status";
}

function isValidImageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

// ======================================
// CARGAR REGISTROS
// ======================================

async function loadRecords() {
  recordsList.textContent = "Cargando contenido...";

  const { data, error } = await supabaseClient
    .from("fn13_content")
    .select("*")
    .eq("section_key", sectionSelect.value)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    recordsList.textContent =
      "Error al cargar: " + error.message;
    return;
  }

  currentRecords = data || [];

  document.getElementById("record-count").textContent =
    currentRecords.length +
    (currentRecords.length === 1 ? " registro" : " registros");

  recordsList.replaceChildren();

  if (currentRecords.length === 0) {
    recordsList.textContent =
      "Todavía no hay contenido en esta sección.";
    return;
  }

  currentRecords.forEach((record) => {
    recordsList.appendChild(createRecordCard(record));
  });
}

// ======================================
// TARJETAS
// ======================================

function createRecordCard(record) {
  const card = document.createElement("article");
  card.className = "record";

  const top = document.createElement("div");
  top.className = "record-top";

  const information = document.createElement("div");

  const heading = document.createElement("h3");
  heading.textContent = record.title;

  const details = document.createElement("p");
  details.textContent = Object.values(record.content || {})
    .filter(value => typeof value === "string" && value.trim())
    .slice(0, 3)
    .join(" · ") || "Sin detalles adicionales";

  information.append(heading, details);

  const state = document.createElement("span");
  state.className =
    "record-state" + (record.is_published ? "" : " draft");

  state.textContent =
    record.is_published ? "PUBLICADO" : "BORRADOR";

  top.append(information, state);

  const actions = document.createElement("div");
  actions.className = "record-actions";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "small-btn";
  editButton.textContent = "Editar";
  editButton.addEventListener("click", () => editRecord(record));

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "small-btn";
  deleteButton.textContent = "Eliminar";
  deleteButton.addEventListener("click", () => deleteRecord(record.id));

  actions.append(editButton, deleteButton);
  card.append(top, actions);

  return card;
}

// ======================================
// GUARDAR CONTENIDO
// ======================================

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();

  if (!title) {
    showMessage("El título es obligatorio.", "error");
    return;
  }

  const record = {
    section_key: sectionSelect.value,
    title,
    content: getFieldValues(),
    is_published: publishedInput.checked,
    updated_at: new Date().toISOString()
  };

  saveButton.disabled = true;
  saveButton.textContent = "Guardando...";

  let result;

  try {
    if (recordIdInput.value) {
      result = await supabaseClient
        .from("fn13_content")
        .update(record)
        .eq("id", Number(recordIdInput.value));
    } else {
      result = await supabaseClient
        .from("fn13_content")
        .insert(record);
    }
  } catch (error) {
    result = { error };
  }

  saveButton.disabled = false;
  saveButton.textContent = "Guardar contenido";

  if (result.error) {
    showMessage("Error: " + result.error.message, "error");
    return;
  }

  showMessage("Contenido guardado correctamente.", "success");

  resetForm();
  await loadRecords();
});

// ======================================
// EDITAR CONTENIDO
// ======================================

function editRecord(record) {
  recordIdInput.value = record.id;
  titleInput.value = record.title;
  publishedInput.checked = record.is_published;

  renderFields(record.content || {});

  document.getElementById("form-title").textContent =
    "Editar contenido";

  document.getElementById("form-mode").textContent =
    "Editando registro";

  saveButton.textContent = "Actualizar contenido";
  cancelButton.classList.remove("hidden");

  updatePreview();
  showMessage("Editando: " + record.title);

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ======================================
// ELIMINAR
// ======================================

async function deleteRecord(id) {
  const confirmed = confirm(
    "¿Seguro que deseas eliminar este contenido? No se puede deshacer."
  );

  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("fn13_content")
    .delete()
    .eq("id", id);

  if (error) {
    showMessage("Error al eliminar: " + error.message, "error");
    return;
  }

  showMessage("Contenido eliminado.", "success");
  await loadRecords();
}

// ======================================
// LIMPIAR FORMULARIO
// ======================================

function resetForm() {
  form.reset();
  recordIdInput.value = "";

  document.getElementById("form-title").textContent =
    "Nuevo contenido";

  document.getElementById("form-mode").textContent =
    "Nuevo registro";

  saveButton.textContent = "Guardar contenido";
  cancelButton.classList.add("hidden");

  renderFields();
  updatePreview();
}

cancelButton.addEventListener("click", () => {
  resetForm();
  showMessage("");
});

// ======================================
// CAMBIAR SECCIÓN
// ======================================

sectionSelect.addEventListener("change", async () => {
  resetForm();
  showMessage("");
  await loadRecords();
});

// ======================================
// VISTA PREVIA EN VIVO
// ======================================

titleInput.addEventListener("input", updatePreview);
publishedInput.addEventListener("change", updatePreview);

// ======================================
// CERRAR SESIÓN
// ======================================

document.getElementById("logout-btn").addEventListener(
  "click",
  async () => {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      alert("No se pudo cerrar sesión: " + error.message);
      return;
    }

    window.location.href = "../index.html";
  }
);

// ======================================
// INICIAR
// ======================================

async function init() {
  const allowed = await checkAccess();

  if (!allowed) return;

  renderFields();
  await loadRecords();
}

init();

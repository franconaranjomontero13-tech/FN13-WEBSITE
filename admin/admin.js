
// ======================================
// FN13 ADMIN - CONFIGURACIÓN
// ======================================

// Reemplaza estos dos valores con los datos
// de tu proyecto Supabase.

const SUPABASE_URL = "https://raoysuocwwtozjpssjrt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_dItOD0QWY26RTctAwRD9Lw_AJDilFJo";

// ======================================
// CONEXIÓN
// ======================================

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const loginScreen = document.getElementById("login-screen");
const adminScreen = document.getElementById("admin-screen");
const loginForm = document.getElementById("login-form");
const loginButton = document.getElementById("login-button");
const loginMessage = document.getElementById("login-message");

let currentProfile = null;

// ======================================
// INICIAR SESIÓN
// ======================================

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  loginButton.disabled = true;
  loginButton.textContent = "VERIFICANDO...";
  loginMessage.textContent = "";

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    await verifyAdmin(data.user);

  } catch (error) {
    loginMessage.textContent = error.message;
    await supabaseClient.auth.signOut();
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "INICIAR SESIÓN";
  }
});

// ======================================
// VERIFICAR ADMINISTRADOR
// ======================================

async function verifyAdmin(user) {
  if (!user) {
    showLogin();
    return;
  }

  const { data, error } = await supabaseClient
    .from("admin_profiles")
    .select("id, display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data || !["owner", "admin", "editor"].includes(data.role)) {
    await supabaseClient.auth.signOut();
    throw new Error("Esta cuenta no tiene autorización para FN13 Admin.");
  }

  currentProfile = data;

  showDashboard(user);
}

// ======================================
// MOSTRAR DASHBOARD
// ======================================

function showDashboard(user) {
  loginScreen.classList.add("hidden");
  adminScreen.classList.remove("hidden");

  document.getElementById("user-name").textContent =
    currentProfile.display_name;

  document.getElementById("user-role").textContent =
    currentProfile.role;

  document.getElementById("account-status").textContent =
    "Autenticado";

  document.getElementById("account-role").textContent =
    currentProfile.role;

  loadStatistics();
  configureNavigation();
}

// ======================================
// ESTADÍSTICAS
// ======================================

async function loadStatistics() {
  const sections = await supabaseClient
    .from("site_sections")
    .select("*", { count: "exact", head: true });

  const posts = await supabaseClient
    .from("posts")
    .select("*", { count: "exact", head: true });

  const modules = await supabaseClient
    .from("site_modules")
    .select("*", { count: "exact", head: true });

  document.getElementById("sections-count").textContent =
    sections.error ? "—" : sections.count;

  document.getElementById("posts-count").textContent =
    posts.error ? "—" : posts.count;

  document.getElementById("modules-count").textContent =
    modules.error ? "—" : modules.count;
}

// ======================================
// NAVEGACIÓN
// ======================================

function configureNavigation() {
  const buttons = document.querySelectorAll(".nav-item");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const section = button.dataset.section;

      buttons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");

      const titles = {
        dashboard: "Dashboard",
        profile: "Mi perfil",
        career: "Trayectoria",
        calendar: "Calendario",
        sponsors: "Patrocinadores",
        gallery: "Galería",
        news: "Noticias",
        builder: "Constructor",
        modules: "Módulos"
      };

      document.getElementById("page-title").textContent =
        titles[section] || "FN13 Admin";

      const isDashboard = section === "dashboard";

      document.getElementById("dashboard-content")
        .classList.toggle("hidden", !isDashboard);

      document.getElementById("section-placeholder")
        .classList.toggle("hidden", isDashboard);

      if (!isDashboard) {
        document.getElementById("placeholder-title").textContent =
          titles[section] || "Sección";
      }
    });
  });
}

// ======================================
// CERRAR SESIÓN
// ======================================

document.getElementById("logout-button").addEventListener(
  "click",
  async () => {
    await supabaseClient.auth.signOut();
    currentProfile = null;
    showLogin();
  }
);

// ======================================
// MOSTRAR LOGIN
// ======================================

function showLogin() {
  adminScreen.classList.add("hidden");
  loginScreen.classList.remove("hidden");
  loginForm.reset();
  loginMessage.textContent = "";
}

// ======================================
// COMPROBAR SESIÓN EXISTENTE
// ======================================

async function initializeAdmin() {
  try {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) throw error;

    if (data.session) {
      await verifyAdmin(data.session.user);
    } else {
      showLogin();
    }
  } catch (error) {
    console.error("FN13 Admin:", error);
    showLogin();
    loginMessage.textContent =
      "No se pudo verificar tu sesión. Comprueba la conexión con Supabase.";
  }
}

initializeAdmin();

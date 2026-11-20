
/* =================================
   FN13 - FUNCIONES DEL SITIO WEB
   ================================= */

// =================================
// CONFIGURACIÓN DE SUPABASE
// =================================

const SUPABASE_URL = "https://raoysuocwwtozjpssjrt.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_dItOD0QWY26RTctAwRD9Lw_AJDilFJo";

let supabaseClient = null;

// =================================
// CARGAR LIBRERÍA DE SUPABASE
// =================================

function loadSupabaseLibrary() {
    return new Promise((resolve, reject) => {
        if (window.supabase) {
            resolve();
            return;
        }

        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

        script.onload = resolve;
        script.onerror = () => reject(
            new Error("No se pudo cargar la librería de Supabase.")
        );

        document.head.appendChild(script);
    });
}

// =================================
// ANIMACIONES AL DESPLAZARSE
// =================================

const sections = document.querySelectorAll(".section");

if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                }
            });
        },
        {
            threshold: 0.12
        }
    );

    sections.forEach((section) => {
        observer.observe(section);
    });
} else {
    sections.forEach((section) => {
        section.classList.add("visible");
    });
}

// =================================
// NAVEGACIÓN SUAVE
// =================================

const navigationLinks = document.querySelectorAll("nav a");

navigationLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
        const targetId = link.getAttribute("href");

        if (targetId && targetId.startsWith("#")) {
            const target = document.querySelector(targetId);

            if (target) {
                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth"
                });
            }
        }
    });
});

// =================================
// AÑO AUTOMÁTICO DEL FOOTER
// =================================

const yearElement = document.querySelector("#current-year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

// =================================
// FUNCIONES AUXILIARES
// =================================

function createElement(tag, className, content) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (content !== undefined && content !== null) {
        element.textContent = content;
    }

    return element;
}

function isValidUrl(value) {
    try {
        const url = new URL(value);

        return url.protocol === "https:" ||
               url.protocol === "http:";
    } catch {
        return false;
    }
}

function getContent(record) {
    return record.content || {};
}

// Elimina únicamente los elementos que generó Supabase.
// Nunca elimina las tarjetas originales del HTML.

function clearGeneratedContent(container) {
    container
        .querySelectorAll('[data-fn13-generated="true"]')
        .forEach((element) => element.remove());
}

// =================================
// CARGAR CONTENIDO PUBLICADO
// =================================

async function getPublishedContent(sectionKey) {
    const { data, error } = await supabaseClient
        .from("fn13_content")
        .select("*")
        .eq("section_key", sectionKey)
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

    if (error) {
        console.error(
            "Error al cargar " + sectionKey + ":",
            error.message
        );

        return [];
    }

    return data || [];
}

// =================================
// PERFIL DEL PILOTO
// =================================

function renderProfile(record) {
    const content = getContent(record);

    if (!content.biography) return;

    const paragraphs = document.querySelectorAll(
        ".about-content p"
    );

    const biographyParts = content.biography
        .split(/\n\s*\n/)
        .map(text => text.trim())
        .filter(Boolean);

    if (paragraphs.length > 0) {
        paragraphs[0].textContent = biographyParts[0] || "";
    }

    if (paragraphs.length > 1) {
        if (biographyParts[1]) {
            paragraphs[1].textContent = biographyParts[1];
            paragraphs[1].hidden = false;
        } else {
            paragraphs[1].hidden = true;
        }
    }
}

// =================================
// TRAYECTORIA
// =================================

function renderCareer(records) {
    const container = document.querySelector(".career-grid");

    if (!container || records.length === 0) return;

    clearGeneratedContent(container);

    records.forEach((record) => {
        const content = getContent(record);

        const card = createElement(
            "article",
            "career-card"
        );

        card.dataset.fn13Generated = "true";

        card.appendChild(
            createElement(
                "span",
                "career-year",
                content.season || "TEMPORADA"
            )
        );

        card.appendChild(
            createElement(
                "div",
                "result-number",
                content.position || "--"
            )
        );

        card.appendChild(
            createElement(
                "h3",
                "",
                content.championship || record.title
            )
        );

        if (content.description) {
            card.appendChild(
                createElement("p", "", content.description)
            );
        }

        if (content.category) {
            card.appendChild(
                createElement(
                    "span",
                    "achievement-label",
                    content.category
                )
            );
        }

        container.appendChild(card);
    });
}

// =================================
// PATROCINADORES
// =================================

function renderSponsors(records) {
    const container = document.querySelector(".sponsor-grid");

    if (!container || records.length === 0) return;

    clearGeneratedContent(container);

    records.forEach((record, index) => {
        const content = getContent(record);

        const card = createElement("article", "sponsor-card");

        card.dataset.fn13Generated = "true";

        if (content.logo && isValidUrl(content.logo)) {
            const logo = document.createElement("img");

            logo.src = content.logo;
            logo.alt = "Logotipo de " + (content.company || record.title);
            logo.loading = "lazy";

            logo.style.maxWidth = "180px";
            logo.style.maxHeight = "75px";
            logo.style.objectFit = "contain";
            logo.style.marginBottom = "25px";

            card.appendChild(logo);
        } else {
            card.appendChild(
                createElement(
                    "div",
                    "sponsor-icon",
                    String(index + 1).padStart(2, "0")
                )
            );
        }

        const heading = createElement(
            "h3",
            "",
            content.company || record.title
        );

        card.appendChild(heading);

        if (content.description) {
            card.appendChild(
                createElement("p", "", content.description)
            );
        }

        if (content.website && isValidUrl(content.website)) {
            const link = createElement("a", "", "VISITAR SITIO WEB");

            link.href = content.website;
            link.target = "_blank";
            link.rel = "noopener noreferrer";

            link.style.display = "inline-block";
            link.style.marginTop = "20px";
            link.style.color = "#e5232d";
            link.style.fontSize = "11px";
            link.style.fontWeight = "bold";

            card.appendChild(link);
        }

        container.appendChild(card);
    });
}

// =================================
// BANDA DESLIZANTE DE PATROCINADORES
// =================================

function renderSponsorMarquee(records) {
    const section = document.getElementById("sponsor-strip");
    const track = document.getElementById("sponsor-marquee-track");

    if (!section || !track) return;

    track.replaceChildren();

    // Solo mostramos patrocinadores publicados
    // que tengan un logotipo con URL válida.

    const sponsorsWithLogos = records.filter((record) => {
        const content = getContent(record);

        return content.logo && isValidUrl(content.logo);
    });

    if (sponsorsWithLogos.length === 0) {
        section.hidden = true;
        return;
    }

    // Crear los logotipos originales.

    sponsorsWithLogos.forEach((record) => {
        const content = getContent(record);

        const item = createElement(
            "div",
            "sponsor-marquee-item"
        );

        const logo = document.createElement("img");

        logo.src = content.logo;
        logo.alt = "Patrocinador " + (
            content.company || record.title
        );

        logo.loading = "lazy";
        logo.decoding = "async";

        logo.addEventListener("error", () => {
            item.remove();

            // Si ya no quedan logotipos, ocultamos la banda.
            if (
                track.querySelectorAll(".sponsor-marquee-item").length === 0
            ) {
                section.hidden = true;
            }
        });

        item.appendChild(logo);
        track.appendChild(item);
    });

    // Duplicar los elementos para conseguir
    // un desplazamiento continuo sin cortes.

    const originalItems = Array.from(
        track.querySelectorAll(".sponsor-marquee-item")
    );

    originalItems.forEach((item) => {
        const clone = item.cloneNode(true);

        clone.setAttribute("aria-hidden", "true");

        const cloneImage = clone.querySelector("img");

        if (cloneImage) {
            cloneImage.alt = "";
            cloneImage.loading = "lazy";
        }

        track.appendChild(clone);
    });

    section.hidden = false;
}

// =================================
// GALERÍA
// =================================

function renderGallery(records) {
    const container = document.querySelector(".gallery-grid");

    if (!container || records.length === 0) return;

    clearGeneratedContent(container);

    records.forEach((record) => {
        const content = getContent(record);

        if (!content.image || !isValidUrl(content.image)) {
            return;
        }

        const image = document.createElement("img");

        image.src = content.image;
        image.alt = content.alt || record.title || "Fotografía FN13";
        image.loading = "lazy";

        image.dataset.fn13Generated = "true";

        container.appendChild(image);
    });
}

// =================================
// INICIAR CONEXIÓN CON SUPABASE
// =================================

async function connectPublicWebsite() {
    try {
        if (
            !SUPABASE_ANON_KEY ||
            SUPABASE_ANON_KEY === "PEGA_AQUI_TU_PUBLISHABLE_KEY"
        ) {
            console.warn(
                "FN13: falta configurar la Publishable Key de Supabase."
            );

            return;
        }

        await loadSupabaseLibrary();

        supabaseClient = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );

        const [
            profileRecords,
            careerRecords,
            sponsorRecords,
            galleryRecords
        ] = await Promise.all([
            getPublishedContent("profile"),
            getPublishedContent("career"),
            getPublishedContent("sponsors"),
            getPublishedContent("gallery")
        ]);

        if (profileRecords.length > 0) {
            renderProfile(profileRecords[0]);
        }

        if (careerRecords.length > 0) {
            renderCareer(careerRecords);
        }

        if (sponsorRecords.length > 0) {
            renderSponsors(sponsorRecords);
        }

        // Cargar la banda con los patrocinadores publicados.
        renderSponsorMarquee(sponsorRecords);

        if (galleryRecords.length > 0) {
            renderGallery(galleryRecords);
        }

        console.log(
            "FN13: contenido publicado cargado correctamente."
        );

    } catch (error) {
        console.error(
            "FN13: no se pudo conectar con Supabase.",
            error
        );
    }
}

// =================================
// EJECUTAR
// =================================

connectPublicWebsite();

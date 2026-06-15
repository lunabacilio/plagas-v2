/* =========================
   UTILIDADES
========================= */

// Escapa texto para insertarlo de forma segura en HTML (atributos y contenido).
// Evita que comillas o signos < > rompan el marcado o el value de un checkbox.
function escaparHTML(texto) {
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Lee y parsea un valor de localStorage de forma segura.
// Si está vacío o corrupto, devuelve el valor por defecto en lugar de romper la app.
function leerJSON(clave, porDefecto) {
    try {
        const crudo = localStorage.getItem(clave);
        return crudo ? JSON.parse(crudo) : porDefecto;
    } catch (e) {
        console.warn(`No se pudo leer "${clave}" de localStorage:`, e);
        return porDefecto;
    }
}

// Respaldo de marca por si brand.js no cargó (p. ej. index.html en caché).
// Conserva los colores para que la app no truene; el logo y la tipografía
// quedan vacíos y el PDF usa estilo básico hasta que brand.js cargue bien.
if (typeof MARCA === "undefined") {
    window.MARCA = {
        verde: [60, 181, 77],
        gris: [51, 51, 51],
        blanco: [255, 255, 255],
        logoHeader: "",
        fuenteRegular: "",
        fuenteBold: ""
    };
    console.warn("brand.js no se cargó: usando estilo básico. Recarga con Ctrl+Shift+R.");
}

// Nombre de la fuente a usar en el PDF. registrarFuente() lo cambia a la de la
// marca si está disponible; si no, se queda con la de jsPDF.
let FUENTE = "helvetica";

const PLAGAS_BASE = [
    "Cucaracha",
    "Roedores",
    "Tijerilla",
    "Chinches",
    "Pulga",
    "Garrapata",
    "Hormiga",
    "Cochinillos",
    "Arañas",
    "Ciempiés"
];

const ACTIVIDADES_BASE = [
    "Aspersión residual",
    "Aplicación de gel",
    "Aplicación de cebo",
    "Nebulización",
    "Espolvoreo",
    "Monitoreo",
    "Inspección"
];

let plagasExtra = leerJSON("plagasExtra", []);
let actividadesExtra = leerJSON("actividadesExtra", []);
let catalogoProductos = leerJSON("catalogoProductos", []);

let fotos = [];

let firmaCanvas;
let firmaCtx;
let firmando = false;

/* =========================
   EMPRESA
========================= */

// Logo que el usuario sube en configuración (dataURL). null = usar el de la marca.
let logoCargado = null;

function guardarEmpresa() {
    const datosPrevios = leerJSON("empresaDatos", {});

    const datos = {
        nombre: document.getElementById("empNombre").value,
        direccion: document.getElementById("empDir").value,
        telefono: document.getElementById("empTel").value,
        correo: document.getElementById("empMail").value,
        licencia: document.getElementById("empLic").value,
        // Conserva el logo guardado salvo que se haya subido o quitado uno nuevo.
        logo: logoCargado !== null ? logoCargado : datosPrevios.logo
    };

    // null explícito = el usuario quitó el logo; no guardamos la clave.
    if (logoCargado === "") delete datos.logo;

    localStorage.setItem("empresaDatos", JSON.stringify(datos));
    logoCargado = null;

    cargarEmpresa();
    document.getElementById("panelEmpresa").classList.add("hidden");
}

function toggleConfiguracion() {
    document.getElementById("panelEmpresa").classList.toggle("hidden");
}

function quitarLogo() {
    // Cadena vacía = marcar para borrar al guardar (distinto de null = sin cambios).
    logoCargado = "";
    document.getElementById("empLogoPreview").src = MARCA.logoHeader;
    document.getElementById("empLogo").value = "";
}

function cargarEmpresa() {
    const datos = leerJSON("empresaDatos", {});

    document.getElementById("empNombre").value = datos.nombre || "";
    document.getElementById("empDir").value = datos.direccion || "";
    document.getElementById("empTel").value = datos.telefono || "";
    document.getElementById("empMail").value = datos.correo || "";
    document.getElementById("empLic").value = datos.licencia || "";

    // El logo de la marca vive en brand.js; si por caché no cargó, no rompemos la app.
    const logoMarca = (typeof MARCA !== "undefined") ? MARCA.logoHeader : "";
    const logo = datos.logo || logoMarca;
    const preview = document.getElementById("empLogoPreview");
    const logoApp = document.getElementById("logoApp");
    if (preview && logo) preview.src = logo;
    if (logoApp && logo) logoApp.src = logo;

    document.getElementById("empresaTitulo").textContent =
        datos.nombre || "Fumigaciones Hoffmann's";

    document.getElementById("empresaResumen").innerHTML = [
        datos.direccion,
        datos.telefono,
        datos.correo,
        datos.licencia
    ].filter(Boolean).map(escaparHTML).join("<br>");
}

// Lee el logo subido y lo deja listo (se guarda al presionar "Guardar datos").
function cargarLogo(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        logoCargado = e.target.result;
        document.getElementById("empLogoPreview").src = logoCargado;
    };
    reader.readAsDataURL(archivo);
}

/* =========================
   PLAGAS
========================= */

function cargarPlagasBase() {
    const contenedor = document.getElementById("plagasBase");

    contenedor.innerHTML = PLAGAS_BASE.map(plaga => `
        <label class="chk-label">
            <input type="checkbox" class="chkPlaga" value="${escaparHTML(plaga)}">
            ${escaparHTML(plaga)}
        </label>
    `).join("");
}

function renderPlagasExtra() {
    const contenedor = document.getElementById("plagasExtra");

    contenedor.innerHTML = plagasExtra.map((plaga, index) => `
        <div class="item-row">
            <label class="chk-label">
                <input type="checkbox" class="chkPlaga" value="${escaparHTML(plaga)}">
                ${escaparHTML(plaga)}
            </label>
            <button class="delete-btn" onclick="eliminarPlaga(${index})">Eliminar</button>
        </div>
    `).join("");
}

function agregarPlaga() {
    const valor = document.getElementById("nuevaPlaga").value.trim();
    if (!valor) return;

    if (!plagasExtra.includes(valor)) {
        plagasExtra.push(valor);
        localStorage.setItem("plagasExtra", JSON.stringify(plagasExtra));
    }

    document.getElementById("nuevaPlaga").value = "";
    renderPlagasExtra();
}

function eliminarPlaga(index) {
    plagasExtra.splice(index, 1);
    localStorage.setItem("plagasExtra", JSON.stringify(plagasExtra));
    renderPlagasExtra();
}

/* =========================
   PRODUCTOS
========================= */

function renderProductos() {
    const contenedor = document.getElementById("catalogoProductos");

    contenedor.innerHTML = catalogoProductos.map(prod => `
        <label class="chk-label">
            <input type="checkbox" class="chkProducto" value="${escaparHTML(prod)}">
            ${escaparHTML(prod)}
        </label>
    `).join("");
}

function agregarProducto() {
    const valor = document.getElementById("nuevoProducto").value.trim();
    if (!valor) return;

    if (!catalogoProductos.includes(valor)) {
        catalogoProductos.push(valor);
        localStorage.setItem("catalogoProductos", JSON.stringify(catalogoProductos));
    }

    document.getElementById("nuevoProducto").value = "";
    renderProductos();
}

/* =========================
   ACTIVIDADES
========================= */

function cargarActividadesBase() {
    const contenedor = document.getElementById("actividadesBase");

    contenedor.innerHTML = ACTIVIDADES_BASE.map(act => `
        <label class="chk-label">
            <input type="checkbox" class="chkActividad" value="${escaparHTML(act)}">
            ${escaparHTML(act)}
        </label>
    `).join("");
}

function renderActividadesExtra() {
    const contenedor = document.getElementById("actividadesExtra");

    contenedor.innerHTML = actividadesExtra.map((act, index) => `
        <div class="item-row">
            <label class="chk-label">
                <input type="checkbox" class="chkActividad" value="${escaparHTML(act)}">
                ${escaparHTML(act)}
            </label>
            <button class="delete-btn" onclick="eliminarActividad(${index})">Eliminar</button>
        </div>
    `).join("");
}

function agregarActividad() {
    const valor = document.getElementById("nuevaActividad").value.trim();
    if (!valor) return;

    if (!actividadesExtra.includes(valor)) {
        actividadesExtra.push(valor);
        localStorage.setItem("actividadesExtra", JSON.stringify(actividadesExtra));
    }

    document.getElementById("nuevaActividad").value = "";
    renderActividadesExtra();
}

function eliminarActividad(index) {
    actividadesExtra.splice(index, 1);
    localStorage.setItem("actividadesExtra", JSON.stringify(actividadesExtra));
    renderActividadesExtra();
}

/* =========================
   FOTOS
========================= */

document.getElementById("selectorFotos").addEventListener("change", cargarFotos);

// Lado máximo (px) y calidad JPEG para las fotos. A 1280 px se ven nítidas en el
// PDF (la hoja las muestra a ~13 cm) y pesan una fracción del original del celular.
const FOTO_LADO_MAX = 1280;
const FOTO_CALIDAD = 0.7;

// Reduce y recomprime una imagen a JPEG para que el PDF no pese de más.
// Si por algo falla, devuelve la imagen original sin romper la carga.
function comprimirImagen(dataURL) {
    return new Promise(resolve => {
        const img = new Image();

        img.onload = function () {
            let ancho = img.width;
            let alto = img.height;

            if (ancho >= alto && ancho > FOTO_LADO_MAX) {
                alto = Math.round(alto * FOTO_LADO_MAX / ancho);
                ancho = FOTO_LADO_MAX;
            } else if (alto > FOTO_LADO_MAX) {
                ancho = Math.round(ancho * FOTO_LADO_MAX / alto);
                alto = FOTO_LADO_MAX;
            }

            const canvas = document.createElement("canvas");
            canvas.width = ancho;
            canvas.height = alto;
            // Fondo blanco por si la imagen original es PNG con transparencia.
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, ancho, alto);
            ctx.drawImage(img, 0, 0, ancho, alto);

            resolve(canvas.toDataURL("image/jpeg", FOTO_CALIDAD));
        };

        img.onerror = () => resolve(dataURL);
        img.src = dataURL;
    });
}

function cargarFotos(event) {
    const archivos = Array.from(event.target.files);

    archivos.forEach(archivo => {
        const reader = new FileReader();

        reader.onload = function (e) {
            comprimirImagen(e.target.result).then(imagenComprimida => {
                fotos.push({
                    imagen: imagenComprimida,
                    descripcion: ""
                });
                renderFotos();
            });
        };

        reader.readAsDataURL(archivo);
    });

    event.target.value = "";
}

function renderFotos() {
    const contenedor = document.getElementById("contenedorFotos");
    contenedor.innerHTML = "";

    fotos.forEach((foto, index) => {
        const div = document.createElement("div");
        div.className = "photo-card";

        div.innerHTML = `
            <img src="${foto.imagen}">
            <label>Descripción</label>
            <textarea oninput="actualizarDescripcion(${index}, this.value)">${escaparHTML(foto.descripcion)}</textarea>
            <br>
            <button class="delete-btn" onclick="eliminarFoto(${index})">Eliminar fotografía</button>
        `;

        contenedor.appendChild(div);
    });
}

function actualizarDescripcion(index, texto) {
    fotos[index].descripcion = texto;
}

function eliminarFoto(index) {
    fotos.splice(index, 1);
    renderFotos();
}

/* =========================
   FIRMA
========================= */

function iniciarFirma() {
    firmaCanvas = document.getElementById("firmaCanvas");
    firmaCtx = firmaCanvas.getContext("2d");
    firmaCtx.lineWidth = 2;
    firmaCtx.lineCap = "round";

    function obtenerPosicion(e) {
        const rect = firmaCanvas.getBoundingClientRect();

        // El canvas se muestra reducido en pantalla (sobre todo en celular),
        // pero su resolución interna sigue siendo 500x180. Hay que escalar las
        // coordenadas del toque/clic para que el trazo caiga donde se toca.
        const escalaX = firmaCanvas.width / rect.width;
        const escalaY = firmaCanvas.height / rect.height;

        const punto = e.touches ? e.touches[0] : e;

        return {
            x: (punto.clientX - rect.left) * escalaX,
            y: (punto.clientY - rect.top) * escalaY
        };
    }

    function iniciar(e) {
        firmando = true;
        const pos = obtenerPosicion(e);
        firmaCtx.beginPath();
        firmaCtx.moveTo(pos.x, pos.y);
    }

    function mover(e) {
        if (!firmando) return;
        e.preventDefault();
        const pos = obtenerPosicion(e);
        firmaCtx.lineTo(pos.x, pos.y);
        firmaCtx.stroke();
    }

    function terminar() {
        firmando = false;
    }

    firmaCanvas.addEventListener("mousedown", iniciar);
    firmaCanvas.addEventListener("mousemove", mover);
    window.addEventListener("mouseup", terminar);

    firmaCanvas.addEventListener("touchstart", iniciar);
    firmaCanvas.addEventListener("touchmove", mover);
    window.addEventListener("touchend", terminar);
}

function limpiarFirma() {
    firmaCtx.clearRect(0, 0, firmaCanvas.width, firmaCanvas.height);
}

/* =========================
   SELECCIONES
========================= */

function obtenerPlagasSeleccionadas() {
    // Incluye base y extra: ambas comparten la clase .chkPlaga y se eligen por checkbox.
    return Array.from(document.querySelectorAll(".chkPlaga:checked"))
        .map(x => x.value);
}

function obtenerActividadesSeleccionadas() {
    return Array.from(document.querySelectorAll(".chkActividad:checked"))
        .map(x => x.value);
}

function obtenerProductosSeleccionados() {
    return Array.from(document.querySelectorAll(".chkProducto:checked"))
        .map(x => x.value);
}

/* =========================
   GENERAR PDF
========================= */

// Margen superior del contenido: debajo del membrete (logo + línea verde).
const MARGEN_SUPERIOR = 38;

// Límite inferior del contenido antes del pie de página (en mm).
const LIMITE_Y = 275;

// Registra la tipografía Nunito Sans (Regular y Bold) en el documento.
// Se incrustan desde brand.js para que el PDF use la fuente de la marca.
function registrarFuente(doc) {
    // Sin fuente embebida (brand.js no cargó) usamos la de jsPDF y no fallamos.
    if (!MARCA.fuenteRegular || !MARCA.fuenteBold) {
        FUENTE = "helvetica";
        doc.setFont(FUENTE, "normal");
        return;
    }
    doc.addFileToVFS("NunitoSans-Regular.ttf", MARCA.fuenteRegular);
    doc.addFont("NunitoSans-Regular.ttf", "NunitoSans", "normal");
    doc.addFileToVFS("NunitoSans-Bold.ttf", MARCA.fuenteBold);
    doc.addFont("NunitoSans-Bold.ttf", "NunitoSans", "bold");
    FUENTE = "NunitoSans";
    doc.setFont(FUENTE, "normal");
}

// Devuelve el logo a usar: el que subió el usuario en configuración, o el de la marca.
function logoActual() {
    const empresa = leerJSON("empresaDatos", {});
    return empresa.logo || MARCA.logoHeader;
}

// Coloca una imagen respetando su proporción, dentro de un alto y ancho máximos.
// El "alias" hace que jsPDF guarde la imagen UNA sola vez aunque se repita en
// varias páginas (clave para que el logo no infle el PDF en cada hoja).
function colocarImagenProporcional(doc, data, x, y, maxAncho, maxAlto, alias) {
    const props = doc.getImageProperties(data);
    let ancho = maxAncho;
    let alto = (props.height / props.width) * ancho;
    if (alto > maxAlto) {
        alto = maxAlto;
        ancho = (props.width / props.height) * alto;
    }
    const formato = String(data).startsWith("data:image/png") ? "PNG" : "JPEG";
    doc.addImage(data, formato, x, y, ancho, alto, alias, "FAST");
}

// Membrete: logo de la marca arriba a la izquierda, folio a la derecha y
// una línea verde que cruza la hoja. Se dibuja igual en TODAS las páginas.
function dibujarMembrete(doc, folio) {
    const logo = logoActual();
    if (logo) {
        try {
            colocarImagenProporcional(doc, logo, 15, 9, 80, 17, "logoMarca");
        } catch (e) {
            console.warn("No se pudo dibujar el logo:", e);
        }
    } else {
        // Sin logo (estilo básico): al menos el nombre de la empresa como membrete.
        const empresa = leerJSON("empresaDatos", {});
        doc.setFont(FUENTE, "bold");
        doc.setFontSize(15);
        doc.setTextColor(...MARCA.gris);
        doc.text(empresa.nombre || "Reporte de Control de Plagas", 15, 18);
    }

    doc.setFont(FUENTE, "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MARCA.gris);
    doc.text("Folio: " + folio, 195, 14, { align: "right" });

    doc.setDrawColor(...MARCA.verde);
    doc.setLineWidth(1);
    doc.line(15, 30, 195, 30);
    doc.setLineWidth(0.2);
    doc.setDrawColor(180);
}

// Pie de página: línea verde, datos de contacto de la empresa y número de página.
function dibujarPie(doc, empresa, pagina, total) {
    doc.setDrawColor(...MARCA.verde);
    doc.setLineWidth(0.6);
    doc.line(15, 284, 195, 284);
    doc.setLineWidth(0.2);
    doc.setDrawColor(180);

    doc.setFont(FUENTE, "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MARCA.gris);

    const contacto = [empresa.telefono, empresa.correo, empresa.licencia && "Lic. " + empresa.licencia]
        .filter(Boolean)
        .join("   ·   ");

    if (contacto) {
        doc.text(contacto, 15, 289);
    }
    doc.text("Página " + pagina + " de " + total, 195, 289, { align: "right" });
}

// Si no cabe un bloque de "alto" mm, agrega página y reinicia y. Devuelve la y a usar.
function nuevaPaginaSiHaceFalta(doc, y, alto) {
    if (y + alto > LIMITE_Y) {
        doc.addPage();
        return MARGEN_SUPERIOR;
    }
    return y;
}

// Dibuja la barra verde de título de una sección. Devuelve la y debajo de la barra.
function bandaSeccion(doc, titulo, y) {
    y = nuevaPaginaSiHaceFalta(doc, y, 14);
    doc.setFillColor(...MARCA.verde);
    doc.rect(15, y, 180, 8, "F");
    doc.setTextColor(...MARCA.blanco);
    doc.setFont(FUENTE, "bold");
    doc.setFontSize(11);
    doc.text(titulo, 20, y + 5.5);
    doc.setFont(FUENTE, "normal");
    doc.setTextColor(...MARCA.gris);
    return y + 15;
}

// Escribe una lista con viñetas, saltando de página si hace falta. Devuelve la y final.
function listaItems(doc, items, y) {
    doc.setFont(FUENTE, "normal");
    doc.setFontSize(11);
    doc.setTextColor(...MARCA.gris);
    items.forEach(item => {
        y = nuevaPaginaSiHaceFalta(doc, y, 6);
        doc.text("• " + item, 20, y);
        y += 6;
    });
    return y;
}

// Recuadro de texto con altura dinámica según el contenido. Devuelve la y final.
function bloqueTexto(doc, titulo, texto, y) {
    const lineas = doc.splitTextToSize(texto || "", 165);
    const alto = Math.max(30, lineas.length * 5 + 16);
    y = nuevaPaginaSiHaceFalta(doc, y, alto);
    doc.setDrawColor(180);
    doc.rect(15, y, 180, alto);
    doc.setTextColor(...MARCA.gris);
    doc.setFont(FUENTE, "bold");
    doc.setFontSize(11);
    doc.text(titulo, 20, y + 7);
    doc.setFont(FUENTE, "normal");
    doc.text(lineas, 20, y + 15);
    return y + alto + 5;
}

// Envoltura: si algo falla, lo muestra en pantalla en vez de "no hacer nada".
async function generarPDF() {
    try {
        await generarPDFInterno();
    } catch (err) {
        console.error("Error al generar el PDF:", err);
        alert("No se pudo generar el PDF.\n\nDetalle: " + (err && err.message ? err.message : err) +
            "\n\nSi menciona 'MARCA' o 'jspdf', recarga con Ctrl+Shift+R.");
    }
}

async function generarPDFInterno() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    registrarFuente(doc);

    const empresa = leerJSON("empresaDatos", {});

    const fechaActual = new Date();

    const folio =
        "CP-" +
        fechaActual.getFullYear() +
        String(fechaActual.getMonth() + 1).padStart(2, "0") +
        String(fechaActual.getDate()).padStart(2, "0") +
        "-" +
        String(fechaActual.getHours()).padStart(2, "0") +
        String(fechaActual.getMinutes()).padStart(2, "0") +
        String(fechaActual.getSeconds()).padStart(2, "0");

    // El contenido empieza debajo del membrete (se dibuja al final en todas las hojas).
    let y = MARGEN_SUPERIOR;

    /* ----- DATOS DEL SERVICIO ----- */
    doc.setDrawColor(180);
    doc.rect(15, y, 180, 30);
    doc.setTextColor(...MARCA.gris);

    doc.setFont(FUENTE, "bold");
    doc.setFontSize(11);
    doc.text("CLIENTE", 20, y + 7);
    doc.text("FECHA", 120, y + 7);
    doc.text("TÉCNICO", 20, y + 24);

    doc.setFont(FUENTE, "normal");
    doc.text(document.getElementById("cliente").value || "", 20, y + 14);
    doc.text(document.getElementById("fecha").value || "", 120, y + 14);
    doc.text(document.getElementById("tecnico").value || "", 50, y + 24);

    y += 40;

    /* ----- PLAGAS ----- */
    y = bandaSeccion(doc, "PLAGAS SUJETAS A CONTROL", y);
    y = listaItems(doc, obtenerPlagasSeleccionadas(), y);

    /* ----- PRODUCTOS ----- */
    y += 4;
    y = bandaSeccion(doc, "PRODUCTOS UTILIZADOS", y);
    y = listaItems(doc, obtenerProductosSeleccionados(), y);

    /* ----- ACTIVIDADES ----- */
    y += 4;
    y = bandaSeccion(doc, "ACTIVIDADES REALIZADAS", y);
    y = listaItems(doc, obtenerActividadesSeleccionadas(), y);

    /* ----- HALLAZGOS ----- */
    y += 4;
    y = bloqueTexto(doc, "HALLAZGOS", document.getElementById("hallazgos").value, y);

    /* ----- RECOMENDACIONES ----- */
    y = bloqueTexto(doc, "RECOMENDACIONES", document.getElementById("recomendaciones").value, y);

    /* ----- ANEXO FOTOGRÁFICO (segunda hoja) ----- */
    if (fotos.length) {
        doc.addPage();
        let fotoY = bandaSeccion(doc, "ANEXO FOTOGRÁFICO", MARGEN_SUPERIOR);

        // Caja máxima donde cabe cada foto, conservando su proporción original.
        const FOTO_MAX_ANCHO = 130;
        const FOTO_MAX_ALTO = 95;

        for (let i = 0; i < fotos.length; i++) {
            const foto = fotos[i];

            // Tamaño respetando la proporción real de la imagen (no se deforma).
            const props = doc.getImageProperties(foto.imagen);
            let imgAncho = FOTO_MAX_ANCHO;
            let imgAlto = (props.height / props.width) * imgAncho;
            if (imgAlto > FOTO_MAX_ALTO) {
                imgAlto = FOTO_MAX_ALTO;
                imgAncho = (props.width / props.height) * imgAlto;
            }

            // Descripción (si hay) y su alto, para decidir el salto de página.
            const textoFoto = foto.descripcion ? doc.splitTextToSize(foto.descripcion, 165) : [];
            const altoTexto = textoFoto.length ? textoFoto.length * 5 + 4 : 0;

            // Alto del bloque completo: banda(12) + imagen + texto + margen.
            const altoBloque = 12 + imgAlto + altoTexto + 8;
            fotoY = nuevaPaginaSiHaceFalta(doc, fotoY, altoBloque);

            doc.setFillColor(...MARCA.verde);
            doc.rect(15, fotoY, 180, 8, "F");
            doc.setTextColor(...MARCA.blanco);
            doc.setFont(FUENTE, "bold");
            doc.setFontSize(11);
            doc.text("FOTOGRAFÍA " + (i + 1), 20, fotoY + 5.5);
            doc.setFont(FUENTE, "normal");
            doc.setTextColor(...MARCA.gris);
            fotoY += 12;

            // El tipo de imagen lo detecta jsPDF del propio data URI (JPEG o PNG).
            doc.addImage(foto.imagen, 20, fotoY, imgAncho, imgAlto);
            fotoY += imgAlto + 4;

            if (textoFoto.length) {
                doc.text(textoFoto, 20, fotoY);
                fotoY += altoTexto;
            }
            fotoY += 4;
        }

        // La firma va después de las fotos, así que continuamos desde aquí.
        y = fotoY + 4;
    }

    /* ----- FIRMA DEL TÉCNICO (última hoja) ----- */
    y = nuevaPaginaSiHaceFalta(doc, y, 50);

    doc.setFont(FUENTE, "bold");
    doc.setFontSize(12);
    doc.setTextColor(...MARCA.gris);
    doc.text("FIRMA DEL TÉCNICO", 15, y);
    y += 5;

    const firmaImagen = firmaCanvas.toDataURL("image/png");
    doc.addImage(firmaImagen, "PNG", 15, y, 70, 25);
    y += 27;

    doc.setDrawColor(...MARCA.gris);
    doc.line(15, y, 85, y);
    y += 5;
    doc.setFont(FUENTE, "normal");
    doc.setFontSize(10);
    doc.text(document.getElementById("tecnico").value || "Técnico aplicador", 15, y);

    /* ----- MEMBRETE Y PIE EN TODAS LAS PÁGINAS ----- */
    const totalPaginas = doc.getNumberOfPages();

    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        doc.setPage(pagina);
        dibujarMembrete(doc, folio);
        dibujarPie(doc, empresa, pagina, totalPaginas);
    }

    /* ----- GUARDAR PDF ----- */
    const clienteNombre = (document.getElementById("cliente").value || "Cliente")
        .replace(/\s+/g, "_");

    doc.save("Reporte_" + clienteNombre + ".pdf");
}

/* =========================
   INICIALIZACIÓN
========================= */

window.addEventListener("load", () => {
    // La firma se activa primero: así, aunque algo del membrete/branding falle,
    // el técnico siempre puede firmar.
    iniciarFirma();

    cargarPlagasBase();
    renderPlagasExtra();
    renderProductos();
    cargarActividadesBase();
    renderActividadesExtra();
    cargarEmpresa();

    document.getElementById("empLogo").addEventListener("change", cargarLogo);
});

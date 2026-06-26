// ===================================
// FORO — LÓGICA CON FIREBASE
// Login con Google + Firestore (temas del foro)
// ===================================
//
// Este archivo es un módulo (por eso usa import). Se carga en
// foro.html con <script type="module" src="foro-firebase.js">

import {
    auth,
    db,
    googleProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "./firebase-config.js";

/* ---------------------------------------------------
   NOTA: antes este archivo subía temas de ejemplo a
   Firestore automáticamente la primera vez que la
   colección estaba vacía. Esa siembra automática ya
   se quitó a propósito: el foro ahora empieza vacío
   y solo se llena con temas reales que publique la
   comunidad.
   --------------------------------------------------- */

const nombresCategoria = {
    general: "General",
    negocios: "Negocios",
    tradiciones: "Tradiciones",
    eventos: "Eventos"
};

/* ---------------------------------------------------
   REFERENCIAS AL DOM
   --------------------------------------------------- */

const forumList = document.getElementById("forum-list");
const forumNoResults = document.getElementById("forum-no-results");
const filtroForo = document.getElementById("foro-categoria");
const btnNuevoTema = document.querySelector(".forum-new-topic");

let temasCache = [];
let usuarioActual = null;

/* ---------------------------------------------------
   FORMATEAR FECHA RELATIVA ("hace 2 días", etc.)
   --------------------------------------------------- */

function formatearFecha(timestamp){

    if(!timestamp){
        return "Hace un momento";
    }

    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMin / 60);
    const diffDias = Math.floor(diffHoras / 24);
    const diffSemanas = Math.floor(diffDias / 7);

    if(diffMin < 1) return "Hace un momento";
    if(diffMin < 60) return `Hace ${diffMin} min`;
    if(diffHoras < 24) return `Hace ${diffHoras} h`;
    if(diffDias < 7) return `Hace ${diffDias} día${diffDias === 1 ? "" : "s"}`;
    return `Hace ${diffSemanas} semana${diffSemanas === 1 ? "" : "s"}`;

}

/* ---------------------------------------------------
   DIBUJAR LA LISTA DE TEMAS
   --------------------------------------------------- */

function renderTemas(){

    forumList.innerHTML = "";

    const categoriaElegida = filtroForo.value;

    const temasFiltrados = categoriaElegida === "todos"
        ? temasCache
        : temasCache.filter(t => t.categoria === categoriaElegida);

    forumNoResults.classList.toggle("show", temasFiltrados.length === 0);

    temasFiltrados.forEach(tema => {

        const article = document.createElement("article");
        article.className = "forum-card";
        article.dataset.categoria = tema.categoria;

        article.innerHTML = `
            <div class="forum-card-main">
                <span class="business-tag forum-tag">${nombresCategoria[tema.categoria] || tema.categoria}</span>
                <h3 class="forum-title">${tema.titulo}</h3>
                <p class="forum-preview">${tema.contenido}</p>
                <div class="forum-meta">
                    <span class="forum-author">Publicado por <strong>${tema.autorNombre}</strong></span>
                    <span class="forum-date">${formatearFecha(tema.fecha)}</span>
                </div>
            </div>
            <div class="forum-card-stats">
                <span class="forum-replies">${tema.respuestas || 0}</span>
                <span class="forum-replies-label">respuestas</span>
            </div>
        `;

        article.addEventListener("click", () => {
            window.location.href = `tema.html?id=${tema.id}`;
        });

        forumList.appendChild(article);

    });

}

/* ---------------------------------------------------
   ESCUCHAR LA COLECCIÓN "temas" EN TIEMPO REAL
   --------------------------------------------------- */

function iniciarListaDeTemas(){

    const q = query(collection(db, "temas"), orderBy("fecha", "desc"));

    /* onSnapshot escucha cambios en tiempo real: si alguien
       crea un tema nuevo, esta lista se actualiza sola sin
       que nadie tenga que recargar la página. */

    onSnapshot(q, (snapshot) => {

        temasCache = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        renderTemas();

    });

}

if(forumList){
    iniciarListaDeTemas();
}

if(filtroForo){
    filtroForo.addEventListener("change", renderTemas);
}

/* ---------------------------------------------------
   LOGIN CON GOOGLE
   --------------------------------------------------- */

const authBar = document.createElement("div");
authBar.className = "forum-auth";
authBar.innerHTML = `
    <button id="btn-login" class="btn forum-login-btn" type="button">Iniciar sesión con Google</button>
    <div id="user-info" class="forum-user-info" style="display:none;">
        <img id="user-photo" class="forum-user-photo" src="" alt="">
        <span id="user-name" class="forum-user-name"></span>
        <button id="btn-logout" class="forum-logout-btn" type="button">Salir</button>
    </div>
`;

const forumToolbar = document.querySelector(".forum-toolbar");

if(forumToolbar){
    forumToolbar.parentNode.insertBefore(authBar, forumToolbar);
}

const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const userInfo = document.getElementById("user-info");
const userPhoto = document.getElementById("user-photo");
const userName = document.getElementById("user-name");

if(btnLogin){

    btnLogin.addEventListener("click", async () => {

        try{
            await signInWithPopup(auth, googleProvider);
        }catch(error){
            console.error("Error al iniciar sesión:", error);
            alert("No se pudo iniciar sesión. Intenta de nuevo.");
        }

    });

}

if(btnLogout){

    btnLogout.addEventListener("click", async () => {
        await signOut(auth);
    });

}

onAuthStateChanged(auth, (usuario) => {

    usuarioActual = usuario;

    if(usuario){

        btnLogin.style.display = "none";
        userInfo.style.display = "flex";
        userPhoto.src = usuario.photoURL || "";
        userName.textContent = usuario.displayName || usuario.email;

        if(btnNuevoTema){
            btnNuevoTema.disabled = false;
        }

    }else{

        btnLogin.style.display = "inline-block";
        userInfo.style.display = "none";

        if(btnNuevoTema){
            btnNuevoTema.disabled = false;
            /* El botón sigue visible y clicable sin sesión;
               al darle clic se le pide iniciar sesión primero
               (ver lógica del modal más abajo) */
        }

    }

});

/* ---------------------------------------------------
   MODAL: NUEVO TEMA
   --------------------------------------------------- */

const modalNuevoTema = document.createElement("div");
modalNuevoTema.className = "topic-modal";
modalNuevoTema.id = "topic-modal";
modalNuevoTema.innerHTML = `
    <div class="topic-modal-content">

        <button class="modal-close" id="topic-modal-close" type="button">✕</button>

        <h3 class="modal-title">Nuevo tema</h3>
        <p class="modal-subtitle">Comparte tu pregunta o comentario con la comunidad</p>

        <form id="topic-form" class="topic-form">

            <label class="topic-label" for="topic-categoria">Categoría</label>
            <select id="topic-categoria" class="filter-select" required>
                <option value="general">General</option>
                <option value="negocios">Negocios</option>
                <option value="tradiciones">Tradiciones</option>
                <option value="eventos">Eventos</option>
            </select>

            <label class="topic-label" for="topic-titulo">Título</label>
            <input
                type="text"
                id="topic-titulo"
                class="topic-input"
                placeholder="Escribe un título claro y breve"
                maxlength="120"
                required>

            <label class="topic-label" for="topic-contenido">Tu mensaje</label>
            <textarea
                id="topic-contenido"
                class="topic-textarea"
                placeholder="Cuéntanos con más detalle..."
                maxlength="1000"
                required></textarea>

            <button type="submit" class="btn topic-submit">Publicar tema</button>

        </form>

    </div>
`;

document.body.appendChild(modalNuevoTema);

const topicModalClose = document.getElementById("topic-modal-close");
const topicForm = document.getElementById("topic-form");

function abrirModalNuevoTema(){

    if(!usuarioActual){
        alert("Inicia sesión con Google para publicar un tema.");
        return;
    }

    modalNuevoTema.classList.add("is-open");

}

function cerrarModalNuevoTema(){
    modalNuevoTema.classList.remove("is-open");
    topicForm.reset();
}

if(btnNuevoTema){
    btnNuevoTema.addEventListener("click", abrirModalNuevoTema);
}

topicModalClose.addEventListener("click", cerrarModalNuevoTema);

modalNuevoTema.addEventListener("click", (e) => {
    if(e.target === modalNuevoTema){
        cerrarModalNuevoTema();
    }
});

topicForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    if(!usuarioActual){
        alert("Inicia sesión con Google para publicar un tema.");
        return;
    }

    const categoria = document.getElementById("topic-categoria").value;
    const titulo = document.getElementById("topic-titulo").value.trim();
    const contenido = document.getElementById("topic-contenido").value.trim();

    if(!titulo || !contenido){
        return;
    }

    try{

        await addDoc(collection(db, "temas"), {
            categoria,
            titulo,
            contenido,
            autorNombre: usuarioActual.displayName || "Usuario",
            autorFoto: usuarioActual.photoURL || "",
            autorUid: usuarioActual.uid,
            respuestas: 0,
            fecha: serverTimestamp()
        });

        cerrarModalNuevoTema();

    }catch(error){

        console.error("Error al publicar el tema:", error);
        alert("No se pudo publicar el tema. Intenta de nuevo.");

    }

});
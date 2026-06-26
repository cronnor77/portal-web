// ===================================
// TEMA (detalle) — LÓGICA CON FIREBASE
// Muestra un tema y sus comentarios; permite comentar con login
// ===================================

import {
    auth,
    db,
    googleProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    collection,
    addDoc,
    doc,
    getDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    increment,
    updateDoc
} from "./firebase-config.js";

const nombresCategoria = {
    general: "General",
    negocios: "Negocios",
    tradiciones: "Tradiciones",
    eventos: "Eventos"
};

/* ---------------------------------------------------
   OBTENER EL ID DEL TEMA DESDE LA URL (?id=...)
   --------------------------------------------------- */

const parametros = new URLSearchParams(window.location.search);
const temaId = parametros.get("id");

const topicDetail = document.getElementById("topic-detail");
const temaTitulo = document.getElementById("tema-titulo");
const commentsList = document.getElementById("comments-list");
const commentsEmpty = document.getElementById("comments-empty");
const commentForm = document.getElementById("comment-form");

let usuarioActual = null;

if(!temaId){

    temaTitulo.textContent = "Tema no encontrado";
    topicDetail.innerHTML = `<p>No se especificó un tema válido. <a href="foro.html">Volver al foro</a></p>`;

}

/* ---------------------------------------------------
   FORMATEAR FECHA RELATIVA
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
   CARGAR Y MOSTRAR EL TEMA
   --------------------------------------------------- */

async function cargarTema(){

    if(!temaId) return;

    const temaRef = doc(db, "temas", temaId);
    const temaSnap = await getDoc(temaRef);

    if(!temaSnap.exists()){

        temaTitulo.textContent = "Tema no encontrado";
        topicDetail.innerHTML = `<p>Este tema ya no existe. <a href="foro.html">Volver al foro</a></p>`;
        return;

    }

    const tema = temaSnap.data();

    document.title = `${tema.titulo} — Foro Suljaa'`;
    temaTitulo.textContent = tema.titulo;

    topicDetail.innerHTML = `
        <div class="topic-detail-card">
            <span class="business-tag forum-tag">${nombresCategoria[tema.categoria] || tema.categoria}</span>
            <p class="topic-detail-content">${tema.contenido}</p>
            <div class="forum-meta">
                <span class="forum-author">Publicado por <strong>${tema.autorNombre}</strong></span>
                <span class="forum-date">${formatearFecha(tema.fecha)}</span>
            </div>
        </div>
    `;

}

/* ---------------------------------------------------
   ESCUCHAR COMENTARIOS EN TIEMPO REAL
   --------------------------------------------------- */

function iniciarComentarios(){

    if(!temaId) return;

    const comentariosRef = collection(db, "temas", temaId, "comentarios");
    const q = query(comentariosRef, orderBy("fecha", "asc"));

    onSnapshot(q, (snapshot) => {

        commentsList.innerHTML = "";

        commentsEmpty.classList.toggle("show", snapshot.empty);

        snapshot.forEach(docSnap => {

            const comentario = docSnap.data();

            const div = document.createElement("div");
            div.className = "comment-item";

            div.innerHTML = `
                ${comentario.autorFoto
                    ? `<img src="${comentario.autorFoto}" class="comment-avatar" alt="">`
                    : `<div class="comment-avatar comment-avatar--placeholder">${(comentario.autorNombre || "?")[0]}</div>`
                }
                <div class="comment-body">
                    <div class="comment-header">
                        <strong>${comentario.autorNombre}</strong>
                        <span class="comment-date">${formatearFecha(comentario.fecha)}</span>
                    </div>
                    <p class="comment-text">${comentario.texto}</p>
                </div>
            `;

            commentsList.appendChild(div);

        });

    });

}

/* ---------------------------------------------------
   LOGIN CON GOOGLE (dentro del formulario de comentarios)
   --------------------------------------------------- */

const commentAuth = document.getElementById("comment-auth");

commentAuth.innerHTML = `
    <button id="btn-login" class="btn forum-login-btn" type="button">Iniciar sesión con Google</button>
    <div id="user-info" class="forum-user-info" style="display:none;">
        <img id="user-photo" class="forum-user-photo" src="" alt="">
        <span id="user-name" class="forum-user-name"></span>
        <button id="btn-logout" class="forum-logout-btn" type="button">Salir</button>
    </div>
`;

const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const userInfo = document.getElementById("user-info");
const userPhoto = document.getElementById("user-photo");
const userName = document.getElementById("user-name");

btnLogin.addEventListener("click", async () => {

    try{
        await signInWithPopup(auth, googleProvider);
    }catch(error){
        console.error("Error al iniciar sesión:", error);
        alert("No se pudo iniciar sesión. Intenta de nuevo.");
    }

});

btnLogout.addEventListener("click", async () => {
    await signOut(auth);
});

onAuthStateChanged(auth, (usuario) => {

    usuarioActual = usuario;

    if(usuario){

        btnLogin.style.display = "none";
        userInfo.style.display = "flex";
        userPhoto.src = usuario.photoURL || "";
        userName.textContent = usuario.displayName || usuario.email;

    }else{

        btnLogin.style.display = "inline-block";
        userInfo.style.display = "none";

    }

});

/* ---------------------------------------------------
   ENVIAR UN COMENTARIO NUEVO
   --------------------------------------------------- */

commentForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    if(!temaId) return;

    if(!usuarioActual){
        alert("Inicia sesión con Google para comentar.");
        return;
    }

    const texto = document.getElementById("comment-text").value.trim();

    if(!texto){
        return;
    }

    try{

        const comentariosRef = collection(db, "temas", temaId, "comentarios");

        await addDoc(comentariosRef, {
            texto,
            autorNombre: usuarioActual.displayName || "Usuario",
            autorFoto: usuarioActual.photoURL || "",
            autorUid: usuarioActual.uid,
            fecha: serverTimestamp()
        });

        /* Mantener actualizado el contador de respuestas
           que se muestra en la tarjeta del foro principal */

        const temaRef = doc(db, "temas", temaId);

        await updateDoc(temaRef, {
            respuestas: increment(1)
        });

        document.getElementById("comment-text").value = "";

    }catch(error){

        console.error("Error al publicar el comentario:", error);
        alert("No se pudo publicar el comentario. Intenta de nuevo.");

    }

});

/* ---------------------------------------------------
   INICIO
   --------------------------------------------------- */

if(temaId){
    cargarTema();
    iniciarComentarios();
}

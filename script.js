console.log("¡Script cargado correctamente!");

const slides = document.querySelectorAll(".slide");
const dots = document.querySelectorAll(".dot");
const slider = document.querySelector(".mini-slider");

let currentSlide = 0;
let isAnimating = false;

let touchStartY = 0;
let touchEndY = 0;

function showSlide(index){

    slides.forEach(slide=>{
        slide.classList.remove("active");
    });

    dots.forEach(dot=>{
        dot.classList.remove("active-dot");
    });

    slides[index].classList.add("active");

    dots[index].classList.add("active-dot");
}
function nextSlide(){

    if(isAnimating) return;

    isAnimating = true;

    currentSlide++;

    if(currentSlide >= slides.length){
        currentSlide = 0;
    }

    showSlide(currentSlide);

    setTimeout(() => {
        isAnimating = false;
    }, 800);
}

function prevSlide(){

    if(isAnimating) return;

    isAnimating = true;

    currentSlide--;

    if(currentSlide < 0){
        currentSlide = slides.length - 1;
    }

    showSlide(currentSlide);

    setTimeout(() => {
        isAnimating = false;
    }, 800);
}


/* SCROLL CON MOUSE */

let scrollCooldown = false;

/* Todo lo del slider solo corre si .mini-slider existe en la página
   (historia.html no tiene slider, así que esto evita que el script
   se rompa ahí y deje de ejecutar el código de abajo, como el menú) */

if(slider){

    slider.addEventListener("wheel", (e) => {

        e.preventDefault();

        if(scrollCooldown) return;

        scrollCooldown = true;

        if(e.deltaY > 0){
            nextSlide();
        }else{
            prevSlide();
        }

        setTimeout(() => {
            scrollCooldown = false;
        }, 700);

    });

    /* TECLADO */

    document.addEventListener("keydown", (e) => {

        if(e.key === "ArrowDown"){
            nextSlide();
        }

        if(e.key === "ArrowUp"){
            prevSlide();
        }

    });

    /* CELULAR - DESLIZAR */

    slider.addEventListener("touchstart", (e) => {

        touchStartY = e.changedTouches[0].screenY;

    });

    slider.addEventListener("touchend", (e) => {

        touchEndY = e.changedTouches[0].screenY;

        handleSwipe();

    });

    /* INICIO */

    showSlide(currentSlide);

}

function handleSwipe(){

    const swipeDistance = touchStartY - touchEndY;

    if(Math.abs(swipeDistance) < 50){
        return;
    }

    if(swipeDistance > 0){

        nextSlide();

    }else{

        prevSlide();

    }
}

/* CAMBIO AUTOMÁTICO */

//setInterval(() => {

  //  nextSlide();

//}, 7000);

/* MENU HAMBURGUESA */

const menuBtn = document.querySelector(".menu-toggle");
const menu = document.querySelector(".menu");

menuBtn.addEventListener("click", () => {

    menu.classList.toggle("active");

});

/* FILTRO DE CATEGORÍAS (página Negocios) */

const filtroCategoria = document.querySelector(".filter-select");

if(filtroCategoria){

    const businessCards = document.querySelectorAll(".business-card");
    const noResults = document.querySelector(".no-results");

    filtroCategoria.addEventListener("change", () => {

        const categoriaElegida = filtroCategoria.value;

        let visibles = 0;

        businessCards.forEach(card => {

            const categoriaCard = card.dataset.categoria;

            if(categoriaElegida === "todos" || categoriaCard === categoriaElegida){

                card.classList.remove("is-hidden");
                visibles++;

            }else{

                card.classList.add("is-hidden");

            }

        });

        if(noResults){
            noResults.classList.toggle("show", visibles === 0);
        }

    });

}

/* MAPA (página Mapa) — Leaflet + OpenStreetMap */

const mapDiv = document.getElementById("map");

if(mapDiv){

    /* Centro aproximado de Suljaa' (Xochistlahuaca), Guerrero */

    const centroSuljaa = [16.7918, -98.2421];

    /* Lista de negocios: mismos id usados en negocios.html (?negocio=id)
       Las coordenadas son APROXIMADAS alrededor de Suljaa' mientras se
       consiguen las reales de cada negocio. Para actualizarlas: clic
       derecho en Google Maps sobre el lugar exacto > copiar coordenadas
       > reemplazar lat/lng aquí abajo. */

    const negocios = [
        {
            id: "telar-nomndaa",
            nombre: "Telar Ñomndaa",
            categoria: "Artesanía",
            direccion: "Calle Principal s/n, Suljaa'",
            lat: 16.7935,
            lng: -98.2438
        },
        {
            id: "cocina-marcela",
            nombre: "Comedor San Miguel",
            categoria: "Comida y bebida",
            direccion: "Av. Centro 12, Suljaa'",
            lat: 16.7908,
            lng: -98.2410
        },
        {
            id: "posada-rio",
            nombre: "Posada Las Palmas",
            categoria: "Hospedaje",
            direccion: "Camino al Río 8, Suljaa'",
            lat: 16.7896,
            lng: -98.2455
        },
        {
            id: "ferreteria-lopez",
            nombre: "Ferretería López",
            categoria: "Servicios",
            direccion: "Carretera Suljaa' km 2",
            lat: 16.7950,
            lng: -98.2390
        },
        {
            id: "panaderia-sanjose",
            nombre: "Panadería San José",
            categoria: "Comida y bebida",
            direccion: "Calle Hidalgo 5, Suljaa'",
            lat: 16.7922,
            lng: -98.2402
        },
        {
            id: "barro-tradicion",
            nombre: "Barro y Tradición",
            categoria: "Artesanía",
            direccion: "Callejón del Sol 3, Suljaa'",
            lat: 16.7889,
            lng: -98.2418
        },
        {
            id: "cabanas-suljaa",
            nombre: "Cabañas Suljaa'",
            categoria: "Hospedaje",
            direccion: "Vereda Alta s/n, Suljaa'",
            lat: 16.7945,
            lng: -98.2460
        },
        {
            id: "abarrotes-esquina",
            nombre: "Abarrotes La Esquina",
            categoria: "Servicios",
            direccion: "Esquina Centro, Suljaa'",
            lat: 16.7915,
            lng: -98.2433
        }
    ];

    /* Crear el mapa */

    const map = L.map("map").setView(centroSuljaa, 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19
    }).addTo(map);

    /* Crear un marcador por negocio y guardarlo junto a su id */

    const marcadores = {};

    negocios.forEach(negocio => {

        const marker = L.marker([negocio.lat, negocio.lng]).addTo(map);

        marker.bindPopup(`
            <span class="popup-tag">${negocio.categoria}</span>
            <h4 class="popup-title">${negocio.nombre}</h4>
            <p>${negocio.direccion}</p>
            <a class="popup-link" href="negocios.html">Ver en Negocios →</a>
        `);

        marcadores[negocio.id] = marker;

    });

    /* Construir el panel lateral a partir del mismo arreglo */

    const sidebarList = document.getElementById("sidebar-list");

    negocios.forEach(negocio => {

        const li = document.createElement("li");
        li.className = "sidebar-item";
        li.dataset.id = negocio.id;

        li.innerHTML = `
            <span>${negocio.categoria}</span>
            <h4>${negocio.nombre}</h4>
        `;

        li.addEventListener("click", () => {

            map.setView([negocio.lat, negocio.lng], 17);
            marcadores[negocio.id].openPopup();

            document.querySelectorAll(".sidebar-item").forEach(item => {
                item.classList.remove("is-active");
            });

            li.classList.add("is-active");

        });

        sidebarList.appendChild(li);

    });

    /* Si llegamos desde negocios.html con ?negocio=id,
       centrar y abrir ese marcador automáticamente */

    const parametros = new URLSearchParams(window.location.search);
    const idNegocio = parametros.get("negocio");

    if(idNegocio && marcadores[idNegocio]){

        const negocioActivo = negocios.find(n => n.id === idNegocio);

        map.setView([negocioActivo.lat, negocioActivo.lng], 17);
        marcadores[idNegocio].openPopup();

        const itemActivo = document.querySelector(`.sidebar-item[data-id="${idNegocio}"]`);

        if(itemActivo){
            itemActivo.classList.add("is-active");
        }

    }

    /* ---------------------------------------------------
       LOCALIDADES DEL MUNICIPIO (cajas con mapa miniatura
       + modal con mapa ampliado y negocios propios)
       --------------------------------------------------- */

    /* Coordenadas reales de cada localidad dentro del
       municipio de Xochistlahuaca (Suljaa'). La de Guadalupe
       Victoria es aproximada (a partir de su distancia
       reportada a la cabecera); el resto son coordenadas
       puntuales encontradas para cada poblado. */

    const localidades = [
        {
            id: "arroyo-guacamaya",
            nombre: "Arroyo Guacamaya",
            lat: 16.818,
            lng: -98.221,
            negocios: [
                {
                    nombre: "Tienda Guacamaya",
                    categoria: "Servicios",
                    direccion: "Centro de Arroyo Guacamaya",
                    lat: 16.8183,
                    lng: -98.2206
                },
                {
                    nombre: "Comedor Economico",
                    categoria: "Comida y bebida",
                    direccion: "Camino principal, Arroyo Guacamaya",
                    lat: 16.8176,
                    lng: -98.2215
                }
            ]
        },
        {
            id: "arroyo-pajaro",
            nombre: "Arroyo Pájaro",
            lat: 16.8199,
            lng: -98.2038,
            negocios: [
                {
                    nombre: "Abarrotes Pájaro",
                    categoria: "Servicios",
                    direccion: "Centro de Arroyo Pájaro",
                    lat: 16.8202,
                    lng: -98.2033
                },
                {
                    nombre: "Telares Amuzgos",
                    categoria: "Artesanía",
                    direccion: "Camino vecinal, Arroyo Pájaro",
                    lat: 16.8195,
                    lng: -98.2044
                }
            ]
        },
        {
            id: "arroyo-grande",
            nombre: "Arroyo Grande",
            lat: 16.793889,
            lng: -98.149722,
            negocios: [
                {
                    nombre: "Cocina Arroyo Grande",
                    categoria: "Comida y bebida",
                    direccion: "Centro de Arroyo Grande",
                    lat: 16.7942,
                    lng: -98.1493
                },
                {
                    nombre: "Misceláneo San Pedro",
                    categoria: "Servicios",
                    direccion: "Camino principal, Arroyo Grande",
                    lat: 16.7935,
                    lng: -98.1502
                }
            ]
        },
        {
            id: "cozoyoapan",
            nombre: "Cozoyoapán",
            lat: 16.7888,
            lng: -98.2427,
            negocios: [
                {
                    nombre: "Taller Textil Cozoyoapán",
                    categoria: "Artesanía",
                    direccion: "Centro de Cozoyoapán",
                    lat: 16.7891,
                    lng: -98.2422
                },
                {
                    nombre: "Taqueria El Carboncito",
                    categoria: "Comida y bebida",
                    direccion: "Calle principal, Cozoyoapán",
                    lat: 16.7884,
                    lng: -98.2432
                }
            ]
        },
        {
            id: "guadalupe-victoria",
            nombre: "Guadalupe Victoria",
            lat: 16.75419915704101,
            lng: -98.18075074166201,
            negocios: [
                {
                    nombre: "Restaurante Guadalupe",
                    categoria: "Comida y bebida",
                    direccion: "Centro de Guadalupe Victoria",
                    lat: 16.75419915704101,
                    lng: -98.18075074166201
                },
                {
                    nombre: "Ferretería Victoria",
                    categoria: "Servicios",
                    direccion: "Calle principal, Guadalupe Victoria",
                    lat: 16.8397,
                    lng: -98.1921
                }
            ]
        },
        {
            id: "los-lirios",
            nombre: "Los Lirios",
            lat: 16.7392,
            lng: -98.2149,
            negocios: [
                {
                    nombre: "Posada Los Lirios",
                    categoria: "Hospedaje",
                    direccion: "Centro de Los Lirios",
                    lat: 16.7395,
                    lng: -98.2144
                },
                {
                    nombre: "Panadería Flor de Cenpasúchil",
                    categoria: "Comida y bebida",
                    direccion: "Camino principal, Los Lirios",
                    lat: 16.7389,
                    lng: -98.2154
                }
            ]
        }
    ];

    /* Construir el grid de cajas, cada una con su mini-mapa */

    const localityGrid = document.getElementById("locality-grid");

    localidades.forEach(localidad => {

        const card = document.createElement("div");
        card.className = "locality-card";
        card.dataset.id = localidad.id;

        card.innerHTML = `
            <div class="locality-thumb">
                <div id="thumb-${localidad.id}" style="width:100%; height:100%;"></div>
                <div class="locality-thumb-overlay"></div>
            </div>
            <div class="locality-info">
                <h3>${localidad.nombre}</h3>
                <p>Municipio de Xochistlahuaca</p>
                <span class="locality-expand">Ver mapa ampliado →</span>
            </div>
        `;

        card.addEventListener("click", () => abrirModalLocalidad(localidad));

        localityGrid.appendChild(card);

        /* Mini-mapa estático (sin controles) dentro de la caja */

        const thumbMap = L.map(`thumb-${localidad.id}`, {
            zoomControl: false,
            attributionControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false
        }).setView([localidad.lat, localidad.lng], 14);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19
        }).addTo(thumbMap);

        L.marker([localidad.lat, localidad.lng]).addTo(thumbMap);

    });

    /* ---------- MODAL ---------- */

    const modal = document.getElementById("locality-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalSubtitle = document.getElementById("modal-subtitle");
    const modalClose = document.getElementById("modal-close");

    let modalMap = null;

    function abrirModalLocalidad(localidad){

        modalTitle.textContent = localidad.nombre;
        modalSubtitle.textContent = `${localidad.negocios.length} negocios registrados en esta localidad`;

        modal.classList.add("is-open");

        /* Si ya existía un mapa anterior en el modal, lo destruimos
           antes de crear uno nuevo (Leaflet no permite reusar el
           mismo contenedor sin esto) */

        if(modalMap){
            modalMap.remove();
        }

        modalMap = L.map("modal-map").setView([localidad.lat, localidad.lng], 15);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap",
            maxZoom: 19
        }).addTo(modalMap);

        /* Marcador de la localidad misma */

        L.marker([localidad.lat, localidad.lng])
            .addTo(modalMap)
            .bindPopup(`<h4 class="popup-title">${localidad.nombre}</h4>`);

        /* Marcadores de los negocios de esa localidad */

        localidad.negocios.forEach(negocio => {

            L.marker([negocio.lat, negocio.lng])
                .addTo(modalMap)
                .bindPopup(`
                    <span class="popup-tag">${negocio.categoria}</span>
                    <h4 class="popup-title">${negocio.nombre}</h4>
                    <p>${negocio.direccion}</p>
                `);

        });

        /* Leaflet necesita recalcular el tamaño cuando el
           contenedor pasa de invisible (display:none) a visible */

        setTimeout(() => {
            modalMap.invalidateSize();
        }, 100);

    }

    function cerrarModal(){
        modal.classList.remove("is-open");
    }

    modalClose.addEventListener("click", cerrarModal);

    /* Cerrar al hacer clic fuera del contenido */

    modal.addEventListener("click", (e) => {

        if(e.target === modal){
            cerrarModal();
        }

    });

    /* Cerrar con la tecla Escape */

    document.addEventListener("keydown", (e) => {

        if(e.key === "Escape" && modal.classList.contains("is-open")){
            cerrarModal();
        }

    });

}
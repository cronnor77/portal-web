// ===================================
// FIREBASE — CONFIGURACIÓN E INICIALIZACIÓN
// Proyecto: suljaa-foro
// ===================================
//
// Este archivo conecta tu sitio con Firebase (login con Google +
// base de datos Firestore). Se carga como módulo de JavaScript,
// por eso usa import/export en vez del estilo normal de script.js.

import { initializeApp }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    doc,
    getDoc,
    getDocs,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    increment,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* Credenciales reales del proyecto suljaa-foro */

const firebaseConfig = {
    apiKey: "AIzaSyCIck4nn2W67dfFFWEsgwv3OJD4ieR95wI",
    authDomain: "suljaa-foro.firebaseapp.com",
    projectId: "suljaa-foro",
    storageBucket: "suljaa-foro.firebasestorage.app",
    messagingSenderId: "909585927334",
    appId: "1:909585927334:web:c93a434beec6c5580a3867"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

/* Exportamos todo lo que las páginas del foro van a necesitar,
   para no repetir la inicialización en cada archivo */

export {
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
    getDocs,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    increment,
    updateDoc
};

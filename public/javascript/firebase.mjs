// firebase.mjs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";

// Configurações do Firebase
import { firebaseConfig } from './config.mjs';

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);

// Inicializa Realtime Database
const database = getDatabase(app);

// Inicializa Cloud Storage
const storage = getStorage(app);

export { database, storage };

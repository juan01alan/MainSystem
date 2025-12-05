// Replace the import lines with CDN links
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";



// a função json está aqui

    async function carregarJSONUniversal(fonte) {
      // Se for um arquivo File
      if (fonte instanceof File) {
        const texto = await fonte.text();
        return JSON.parse(texto);
      }
      
      // Se for string (URL ou caminho relativo)
      if (typeof fonte === 'string') {
        const resposta = await fetch(fonte);
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
        return await resposta.json();
      }
      
      throw new Error('Fonte inválida');
    }

// Your web app's Firebase configuration// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBaA1GvG0O9kxtvM_jRkMwGTkkqDUK4cb8",
  authDomain: "linen-works-420623.firebaseapp.com",
  databaseURL: "https://linen-works-420623-default-rtdb.firebaseio.com",
  projectId: "linen-works-420623",
  storageBucket: "linen-works-420623.firebasestorage.app",
  messagingSenderId: "1024746152058",
  appId: "1:1024746152058:web:7783459f7a045de5f01bc3"
};
console.log(firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);
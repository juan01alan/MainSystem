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

    const dados = await carregarJSONUniversal('../../dados.json');
    console.log(dados.firebaseConfig);


// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: dados.firebaseConfig.apiKey,
    authDomain: dados.firebaseConfig.authDomain,
    databaseURL: dados.firebaseConfig.databaseURL,
    projectId: dados.firebaseConfig.projectId,
    storageBucket: dados.firebaseConfig.storageBucket,
    messagingSenderId: dados.firebaseConfig.messagingSenderId,
    appId: dados.firebaseConfig.appId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);
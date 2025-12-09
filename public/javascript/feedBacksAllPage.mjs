// Na página de feedbacks
const urlParams = new URLSearchParams(window.location.search);
const obraId = urlParams.get('obra');
const obraNome = urlParams.get('nome');

console.log(obraId);
// Usar obraId para buscar os feedbacks específicos desta obra

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, query, orderByChild, equalTo, get, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

import { firebaseConfig } from './config.mjs';
const fbConfig = firebaseConfig;

// Inicialize o Firebase
const app = initializeApp(fbConfig);
const db = getDatabase(app);

// Função para obter parâmetros da URL
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        obraId: params.get('obra'),
        obraNome: params.get('nome')
    };
}// Função para buscar feedbacks por obraId no Realtime Database (sem índice)
async function getFeedbacksByObraId(obraId) {
    try {
        const feedbacksRef = ref(db, "feedbacks");
        
        // Busca todos os feedbacks
        const snapshot = await get(feedbacksRef);
        const feedbacks = [];
        
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const feedback = childSnapshot.val();
                // Filtra pelo obraId no lado do cliente
                if (feedback.obraId === obraId) {
                    feedbacks.push({ 
                        id: childSnapshot.key, 
                        ...feedback 
                    });
                }
            });
        }
        return feedbacks;
    } catch (error) {
        console.error("Erro ao buscar feedbacks:", error);
        throw error;
    }
}

// Função para criar o elemento de feedback no DOM
function createFeedbackElement(feedback) {
    // Formata a data se existir
    let dataFormatada = '';
    if (feedback.data) {
        let data;
        // Verifica se é timestamp do Firebase ou string
        if (feedback.data && typeof feedback.data === 'object' && feedback.data.seconds) {
            // Se for timestamp do Firestore (ainda pode aparecer em alguns dados)
            data = new Date(feedback.data.seconds * 1000);
        } else if (typeof feedback.data === 'number') {
            // Se for timestamp em milissegundos
            data = new Date(feedback.data);
        } else if (typeof feedback.data === 'string') {
            // Se for string ISO
            data = new Date(feedback.data);
        } else {
            data = new Date();
        }
        
        if (!isNaN(data.getTime())) {
            dataFormatada = data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
    }

    // Cria o elemento de feedback
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = 'w-full bg-white dark:bg-zinc-800 rounded-xl shadow p-6';
    
    // Prepara as categorias HTML
    let categoriasHTML = '';
    if (feedback.categorias && Array.isArray(feedback.categorias) && feedback.categorias.length > 0) {
        categoriasHTML = `
            <div class="flex flex-wrap gap-2 mb-4">
                ${feedback.categorias.map(cat => `<span class="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-3 py-1 rounded-full">${cat}</span>`).join('')}
            </div>
        `;
    }

    // Prepara o HTML da avaliação
    let avaliacaoHTML = '';
    if (feedback.avaliacao) {
        avaliacaoHTML = `
            <div class="flex items-center bg-primary/10 text-primary dark:bg-primary/20 dark:text-yellow-300 px-3 py-1 rounded-full">
                <span class="material-symbols-outlined text-lg mr-1">star</span>
                <span class="font-bold">${feedback.avaliacao}/5</span>
            </div>
        `;
    }

    // Prepara o HTML da imagem
    let imagemHTML = '';
    if (feedback.imagemUrl) {
        imagemHTML = `
            <div class="mt-4">
                <img src="${feedback.imagemUrl}" alt="Imagem do feedback" class="rounded-lg w-full h-auto max-h-64 object-cover">
            </div>
        `;
    }

    feedbackDiv.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div>
                <h3 class="text-lg font-bold text-primary dark:text-white">${feedback.titulo || 'Sem título'}</h3>
                ${dataFormatada ? `<p class="text-sm text-gray-500 dark:text-gray-400">${dataFormatada}</p>` : ''}
            </div>
            ${avaliacaoHTML}
        </div>
        <p class="text-gray-700 dark:text-gray-300 mb-4">${feedback.comentario || 'Sem comentário'}</p>
        ${categoriasHTML}
        ${imagemHTML}
        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
            <p><strong>Enviado por:</strong> ${feedback.autor || 'Anônimo'}</p>
        </div>
    `;
    return feedbackDiv;
}

// Função principal que é executada quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', async function() {
    const params = getUrlParams();
    const obraId = params.obraId;
    const obraNome = params.obraNome;

    // Atualiza o título da página
    const tituloElement = document.getElementById('tituloObra');
    if (obraNome && tituloElement) {
        tituloElement.textContent = `Feedbacks: ${decodeURIComponent(obraNome)}`;
    }

    // Busca os feedbacks
    if (obraId) {
        try {
            const feedbacks = await getFeedbacksByObraId(obraId);
            const container = document.getElementById('feedbacksContainer');

            if (!container) {
                console.error("Elemento 'feedbacksContainer' não encontrado!");
                return;
            }

            if (feedbacks.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-12">
                        <span class="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600">reviews</span>
                        <h3 class="text-xl font-bold text-gray-700 dark:text-gray-300 mt-4">Nenhum feedback encontrado</h3>
                        <p class="text-gray-500 dark:text-gray-400">Esta obra ainda não possui feedbacks.</p>
                    </div>
                `;
            } else {
                // Ordena feedbacks por data (mais recente primeiro)
                feedbacks.sort((a, b) => {
                    const timeA = a.data ? (a.data.seconds ? a.data.seconds * 1000 : new Date(a.data).getTime()) : 0;
                    const timeB = b.data ? (b.data.seconds ? b.data.seconds * 1000 : new Date(b.data).getTime()) : 0;
                    return timeB - timeA;
                });

                // Limpa o container primeiro
                container.innerHTML = '';
                
                // Adiciona cada feedback
                feedbacks.forEach(feedback => {
                    const feedbackElement = createFeedbackElement(feedback);
                    container.appendChild(feedbackElement);
                });
            }
        } catch (error) {
            console.error("Erro ao buscar feedbacks:", error);
            const container = document.getElementById('feedbacksContainer');
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-12 text-red-600 dark:text-red-400">
                        <span class="material-symbols-outlined text-6xl">error</span>
                        <h3 class="text-xl font-bold mt-4">Erro ao carregar feedbacks</h3>
                        <p>Por favor, tente novamente mais tarde.</p>
                        <p class="text-xs mt-2">${error.message}</p>
                    </div>
                `;
            }
        }
    } else {
        // Se não houver obraId na URL
        const container = document.getElementById('feedbacksContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12 text-yellow-600 dark:text-yellow-400">
                    <span class="material-symbols-outlined text-6xl">warning</span>
                    <h3 class="text-xl font-bold mt-4">Obra não especificada</h3>
                    <p>Não foi possível identificar a obra. Volte à página anterior e tente novamente.</p>
                </div>
            `;
        }
    }
});
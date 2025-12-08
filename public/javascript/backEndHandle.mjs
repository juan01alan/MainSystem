import { onChildAdded, onValue } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import { database } from "./firebase.mjs";
import { storage } from "./firebase.mjs";
import { updateLocal, storeLocal, retrieveLocal } from "./storaManager.js";
import { 
    ref, push, set, get, remove, update, query, orderByChild, 
    equalTo, orderByKey, limitToFirst, limitToLast 
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import { ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";

import { viewOperator as vo } from "./gerente.mjs";

// VARIÁVEIS GLOBAIS
let operatorList = [];

// INICIALIZAÇÃO DA PÁGINA
document.addEventListener("DOMContentLoaded", () => {
    initializePage();
});

//SEM BUGS CRITICOS
//Nao da pra incluir projetos novos para operadores cadastrados na tela de cadastro de operadores
/**
 * Inicializa a página com base nos elementos presentes
 */
async function initializePage() {
    verificarECriarProjeto0();
  console.log("🚀 Inicializando página...");
  console.log("📄 Página atual:", window.location.pathname);
  
  // Detectar qual página está sendo carregada
  const isOperatorChatPage = document.getElementById("nomedoProjetoOutput") && document.getElementById("messages");
  const isGerenteChatPage = document.getElementById("messagesGerente");
  const isObrasPage = document.getElementById("divToObras");
  const isOperatorsPage = document.getElementById("operatorList");
  const isMinhasObrasPage = document.getElementById("minhasObrasScreen");
  const isFeedbackPage = document.getElementById("submitFeedback");
  const emAndamentoBt = document.getElementById("emAndamentoBt");
  const concluidoBt = document.getElementById("concluidoBt");
  console.log("🔍 Detecção de páginas:", {
    isOperatorChatPage,
    isGerenteChatPage,
    isObrasPage,
    isOperatorsPage,
    isMinhasObrasPage,
    isFeedbackPage
  });
  
  if (emAndamentoBt) {
    inicializeBtsStatus();
  }
  //tela de cadastro operador
  const competencias = document.getElementById('competencias');
  if (competencias) {
    const clickBt = document.getElementById('btnSalvar');
    
            // Botão Salvar
            clickBt.addEventListener('click', function() {
                const nomeOperador = document.getElementById('nomeOperador').value.trim();
                let competencias = document.getElementById('competencias').value;
                competencias.slice(",");
                console.log(competencias, 'COMPETENCIAS ');
                if (!nomeOperador) {
                    alert('Por favor, preencha o nome do operador.');
                    document.getElementById('nomeOperador').focus();
                    return;
                }
                
                if (!competencias) {
                    alert('Por favor, preencha as competências do operador.');
                    document.getElementById('competencias').focus();
                    return;
                }
                
                // Aqui você pode adicionar a lógica para salvar os dados
                console.log('Dados do operador:');
                console.log('Nome:', nomeOperador);
                console.log('Data de cadastro:', document.getElementById('dataCadastro').value);
                console.log('Competências:', competencias);
                console.log('Status:', document.getElementById('statusOperador').value);
                
                // Simulação de salvamento bem-sucedido
                criarOuAtualizarOperadorCOMDATA(nomeOperador,0, {
        cliente: "InitialOrder",
        obra: "InitialOrder",
        localizacao: "InitialOrder",
        descricao: "InitialOrder",
        email: "InitialOrder",
        whatsappCliente: "InitialOrder",
        Criado:"InitialOrder",
        cpfCnpjCliente: "InitialOrder",
        operadores: [],
        dataInicial: "InitialOrder",
        dataFinal: "InitialOrder",
        managerId: 0,
        status: 1}, {
                    nome:  nomeOperador,
                    competencias: competencias,
                    criadoEm: document.getElementById('dataCadastro').value,
                    status: document.getElementById('statusOperador').value,
                    projetos:{}
                    
                })
                
            });

  }
  // Inicializa feedback se estiver na página de feedback
  if (isFeedbackPage) {
    console.log("📝 Inicializando sistema de feedback");
    inicializarSistemaFeedback();
  }
  
  // Inicializa chat do gerente se estiver na página do gerente
  if (isGerenteChatPage) {
    console.log("👨‍💼 Inicializando chat do gerente");
    await setUpMsgsGerente();
  }
  
  // Inicializa chat do operador se estiver na página do operador
  if (isOperatorChatPage) {
    console.log("👷 Inicializando chat do operador");
    await OperatorChatDOM();
    
    // Configura botão de envio de mensagem
    const sendMsgBt = document.getElementById("sendMessageBtOperator");
    if (sendMsgBt) {
      setupMessageButton(sendMsgBt);
    }
  }
  
  // Inicializa lista de operadores se estiver na página de operadores
  if (isOperatorsPage) {
    console.log("👥 Inicializando lista de operadores");
    const listaOperators = document.getElementById("operatorList");
    if (listaOperators) {
      await MAKEOPERATORSDOM(listaOperators);
    }
  }
  
  // Inicializa lista de obras se estiver na página de obras
  if (isObrasPage) {
    console.log("🏗️ Inicializando lista de obras");
    const divObrasList = document.getElementById("divToObras");
    if (divObrasList) {
      await HANDLEOBRASDOM();
    }
  }
  
  // Inicializa tela de minhas obras se estiver na página do operador
  if (isMinhasObrasPage) {
    console.log("📱 Inicializando tela de minhas obras");
    await handleOperatorsObra();
  }
  
  // Configura botão de salvar projeto
  const botaoSalvar = document.querySelector("#submitSalvar");
  if (botaoSalvar) {
    await setupSaveButton(botaoSalvar);
  }
}

async function inicializeBtsStatus(){
    const chatAtual = retrieveLocal("chatAtual");
    const projeto = await getProjectByName(chatAtual);
    console.log('chat atual: ', projeto);
    const emAndamentoBt = document.getElementById("emAndamentoBt");
  const concluidoBt = document.getElementById("concluidoBt");
  emAndamentoBt.addEventListener('change',()=>{
    
        const confirmacao = confirm(`Confirmar mudança para em Andamento?`);
        
        if (confirmacao) {
            
            emAndamentoBt.checked = true;
            atualizarProjeto(projeto.id, 'status', 0)
        } else{
            emAndamentoBt.checked = false;
        }
  });
  concluidoBt.addEventListener('change',()=>{

        const confirmacao = confirm(`Confirmar mudança concluido?`);
        
        if (confirmacao) {
            
            concluidoBt.checked = true;
            atualizarProjeto(projeto.id, 'status', 1)
        } else{
            concluidoBt.checked = false;
            
        }

  });

}

// Alterar uma chave especifica num projeto id especifico
async function atualizarProjeto(id, campo, valor) {
  try {
    await update(ref(database, `projetos/${id}`), { [campo]: valor });
    console.log(`✅ ${campo} = ${valor}`);
    return true;
  } catch (error) {
    console.error(`❌ ${error.message}`);
    return false;
  }
}
/**
 * Busca operador pelo nome (case-insensitive)
 * @param {string} nomeOperador - Nome do operador a buscar
 * @returns {Promise<Object|null>} - Operador encontrado ou null
 */
async function getOperatorByName(nomeOperador) {
    try {
        // Validação do parâmetro
        if (!nomeOperador || typeof nomeOperador !== 'string' || nomeOperador.trim() === '') {
            console.warn('⚠️ Nome do operador inválido');
            return null;
        }
        
        const nomeBusca = nomeOperador.trim().toLowerCase();
        console.log(`🔍 Buscando operador: "${nomeBusca}"`);
        
        // Referência à coleção de operadores
        const operadoresRef = ref(database, 'operadores');
        const snapshot = await get(operadoresRef);
        
        // Se não houver operadores
        if (!snapshot.exists()) {
            console.log('📭 Nenhum operador cadastrado');
            return null;
        }
        
        const operadores = snapshot.val();
        
        // Procura pelo operador com nome correspondente
        for (const operadorId in operadores) {
            const operador = operadores[operadorId];
            
            // Verifica se o operador tem nome e se corresponde (case-insensitive)
            if (operador.nome && 
                operador.nome.trim().toLowerCase() === nomeBusca) {
                
                console.log(`✅ Operador encontrado: ${operadorId} - ${operador.nome}`);
                
                // Retorna o operador com ID incluso
                return {
                    id: operadorId,
                    ...operador
                };
            }
        }
        
        console.log(`❌ Operador não encontrado: "${nomeBusca}"`);
        return null;
        
    } catch (error) {
        console.error('💥 Erro ao buscar operador por nome:', error);
        return null;
    }
}
/**
 * Coleta todos os dados do formulário de feedback
 * @returns {Object} Objeto com todos os dados do formulário
 */
function coletarDadosFeedback() {
    // 1. Dados do Projeto (campos automáticos)
    const dadosProjeto = {
        obra: document.getElementById("obraIp")?.value || "",
        nomeCompleto: document.getElementById("nomeIp")?.value || "",
        // Você pode adicionar mais dados automáticos se necessário
        timestamp: new Date().toISOString(),
        dataEnvio: new Date().toLocaleDateString('pt-BR'),
        horaEnvio: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    // 2. Avaliação (sistema de rating)
    const ratingContainer = document.getElementById("feedbackNota");
    let avaliacaoGeral = 0;
    
    // Busca por botões de avaliação
    const botoesAvaliacao = ratingContainer?.querySelectorAll('button[value]') || [];
    
    // Pega o botão selecionado (com fundo diferente)
    for (const botao of botoesAvaliacao) {
        // Verifica se o botão está selecionado (tem cor de fundo)
        const estilo = window.getComputedStyle(botao);
        const backgroundColor = estilo.backgroundColor;
        const bgColor = estilo.backgroundColor || estilo.background;
        
        // Se o botão tiver cor de fundo (não transparente), considera como selecionado
        if (backgroundColor !== 'rgba(0, 0, 0, 0)' && 
            backgroundColor !== 'transparent' &&
            !botao.classList.contains('bg-transparent')) {
            avaliacaoGeral = parseInt(botao.value) + 1; // Converte de 0-9 para 1-10
            break;
        }
    }
    
    // 3. Comentários Adicionais
    const comentarios = document.getElementById("adicionalComent")?.value || "";

    // 4. Texto da avaliação baseado na nota
    const textoAvaliacao = gerarTextoAvaliacao(avaliacaoGeral);
    
    // 5. Status do envio
    const status = {
        enviado: false,
        dataEnvio: null,
        ip: null // Você pode obter o IP se necessário
    };

    // Retorna todos os dados em um objeto organizado
    return {
        // Dados básicos
        ...dadosProjeto,
        
        // Avaliação
        avaliacao: {
            nota: avaliacaoGeral,
            texto: textoAvaliacao,
            escala: "1-10"
        },
        
        // Comentários
        comentarios: {
            texto: comentarios,
            possuiComentarios: comentarios.trim().length > 0,
            tamanho: comentarios.length
        },
        
        // Metadados
        metadata: {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            linguagem: navigator.language,
            plataforma: navigator.platform
        },
        
        // Status
        status: status
    };
}

/**
 * Gera texto descritivo baseado na nota
 * @param {number} nota - Nota de 1 a 10
 * @returns {string} Texto da avaliação
 */
function gerarTextoAvaliacao(nota) {
    if (nota >= 9) return "Excelente";
    if (nota >= 7) return "Muito Bom";
    if (nota >= 5) return "Bom";
    if (nota >= 3) return "Regular";
    if (nota >= 1) return "Ruim";
    return "Não Avaliado";
}

/**
 * Valida os dados do feedback antes de enviar
 * @param {Object} dados - Dados do feedback
 * @returns {Object} Resultado da validação
 */
function validarFeedback(dados) {
    const erros = [];
    
    // Verifica se a obra foi preenchida
    if (!dados.obra || dados.obra.trim() === "") {
        erros.push("Nome da obra não preenchido");
    }
    
    // Verifica se o nome foi preenchido
    if (!dados.nomeCompleto || dados.nomeCompleto.trim() === "") {
        erros.push("Nome completo não preenchido");
    }
    
    // Verifica se a avaliação foi feita
    if (dados.avaliacao.nota === 0) {
        erros.push("Por favor, selecione uma avaliação");
    }
    
    // Verifica se os comentários são muito curtos (se preenchidos)
    if (dados.comentarios.texto.trim().length > 0 && dados.comentarios.texto.length < 5) {
        erros.push("Os comentários devem ter pelo menos 5 caracteres");
    }
    
    // Verifica se os comentários são muito longos
    if (dados.comentarios.texto.length > 1000) {
        erros.push("Os comentários não podem exceder 1000 caracteres");
    }
    
    return {
        valido: erros.length === 0,
        erros: erros,
        mensagem: erros.length === 0 ? "Dados válidos" : "Corrija os erros abaixo"
    };
}

/**
 * Formata os dados para exibição ou envio
 * @param {Object} dados - Dados do feedback
 * @returns {Object} Dados formatados
 */
function formatarDadosFeedback(dados) {
    return {
        resumo: `Feedback de ${dados.nomeCompleto} para a obra "${dados.obra}"`,
        detalhes: {
            obra: dados.obra,
            cliente: dados.nomeCompleto,
            avaliacao: `${dados.avaliacao.nota}/10 - ${dados.avaliacao.texto}`,
            comentarios: dados.comentarios.texto || "Sem comentários adicionais",
            data: dados.dataEnvio,
            hora: dados.horaEnvio
        },
        paraJSON: function() {
            return JSON.stringify(this.detalhes, null, 2);
        },
        paraTexto: function() {
            return `
            📋 FEEDBACK RECEBIDO
            
            Obra: ${this.detalhes.obra}
            Cliente: ${this.detalhes.cliente}
            Avaliação: ${this.detalhes.avaliacao}
            
            Comentários:
            ${this.detalhes.comentarios}
            
            Enviado em: ${this.detalhes.data} às ${this.detalhes.hora}
            `;
        }
    };
}

/**
 * Função para inicializar o sistema de rating (botões clicáveis)
 */
function inicializarSistemaRating() {
    const botoesRating = document.querySelectorAll('#feedbackNota button[value]');
    const textoAvaliacao = document.getElementById('avaliacaoshowtext');
    
    if (botoesRating.length === 0) return;
    
    // Adiciona evento de clique a cada botão
    botoesRating.forEach(botao => {
        botao.addEventListener('click', function() {
            const valor = parseInt(this.value);
            const nota = valor + 1; // Converte para escala 1-10
            
            // Remove a seleção de todos os botões
            botoesRating.forEach(b => {
                b.classList.remove('bg-secondary', 'text-white');
                b.classList.add('bg-transparent', 'text-secondary');
            });
            
            // Seleciona os botões até o clicado
            for (let i = 0; i <= valor; i++) {
                botoesRating[i].classList.remove('bg-transparent', 'text-secondary');
                botoesRating[i].classList.add('bg-secondary', 'text-white');
            }
            
            // Atualiza o texto da avaliação
            if (textoAvaliacao) {
                const texto = gerarTextoAvaliacao(nota);
                textoAvaliacao.textContent = `Sua Avaliação: ${nota}/10 - ${texto}`;
            }
            
            console.log(`⭐ Avaliação selecionada: ${nota}/10`);
        });
        
        // Efeito hover
        botao.addEventListener('mouseenter', function() {
            const valor = parseInt(this.value);
            
            // Mostra preview do hover
            botoesRating.forEach((b, index) => {
                if (index <= valor) {
                    b.classList.add('opacity-80');
                }
            });
        });
        
        botao.addEventListener('mouseleave', function() {
            botoesRating.forEach(b => {
                b.classList.remove('opacity-80');
            });
        });
    });
}

/**
 * Função para enviar os dados do feedback (exemplo)
 * @param {Object} dados - Dados do feedback
 * @returns {Promise} Resultado do envio
 *//**
 * Envia feedback para o Firebase
 * @param {Object} dados - Dados do feedback coletados do formulário
 * @returns {Promise<Object>} Resultado do envio
 */
async function enviarFeedback(dados) {
    try {
        // 1. Obtém o ID do projeto do localStorage
        let projectAtual = retrieveLocal("IdFeedBack");
        
        if (!projectAtual) {
            console.error('❌ ID do projeto não encontrado no localStorage');
    const urlParams = new URLSearchParams(window.location.search);
            projectAtual = urlParams.get("id");
        }
        
        console.log('📤 Enviando feedback para o projeto:', projectAtual);
        console.log('📊 Dados do feedback:', dados);
        
        // 2. Prepara os dados para o Firebase
        const dadosFirebase = {
            // Dados do projeto
            projetoId: projectAtual,
            obra: dados.obra || '',
            cliente: dados.nomeCompleto || '',
            
            // Avaliação
            nota: dados.avaliacao?.nota || 0,
            textoAvaliacao: dados.avaliacao?.texto || '',
            
            // Comentários
            comentarios: dados.comentarios?.texto || '',
            possuiComentarios: dados.comentarios?.possuiComentarios || false,
            
            // Metadados
            dataEnvio: new Date().toISOString(),
            dataEnvioFormatada: new Date().toLocaleDateString('pt-BR'),
            horaEnvio: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            
            // Informações do navegador
            userAgent: navigator.userAgent.substring(0, 100), // Limita tamanho
            linguagem: navigator.language,
            
            // Status
            status: 'recebido',
            processado: false,
            
            // Timestamp para ordenação
            timestamp: Date.now()
        };
        
        // 3. Referência para o Firebase
        // Estrutura: feedbacks/{projectAtual}/{feedbackId}
        const feedbackRef = ref(database, `feedbacks/${projectAtual}`);
        const novoFeedbackRef = push(feedbackRef);
        const feedbackId = novoFeedbackRef.key;
        
        // 4. Adiciona o ID do feedback aos dados
        dadosFirebase.id = feedbackId;
        
        // 5. Salva no Firebase
        await set(novoFeedbackRef, dadosFirebase);
        
        console.log(`✅ Feedback enviado com sucesso! ID: ${feedbackId}`);
        
        // 6. Atualiza o projeto com a referência do feedback (opcional)
        try {
            await atualizarProjetoComFeedback(projectAtual, feedbackId, dadosFirebase.nota);
        } catch (error) {
            console.warn('⚠️ Não foi possível atualizar o projeto, mas o feedback foi salvo');
        }
        
        return {
            success: true,
            feedbackId: feedbackId,
            projetoId: projectAtual,
            message: 'Feedback enviado com sucesso!',
            dados: dadosFirebase,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ Erro ao enviar feedback para o Firebase:', error);
        return {
            success: false,
            error: error.message,
            message: 'Erro ao enviar feedback para o banco de dados'
        };
    }
}

/**
 * Atualiza o projeto com a referência do feedback
 */
async function atualizarProjetoComFeedback(projetoId, feedbackId, nota) {
    try {
        const projetoRef = ref(database, `projetos/${projetoId}`);
        
        // Primeiro obtém os dados atuais do projeto
        const snapshot = await get(projetoRef);
        
        if (snapshot.exists()) {
            const projeto = snapshot.val();
            
            // Prepara atualizações
            const updates = {
                atualizadoEm: new Date().toISOString(),
                temFeedback: true
            };
            
            // Adiciona ao array de feedbacks se existir, ou cria novo
            if (projeto.feedbacks && Array.isArray(projeto.feedbacks)) {
                updates.feedbacks = [...projeto.feedbacks, feedbackId];
            } else {
                updates.feedbacks = [feedbackId];
            }
            
            // Atualiza a média de notas se existir
            if (nota && nota > 0) {
                if (projeto.avaliacoes && projeto.avaliacoes.total && projeto.avaliacoes.media) {
                    const novoTotal = projeto.avaliacoes.total + 1;
                    const novaMedia = ((projeto.avaliacoes.media * projeto.avaliacoes.total) + nota) / novoTotal;
                    
                    updates.avaliacoes = {
                        total: novoTotal,
                        media: parseFloat(novaMedia.toFixed(1)),
                        ultimaAtualizacao: new Date().toISOString()
                    };
                } else {
                    updates.avaliacoes = {
                        total: 1,
                        media: nota,
                        ultimaAtualizacao: new Date().toISOString()
                    };
                }
            }
            
            // Aplica as atualizações
            await update(projetoRef, updates);
            console.log(`📊 Projeto ${projetoId} atualizado com feedback`);
        }
    } catch (error) {
        console.error('Erro ao atualizar projeto:', error);
        throw error;
    }
}

/**
 * Busca feedbacks de um projeto específico
 */
async function buscarFeedbacksDoProjeto(projetoId) {
    try {
        console.log(`🔍 Buscando feedbacks do projeto: ${projetoId}`);
        
        const feedbacksRef = ref(database, `feedbacks/${projetoId}`);
        const snapshot = await get(feedbacksRef);
        
        if (!snapshot.exists()) {
            console.log(`📭 Nenhum feedback encontrado para o projeto ${projetoId}`);
            return [];
        }
        
        const feedbacks = [];
        snapshot.forEach((childSnapshot) => {
            feedbacks.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        
        // Ordena por data (mais recentes primeiro)
        feedbacks.sort((a, b) => {
            const timeA = a.timestamp || new Date(a.dataEnvio).getTime() || 0;
            const timeB = b.timestamp || new Date(b.dataEnvio).getTime() || 0;
            return timeB - timeA;
        });
        
        console.log(`✅ ${feedbacks.length} feedbacks encontrados`);
        return feedbacks;
        
    } catch (error) {
        console.error('❌ Erro ao buscar feedbacks:', error);
        return [];
    }
}
/**
 * Configura o botão de envio do feedback
 */
function configurarBotaoEnvio() {
    const botaoEnvio = document.getElementById('submitFeedback');
    
    if (!botaoEnvio) return;
    
    botaoEnvio.addEventListener('click', async function() {
        // Coleta os dados
        const dados = coletarDadosFeedback();
        
        // Valida os dados
        const validacao = validarFeedback(dados);
        
        if (!validacao.valido) {
            alert(`❌ ${validacao.mensagem}\n\n${validacao.erros.join('\n')}`);
            return;
        }
        
        // Formata os dados para exibição
        const dadosFormatados = formatarDadosFeedback(dados);
        
        // Confirmação do usuário
        const confirmacao = confirm(`Enviar feedback?\n\n${dadosFormatados.paraTexto()}`);
        
        if (!confirmacao) return;
        
        // Desabilita o botão durante o envio
        botaoEnvio.disabled = true;
        botaoEnvio.textContent = 'Enviando...';
        botaoEnvio.classList.add('opacity-50');
        
        try {
            // Envia o feedback
            const resultado = await enviarFeedback(dados);
            
            if (resultado.success) {
                alert('✅ Feedback enviado com sucesso!');
                
                // Limpa o formulário
                document.getElementById('adicionalComent').value = '';
                
                // Reseta os botões de rating
                const botoesRating = document.querySelectorAll('#feedbackNota button[value]');
                botoesRating.forEach(b => {
                    b.classList.remove('bg-secondary', 'text-white');
                    b.classList.add('bg-transparent', 'text-secondary');
                });
                
                // Reseta o texto da avaliação
                const textoAvaliacao = document.getElementById('avaliacaoshowtext');
                if (textoAvaliacao) {
                    textoAvaliacao.textContent = 'Sua Avaliação';
                }
                
                console.log('📊 Feedback enviado:', dadosFormatados.detalhes);
                
            } else {
                alert(`❌ Erro: ${resultado.message}`);
            }
            
        } catch (error) {
            alert('❌ Erro ao enviar feedback. Tente novamente.');
            console.error(error);
            
        } finally {
            // Reabilita o botão
            botaoEnvio.disabled = false;
            botaoEnvio.textContent = 'Enviar Feedback';
            botaoEnvio.classList.remove('opacity-50');
        }
    });
}
/**
 * Monitora mensagens de um projeto em tempo real
 * @param {string} projetoId - ID do projeto a monitorar
 * @param {Function} callback - Função a ser chamada quando houver novas mensagens
 * @returns {Function} Função para parar o monitoramento
 */
function monitorarMensagensEmTempoReal(projetoId, callback) {
  try {
    console.log(`👂 Iniciando monitoramento em tempo real do projeto: ${projetoId}`);
    
    // Referência às mensagens do projeto
    const mensagensRef = ref(database, `chats/${projetoId}/mensagens`);
    
    // Configura o listener para mudanças
    const unsubscribe = onChildAdded(mensagensRef, (snapshot) => {
      if (snapshot.exists()) {
        const novaMensagem = {
          id: snapshot.key,
          ...snapshot.val()
        };
        
        console.log(`📨 Nova mensagem recebida (ID: ${novaMensagem.id})`);
        
        // Chama o callback com a nova mensagem
        if (callback && typeof callback === 'function') {
          callback(novaMensagem);
        }
      }
    });
    
    console.log(`✅ Monitoramento iniciado para projeto ${projetoId}`);
    
    // Retorna função para parar o monitoramento
    return () => {
      console.log(`🛑 Parando monitoramento do projeto ${projetoId}`);
      unsubscribe();
    };
    
  } catch (error) {
    console.error('❌ Erro ao iniciar monitoramento em tempo real:', error);
    return () => {}; // Retorna função vazia em caso de erro
  }
}

/**
 * Monitora todas as mensagens do projeto e atualiza a tela automaticamente
 * @param {string} projetoId - ID do projeto
 * @param {string} operadorId - ID do operador logado (para exibirMensagens)
 */
function iniciarMonitoramentoChat(projetoId, operadorId) {
  console.log(`🚀 Iniciando monitoramento automático do chat ${projetoId}`);
  
  // Função para buscar e exibir todas as mensagens
  const atualizarChat = async () => {
    try {
      const mensagens = await buscarMensagensChat(projetoId);
      exibirMensagens(mensagens, operadorId);
      console.log(`🔄 Chat atualizado - ${mensagens.length} mensagens`);
    } catch (error) {
      console.error('❌ Erro ao atualizar chat:', error);
    }
  };
  
  // Atualiza imediatamente
  atualizarChat();
  
  // Inicia monitoramento em tempo real
  const pararMonitoramento = monitorarMensagensEmTempoReal(projetoId, (novaMensagem) => {
    // Quando receber nova mensagem, atualiza o chat
    atualizarChat();
    
    // Opcional: notificação visual/sonora
    notificarNovaMensagem(novaMensagem);
  });
  
  // Retorna função para parar o monitoramento
  return pararMonitoramento;
}

/**
 * Função de exemplo para notificar nova mensagem
 */
function notificarNovaMensagem(mensagem) {
  // Aqui você pode adicionar notificações
  console.log(`🔔 Nova mensagem de ${mensagem.operadorNome || 'Operador'}: ${mensagem.mensagem?.substring(0, 50)}...`);
  
  // Exemplo: Adicionar efeito visual
  if (document.getElementById("messages")) {
    const chatContainer = document.getElementById("messages");
    chatContainer.classList.add('bg-blue-50', 'duration-300');
    setTimeout(() => {
      chatContainer.classList.remove('bg-blue-50');
    }, 1000);
  }
  
  // Exemplo: Som de notificação (opcional)
  // const audio = new Audio('notification-sound.mp3');
  // audio.play().catch(e => console.log('Som de notificação ignorado'));
}
/**
 * Para uso no gerenteChat também
 */
async function setUpMsgsGerenteSemRealtime() {
  const Id = retrieveLocal("chatAtualId");
  if (!Id) {
    console.error('❌ ID do chat não encontrado');
    return;
  }
  
  // Busca mensagens iniciais
  const mensagens = await buscarMensagensChat(Id);
  exibirMensagensGerente(mensagens, null);
  
  // Guarda para limpar depois
  storeLocal("pararMonitoramentoGerente", pararMonitoramento);
}


// ============================================================
// IMPORTANTE: Adicionar este import no início do arquivo
// ============================================================
// Adicione esta importação junto com as outras do Firebase:
// import { onChildAdded, onValue } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
/**
 * Função simplificada que sempre funciona
 */
function gerarLinkFeedbackSimples(projetoId, nomeObra, nomeCliente) {
    const obraCodificada = encodeURIComponent(nomeObra);
    const clienteCodificado = encodeURIComponent(nomeCliente);
    
    // URL relativa simples - funciona em qualquer ambiente
    const url = `./feedback.html?id=${projetoId}&obra=${obraCodificada}&cliente=${clienteCodificado}`;
    
    console.log("📄 Link simples gerado:", url);
    return url;
}
/**
 * Inicializa todo o sistema de feedback
 */
function inicializarSistemaFeedback() {
    // Inicializa o sistema de rating
    inicializarSistemaRating();
    
    // Configura o botão de envio
    configurarBotaoEnvio();
    
    // Adiciona preenchimento automático se necessário
    const urlParams = new URLSearchParams(window.location.search);
    const obraParam = urlParams.get('obra');
    const IdParam = urlParams.get("id");
    storeLocal("IdFeedBack", IdParam);
    const clienteParam = urlParams.get('cliente');
    
    if (obraParam && document.getElementById('obraIp')) {
        document.getElementById('obraIp').value = decodeURIComponent(obraParam);
    }
    
    if (clienteParam && document.getElementById('nomeIp')) {
        document.getElementById('nomeIp').value = decodeURIComponent(clienteParam);
    }
    
    console.log('✅ Sistema de feedback inicializado');
}

//FUNÇÃO DE INICIALIZAR TELA DE CHAT DO OPERADOR

async function OperatorChatDOM() {
    atualizarCabecalhoDataHora();
    const OperatorChatTitleH = document.getElementById("nomedoProjetoOutput");
    const Id = await retrieveLocal("chatAtual");
    const OperadorAtual = await retrieveLocal("OperadorNome");
    const projeto = await getProjectByName(Id);
    console.log(projeto);
    storeLocal("IdProjetoAtual", projeto.id);
    const operator = await getOperatorByName(OperadorAtual);
    OperatorChatTitleH.innerHTML = projeto.obra;
    const mensagens = await buscarMensagensChat(projeto.id);
    
    exibirMensagens(mensagens,OperadorAtual );
}
/**
 * Configura o botão de salvar projeto
 */
let ProjectCreate = false;

async function setupSaveButton(botaoSalvar) {
    await IniciarDataList(); // Carrega clientes e operadores para autocomplete
    
    botaoSalvar.addEventListener("click", async () => {
        // Coleta dados do formulário
        const projectData = collectFormData();
        
        if (!validateProjectData(projectData)) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }
        
        console.log("🚀 Iniciando criação do projeto...");
        
        try {
            if (ProjectCreate) {
                return;
            }
            // Tenta criar o projeto
            const result = await addProject(projectData, 0); // managerId 0 = sistema
            if (result.success) {

                ProjectCreate = true;
                alert(`✅ Projeto criado com sucesso!\nID: ${result.projectId}`);
                // Limpa o formulário ou redireciona
                setTimeout(() => {
                    
    window.location.href = `obrasGerais.html`;
                }, 1000);
                clearForm();
            } else {
                alert(`❌ Erro ao criar projeto: ${result.message}`);
            }
        } catch (error) {
            console.error("Erro crítico:", error);
            alert("❌ Erro ao criar projeto. Verifique o console.");
        }
    });
}

/**
 * Coleta dados do formulário na criação da obra
 */
function collectFormData() {
    operatorList = vo(); // Obtém lista de operadores selecionados
    const dataHoje = obterDataDeHoje();

    return {
        cliente: document.getElementById("nomeCliente").value,
        obra: document.getElementById("nomedaobra").value,
        localizacao: document.getElementById("local").value,
        descricao: document.getElementById("descricao").value,
        email: document.getElementById("emailcliente").value,
        whatsappCliente: document.getElementById("whatsappcliente").value,
        Criado:dataHoje,
        cpfCnpjCliente: document.getElementById("cpfcnpjcliente").value,
        operadores: operatorList,
        dataInicial: document.getElementById("datainicial").value,
        dataFinal: document.getElementById("datafinal").value,
        managerId: 0,
        status: 0
    };
}

/**
 * Valida dados do projeto
 */
function validateProjectData(projectData) {
    return projectData.obra && projectData.obra.trim() && 
           projectData.cliente && projectData.cliente.trim() && 
           projectData.dataInicial;
}

/**
 * Scrolla uma div até o final com animação suave
 * @param {string|HTMLElement} container - ID da div ou elemento HTML
 */
function scrollParaFinalSuave(container) {
  const div = typeof container === 'string' 
    ? document.getElementById(container) 
    : container;
  
  if (!div) {
    console.warn('⚠️ Elemento não encontrado para scroll suave');
    return;
  }
  
  // Scroll com animação suave
  div.scrollTo({
    top: div.scrollHeight,
    behavior: 'smooth'
  });
}

/**
 * Limpa formulário após criação do projeto
 */
function clearForm() {
    document.getElementById("nomedaobra").value = "";
    document.getElementById("local").value = "";
    document.getElementById("descricao").value = "";
    document.getElementById("datainicial").value = "";
    document.getElementById("datafinal").value = "";
    document.getElementById("nomeCliente").value = "";
    document.getElementById("cpfcnpjcliente").value = "";
    document.getElementById("emailcliente").value = "";
    document.getElementById("whatsappcliente").value = "";
}

/**
 * Exibir mensagens pro gerente
 */

async function setUpMsgsGerente() {
  await setUpMsgsGerenteSemRealtime(); // Usar versão com realtime
}

/**
 * Configura botão de enviar mensagem
 */async function setupMessageButton(button) {
    
      const operatorMsgEL = document.getElementById("msgTxt");
      operatorMsgEL.addEventListener("keydown", async (event) => {
        if (event.key == 'Enter') {
            event.preventDefault();
             try {
      const Id = retrieveLocal("IdProjetoAtual");
      const OperadorId = retrieveLocal("OperadorSelecionado");
      const OperadorNome = retrieveLocal("OperadorNome");
      const operatorMsg = document.getElementById("msgTxt").value;
      
      
      
      // Envia mensagem
      await enviarMensagem(Id, OperadorId, OperadorNome, operatorMsg);
      
      // Atualiza mensagens
      const OperadorAtual = await retrieveLocal("OperadorNome");
      const mensagens = await buscarMensagensChat(Id);
      
      // Verifica se estamos na página correta antes de exibir
      const chatContainer = document.getElementById("messages");
      if (chatContainer) {
        exibirMensagens(mensagens, OperadorAtual);
      }
      
      // Limpa campo de mensagem
      const msgInput = document.getElementById("msgTxt");
      if (msgInput) {
        msgInput.value = '';
      }
      
    } catch (error) {
      console.error("❌ Erro ao enviar mensagem:", error);
    }
        }
      })
  button.addEventListener("click", async () => {
    try {
      const Id = retrieveLocal("IdProjetoAtual");
      const OperadorId = retrieveLocal("OperadorSelecionado");
      const OperadorNome = retrieveLocal("OperadorNome");
      const operatorMsg = document.getElementById("msgTxt").value;
      
      
      
      // Envia mensagem
      await enviarMensagem(Id, OperadorId, OperadorNome, operatorMsg);
      
      // Atualiza mensagens
      const OperadorAtual = await retrieveLocal("OperadorNome");
      const mensagens = await buscarMensagensChat(Id);
      
      // Verifica se estamos na página correta antes de exibir
      const chatContainer = document.getElementById("messages");
      if (chatContainer) {
        exibirMensagens(mensagens, OperadorAtual);
      }
      
      // Limpa campo de mensagem
      const msgInput = document.getElementById("msgTxt");
      if (msgInput) {
        msgInput.value = '';
      }
      
    } catch (error) {
      console.error("❌ Erro ao enviar mensagem:", error);
    }
  });
}
// Função para formatar a data e hora atual (para o cabeçalho)
function formatarDataHoraAtual() {
  const agora = new Date();
  const data = agora.toLocaleDateString('pt-BR');
  const hora = agora.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  return `${data} · ${hora}`;
}


// Função para exibir as mensagens no DOM// Função para exibir as mensagens no DOM
async function exibirMensagens(mensagens, operadorLogadoId) {
  const chatContainer = document.getElementById("messages");
  
  // Limpa o container
  chatContainer.innerHTML = '';

  if (!mensagens || !Array.isArray(mensagens) || mensagens.length === 0) {
    chatContainer.innerHTML = '<p class="text-center text-gray-500 py-8">Nenhuma mensagem ainda.</p>';
    return;
  }

  // Filtra mensagens do sistema (operadorId 0 ou operadorNome 'Sistema')
  const mensagensFiltradas = mensagens.filter(mensagem => {
    return mensagem.operadorId !== 0 && 
           mensagem.operadorId !== '0' &&
           mensagem.operadorNome !== 'Sistema' &&
           mensagem.operadorNome !== 'sistema';
  });

  if (mensagensFiltradas.length === 0) {
    chatContainer.innerHTML = '<p class="text-center text-gray-500 py-8">Nenhuma mensagem de operadores.</p>';
    return;
  }

  // Ordena por timestamp (mais antigas primeiro)
  const mensagensOrdenadas = mensagensFiltradas.sort((a, b) => {
    const timeA = a.timestamp || new Date(a.data).getTime() || 0;
    const timeB = b.timestamp || new Date(b.data).getTime() || 0;
    return timeA - timeB;
  });
  
  mensagensOrdenadas.forEach(async (mensagem) => {
    // Verifica se a mensagem é do operador logado
    const isOperadorLogado = mensagem.operadorId === operadorLogadoId || 
                            mensagem.operadorId === String(operadorLogadoId);
    console.log(mensagem);
const nomeOperador = await getNomeOperador(mensagem.operadorId);
    // Formata data e hora
    const dataHoraFormatada = formatarDataHoraMensagem(mensagem.timestamp || mensagem.data);
    
    // Obtém nome do operador logado do localStorage
    const nomeOperadorLogado = retrieveLocal("OperadorNome");
    
    // Define nome a exibir
    const nomeExibido = nomeOperador ? nomeOperador : "Operador";

    // Cria elemento da mensagem - SEMPRE alinhado à direita
    const mensagemElement = document.createElement('div');
    mensagemElement.className = 'flex items-end gap-3 justify-end mb-3';
    if (mensagem.mensagem) {
        
    // Cria o HTML da mensagem - SEMPRE com fundo laranja (primary)
    mensagemElement.innerHTML = `
      <div class="flex flex-col gap-1 items-end">
        <p class="text-xs text-gray-500 text-right">${nomeExibido}</p>
        <div class="flex items-start">
          <p class="text-base bg-primary text-white rounded-xl rounded-br-lg px-4 py-3 max-w-[360px]">
            ${mensagem.mensagem || ''}
          </p>
        </div>
        <span class="text-xs text-gray-400 mr-3 mt-1.5 whitespace-nowrap text-right">
          ${dataHoraFormatada}
        </span>
      </div>
    `;

    chatContainer.appendChild(mensagemElement);
    }
  });
  scrollParaFinalSuave('messages');

  if (chatContainer) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

// Função para exibir as mensagens no DOM// Função para exibir as mensagens no DOM
function exibirMensagensGerente(mensagens, operadorLogadoId) {
  const chatContainer = document.getElementById("messages");
  
  // Limpa o container
  chatContainer.innerHTML = '';

  if (!mensagens || !Array.isArray(mensagens) || mensagens.length === 0) {
    chatContainer.innerHTML = '<p class="text-center text-gray-500 py-8">Nenhuma mensagem ainda.</p>';
    return;
  }

  // Filtra mensagens do sistema (operadorId 0 ou operadorNome 'Sistema')
  const mensagensFiltradas = mensagens.filter(mensagem => {
    return mensagem.operadorId !== 0 && 
           mensagem.operadorId !== '0' &&
           mensagem.operadorNome !== 'Sistema' &&
           mensagem.operadorNome !== 'sistema';
  });

  if (mensagensFiltradas.length === 0) {
    chatContainer.innerHTML = '<p class="text-center text-gray-500 py-8">Nenhuma mensagem de operadores.</p>';
    return;
  }

  // Ordena por timestamp (mais antigas primeiro)
  const mensagensOrdenadas = mensagensFiltradas.sort((a, b) => {
    const timeA = a.timestamp || new Date(a.data).getTime() || 0;
    const timeB = b.timestamp || new Date(b.data).getTime() || 0;
    return timeA - timeB;
  });

  mensagensOrdenadas.forEach(mensagem => {
    // Verifica se a mensagem é do operador logado
    // Formata data e hora
    const dataHoraFormatada = formatarDataHoraMensagem(mensagem.timestamp || mensagem.data);
    
    // Obtém nome do operador logado do localStorage
    const nomeOperadorLogado = mensagem.operadorNome;
    
    // Define nome a exibir
    const nomeExibido =mensagem.operadorNome;
    console.log(nomeExibido);
    // Cria elemento da mensagem - SEMPRE alinhado à direita
    const mensagemElement = document.createElement('div');
    mensagemElement.className = 'flex items-end gap-3 justify-end mb-3';

    // Cria o HTML da mensagem - SEMPRE com fundo laranja (primary)
    mensagemElement.innerHTML = `
      <div class="flex flex-col gap-1 items-end">
        <p class="text-xs text-gray-500 text-right">${nomeExibido}</p>
        <div class="flex items-start">
          <p class="text-base bg-primary text-white rounded-xl rounded-br-lg px-4 py-3 max-w-[360px]">
            ${mensagem.mensagem || ''}
          </p>
        </div>
        <span class="text-xs text-gray-400 mr-3 mt-1.5 whitespace-nowrap text-right">
          ${dataHoraFormatada}
        </span>
      </div>
    `;

    chatContainer.appendChild(mensagemElement);
  });
  scrollParaFinalSuave('messages');

  if (chatContainer) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}
// Função auxiliar para formatar data/hora das mensagens
function formatarDataHoraMensagem(timestamp) {
  if (!timestamp) return '';
  
  try {
    const data = new Date(timestamp);
    
    if (isNaN(data.getTime())) {
      return '';
    }
    
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    
    let dataFormatada;
    if (data.toDateString() === hoje.toDateString()) {
      dataFormatada = 'HOJE';
    } else if (data.toDateString() === ontem.toDateString()) {
      dataFormatada = 'ONTEM';
    } else {
      dataFormatada = data.toLocaleDateString('pt-BR');
    }
    
    const hora = data.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
    
    return `${dataFormatada} · ${hora}`;
  } catch (error) {
    console.error('Erro ao formatar data/hora:', error);
    return '';
  }
}


// Atualiza o cabeçalho quando a página carrega
function atualizarCabecalhoDataHora() {
  const dataHoratxt = document.getElementById("horadataTxt");
  if (dataHoratxt) {
    dataHoratxt.textContent = `HOJE: ${formatarDataHoraAtual()}`;
  }
}


// Para atualizar o cabeçalho com a data atual (como no exemplo original)
const dataHoratxt = document.getElementById("horadataTxt");
if (dataHoratxt) {
  dataHoratxt.textContent = `HOJE: ${formatarDataHoraAtual()}`;
}
// ============================================================
// FUNÇÕES DE PROJETOS
// ============================================================

/**
 * Obtém projetos de um operador específico
 */
async function getOperatorProjects(operatorId) {
    console.log(`🔍 Buscando projetos do operador: ${operatorId}`);
    
    try {
        const snapshot = await get(ref(database, `operadores/${operatorId}/projetos`));
        
        if (!snapshot.exists()) {
            console.log(`📭 Operador ${operatorId} não tem projetos`);
            return [];
        }
        
        // Converte objeto para array de projetos
        const projetos = Object.values(snapshot.val());
        
        console.log(`✅ ${projetos.length} projetos encontrados`);
        
        return projetos.filter(projeto => projeto && projeto.obra && projeto.obra !== "InitialOrder"); // Filtra projetos válidos
    } catch (error) {
        console.error(`❌ Erro ao buscar projetos:`, error);
        return [];
    }
}


async function handleOperatorsObra() {
    const OperatorAtual = retrieveLocal("OperadorSelecionado");
    if (!OperatorAtual) {
        console.log("⚠️ Nenhum operador selecionado");
        return;
    }
    
    const projetosOperador = await getOperatorProjects(OperatorAtual);
    const minhasObrasScreenDOM = document.getElementById("minhasObrasScreen");
    
    if (!minhasObrasScreenDOM) return;
    
    // Encontra ou cria o container de obras
    let obrasContainer = minhasObrasScreenDOM.querySelector('.w-full.flex-col');
    if (!obrasContainer) {
        obrasContainer = minhasObrasScreenDOM.querySelector('div.w-full');
        if (!obrasContainer) {
            obrasContainer = document.createElement('div');
            obrasContainer.className = 'w-full flex flex-col items-center space-y-4';
            obrasContainer.id = 'containerObrasOperator'
            minhasObrasScreenDOM.innerHTML = ''; // Limpa
            minhasObrasScreenDOM.appendChild(obrasContainer);
        }
    } else {
        obrasContainer.innerHTML = ''; // Limpa conteúdo existente
    }
    
    if (projetosOperador.length === 0) {
        obrasContainer.innerHTML = `
            <p class="text-text-secondary text-center p-8">Nenhuma obra encontrada</p>
        `;
        return;
    }
    
    // Adiciona cada obra
    projetosOperador.forEach(element => {
        if (element && element.obra) {
            const button = document.createElement('button');
            button.className = 'obra-button';
            button.dataset.id = element.id;
            button.id = element.obra;
            
            button.innerHTML = `
                <span class="truncate text-left flex-1 pr-4">${element.obra}</span>
                <span class="material-symbols-outlined text-surface/80 text-2xl shrink-0">
                    arrow_forward_ios
                </span>
            `;
            
            button.addEventListener('click', () => handleObraclick(element.obra));
            obrasContainer.appendChild(button);
        }
    });
}

/**
 * Manipula clique em uma obra
 */
function handleObraclick(id) {
    console.log('🎯 Clicou na obra:', id);
    const obra = getProjectByName(id);
    if (obra) {
        alert(id);
    storeLocal("chatAtualID", obra.id);
    }
    storeLocal("chatAtual", id);
    // Redireciona ou mostra detalhes da obra
    window.location.href = `operadorChat.html?id=${id}`;
}
/**
 * Manipula clique em uma obra
 */
function handleObraclickGerente(id) {
    console.log('🎯 Clicou na obra:', id);
    const obra = getProjectByName(id);
    if (obra) {
        alert(id);
    storeLocal("chatAtualID", obra.id);
    }
    storeLocal("chatAtual", id);
    // Redireciona ou mostra detalhes da obra
    window.location.href = `gerenteChat.html?id=${id}`;
}


/**
 * Obtém dados detalhados de um projeto
 */
async function getProjectData(projectId) {
    console.log(`📋 Buscando projeto: ${projectId}`);
    
    try {
        const projectRef = ref(database, `projetos/${projectId}`);
        const snapshot = await get(projectRef);
        
        if (!snapshot.exists()) {
            console.warn(`❌ Projeto ${projectId} não encontrado`);
            return null;
        }
        
        const projectData = snapshot.val();
        console.log(`✅ Projeto encontrado: ${projectData.obra || 'Sem nome'}`);
        
        return {
            id: projectId,
            ...projectData
        };
    } catch (error) {
        console.error(`💥 Erro ao buscar projeto:`, error);
        return null;
    }
}
/**
 * Manipula DOM da lista de obras - VERSÃO ATUALIZADA (CENTRALIZADA)
 */
async function HANDLEOBRASDOM() {
    const divObrasList = document.getElementById("divToObras");
    const obras = await getAllProjects();
    
    if (!divObrasList) return;
    
    // Limpa a lista
    divObrasList.innerHTML = "";
    
    if (obras.length === 0) {
        divObrasList.innerHTML = `
            <div class="text-center w-full py-12">
                <span class="material-symbols-outlined text-gray-400 text-6xl mb-4 block">
                    construction
                </span>
                <p class="text-gray-500 text-lg">Nenhuma obra cadastrada</p>
            </div>
        `;
        return;
    }
    
    // Container para centralizar os cards de obra
    const obrasContainer = document.createElement('div');
    obrasContainer.id = 'obrasContainer';
    obrasContainer.className = 'w-full max-w-2xl space-y-6';
    
    // Adiciona cada obra
    obras.forEach(element => {
        if (element && element.obra && typeof element.obra === "string") {
            const operadoresFormatados = formatarOperadores(element.operadores);
            
            const obraCard = document.createElement('div');
            obraCard.id = element.obra;
            obraCard.className = 'flex flex-col items-center w-full';
            
            obraCard.innerHTML = `
                <div id="${element.id}"  class="w-full max-w-md flex flex-col gap-3">
                    <button data-status="${element.status}" data-nome="${element.obra}" data-id="${element.id}" 
                            class="obra-item w-full cursor-pointer flex items-center justify-between overflow-hidden rounded-xl h-20 px-6 bg-primary text-white gap-4 text-lg font-bold leading-normal tracking-[0.015em] active:opacity-80 transition-all duration-200 hover:bg-primary/90 hover:shadow-lg">
                        <span class="truncate text-left flex-1">${element.obra}</span>
                        <span class="material-symbols-outlined text-3xl text-white/70 flex-shrink-0">arrow_forward_ios</span>
                    </button>
                    <div class="flex flex-col text-sm text-primary/80 dark:text-neutral-50/80 px-2">
                        <p><span class="font-bold">Status:</span> ${element.status == 0 ? "🟢 Em andamento" : "✅ Finalizado"}</p>
                        <p><span class="font-bold">Criado em:</span> ${element.Criado}"}</p>
                        
                        <a class="font-bold" href="${element.linkReview}">${element.linkReview}"}</a>
                        <p><span class="font-bold">Operadores:</span> ${operadoresFormatados}</p>
                        ${element.cliente ? `<p><span class="font-bold">Cliente:</span> ${element.cliente}</p>` : ''}
                    </div>
                </div>
            `;
            
            obrasContainer.appendChild(obraCard);
        }
    });
    
    divObrasList.appendChild(obrasContainer);
    
    // Event delegation para cliques nas obras
    divObrasList.addEventListener('click', function(event) {
        const obraElement = event.target.closest('.obra-item');
        if (obraElement) {
            const id = obraElement.dataset.nome;
            handleObraclickGerente(id);
        }
    });
}

// ============================================================
// FUNÇÕES DE FORMATAÇÃO
// ============================================================

/**
 * Formata array de operadores para string
 */
function formatarOperadores(operadores) {
    if (!operadores || !Array.isArray(operadores) || operadores.length === 0) {
        return 'Nenhum operador';
    }

    const nomesFormatados = operadores.map(operador => {
        if (typeof operador === 'string') return extrairPrimeiroUltimoNome(operador);
        if (operador && typeof operador === 'object') {
            return extrairPrimeiroUltimoNome(operador.nome || operador.nomeCompleto || '');
        }
        return '';
    }).filter(nome => nome.trim() !== '');

    return nomesFormatados.join(', ') || 'Nenhum operador';
}

/**
 * Extrai primeiro e último nome
 */
function extrairPrimeiroUltimoNome(nomeCompleto) {
    if (!nomeCompleto || typeof nomeCompleto !== 'string') return '';
    
    const partes = nomeCompleto.trim().split(/\s+/).filter(parte => parte !== '');
    
    if (partes.length === 0) return '';
    if (partes.length === 1) return partes[0];
    if (partes.length === 2) return `${partes[0]} ${partes[1]}`;
    return `${partes[0]} ${partes[partes.length - 1]}`;
}

// ============================================================
// FUNÇÕES DE DATALIST (AUTOCOMPLETE)
// ============================================================

/**
 * Inicializa datalist para autocomplete
 */
async function IniciarDataList() {
    const clientesDataList = document.getElementById("clientesDL");
    const operatorsDL = document.getElementById("operatorsDL");
    
    if (!clientesDataList || !operatorsDL) return;
    
    // Carrega clientes
    const clientesCur = await buscarTodosClientes();
    if (clientesCur.length > 0) {
        clientesCur.forEach(element => {
            if (element.nome) {
                clientesDataList.innerHTML += `<option value="${element.nome}">`;
            }
        });
    }
    
    // Carrega operadores
    const operatorsCur = await buscarTodosOperadores();
    if (operatorsCur.length > 0) {
        operatorsCur.forEach(element => {
            if (element.nome) {
                operatorsDL.innerHTML += `<option value="${element.nome}">`;
            }
        });
    }
}

// ============================================================
// FUNÇÕES DE CHAT/MENSAGENS
// ============================================================
/**
 * Busca operador pelo ID e retorna apenas o nome
 * @param {string} operadorId - ID do operador
 * @returns {Promise<string|null>} - Nome do operador ou null se não encontrar
 */
async function getNomeOperador(operadorId) {
  try {
    console.log(operadorId);
    const path = ref(database, `operadores/${operadorId}`)
    const snap = await get(path);
    if (snap.exists()) {
        const valor =  snap.val();
        console.log(valor);
        return valor.nome;
    }
    return null;
  } catch (error) {
    console.error(`❌ Erro ao buscar operador ${operadorId}:`, error);
    return null;
  }
}
/**
 * Envia mensagem para o chat de um projeto
 */
async function enviarMensagem(projetoId, operadorId, operadorNome, textoMensagem) {
    try {
        const mensagensRef = ref(database, `chats/${projetoId}/mensagens`);
        const mensagemCompleta = {
            mensagem: textoMensagem,
            operadorId: operadorId,
            operadorNome: operadorNome,
            projeto: projetoId,
            data: new Date().toISOString(),
            timestamp: Date.now()
        };

        const novaMensagemRef = push(mensagensRef);
        await set(novaMensagemRef, mensagemCompleta);

        // Atualiza timestamp da última mensagem
        const projetoRef = ref(database, `chats/${projetoId}`);
        await update(projetoRef, {
            ultimaMensagem: mensagemCompleta.mensagem.substring(0, 50) + '...',
            ultimaAtualizacao: new Date().toISOString(),
            ultimoOperador: mensagemCompleta.operadorNome
        });

  const chatContainer = document.getElementById("messages");
  
  // Limpa o container
  chatContainer.innerHTML = '';
        return {
            success: true,
            mensagemId: novaMensagemRef.key,
            message: 'Mensagem enviada com sucesso'
        };
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        return {
            success: false,
            error: error.message,
            message: 'Erro ao enviar mensagem'
        };
    }
}

/**
 * Busca mensagens de um chat
 */
async function buscarMensagensChat(projetoId) {
    try {
        const mensagensRef = ref(database, `chats/${projetoId}/mensagens`);
        const snapshot = await get(mensagensRef);
        
        if (snapshot.exists()) {
            const mensagens = [];
            snapshot.forEach((childSnapshot) => {
                mensagens.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            
            return mensagens.sort((a, b) => a.timestamp - b.timestamp);
        }
        return [];
    } catch (error) {
        console.error('❌ Erro ao buscar mensagens:', error);
        throw error;
    }
}
/**
 * Busca todos os projetos válidos
 */
async function getAllProjects() {
    try {
        const projectsRef = ref(database, 'projetos');
        const snapshot = await get(projectsRef);
        
        const projects = [];
        
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const project = childSnapshot.val();
                
                // CORREÇÃO: substituir "projeto.obra" por "project.obra"
                // Verifica se tem uma obra válida e não é "InitialOrder"
                if (project.obra && project.obra !== "InitialOrder" && project.obra.trim()) {
                    projects.push({
                        key: childSnapshot.key,
                        ...project
                    });
                }
            });
            
            // Ordena por ID (se existir) ou por chave
            projects.sort((a, b) => {
                if (a.id && b.id) return a.id - b.id;
                return (a.key || '').localeCompare(b.key || '');
            });
        }
        
        console.log(`📊 ${projects.length} projetos válidos encontrados`);
        return projects;
    } catch (error) {
        console.error('❌ Erro ao buscar projetos:', error);
        return [];
    }
}

// ============================================================
// FUNÇÕES DE GERAÇÃO DE IDs
// ============================================================

/**
 * Gera ID baseado no nome (para evitar duplicatas)
 */
function gerarIdUnicoPorNome(nome, prefixo = '') {
    if (!nome || typeof nome !== 'string') {
        const randomId = Math.floor(Math.random() * 1000000);
        return `${prefixo}${randomId}`;
    }
    
    // Normaliza o nome para criar um ID consistente
    const nomeNormalizado = nome
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9]/g, '_') // Substitui caracteres especiais por _
        .replace(/_+/g, '_') // Remove múltiplos _
        .replace(/^_+|_+$/g, ''); // Remove _ do início e fim
    
    // Adiciona timestamp para garantir unicidade
    const timestamp = Date.now().toString(36);
    
    return `${prefixo}${nomeNormalizado}_${timestamp}`;
}

/**
 * Obtém próximo ID numérico para projeto
 */
async function getNextProjectId() {
    try {
        const projectsRef = ref(database, 'projetos');
        const snapshot = await get(projectsRef);
        
        let maxId = 0;
        
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const project = childSnapshot.val();
                maxId +=1;
            });
        }
        
        return maxId;
    } catch (error) {
        console.error('❌ Erro ao obter próximo ID do projeto:', error);
        return Date.now(); // Fallback: timestamp
    }
}

async function buscarOperadorPorNome(nome) {
    try {
        const operadoresRef = ref(database, 'operadores');
        const snapshot = await get(operadoresRef);
        
        if (snapshot.exists()) {
            const operadores = snapshot.val();
            
            // Busca operador pelo nome (case insensitive)
            for (const [id, operador] of Object.entries(operadores)) {
                if (operador.nome && operador.nome.toLowerCase() === nome.toLowerCase()) {
                    return { id, ...operador };
                }
            }
        }
        
        return null;
    } catch (error) {
        console.error('❌ Erro ao buscar operador por nome:', error);
        return null;
    }
}

/**
 * Verifica se cliente já existe pelo nome
 */
async function buscarClientePorNome(nome) {
    try {
        const clientesRef = ref(database, 'clientes');
        const snapshot = await get(clientesRef);
        
        if (snapshot.exists()) {
            const clientes = snapshot.val();
            
            // Busca cliente pelo nome (case insensitive)
            for (const [id, cliente] of Object.entries(clientes)) {
                if (cliente.nome && cliente.nome.toLowerCase() === nome.toLowerCase()) {
                    return { id, ...cliente };
                }
            }
        }
        
        return null;
    } catch (error) {
        console.error('❌ Erro ao buscar cliente por nome:', error);
        return null;
    }
}


/**
 * Cria ou atualiza operador evitando duplicatas, 
 */
async function criarOuAtualizarOperador(nomeOperador, projetoId, projetoData) {
    try {
        // Verifica se operador já existe
        const operadorExistente = await buscarOperadorPorNome(nomeOperador);
        
        if (operadorExistente) {
            console.log(`🔄 Operador existente: ${nomeOperador}`);
            

            // Verifica se o projeto já está associado ao operador
            const projetosRef = ref(database, `operadores/${operadorExistente.id}/projetos/${projetoId}`);
            const projetoSnapshot = await get(projetosRef);
            
            if (!projetoSnapshot.exists()) {
                // Adiciona o projeto ao operador existente
                await set(projetosRef, {
                    id: projetoId,
                    obra: projetoData.obra,
                    dataAssociacao: new Date().toISOString(),
                    ...projetoData
                });
                console.log(`✅ Projeto adicionado ao operador existente`);
            } else {
                console.log(`ℹ️ Projeto já existe no operador`);
            }
            
            return {
                success: true,
                operadorId: operadorExistente.id,
                operadorExistia: true,
                operadorNome: nomeOperador
            };
        } else {
            // Cria novo operador
            const operadorId = gerarIdUnicoPorNome(nomeOperador, 'op_');
            
            const operadorData = {
                id: operadorId,
                nome: nomeOperador,
                criadoEm: new Date().toISOString(),
                atualizadoEm: new Date().toISOString(),
                ativo: true
            };
            
            // Salva o operador
            await set(ref(database, `operadores/${operadorId}`), operadorData);
            
            // Adiciona o projeto ao novo operador
            await set(ref(database, `operadores/${operadorId}/projetos/${projetoId}`), {
                id: projetoId,
                obra: projetoData.obra,
                dataAssociacao: new Date().toISOString(),
                ...projetoData
            });
            
            console.log(`➕ Novo operador criado: ${nomeOperador} (ID: ${operadorId})`);
            
            return {
                success: true,
                operadorId: operadorId,
                operadorExistia: false,
                operadorNome: nomeOperador
            };
        }
    } catch (error) {
        console.error(`❌ Erro ao processar operador ${nomeOperador}:`, error);
        return {
            success: false,
            error: error.message
        };
    }

    //atualize dados do operador
}
async function atualizarOperador(nome, novosDados) {
    try {
        
        const q = await buscarOperadorPorNome(nome);
        const operadoresRef = ref(database, `operadores/${q.id}`);
        const Shot = await get(operadoresRef);
        const values = Shot.val();

        if (!values) {
            alert('Operador não encontrado');
            return false;
        }

        if (values) {
            await update(operadoresRef, novosDados);
            alert('Operador atualizado com sucesso!');
            return true;
        } else {
            alert('Operador não encontrado');
            return false;
        }
    } catch (error) {
        console.error('Erro ao atualizar operador:', error);
        alert('Erro ao atualizar operador');
        return false;
    }
}

/**
 * Cria ou atualiza operador evitando duplicatas COM DATAfunção gambiarra
 */
async function criarOuAtualizarOperadorCOMDATA(nomeOperador, projetoId, projetoData, operadorDataBase) {
    try {
        // Verifica se operador já existe
        const operadorExistente = await buscarOperadorPorNome(nomeOperador);
        
        if (operadorExistente) {
            
            
        
            const operadorRef =await ref(database, `operadores/${operadorExistente.id}`);
            const snapshot = await get(operadorRef);
            const valores = snapshot.val();
            console.log(operadorRef);
            if (operadorRef) {
                // Limpar formulário (opcional)
                document.getElementById('nomeOperador').value = valores.nome;
                document.getElementById('competencias').value = valores.competencias;
                contadorCaracteres.textContent = '0';
                
            }

            const salvarOperadotbtnTxt = document.getElementById("btnSalvar");
            if (salvarOperadotbtnTxt.innerHTML == "Atualizar Operador") {
                atualizarOperador(nomeOperador, operadorDataBase);
            }else{
            alert(`🔄 Operador existente: ${nomeOperador}`);
            alert(`Indo para tela de atualização de dados!`);
            salvarOperadotbtnTxt.innerHTML = "Atualizar Operador";
            
            
            // Verifica se o projeto já está associado ao operador
            const projetosRef = ref(database, `operadores/${operadorExistente.id}/projetos/${projetoId}`);
            const projetoSnapshot = await get(projetosRef);
            
            if (!projetoSnapshot.exists()) {
                // Adiciona o projeto ao operador existente
                await set(projetosRef, {
                    id: projetoId,
                    obra: projetoData.obra,
                    dataAssociacao: new Date().toISOString(),
                    ...projetoData
                });
                console.log(`✅ Projeto adicionado ao operador existente`);
            } else {
                console.log(`ℹ️ Projeto já existe no operador`);
            };
            return;
            }
            // Verifica se o projeto já está associado ao operador
            const projetosRef = ref(database, `operadores/${operadorExistente.id}/projetos/${projetoId}`);
            const projetoSnapshot = await get(projetosRef);
            
            if (!projetoSnapshot.exists()) {
                // Adiciona o projeto ao operador existente
                await set(projetosRef, {
                    id: projetoId,
                    obra: projetoData.obra,
                    dataAssociacao: new Date().toISOString(),
                    ...projetoData
                });
                console.log(`✅ Projeto adicionado ao operador existente`);
            } else {
                console.log(`ℹ️ Projeto já existe no operador`);
            }
            
            return {
                success: true,
                operadorId: operadorExistente.id,
                operadorExistia: true,
                operadorNome: nomeOperador
            };
        } else {
                // Limpar formulário (opcional)
                document.getElementById('nomeOperador').value = '';
                document.getElementById('competencias').value = '';
                contadorCaracteres.textContent = '0';
            // Cria novo operador
            const operadorId = gerarIdUnicoPorNome(nomeOperador, 'op_');
            
            const operadorData = {
                id: operadorId,
                nome: nomeOperador,
                criadoEm: new Date().toISOString(),
                atualizadoEm: new Date().toISOString(),
                ativo: true,
                ...operadorDataBase
            };
            
            // Salva o operador
            await set(ref(database, `operadores/${operadorId}`), operadorData);
            
            // Adiciona o projeto ao novo operador
            await set(ref(database, `operadores/${operadorId}/projetos/${projetoId}`), {
                id: projetoId,
                obra: projetoData.obra,
                dataAssociacao: new Date().toISOString(),
                ...projetoData
            });
            
            console.log(`➕ Novo operador criado: ${nomeOperador} (ID: ${operadorId})`);
            
            return {
                success: true,
                operadorId: operadorId,
                operadorExistia: false,
                operadorNome: nomeOperador
            };
        }
    } catch (error) {
        console.error(`❌ Erro ao processar operador ${nomeOperador}:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Cria ou atualiza cliente evitando duplicatas
 */
async function criarOuAtualizarCliente(nomeCliente, projetoId, projetoData) {
    try {
        // Verifica se cliente já existe
        const clienteExistente = await buscarClientePorNome(nomeCliente);
        
        if (clienteExistente) {
            console.log(`🔄 Cliente existente: ${nomeCliente}`);
            
            // Atualiza lista de projetos do cliente
            const projetosAtuais = clienteExistente.projetos || [];
            if (!projetosAtuais.includes(projetoId)) {
                projetosAtuais.push(projetoId);
                await update(ref(database, `clientes/${clienteExistente.id}`), {
                    projetos: projetosAtuais,
                    atualizadoEm: new Date().toISOString()
                });
            }
            
            return {
                success: true,
                clienteId: clienteExistente.id,
                clienteExistia: true
            };
        } else {
            // Cria novo cliente
            const clienteId = gerarIdUnicoPorNome(nomeCliente, 'cli_');
            
            const clienteData = {
                id: clienteId,
                nome: nomeCliente,
                projetos: [projetoId],
                criadoEm: new Date().toISOString(),
                atualizadoEm: new Date().toISOString(),
                ativo: true,
                email: projetoData.email || '',
                telefone: projetoData.whatsappCliente || '',
                documento: projetoData.cpfCnpjCliente || ''
            };
            
            await set(ref(database, `clientes/${clienteId}`), clienteData);
            console.log(`➕ Novo cliente criado: ${nomeCliente} (ID: ${clienteId})`);
            
            return {
                success: true,
                clienteId: clienteId,
                clienteExistia: false
            };
        }
    } catch (error) {
        console.error(`❌ Erro ao processar cliente ${nomeCliente}:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Extrai apenas o nome real removendo sufixos e IDs
 * Exemplo: "op_juan_mk3sdaj" → "juan"
 * Exemplo: "cli_maria_abc123" → "maria"
 */
function extrairNomeReal(nomeCompleto) {
    if (!nomeCompleto || typeof nomeCompleto !== 'string') return '';
    
    // Remove prefixos comuns (op_, cli_, etc)
    let nome = nomeCompleto.trim();
    
    // Remove prefixos como "op_", "cli_", "operador_", "cliente_"
    const prefixos = ['op_', 'cli_', 'operador_', 'cliente_'];
    
    for (const prefixo of prefixos) {
        if (nome.toLowerCase().startsWith(prefixo)) {
            nome = nome.substring(prefixo.length);
            break;
        }
    }
    
    // Remove qualquer sufixo numérico ou alfanumérico após underscore
    const partes = nome.split('_');
    if (partes.length > 1) {
        // Se a última parte parece ser um ID/hash (contém números ou é muito curta)
        const ultimaParte = partes[partes.length - 1];
        if (ultimaParte.match(/\d/) || ultimaParte.length <= 4) {
            partes.pop(); // Remove o ID/hash
        }
    }
    
    // Remove qualquer coisa que pareça ser um timestamp ou ID
    nome = partes.join('_').replace(/_+/g, ' ').trim();
    
    // Remove caracteres especiais no final
    nome = nome.replace(/[^a-zA-ZÀ-ÿ\s]+$/g, '');
    
    return nome;
}
// Supondo que você já tenha inicializado o Firebase e tenha uma variável 'db' para o Firestore
// Se não, você pode inicializar assim:
//   const firebaseConfig = { ... };
//   firebase.initializeApp(firebaseConfig);
//   const db = firebase.firestore();
/**
 * Função Firebase Realtime Database para verificar se o nó 'projetos' está vazio
 * Se estiver, cria o projeto 0 com parâmetros predefinidos
 */
async function verificarECriarProjeto0() {
    try {
        console.log('🔍 Verificando nó "projetos" no Firebase Realtime Database...');
        
        // Referência para o nó de projetos
        const projetosRef = ref(database,'projetos');
        
        // Verificar se existem dados no nó
        const snapshot = await get(projetosRef);
        
        if (!snapshot.exists()) {
            console.log('📝 Nó "projetos" vazio. Criando Projeto 0...');
            
            // Criar projeto 0 com parâmetros predefinidos
            const projeto0 = {
        cliente: "InitialOrder",
        obra: "InitialOrder",
        localizacao: "InitialOrder",
        descricao: "InitialOrder",
        email: "InitialOrder",
        whatsappCliente: "InitialOrder",
        Criado:"InitialOrder",
        cpfCnpjCliente: "InitialOrder",
        operadores: [],
        dataInicial: "InitialOrder",
        dataFinal: "InitialOrder",
        managerId: 0,
        status: 1
            };
            
  set(ref(database, 'projetos/' + 0), projeto0);
            
            console.log('✅ Projeto 0 criado com sucesso no Firebase Realtime Database!');
            console.log('📋 Detalhes:', projeto0);
            
            return {
                success: true,
                message: "Projeto 0 criado com sucesso",
                projeto: projeto0,
                projetoId: "0"
            };
            
        } else {
            const projetos = snapshot.val();
            const projetosArray = Object.keys(projetos).map(key => ({
                id: key,
                ...projetos[key]
            }));
            
            console.log(`📊 Nó "projetos" já contém ${projetosArray.length} projeto(s).`);
            
            // Verificar se existe o projeto 0
            const projeto0 = projetos["0"];
            
            if (projeto0) {
                console.log('✅ Projeto 0 já existe no sistema');
                return {
                    success: true,
                    message: "Projeto 0 já existe",
                    projeto: {
                        id: "0",
                        ...projeto0
                    },
                    projetoId: "0"
                };
            } else {
                console.log('⚠️  Projeto 0 não encontrado, mas existem outros projetos');
                return {
                    success: true,
                    message: "Sistema já possui projetos, mas não o projeto 0",
                    projetos: projetosArray,
                    primeiroProjeto: projetosArray[0]
                };
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar/criar projeto :', error);
        
        return {
            success: false,
            message: `Erro: ${error.message}`,
            error: error
        };
    }
}




/**
 * Busca projeto pelo nome exato da obra
 */
async function buscarProjetoPorNome(nomeObra) {
    try {
        console.log(`🔍 Buscando projeto pelo nome: "${nomeObra}"`);
        
        const projetosRef = ref(database, 'projetos');
        const snapshot = await get(projetosRef);
        
        if (!snapshot.exists()) {
            console.log('📭 Nenhum projeto encontrado no banco de dados');
            return null;
        }
        
        const projetos = snapshot.val();
        console.log(`📊 Total de projetos no banco: ${Object.keys(projetos).length}`);
        
        // Busca projeto pelo nome exato (case-insensitive)
        for (const projetoId in projetos) {
            const projeto = projetos[projetoId];
            
            console.log(`  🔎 Verificando projeto ID: ${projetoId}`);
            console.log(`    Nome no banco: "${projeto.obra}"`);
            console.log(`    Comparando com: "${nomeObra}"`);
            
            // CORREÇÃO: Remover esta linha que causa erro
         if (projeto.obra = "InitialOrder") {
             return;
            }
            
            // Verifica se a propriedade obra existe e faz a comparação
            if (projeto.obra && projeto.obra.trim().toLowerCase() === nomeObra.trim().toLowerCase()) {
                console.log(`✅ Projeto encontrado! ID: ${projetoId}`);
                return {
                    id: projetoId,
                    ...projeto
                };
            }
        }
        
        console.log(`❌ Nenhum projeto encontrado com o nome: "${nomeObra}"`);
        return null;
        
    } catch (error) {
        console.error('💥 Erro ao buscar projeto por nome:', error);
        return null;
    }
}

function obterDataDeHoje() {
  return new Date().toLocaleDateString('pt-BR');
}
/**
 * Cria ou atualiza projeto verificando duplicatas pelo nome
 */
async function addProject(projectData, managerId) {
    try {
        console.log("🏗️ Iniciando criação/atualização de projeto...");
        
        // 1. Extrai nomes reais removendo sufixos
        const nomeClienteReal = extrairNomeReal(projectData.cliente);
        const nomesOperadoresReais = projectData.operadores 
            ? projectData.operadores.map(op => extrairNomeReal(op))
            : [];
        
        console.log(`👤 Cliente extraído: ${projectData.cliente} → ${nomeClienteReal}`);
        console.log(`👥 Operadores extraídos:`, nomesOperadoresReais);
        
        // 2. Verifica se já existe projeto com o mesmo nome
        const projetoExistente = await buscarProjetoPorNome(projectData.obra);
        let projectId;
        let isNewProject = false;
        
        if (projetoExistente != null) {
            // Projeto já existe - usar ID existente para atualização
            projectId = projetoExistente.id;
            console.log(`🔍 Projeto encontrado, atualizando: ${projectId}`);
        } else {
            // Projeto não existe - criar novo ID sequencial
            projectId = await getNextProjectId();
            isNewProject = true;
            console.log(`🔢 Novo ID do projeto: ${projectId}`);
        }
        
        const projectRef = ref(database, `projetos/${projectId}`);
        const linkPj = await gerarLinkFeedbackSimples(projectId, projectData.obra, nomeClienteReal);
        // 3. Prepara objeto do projeto
        const project = {
            ...projectData,
            id: projectId,
            linkReview : linkPj,
            updatedAt: new Date().toISOString(),
            cliente: nomeClienteReal, // Usa nome limpo
            operadores: nomesOperadoresReais // Usa nomes limpos
        };
        
        // 4. Adiciona campos de criação se for novo
        if (isNewProject) {
            project.createdBy = managerId;
            project.createdAt = new Date().toISOString();
        } else {
            // Mantém campos originais se atualizando
            if (projetoExistente.createdBy) project.createdBy = projetoExistente.createdBy;
            if (projetoExistente.createdAt) project.createdAt = projetoExistente.createdAt;
        }
        
        // 5. Processa cliente (com nome real)
        let clienteId = null;
        if (nomeClienteReal) {
            const resultadoCliente = await criarOuAtualizarCliente(nomeClienteReal, projectId, projectData);
            
            if (resultadoCliente.success) {
                clienteId = resultadoCliente.clienteId;
                project.clienteId = clienteId;
                console.log(`✅ Cliente processado: ${nomeClienteReal} (ID: ${clienteId})`);
            } else if (projetoExistente && projetoExistente.clienteId) {
                // Mantém cliente existente em caso de erro
                project.clienteId = projetoExistente.clienteId;
            }
        }
        
        // 6. Processa operadores (com nomes reais)
        const operadoresIds = [];
        const operadoresNomes = [];
        
        // Inicia com operadores existentes se for atualização
        if (projetoExistente && projetoExistente.operadoresIds) {
            operadoresIds.push(...projetoExistente.operadoresIds);
        }
        if (projetoExistente && projetoExistente.operadoresNomes) {
            operadoresNomes.push(...projetoExistente.operadoresNomes);
        }
        
        if (nomesOperadoresReais.length > 0) {
            console.log(`👥 Processando ${nomesOperadoresReais.length} operadores...`);
            
            for (let i = 0; i < nomesOperadoresReais.length; i++) {
                const nomeOperadorReal = nomesOperadoresReais[i];
                if (!nomeOperadorReal) continue;
                console.log('operador atual: ', nomeOperadorReal);
                
                // Verifica se operador já está associado
                if (!operadoresNomes.includes(nomeOperadorReal)) {
                    const resultadoOperador = await criarOuAtualizarOperador(nomeOperadorReal, projectId, projectData);
                    
                    if (resultadoOperador.success) {
                        operadoresIds.push(resultadoOperador.operadorId);
                        operadoresNomes.push(nomeOperadorReal);
                        console.log(`  ✅ Operador ${i+1}: ${nomeOperadorReal} processado`);
                    } else {
                        console.log(`  ❌ Erro no operador ${nomeOperadorReal}`);
                    }
                } else {
                    console.log(`  ⚡ Operador ${nomeOperadorReal} já associado`);
                }
            }
        }
        
        project.operadoresIds = operadoresIds;
        project.operadoresNomes = operadoresNomes;
        
        // 7. Salva o projeto no banco de dados
        console.log("💾 Salvando projeto no banco de dados...");
        await set(projectRef, project);
        
        // 8. Se for novo projeto, envia mensagem de boas-vindas
        /*if (isNewProject) {
            const msgResult = await enviarMensagem(
                projectId,
                0,
                'Sistema',
                `Projeto "${projectData.obra}" criado com sucesso! Bem-vindo(a)!`
            );
            
            if (msgResult.success) {
                console.log(`📨 Mensagem de boas-vindas enviada`);
            }
        }*/
        
        console.log(`🎉 Projeto ${isNewProject ? 'criado' : 'atualizado'} com sucesso!`);
        console.log(`   ID: ${projectId}`);
        console.log(`   Obra: ${projectData.obra}`);
        console.log(`   Cliente: ${nomeClienteReal}`);
        console.log(`   Operadores: ${operadoresNomes.length}`);
        
        return {
            success: true,
            projectId: projectId,
            isNewProject: isNewProject,
            message: `Projeto ${isNewProject ? 'criado' : 'atualizado'} com sucesso`,
            details: {
                obra: projectData.obra,
                cliente: nomeClienteReal,
                clienteId: clienteId,
                operadores: nomesOperadoresReais,
                operadoresIds: operadoresIds,
                operadoresCount: operadoresIds.length
            }
        };
        
    } catch (error) {
        console.error('💥 Erro crítico ao criar/atualizar projeto:', error);
        return {
            success: false,
            error: error.message,
            message: 'Erro ao criar/atualizar projeto'
        };
    }
}
// Função auxiliar para buscar projeto pelo nome
async function getProjectByName(projectName) {
    const projetosRef = ref(database, 'projetos');
    const snapshot = await get(projetosRef);
    if (snapshot.exists()) {
        const projetos = snapshot.val();
        for (let id in projetos) {
            if (projetos[id].obra === projectName) {
                return { id, ...projetos[id] };
            }
        }
    }
    return null;
}
// ============================================================
// FUNÇÕES DE LISTAGEM E SELEÇÃO
// ============================================================

/**
 * Cria DOM da lista de operadores
 */
async function MAKEOPERATORSDOM(OperadoresDiv) {
    if (!OperadoresDiv) return;
    
    const Operadorespresentes = await buscarTodosOperadores();
    console.log(`👥 ${Operadorespresentes.length} operadores encontrados`);
    
    // Limpa o container
    OperadoresDiv.innerHTML = "";
    
    if (Operadorespresentes.length === 0) {
        OperadoresDiv.innerHTML = '<p class="text-gray-500 text-center p-8">Nenhum operador cadastrado</p>';
        return;
    }
    
    // Adiciona cada operador
    Operadorespresentes.forEach(element => {
        if (element.nome) {
            OperadoresDiv.innerHTML += `
                <div id="${element.id}" data-id="${element.id}" class="operatorInList flex cursor-pointer items-center gap-4 rounded-lg bg-black p-3 min-h-[72px] justify-between transition-all hover:bg-neutral-900 active:bg-neutral-800 mb-2">
                    <div class="flex items-center gap-4">
                        <div class="flex flex-col justify-center">
                            <p class="text-white text-base font-medium leading-normal line-clamp-1">
                                ${element.nome}
                            </p>
                        </div>
                    </div>
                    <div class="shrink-0">
                        <div class="text-white flex size-7 items-center justify-center">
                            <span class="material-symbols-outlined">chevron_right</span>
                        </div>
                    </div>
                </div>
            `;
        }
    });
    
    // Event delegation para cliques
    OperadoresDiv.addEventListener('click', function(event) {
        const operatorElement = event.target.closest('.operatorInList');
        if (operatorElement) {
            const id = operatorElement.dataset.id;
            handleOperadorClick(id);
        }
    });
}

/**
 * Manipula clique em operador
 */
async function handleOperadorClick(id) {
    console.log('👆 Operador clicado:', id);
    
    // Busca nome do operador
    const operadorRef = ref(database, `operadores/${id}`);
    const snapshot = await get(operadorRef);
    
    if (snapshot.exists()) {
        const operador = snapshot.val();
        storeLocal("OperadorSelecionado", id);
        storeLocal("OperadorNome", operador.nome);
        
        // Redireciona para página de obras do operador
        window.open("./obrasOperador.html", "_self");
    } else {
        alert("❌ Operador não encontrado");
    }
}

// ============================================================
// FUNÇÕES DE BUSCA GERAL
// ============================================================

/**
 * Busca todos os operadores
 */
async function buscarTodosOperadores() {
    try {
        const operadoresRef = ref(database, 'operadores');
        const snapshot = await get(operadoresRef);
        
        if (snapshot.exists()) {
            const operadores = [];
            snapshot.forEach((childSnapshot) => {
                operadores.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            console.log(`✅ ${operadores.length} operadores encontrados`);
            return operadores;
        }
        console.log('📭 Nenhum operador encontrado');
        return [];
    } catch (error) {
        console.error('❌ Erro ao buscar operadores:', error);
        return [];
    }
}

/**
 * Busca todos os clientes
 */
async function buscarTodosClientes() {
    try {
        const clientesRef = ref(database, 'clientes');
        const snapshot = await get(clientesRef);
        
        if (snapshot.exists()) {
            const clientes = [];
            snapshot.forEach((childSnapshot) => {
                clientes.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            console.log(`✅ ${clientes.length} clientes encontrados`);
            return clientes;
        }
        console.log('📭 Nenhum cliente encontrado');
        return [];
    } catch (error) {
        console.error('❌ Erro ao buscar clientes:', error);
        return [];
    }
}


async function removerProjetoDoOperador(operadorId, projetoId) {
    try {
        const projetoRef = ref(database, `operadores/${operadorId}/projetos/${projetoId}`);
        await remove(projetoRef);
        console.log(`🗑️ Projeto removido do operador ${operadorId}`);
        return { success: true };
    } catch (error) {
        console.error(`❌ Erro ao remover projeto:`, error);
        return { success: false, error: error.message };
    }
}
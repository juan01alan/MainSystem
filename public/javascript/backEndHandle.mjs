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
  const operatorDataList = document.getElementById("operatorDataList");
  const cameraBt = document.getElementById('botaoSendFoto');
  if (cameraBt) {
    // if body
    cameraBt.addEventListener('click',()=>{
        irparafotoscreen();
    })
  }
  if (operatorDataList) {
    operatorDataListDOM();
  }
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

let operatorsNAMEArray = [];
async function operatorDataListDOM(){
    const operatorNameDOM = document.getElementById("nomeOperador");
    const operatorDataListDOM = document.getElementById("operatorDataList");
    // Carrega operadores
    const operatorsCur = await buscarTodosOperadores();
    if (operatorsCur.length > 0) {
        operatorsCur.forEach(element => {
            if (element.nome) {
                operatorsNAMEArray.push(element.nome);
                operatorDataListDOM.innerHTML += `<option value="${element.nome}">`;
            }
        });
    }
    operatorNameDOM.addEventListener('input',async (event)=>{
        if (event.target.value) {
            if (operatorsNAMEArray.includes(event.target.value)) {
                console.log(event.target.value);
                
            const salvarOperadotbtnTxt = document.getElementById("btnSalvar");
            salvarOperadotbtnTxt.innerHTML = "Atualizar Operador";
            const operatorValuebyName = await getOperatorByName(event.target.value);
            const operadorRef =await ref(database, `operadores/${operatorValuebyName.id}`);
            const snapshot = await get(operadorRef);
            const valores = snapshot.val();
            console.log(operadorRef);
            if (operadorRef) {
                // Limpar formulário (opcional)
                document.getElementById('nomeOperador').value = valores.nome;
                document.getElementById('competencias').value = valores.competencias === undefined ? "não atribuidas " : valores.competencias;
                contadorCaracteres.textContent = '0';
                
            }
            }
        }
    });
    
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
 * Preenche dados automáticos do formulário
 */
function preencherDadosAutomaticos() {
    // Tentar obter dados da URL
    const urlParams = new URLSearchParams(window.location.search);
    const obra = urlParams.get('obra');
    const nome = urlParams.get('nome');
    const projetoId = urlParams.get('projeto') || urlParams.get('id');
    
    // Preencher campos se disponíveis
    const campoObra = document.getElementById('obraIp');
    const campoNome = document.getElementById('nomeIp');
    
    if (campoObra && obra) campoObra.value = obra;
    if (campoNome && nome) campoNome.value = nome;
    
    // Salvar ID do projeto no localStorage para uso posterior
    if (projetoId) {
        storeLocal("IdFeedBack", projetoId);
        console.log(`📌 ID do projeto salvo: ${projetoId}`);
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarFormularioFeedback);
} else {
    inicializarFormularioFeedback();
}

// Exportar funções para uso em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        coletarDadosFeedback,
        validarFeedback,
        formatarDadosFeedback,
        enviarFeedbackParaFirebase,
        processarEnvioFeedback,
        inicializarFormularioFeedback
    };
}
/**
 * Coleta todos os dados do formulário de feedback incluindo notas brutas
 * @returns {Object} Objeto com todos os dados do formulário
 */
function coletarDadosFeedback() {
    console.log('📝 Coletando dados do feedback...');
    
    // 1. Dados do Projeto (campos automáticos)
    const dadosProjeto = {
        obra: document.getElementById("obraIp")?.value || "",
        nomeCompleto: document.getElementById("nomeIp")?.value || "",
        timestamp: new Date().toISOString(),
        dataEnvio: new Date().toLocaleDateString('pt-BR'),
        horaEnvio: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    // 2. Tipos de Serviço (checkboxes múltiplos)
    const tiposServicoSelecionados = [];
    const checkboxesServico = document.querySelectorAll('input[name="tipoServico"]:checked');
    checkboxesServico.forEach(checkbox => {
        tiposServicoSelecionados.push(checkbox.value);
    });

    // 3. Avaliações (3 ratings separados) - NOTAS BRUTAS DE 0-10
    const avaliacoes = {
        // 🔴 NOTAS BRUTAS (0-10)
        notaTecnicaBruta: obterAvaliacao('rating-btn-tecnica'),
        notaComercialBruta: obterAvaliacao('rating-btn-comercial'),
        notaFinalBruta: obterAvaliacao('rating-btn-final')
    };

    // 4. Média Geral das Avaliações (com cálculo correto)
    const notasValidas = [
        avaliacoes.notaTecnicaBruta, 
        avaliacoes.notaComercialBruta, 
        avaliacoes.notaFinalBruta
    ].filter(nota => nota !== null && !isNaN(nota));
    
    const mediaGeral = notasValidas.length > 0 
        ? (notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length).toFixed(1)
        : 0;

    // 5. Comentários Adicionais
    const comentarios = document.getElementById("adicionalComent")?.value || "";

    // 6. Textos descritivos para cada avaliação
    const textosAvaliacao = {
        tecnica: gerarTextoAvaliacao(avaliacoes.notaTecnicaBruta),
        comercial: gerarTextoAvaliacao(avaliacoes.notaComercialBruta),
        final: gerarTextoAvaliacao(avaliacoes.notaFinalBruta)
    };

    // 7. Status do envio
    const status = {
        enviado: false,
        dataEnvio: null,
        possuiTodasAvaliacoes: avaliacoes.notaTecnicaBruta !== null && 
                               avaliacoes.notaComercialBruta !== null && 
                               avaliacoes.notaFinalBruta !== null
    };

    // Retorna todos os dados em um objeto organizado
    return {
        // Dados básicos
        ...dadosProjeto,
        
        // Tipos de serviço
        tiposServico: {
            selecionados: tiposServicoSelecionados,
            quantidade: tiposServicoSelecionados.length,
            temServicos: tiposServicoSelecionados.length > 0
        },
        
        // 🔴 AVALIAÇÕES COM NOTAS BRUTAS
        avaliacoes: {
            // Notas brutas de 0-10
            notaTecnicaBruta: avaliacoes.notaTecnicaBruta,
            notaComercialBruta: avaliacoes.notaComercialBruta,
            notaFinalBruta: avaliacoes.notaFinalBruta,
            
            // Textos descritivos
            textoAvaliacaoTecnica: textosAvaliacao.tecnica,
            textoAvaliacaoComercial: textosAvaliacao.comercial,
            textoAvaliacaoFinal: textosAvaliacao.final,
            
            // Média geral
            mediaGeral: parseFloat(mediaGeral),
            
            // Status de preenchimento
            todasPreenchidas: status.possuiTodasAvaliacoes
        },
        
        // Comentários
        comentarios: {
            texto: comentarios,
            possuiComentarios: comentarios.trim().length > 0,
            tamanho: comentarios.length,
            palavras: comentarios.trim() === '' ? 0 : comentarios.trim().split(/\s+/).length
        },
        
        // Metadados
        metadata: {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            linguagem: navigator.language,
            plataforma: navigator.platform,
            tela: {
                largura: window.innerWidth,
                altura: window.innerHeight
            }
        },
        
        // Status
        status: status
    };
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
 * Obtém a avaliação de um conjunto específico de botões (VERSÃO CORRIGIDA)
 * @param {string} ratingClass - Classe CSS dos botões de rating
 * @returns {number|null} Valor da avaliação (0-10) ou null se não selecionado
 */
function obterAvaliacao(ratingClass) {
    try {
        console.log(`🔍 Buscando avaliação: ${ratingClass}`);
        
        // ENCONTRAR O BOTÃO SELECIONADO
        // Primeiro, tenta encontrar pelo botão com background color diferente
        let selectedButton = null;
        
        // Busca por botão com classe de seleção (bg-secondary, bg-primary, ou qualquer classe de cor)
        const allButtons = document.querySelectorAll(`.${ratingClass}`);
        
        console.log(`📊 Total de botões ${ratingClass}: ${allButtons.length}`);
        
        // Verifica cada botão para ver qual está selecionado
        allButtons.forEach((button, index) => {
            // Verifica estilos computados
            const styles = window.getComputedStyle(button);
            const backgroundColor = styles.backgroundColor;
            
            // Verifica classes CSS
            const classes = button.classList;
            
            console.log(`  Botão ${index} (value: ${button.value}):`, {
                bgColor: backgroundColor,
                classes: Array.from(classes),
                hasBgSecondary: classes.contains('bg-secondary'),
                hasBgPrimary: classes.contains('bg-primary')
            });
            
            // Um botão está selecionado se:
            // 1. Tem classe bg-secondary ou bg-primary
            // 2. OU tem cor de fundo diferente do padrão
            if (classes.contains('bg-secondary') || 
                classes.contains('bg-primary') ||
                classes.contains('selected') ||
                backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                backgroundColor !== 'transparent') {
                
                selectedButton = button;
                console.log(`  ✅ Botão ${index} selecionado:`, button.value);
            }
        });
        
        if (!selectedButton) {
            console.log(`❌ ${ratingClass}: Nenhum botão selecionado encontrado`);
            return null;
        }
        
        // Obter valor do atributo 'value'
        const rawValue = selectedButton.getAttribute('value');
        
        if (!rawValue || rawValue.trim() === '') {
            console.warn(`⚠️ ${ratingClass}: Botão selecionado sem valor`);
            return null;
        }
        
        // Converter para número
        const value = parseInt(rawValue);
        
        if (isNaN(value)) {
            console.error(`❌ ${ratingClass}: Valor não é um número: "${rawValue}"`);
            return null;
        }
        
        console.log(`📊 ${ratingClass}: Valor bruto encontrado = ${value}`);
        
        // DETERMINAR ESCALA DOS BOTÕES
        // Contar botões válidos neste grupo
        const validButtons = Array.from(allButtons).filter(btn => {
            const val = btn.getAttribute('value');
            return val !== null && val !== '';
        });
        
        if (validButtons.length === 0) {
            console.warn(`⚠️ ${ratingClass}: Nenhum botão válido encontrado`);
            return null;
        }
        
        const values = validButtons.map(btn => parseInt(btn.getAttribute('value')));
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        
        console.log(`📊 ${ratingClass}: Escala detectada: ${minValue} a ${maxValue}, ${validButtons.length} botões`);
        
        // CONVERSÃO PARA ESCALA 0-10
        let notaFinal;
        
        // Se temos botões de 0-9 (10 botões)
        if (validButtons.length === 10 && maxValue === 9) {
            // Botões são 0-9 → converter para 0-10 (adiciona 1)
            notaFinal = value + 1;
            console.log(`🔄 ${ratingClass}: Convertendo ${value}/9 para ${notaFinal}/10`);
        }
        // Se temos botões de 1-10 (10 botões)
        else if (validButtons.length === 10 && maxValue === 10 && minValue === 1) {
            // Já está na escala correta
            notaFinal = value;
            console.log(`📊 ${ratingClass}: Mantendo ${value}/10 (escala 1-10)`);
        }
        // Se temos botões de 0-10 (11 botões)
        else if (validButtons.length === 11 && maxValue === 10 && minValue === 0) {
            // Já está na escala correta
            notaFinal = value;
            console.log(`📊 ${ratingClass}: Mantendo ${value}/10 (escala 0-10)`);
        }
        // Se temos 5 botões (estrelas)
        else if (validButtons.length === 5) {
            // Converter para escala 0-10
            notaFinal = Math.round((value / maxValue) * 10);
            console.log(`🔄 ${ratingClass}: Convertendo ${value}/${maxValue} para ${notaFinal}/10`);
        }
        // Outros casos
        else {
            // Tentar converter baseado na proporção
            notaFinal = Math.round((value / maxValue) * 10);
            console.log(`🔄 ${ratingClass}: Convertendo proporcionalmente ${value}/${maxValue} para ${notaFinal}/10`);
        }
        
        // Garantir que a nota esteja entre 0-10
        notaFinal = Math.max(0, Math.min(10, notaFinal));
        
        console.log(`✅ ${ratingClass}: Nota final = ${notaFinal}/10`);
        return notaFinal;
        
    } catch (error) {
        console.error(`❌ Erro ao obter avaliação ${ratingClass}:`, error);
        return null;
    }
}
/**
 * Gera texto descritivo baseado na nota (0-10)
 * @param {number|null} nota - Nota de 0 a 10 ou null
 * @returns {string} Texto da avaliação
 */
function gerarTextoAvaliacao(nota) {
    // Se nota for null, undefined ou não for número
    if (nota === null || nota === undefined || typeof nota !== 'number' || isNaN(nota)) {
        return "Não Avaliado";
    }
    
    // Garantir que a nota está no range 0-10
    const notaTratada = Math.max(0, Math.min(10, nota));
    
    // Classificação detalhada com base na nota
    if (notaTratada === 10) {
        return "Excepcional ⭐⭐⭐⭐⭐";
    } else if (notaTratada >= 9) {
        return "Excelente ⭐⭐⭐⭐⭐";
    } else if (notaTratada >= 8) {
        return "Muito Bom ⭐⭐⭐⭐";
    } else if (notaTratada >= 7) {
        return "Bom ⭐⭐⭐⭐";
    } else if (notaTratada >= 6) {
        return "Satisfatório ⭐⭐⭐";
    } else if (notaTratada >= 5) {
        return "Regular ⭐⭐⭐";
    } else if (notaTratada >= 4) {
        return "Insuficiente ⭐⭐";
    } else if (notaTratada >= 3) {
        return "Ruim ⭐⭐";
    } else if (notaTratada >= 2) {
        return "Muito Ruim ⭐";
    } else if (notaTratada >= 1) {
        return "Péssimo ⭐";
    } else if (notaTratada === 0) {
        return "Não atendido";
    }
    
    return "Não Avaliado";
}

/**
 * Valida os dados do feedback antes de enviar
 * @param {Object} dados - Dados do feedback coletados do formulário
 * @returns {Object} Resultado da validação
 */
function validarFeedback(dados) {
    console.log('🔍 Validando dados do feedback...');
    
    const erros = [];
    const alertas = [];
    
    // 1. VALIDAÇÕES OBRIGATÓRIAS (CRÍTICAS)
    
    // Verifica se a obra foi preenchida
    if (!dados.obra || dados.obra.trim() === "") {
        erros.push("Nome da obra não preenchido");
    } else if (dados.obra.trim().length < 2) {
        erros.push("Nome da obra muito curto (mínimo 2 caracteres)");
    }
    
    // Verifica se o nome foi preenchido
    if (!dados.nomeCompleto || dados.nomeCompleto.trim() === "") {
        erros.push("Nome completo não preenchido");
    } else if (dados.nomeCompleto.trim().length < 3) {
        erros.push("Nome completo muito curto (mínimo 3 caracteres)");
    } else if (dados.nomeCompleto.trim().length > 100) {
        erros.push("Nome completo muito longo (máximo 100 caracteres)");
    }
    
    // 2. VALIDAÇÕES DAS AVALIAÇÕES
    
    // Verifica se todas as avaliações foram preenchidas
    if (!dados.avaliacoes.todasPreenchidas) {
        // Verifica cada avaliação individualmente para dar feedback específico
        if (dados.avaliacoes.notaTecnicaBruta === null) {
            erros.push("Avaliação da equipe técnica não preenchida");
        }
        if (dados.avaliacoes.notaComercialBruta === null) {
            erros.push("Avaliação da equipe comercial não preenchida");
        }
        if (dados.avaliacoes.notaFinalBruta === null) {
            erros.push("Avaliação final do projeto não preenchida");
        }
    } else {
        // Se todas estão preenchidas, valida os valores individuais
        const validarNota = (nota, nome) => {
            if (nota < 0 || nota > 10) {
                erros.push(`${nome} deve estar entre 0 e 10`);
            }
            if (!Number.isInteger(nota)) {
                alertas.push(`${nome} não é um número inteiro`);
            }
        };
        
        validarNota(dados.avaliacoes.notaTecnicaBruta, "Nota técnica");
        validarNota(dados.avaliacoes.notaComercialBruta, "Nota comercial");
        validarNota(dados.avaliacoes.notaFinalBruta, "Nota final");
        
        // Verificar se alguma nota é muito baixa (alerta, não erro)
        if (dados.avaliacoes.notaTecnicaBruta < 3) {
            alertas.push("Nota da equipe técnica muito baixa");
        }
        if (dados.avaliacoes.notaComercialBruta < 3) {
            alertas.push("Nota da equipe comercial muito baixa");
        }
        if (dados.avaliacoes.notaFinalBruta < 3) {
            alertas.push("Nota final do projeto muito baixa");
        }
        
        // Verificar média geral muito baixa
        if (dados.avaliacoes.mediaGeral < 4) {
            alertas.push("Média geral muito baixa");
        }
    }
    
    // 3. VALIDAÇÕES DOS COMENTÁRIOS
    
    if (dados.comentarios.possuiComentarios) {
        // Comentários preenchidos
        if (dados.comentarios.texto.length < 5) {
            alertas.push("Comentários muito curtos (mínimo 5 caracteres)");
        } else if (dados.comentarios.texto.length > 2000) {
            erros.push("Comentários muito longos (máximo 2000 caracteres)");
        }
        
        // Verificar palavras ofensivas (exemplo básico)
        const palavrasIndesejadas = ['palavra1', 'palavra2']; // Adicione palavras aqui
        const textoLower = dados.comentarios.texto.toLowerCase();
        
        palavrasIndesejadas.forEach(palavra => {
            if (textoLower.includes(palavra)) {
                alertas.push("Comentário contém linguagem inadequada");
            }
        });
    } else {
        // Sem comentários
        if (dados.avaliacoes.mediaGeral < 6) {
            alertas.push("Nota baixa sem comentários explicativos");
        }
    }
    
    // 4. VALIDAÇÕES DOS TIPOS DE SERVIÇO
    
    if (!dados.tiposServico.temServicos) {
        alertas.push("Nenhum tipo de serviço selecionado");
    } else if (dados.tiposServico.quantidade > 4) {
        alertas.push("Muitos tipos de serviço selecionados");
    }
    
    // 5. VALIDAÇÕES DE DADOS TÉCNICOS
    
    if (dados.metadata.userAgent && dados.metadata.userAgent.length < 10) {
        alertas.push("User agent incompleto");
    }
    
    // 6. VERIFICAÇÕES DE CONSISTÊNCIA
    
    // Se nota técnica e comercial forem altas mas final for baixa
    if (dados.avaliacoes.todasPreenchidas) {
        const diffTecnicaFinal = Math.abs(dados.avaliacoes.notaTecnicaBruta - dados.avaliacoes.notaFinalBruta);
        const diffComercialFinal = Math.abs(dados.avaliacoes.notaComercialBruta - dados.avaliacoes.notaFinalBruta);
        
        if (diffTecnicaFinal > 5) {
            alertas.push("Grande diferença entre nota técnica e nota final");
        }
        if (diffComercialFinal > 5) {
            alertas.push("Grande diferença entre nota comercial e nota final");
        }
    }
    
    // 7. PREPARAR RESULTADO
    
    const resultado = {
        valido: erros.length === 0,
        temAlertas: alertas.length > 0,
        erros: erros,
        alertas: alertas,
        totalErros: erros.length,
        totalAlertas: alertas.length
    };
    
    // Adicionar mensagem descritiva
    if (erros.length > 0) {
        resultado.mensagem = `Encontramos ${erros.length} erro(s) que precisam ser corrigidos`;
    } else if (alertas.length > 0) {
        resultado.mensagem = `✓ Dados válidos, mas temos ${alertas.length} alerta(s)`;
    } else {
        resultado.mensagem = "✓ Todos os dados estão válidos para envio";
    }
    
    // Adicionar pontuação de qualidade (opcional)
    resultado.pontuacaoQualidade = calcularPontuacaoQualidade(dados, erros.length);
    
    console.log('📊 Resultado da validação:', resultado);
    return resultado;
}

/**
 * Calcula pontuação de qualidade do feedback (opcional)
 */
function calcularPontuacaoQualidade(dados, totalErros) {
    let pontuacao = 100;
    
    // Penalidades por erros
    pontuacao -= totalErros * 20;
    
    // Penalidades por alertas (menos severas)
    if (dados.comentarios.possuiComentarios && dados.comentarios.texto.length < 10) {
        pontuacao -= 5;
    }
    
    if (!dados.tiposServico.temServicos) {
        pontuacao -= 10;
    }
    
    if (dados.avaliacoes.mediaGeral < 5) {
        pontuacao -= 10;
    }
    
    // Bônus por feedback detalhado
    if (dados.comentarios.possuiComentarios && dados.comentarios.palavras > 20) {
        pontuacao += 5;
    }
    
    if (dados.tiposServico.quantidade >= 2) {
        pontuacao += 5;
    }
    
    // Garantir que fique entre 0-100
    return Math.max(0, Math.min(100, Math.round(pontuacao)));
}

/**
 * Formata os dados para exibição com notas brutas
 */
function formatarDadosFeedback(dados) {
    const tiposServicoMap = {
        microcimento: "Microcimento",
        pisos_paineis_madeira: "Pisos e Paineis de Madeira",
        deck: "Deck",
        pedras_drenantes: "Pedras Drenantes"
    };
    
    const tiposServicoFormatados = dados.tiposServico.selecionados.map(
        tipo => tiposServicoMap[tipo] || tipo
    );
    
    return {
        resumo: `📊 Feedback de ${dados.nomeCompleto}`,
        detalhes: {
            obra: dados.obra,
            cliente: dados.nomeCompleto,
            tiposServico: tiposServicoFormatados.join(", ") || "Nenhum selecionado",
            
            // 🔴 EXIBE NOTAS BRUTAS
            avaliacoes: {
                // Notas brutas
                notasBrutas: {
                    tecnica: `${dados.avaliacoes.notaTecnicaBruta}/10`,
                    comercial: `${dados.avaliacoes.notaComercialBruta}/10`,
                    final: `${dados.avaliacoes.notaFinalBruta}/10`
                },
                
                // Textos descritivos
                textos: {
                    tecnica: dados.avaliacoes.textoAvaliacaoTecnica,
                    comercial: dados.avaliacoes.textoAvaliacaoComercial,
                    final: dados.avaliacoes.textoAvaliacaoFinal
                },
                
                media: `${dados.avaliacoes.mediaGeral}/10`
            },
            
            comentarios: dados.comentarios.texto || "Sem comentários adicionais",
            data: dados.dataEnvio,
            hora: dados.horaEnvio
        },
        paraJSON: function() {
            return JSON.stringify(this.detalhes, null, 2);
        },
        paraTexto: function() {
            return `
            📋 FEEDBACK RECEBIDO - WeDo Administração
            
            👤 Cliente: ${this.detalhes.cliente}
            🏗️ Obra: ${this.detalhes.obra}
            
            🛠️ Tipos de Serviço:
            ${this.detalhes.tiposServico}
            
            ⭐ NOTAS BRUTAS (0-10):
            • Equipe Técnica: ${this.detalhes.avaliacoes.notasBrutas.tecnica}
            • Equipe Comercial: ${this.detalhes.avaliacoes.notasBrutas.comercial}
            • Projeto Final: ${this.detalhes.avaliacoes.notasBrutas.final}
            • Média Geral: ${this.detalhes.avaliacoes.media}
            
            📝 AVALIAÇÕES:
            • Técnica: ${this.detalhes.avaliacoes.textos.tecnica}
            • Comercial: ${this.detalhes.avaliacoes.textos.comercial}
            • Final: ${this.detalhes.avaliacoes.textos.final}
            
            💬 Comentários:
            ${this.detalhes.comentarios}
            
            📅 Enviado em: ${this.detalhes.data} às ${this.detalhes.hora}
            `;
        }
    };
}
/**
 * Envia feedback para o Firebase COM NOTAS BRUTAS
 * @param {Object} dados - Dados do feedback coletados do formulário
 * @returns {Promise<Object>} Resultado do envio
 */
async function enviarFeedbackParaFirebase(dados) {
    console.log('🚀 Iniciando envio do feedback para Firebase...');
    console.log('🔴 DETALHES DAS NOTAS BRUTAS:');
    console.log(`   • Técnica: ${dados.avaliacoes.notaTecnicaBruta}/10`);
    console.log(`   • Comercial: ${dados.avaliacoes.notaComercialBruta}/10`);
    console.log(`   • Final: ${dados.avaliacoes.notaFinalBruta}/10`);
    console.log(`   • Média Geral: ${dados.avaliacoes.mediaGeral}/10`);
    
    try {
        // 1. Obtém o ID do projeto
        let projectAtual = retrieveLocal("IdFeedBack");
        
        if (!projectAtual) {
            console.warn('⚠️ ID do projeto não encontrado no localStorage, tentando URL...');
            const urlParams = new URLSearchParams(window.location.search);
            projectAtual = urlParams.get("id") || urlParams.get("projeto");
        }
        
        if (!projectAtual) {
            throw new Error("ID do projeto não encontrado");
        }
        
        console.log(`📁 Enviando feedback para o projeto: ${projectAtual}`);
        
        // 2. Prepara os dados para o Firebase COM NOTAS BRUTAS
        const dadosFirebase = {
            // Dados do projeto
            projetoId: projectAtual,
            obra: dados.obra || '',
            cliente: dados.nomeCompleto || '',
            
            // Tipos de serviço
            tiposServico: dados.tiposServico.selecionados,
            quantidadeTiposServico: dados.tiposServico.quantidade,
            
            // 🔴 AVALIAÇÕES COM NOTAS BRUTAS (0-10)
            avaliacoes: {
                // 🔴 NOTAS BRUTAS (0-10)
                notaBruta: {
                    tecnica: dados.avaliacoes.notaTecnicaBruta,
                    comercial: dados.avaliacoes.notaComercialBruta,
                    final: dados.avaliacoes.notaFinalBruta
                },
                
                // Textos descritivos
                texto: {
                    tecnica: dados.avaliacoes.textoAvaliacaoTecnica,
                    comercial: dados.avaliacoes.textoAvaliacaoComercial,
                    final: dados.avaliacoes.textoAvaliacaoFinal
                },
                
                // Média geral
                mediaGeral: dados.avaliacoes.mediaGeral,
                
                // 🔴 CLASSIFICAÇÃO NUMÉRICA
                classificacaoNumerica: {
                    tecnica: dados.avaliacoes.notaTecnicaBruta,
                    comercial: dados.avaliacoes.notaComercialBruta,
                    final: dados.avaliacoes.notaFinalBruta,
                    media: dados.avaliacoes.mediaGeral
                },
                
                // Status
                todasAvaliacoesPreenchidas: dados.avaliacoes.todasPreenchidas
            },
            
            // Comentários
            comentarios: dados.comentarios.texto || '',
            possuiComentarios: dados.comentarios.possuiComentarios,
            tamanhoComentarios: dados.comentarios.tamanho,
            palavrasComentarios: dados.comentarios.palavras,
            
            // Metadados
            dataEnvio: new Date().toISOString(),
            dataEnvioFormatada: dados.dataEnvio,
            horaEnvio: dados.horaEnvio,
            
            // Informações técnicas
            userAgent: dados.metadata.userAgent.substring(0, 150),
            linguagem: dados.metadata.linguagem,
            tela: dados.metadata.tela,
            
            // Status
            status: 'recebido',
            processado: false,
            revisaoPendente: dados.avaliacoes.mediaGeral < 6,
            
            // Timestamp para ordenação
            timestamp: Date.now(),
            timestampLegivel: new Date().toLocaleString('pt-BR'),
            
            // 🔴 METADADOS DAS NOTAS
            metadataNotas: {
                escala: "0-10",
                unidade: "pontos",
                precisao: "inteiro",
                maximo: 10,
                minimo: 0
            }
        };
        
        // 3. Referência para o Firebase
        const feedbackRef = ref(database, `feedbacks/${projectAtual}`);
        const novoFeedbackRef = push(feedbackRef);
        const feedbackId = novoFeedbackRef.key;
        
        // 4. Adiciona o ID do feedback aos dados
        dadosFirebase.id = feedbackId;
        
        // 5. Salva no Firebase
        await set(novoFeedbackRef, dadosFirebase);
        
        console.log(`✅ Feedback enviado com sucesso! ID: ${feedbackId}`);
        console.log(`🔴 RESUMO DAS NOTAS SALVAS:`);
        console.log(`   • Técnica: ${dadosFirebase.avaliacoes.notaBruta.tecnica}/10`);
        console.log(`   • Comercial: ${dadosFirebase.avaliacoes.notaBruta.comercial}/10`);
        console.log(`   • Final: ${dadosFirebase.avaliacoes.notaBruta.final}/10`);
        console.log(`   • Média: ${dadosFirebase.avaliacoes.classificacaoNumerica.media}/10`);
        
        // 6. Atualiza o projeto com estatísticas DETALHADAS
        try {
            await atualizarEstatisticasProjeto(projectAtual, dadosFirebase);
        } catch (error) {
            console.warn('⚠️ Não foi possível atualizar estatísticas do projeto:', error);
        }
        
        return {
            success: true,
            feedbackId: feedbackId,
            projetoId: projectAtual,
            message: 'Feedback enviado com sucesso!',
            dados: dadosFirebase,
            notas: {
                tecnica: dadosFirebase.avaliacoes.notaBruta.tecnica,
                comercial: dadosFirebase.avaliacoes.notaBruta.comercial,
                final: dadosFirebase.avaliacoes.notaBruta.final,
                media: dadosFirebase.avaliacoes.classificacaoNumerica.media
            },
            timestamp: new Date().toISOString(),
            redirectUrl: `obrigado.html?id=${projectAtual}&feedback=${feedbackId}&nota=${dados.avaliacoes.mediaGeral}`
        };
        
    } catch (error) {
        console.error('❌ Erro ao enviar feedback para o Firebase:', error);
        return {
            success: false,
            error: error.message,
            code: error.code || 'UNKNOWN_ERROR',
            message: 'Erro ao enviar feedback para o banco de dados',
            timestamp: new Date().toISOString()
        };
    }
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

/**
 * Inicializa todo o sistema de feedback (USANDO SINGLETON PARA EVITAR DUPLICAÇÃO)
 */
function inicializarSistemaFeedback() {
    console.log('🚀 Inicializando sistema de feedback...');
    
    // Verificar se já foi inicializado
    if (window.feedbackSystemInitialized) {
        console.log('⚠️ Sistema de feedback já inicializado, ignorando...');
        return;
    }
    
    // Inicializa o sistema de rating
    inicializarSistemaRating();
    
    // Configura o botão de envio (APENAS UMA VEZ)
    configurarBotaoEnvioFeedback();
    
    // Adiciona preenchimento automático se necessário
    preencherDadosFeedbackAutomaticos();
    
    // Marcar como inicializado
    window.feedbackSystemInitialized = true;
    
    console.log('✅ Sistema de feedback inicializado');
}

/**
 * Configura o botão de envio do feedback (COM PREVENÇÃO DE DUPLICAÇÃO)
 */
function configurarBotaoEnvioFeedback() {
    const botaoEnvio = document.getElementById('submitFeedback');
    
    if (!botaoEnvio) {
        console.warn('⚠️ Botão de envio de feedback não encontrado');
        return;
    }
    
    // Remover event listeners anteriores para evitar duplicação
    const novoBotao = botaoEnvio.cloneNode(true);
    botaoEnvio.parentNode.replaceChild(novoBotao, botaoEnvio);
    
    // Agora adicionar o event listener ao novo botão
    const botaoAtual = document.getElementById('submitFeedback');
    
    // Usar um flag para evitar múltiplos cliques simultâneos
    let enviando = false;
    
    botaoAtual.addEventListener('click', async function(event) {
        event.preventDefault();
        event.stopPropagation(); // Impedir propagação
        
        // Prevenir múltiplos cliques simultâneos
        if (enviando) {
            console.log('⏳ Feedback já sendo enviado, aguarde...');
            return;
        }
        
        console.log('🎯 Botão de feedback clicado');
        enviando = true;
        
        try {
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
            
            if (!confirmacao) {
                console.log('❌ Envio cancelado pelo usuário');
                return;
            }
            
            // Desabilita o botão durante o envio
            botaoAtual.disabled = true;
            const textoOriginal = botaoAtual.innerHTML;
            botaoAtual.innerHTML = 'Enviando...';
            botaoAtual.classList.add('opacity-50');
            
            // Envia o feedback
            const resultado = await enviarFeedbackParaFirebase(dados);
            
            if (resultado.success) {
                alert('✅ Feedback enviado com sucesso!');
                
                // Limpa o formulário
                limparFormularioFeedback();
                
                console.log('📊 Feedback enviado:', dadosFormatados.detalhes);
                
                // Redireciona para página de obrigado
                setTimeout(() => {
                    if (resultado.redirectUrl) {
                        window.location.href = resultado.redirectUrl;
                    } else {
                        window.location.href = `obrigado.html?nota=${dados.avaliacoes.mediaGeral}`;
                    }
                }, 1500);
                
            } else {
                alert(`❌ Erro: ${resultado.message}`);
            }
            
        } catch (error) {
            alert('❌ Erro ao enviar feedback. Tente novamente.');
            console.error('Erro no envio:', error);
            
        } finally {
            // Reabilita o botão
            enviando = false;
            if (botaoAtual) {
                botaoAtual.disabled = false;
                botaoAtual.innerHTML = 'Enviar Feedback';
                botaoAtual.classList.remove('opacity-50');
            }
        }
    });
}

/**
 * Inicializa o formulário de feedback (MODIFICADA PARA NÃO DUPLICAR)
 */
function inicializarFormularioFeedback() {
    console.log('🚀 Inicializando formulário de feedback...');
    
    // Verificar se já foi inicializado
    if (window.formularioFeedbackInitialized) {
        console.log('⚠️ Formulário de feedback já inicializado');
        return;
    }
    
    // Apenas inicializar sistemas básicos, não configurar botão aqui
    inicializarSistemaRating();
    
    // Preencher dados automáticos
    preencherDadosFeedbackAutomaticos();
    
    // Configurar contador de caracteres (se houver)
    configurarContadorCaracteres();
    
    // Marcar como inicializado
    window.formularioFeedbackInitialized = true;
    
    console.log('✅ Formulário de feedback inicializado');
}

/**
 * Inicializa o sistema de rating (botões clicáveis)
 */
function inicializarSistemaRating() {
    console.log('⚙️ Inicializando sistema de rating...');
    
    // Configura cada um dos 3 sistemas de rating
    const ratingSystems = ['rating-btn-tecnica', 'rating-btn-comercial', 'rating-btn-final'];
    
    ratingSystems.forEach(ratingClass => {
        const buttons = document.querySelectorAll(`.${ratingClass}`);
        
        if (buttons.length === 0) return;
        
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                const value = parseInt(this.getAttribute('value'));
                const container = this.closest('div.flex.flex-1');
                const allButtons = container.querySelectorAll(`.${ratingClass}`);
                
                // Remove a seleção de todos os botões
                allButtons.forEach(btn => {
                    btn.classList.remove('bg-secondary', 'text-white');
                    btn.classList.add('bg-transparent', 'text-secondary');
                });
                
                // Seleciona os botões até o clicado
                for (let i = 0; i <= value; i++) {
                    const btnToSelect = container.querySelector(`.${ratingClass}[value="${i}"]`);
                    if (btnToSelect) {
                        btnToSelect.classList.remove('bg-transparent', 'text-secondary');
                        btnToSelect.classList.add('bg-secondary', 'text-white');
                    }
                }
                
                console.log(`⭐ ${ratingClass}: ${value}/10 selecionado`);
                
                // Atualiza o preview da avaliação
                atualizarPreviewAvaliacao(ratingClass, value);
            });
            
            // Efeitos hover
            button.addEventListener('mouseenter', function() {
                const value = parseInt(this.getAttribute('value'));
                const container = this.closest('div.flex.flex-1');
                const allButtons = container.querySelectorAll(`.${ratingClass}`);
                
                allButtons.forEach((btn, index) => {
                    if (index <= value) {
                        btn.classList.add('opacity-80', 'bg-secondary/30');
                    }
                });
            });
            
            button.addEventListener('mouseleave', function() {
                const container = this.closest('div.flex.flex-1');
                const allButtons = container.querySelectorAll(`.${ratingClass}`);
                
                allButtons.forEach(btn => {
                    btn.classList.remove('opacity-80', 'bg-secondary/30');
                });
            });
        });
    });
    
    // Inicializa o sistema de checkboxes de tipos de serviço
    inicializarCheckboxesServico();
}

/**
 * Inicializa checkboxes de tipos de serviço
 */
function inicializarCheckboxesServico() {
    const serviceCheckboxes = document.querySelectorAll('input[name="tipoServico"]');
    
    if (serviceCheckboxes.length === 0) {
        console.log('⚠️ Nenhum checkbox de tipo de serviço encontrado');
        return;
    }
    
    serviceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const parent = this.closest('label');
            if (!parent) return;
            
            if (this.checked) {
                parent.classList.add('bg-secondary/10', 'border-primary/50');
            } else {
                parent.classList.remove('bg-secondary/10', 'border-primary/50');
            }
            console.log(`🔘 Tipo de serviço: ${this.value} - ${this.checked ? 'selecionado' : 'desmarcado'}`);
        });
    });
}

/**
 * Atualiza o preview da avaliação
 */
function atualizarPreviewAvaliacao(ratingClass, value) {
    const ratingTitles = {
        'rating-btn-tecnica': 'Equipe Técnica',
        'rating-btn-comercial': 'Equipe Comercial',
        'rating-btn-final': 'Projeto Final'
    };
    
    const title = ratingTitles[ratingClass] || ratingClass;
    const texto = gerarTextoAvaliacao(value);
    
    // Aqui você pode atualizar algum elemento na UI se desejar
    // Exemplo: mostrar a descrição da nota ao lado
    const previewElement = document.querySelector(`#preview-${ratingClass}`);
    if (previewElement) {
        previewElement.textContent = `${value}/10 - ${texto}`;
    }
}



/**
 * Preenche dados automáticos do formulário
 */
function preencherDadosFeedbackAutomaticos() {
    const urlParams = new URLSearchParams(window.location.search);
    const obraParam = urlParams.get('obra');
    const idParam = urlParams.get('id');
    const clienteParam = urlParams.get('cliente');
    
    // Armazena ID para uso posterior
    if (idParam) {
        storeLocal("IdFeedBack", idParam);
    }
    
    // Preenche campos automáticos
    if (obraParam && document.getElementById('obraIp')) {
        document.getElementById('obraIp').value = decodeURIComponent(obraParam);
    }
    
    if (clienteParam && document.getElementById('nomeIp')) {
        document.getElementById('nomeIp').value = decodeURIComponent(clienteParam);
    }
    
    console.log('📋 Dados automáticos preenchidos:', {
        obra: obraParam,
        cliente: clienteParam,
        id: idParam
    });
}

/**
 * Configura contador de caracteres para comentários
 */
function configurarContadorCaracteres() {
    const textarea = document.getElementById('adicionalComent');
    const contador = document.getElementById('contadorCaracteres');
    
    if (!textarea || !contador) return;
    
    textarea.addEventListener('input', function() {
        const caracteres = this.value.length;
        contador.textContent = `${caracteres}/2000`;
        
        // Altera cor se passar de 1500 caracteres
        if (caracteres > 1800) {
            contador.classList.add('text-red-500');
            contador.classList.remove('text-gray-500');
        } else if (caracteres > 1500) {
            contador.classList.add('text-yellow-500');
            contador.classList.remove('text-gray-500');
        } else {
            contador.classList.remove('text-red-500', 'text-yellow-500');
            contador.classList.add('text-gray-500');
        }
    });
}

/**
 * Limpa o formulário após envio
 */
function limparFormularioFeedback() {
    console.log('🧹 Limpando formulário de feedback...');
    
    // Limpar checkboxes de tipos de serviço
    const serviceCheckboxes = document.querySelectorAll('input[name="tipoServico"]');
    serviceCheckboxes.forEach(cb => {
        cb.checked = false;
        const parent = cb.closest('label');
        if (parent) {
            parent.classList.remove('bg-secondary/10', 'border-primary/50');
        }
    });
    
    // Limpar avaliações
    const ratingClasses = ['rating-btn-tecnica', 'rating-btn-comercial', 'rating-btn-final'];
    ratingClasses.forEach(className => {
        const buttons = document.querySelectorAll(`.${className}`);
        buttons.forEach(btn => {
            btn.classList.remove('bg-secondary', 'text-white');
            btn.classList.add('bg-transparent', 'text-secondary');
        });
    });
    
    // Limpar textarea
    const textarea = document.getElementById('adicionalComent');
    if (textarea) {
        textarea.value = '';
        
        // Atualizar contador
        const contador = document.getElementById('contadorCaracteres');
        if (contador) {
            contador.textContent = '0/2000';
            contador.classList.remove('text-red-500', 'text-yellow-500');
            contador.classList.add('text-gray-500');
        }
    }
    
    // Limpar previews (se existirem)
    const previewElements = document.querySelectorAll('[id^="preview-"]');
    previewElements.forEach(el => {
        el.textContent = '';
    });
    
    console.log('✅ Formulário limpo');
}

// Exportar funções se for módulo ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        inicializarSistemaFeedback,
        inicializarSistemaRating,
        inicializarFormularioFeedback,
        coletarDadosFeedback,
        validarFeedback,
        formatarDadosFeedback,
        enviarFeedbackParaFirebase,
        limparFormularioFeedback
    };
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
 */function collectFormData() {
    operatorList = vo(); // Obtém lista de operadores selecionados
    const dataHoje = obterDataDeHoje();

    return {
        cliente: document.getElementById("nomeCliente").value,
        obra: document.getElementById("nomedaobra").value,
        localizacao: document.getElementById("local").value,
        descricao: document.getElementById("descricao").value,
        email: document.getElementById("emailcliente").value,
        whatsappCliente: document.getElementById("whatsappcliente").value,
        Criado: dataHoje,
        cpfCnpjCliente: document.getElementById("cpfcnpjcliente").value,
        operadores: operatorList,
        dataInicial: document.getElementById("datainicial").value,
        dataFinal: document.getElementById("datafinal").value,
        managerId: 0,
        status: 0,
        // NOVOS CAMPOS ADICIONADOS
        engenheiroResponsavel: document.getElementById("engenheiro").value,
        arquitetoResponsavel: document.getElementById("arquiteto").value,
        dataEntregaMaterial: document.getElementById("dataEntregaMaterial").value,
        horarioTrabalho: {
            inicio: document.getElementById("horarioInicio").value,
            termino: document.getElementById("horarioTermino").value
        }
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
function clearForm() {function clearForm() {
    document.getElementById("nomedaobra").value = "";
    document.getElementById("local").value = "";
    document.getElementById("descricao").value = "";
    document.getElementById("datainicial").value = "";
    document.getElementById("datafinal").value = "";
    document.getElementById("nomeCliente").value = "";
    document.getElementById("cpfcnpjcliente").value = "";
    document.getElementById("emailcliente").value = "";
    document.getElementById("whatsappcliente").value = "";
    // NOVOS CAMPOS
    document.getElementById("engenheiro").value = "";
    document.getElementById("arquiteto").value = "";
    document.getElementById("dataEntregaMaterial").value = "";
    document.getElementById("horarioInicio").value = "08:00";
    document.getElementById("horarioTermino").value = "18:00";
}
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
function irparafotoscreen () {
    const inputFoto = retrieveLocal("chatAtual");
    let nomeFoto = inputFoto ? 'foto' + inputFoto : '';

    

    if (nomeFoto) {
        const agora = new Date();
        const dataHora = agora.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
        // Passar nomeFoto e dataHora como parâmetros separados
        window.open(`../fotos_rotina/index.html?obra=${encodeURIComponent(nomeFoto)}&dataHora=${encodeURIComponent(dataHora)}`, '_blank');
    } else {
        alert('Nenhum nome de foto fornecido.');
    }
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
            
            obraCard.innerHTML =  `
    <div id="${element.id}" class="w-full max-w-md flex flex-col gap-3">
        <button data-status="${element.status}" data-nome="${element.obra}" data-id="${element.id}" 
                class="obra-item w-full cursor-pointer flex items-center justify-between overflow-hidden rounded-xl h-20 px-6 bg-primary text-white gap-4 text-lg font-bold leading-normal tracking-[0.015em] active:opacity-80 transition-all duration-200 hover:bg-primary/90 hover:shadow-lg">
            <span class="truncate text-left flex-1">${element.obra}</span>
            <span class="material-symbols-outlined text-3xl text-white/70 flex-shrink-0">arrow_forward_ios</span>
        </button>
        
        <div class="flex flex-col text-sm text-primary/80 dark:text-neutral-50/80 px-2 gap-1">
            <p><span class="font-bold">Status:</span> ${element.status == 0 ? "🟢 Em andamento" : "✅ Finalizado"}</p>
            <p><span class="font-bold">Criado em:</span> ${element.Criado}</p>
            
            ${element.tipoServico ? `<p><span class="font-bold">Tipo de Serviço:</span> ${element.tipoServico}</p>` : ''}
            ${element.cliente ? `<p><span class="font-bold">Cliente:</span> ${element.cliente}</p>` : ''}
            ${element.arquiteto ? `<p><span class="font-bold">Arquiteto:</span> ${element.arquiteto}</p>` : ''}
            ${element.engenheiro ? `<p><span class="font-bold">Engenheiro:</span> ${element.engenheiro}</p>` : ''}
            
            ${element.mediaGeral !== undefined ? `
                <div class="mt-1">
                    <span class="font-bold">Média Geral:</span>
                    <div class="inline-flex items-center ml-2">
                        ${getStars(element.mediaGeral)}
                        <span class="ml-2 font-medium">${element.mediaGeral.toFixed(1)}/5</span>
                    </div>
                </div>
            ` : ''}
            
            
            ${operadoresFormatados ? `<p><span class="font-bold">Operadores:</span> ${operadoresFormatados}</p>` : ''}
            
            ${element.linkReview ? `
                <a class="font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors" 
                   href="${element.linkReview}" 
                   target="_blank">
                   🔗 Ver Review
                </a>
            ` : ''}
        </div>
        
        <!-- Botão para página de feedbacks -->
        <button onclick="window.open('./todosFeedbacks.html?obra=${encodeURIComponent(element.id)}&nome=${encodeURIComponent(element.obra)}', '_blank')"
                class="mt-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2">
            <span class="material-symbols-outlined">reviews</span>
            Ver Feedbacks
        </button>
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


// Função auxiliar para mostrar estrelas (opcional)
function getStars(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
        stars += '⭐';
    }
    
    if (hasHalfStar) {
        stars += '✨';
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        stars += '☆';
    }
    
    return stars;
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
        const projetos = values.projetos;
        const dados = {
            ...novosDados,
            projetos: projetos,
        }

        if (!values) {
            alert('Operador não encontrado');
            return false;
        }

        if (values) {
            await update(operadoresRef, dados);
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
                document.getElementById('competencias').value = valores.competencias === undefined ? "não atribuidas " : valores.competencias;
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
// nao usado, só a caso de estudo
/**
 * Adiciona um projeto ao operador se ele não existir no array
 * @param {string} operadorId - ID do operador
 * @param {string} projetoId - ID do projeto
 * @param {Object} projetoData - Dados do projeto
 * @returns {Promise<Object>} - Resultado da operação
 */
export async function adicionarProjetoAoOperador(operadorId, projetoId, projetoData) {
    try {
        const operadorRef = ref(database, `operadores/${operadorId}`);
        const snapshot = await get(operadorRef);
        
        if (!snapshot.exists()) {
            return {
                success: false,
                error: 'Operador não encontrado',
                message: `Operador ${operadorId} não existe no banco de dados`
            };
        }

        const operador = snapshot.val();
        
        // Inicializa o array de projetos se não existir
        if (!operador.projetos) {
            operador.projetos = {};
        }

        // Verifica se o projeto já existe
        if (operador.projetos[projetoId]) {
            return {
                success: true,
                exists: true,
                message: 'Projeto já está associado ao operador'
            };
        }

        // Adiciona o projeto ao operador
        const projetoInfo = {
            id: projetoId,
            nome: projetoData.nome || 'Projeto sem nome',
            dataAssociacao: new Date().toISOString(),
            status: 'ativo',
            ...projetoData
        };

        // Atualiza apenas o projeto específico
        const updates = {};
        updates[`operadores/${operadorId}/projetos/${projetoId}`] = projetoInfo;

        await update(ref(database), updates);

        return {
            success: true,
            exists: false,
            data: projetoInfo,
            message: 'Projeto adicionado ao operador com sucesso'
        };

    } catch (error) {
        console.error('Erro ao adicionar projeto ao operador:', error);
        return {
            success: false,
            error: error.message,
            message: 'Erro ao adicionar projeto'
        };
    }
}

/**
 * Remove um projeto do operador (quando concluído)
 * @param {string} operadorId - ID do operador
 * @param {string} projetoId - ID do projeto
 * @returns {Promise<Object>} - Resultado da operação
 */
export async function removerProjetoDoOperador(operadorId, projetoId) {
    try {
        const projetoRef = ref(database, `operadores/${operadorId}/projetos/${projetoId}`);
        const snapshot = await get(projetoRef);
        
        if (!snapshot.exists()) {
            return {
                success: false,
                error: 'Projeto não encontrado',
                message: `Projeto ${projetoId} não está associado ao operador ${operadorId}`
            };
        }

        // Remove o projeto do operador
        await remove(projetoRef);

        return {
            success: true,
            message: 'Projeto removido do operador com sucesso'
        };

    } catch (error) {
        console.error('Erro ao remover projeto do operador:', error);
        return {
            success: false,
            error: error.message,
            message: 'Erro ao remover projeto'
        };
    }
}

/**
 * Marca projeto como concluído (em vez de remover imediatamente)
 * @param {string} operadorId - ID do operador
 * @param {string} projetoId - ID do projeto
 * @returns {Promise<Object>} - Resultado da operação
 */
export async function marcarProjetoComoConcluido(operadorId, projetoId) {
    try {
        const projetoRef = ref(database, `operadores/${operadorId}/projetos/${projetoId}`);
        const snapshot = await get(projetoRef);
        
        if (!snapshot.exists()) {
            return {
                success: false,
                error: 'Projeto não encontrado'
            };
        }

        // Atualiza o status para concluído
        await update(projetoRef, {
            status: 'concluido',
            dataConclusao: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        });

        return {
            success: true,
            message: 'Projeto marcado como concluído'
        };

    } catch (error) {
        console.error('Erro ao marcar projeto como concluído:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Busca todos os projetos de um operador
 * @param {string} operadorId - ID do operador
 * @returns {Promise<Array>} - Lista de projetos do operador
 */
export async function buscarProjetosDoOperador(operadorId) {
    try {
        const projetosRef = ref(database, `operadores/${operadorId}/projetos`);
        const snapshot = await get(projetosRef);
        
        if (snapshot.exists()) {
            const projetos = [];
            snapshot.forEach((childSnapshot) => {
                projetos.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            return projetos;
        } else {
            return [];
        }
    } catch (error) {
        console.error('Erro ao buscar projetos do operador:', error);
        throw error;
    }
}

/**
 * Função completa: cria operador se não existir e associa projeto
 * @param {Object} operadorData - Dados do operador
 * @param {string} projetoId - ID do projeto
 * @param {Object} projetoData - Dados do projeto
 * @returns {Promise<Object>} - Resultado completo
 */
export async function garantirOperadorEProjeto(operadorData, projetoId, projetoData) {
    try {
        // Importa a função do arquivo anterior
        const { verificarOuCriarOperador } = await import('./operadores.mjs');
        
        // 1. Verifica/Cria operador
        const resultadoOperador = await verificarOuCriarOperador(operadorData);
        
        if (!resultadoOperador.success) {
            return resultadoOperador;
        }

        // 2. Associa projeto ao operador
        const resultadoProjeto = await adicionarProjetoAoOperador(
            operadorData.id, 
            projetoId, 
            projetoData
        );

        return {
            operador: resultadoOperador,
            projeto: resultadoProjeto,
            success: resultadoProjeto.success
        };

    } catch (error) {
        console.error('Erro no processo completo:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
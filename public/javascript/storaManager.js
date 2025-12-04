// storage-simple.js

// Armazenar
const storeLocal = (key, value) => {
    try {
        const data = typeof value === 'object' ? JSON.stringify(value) : value;
        localStorage.setItem(key, data);
        return true;
    } catch (e) {
        console.error('Erro ao armazenar:', e);
        return false;
    }
};

// Recuperar
const retrieveLocal = (key, defaultValue = null) => {
    try {
        const data = localStorage.getItem(key);
        if (data === null) return defaultValue;
        
        try {
            return JSON.parse(data);
        } catch {
            return data;
        }
    } catch (e) {
        console.error('Erro ao recuperar:', e);
        return defaultValue;
    }
};

// Atualizar (para objetos)
const updateLocal = (key, updates) => {
    const current = retrieve(key, {});
    
    if (typeof current === 'object' && !Array.isArray(current)) {
        const updated = { ...current, ...updates };
        store(key, updated);
        return updated;
    }
    
    // Se não for objeto, substitui
    store(key, updates);
    return updates;
};

// Exportar
export { updateLocal, storeLocal, retrieveLocal };
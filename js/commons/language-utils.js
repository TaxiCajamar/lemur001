// 📁 js/commons/language-utils.js

// ✅ VARIÁVEIS SEPARADAS PARA RECEIVER E CALLER
window.idiomaReceiver = 'pt-BR';  // Idioma DO RECEIVER
window.idiomaCaller = 'en-US';    // Idioma DO CALLER

export async function obterIdiomaCompleto(lang) {
    if (!lang) return 'pt-BR';
    if (lang.includes('-')) return lang;

    const response = await fetch('assets/bandeiras/language-flags.json');
    const flags = await response.json();
    const codigoCompleto = Object.keys(flags).find(key => key.startsWith(lang + '-'));
    return codigoCompleto || `${lang}-${lang.toUpperCase()}`;
}

export async function aplicarBandeiraLocal(langCode) {
    try {
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();
        const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🏴';

        const languageFlagElement = document.querySelector('.language-flag');
        if (languageFlagElement) languageFlagElement.textContent = bandeira;

        const localLangDisplay = document.querySelector('.local-Lang');
        if (localLangDisplay) localLangDisplay.textContent = bandeira;

    } catch (error) {
        const languageFlagElement = document.querySelector('.language-flag');
        if (languageFlagElement) languageFlagElement.textContent = '🏴';
        
        const localLangDisplay = document.querySelector('.local-Lang');
        if (localLangDisplay) localLangDisplay.textContent = '🏴';
    }
}

export async function aplicarBandeiraRemota(langCode) {
    try {
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();
        const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🏴';

        const remoteLangElement = document.querySelector('.remoter-Lang');
        if (remoteLangElement) remoteLangElement.textContent = bandeira;

    } catch (error) {
        const remoteLangElement = document.querySelector('.remoter-Lang');
        if (remoteLangElement) remoteLangElement.textContent = '🏴';
    }
}

export async function translateText(text, targetLang) {
    try {
        const response = await fetch('https://chat-tradutor.onrender.com/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, targetLang })
        });

        const result = await response.json();
        return result.translatedText || text;
    } catch (error) {
        return text;
    }
}

// ✅ FUNÇÕES PARA GERENCIAR IDIOMAS SEPARADAMENTE
export function definirIdiomaLocal(langCode) {
    // Detecta automaticamente se é receiver ou caller
    if (window.location.pathname.includes('receiver')) {
        window.idiomaReceiver = langCode;
    } else {
        window.idiomaCaller = langCode;
    }
    aplicarBandeiraLocal(langCode);
}

export function obterIdiomaLocal() {
    // Retorna o idioma correto baseado na página
    if (window.location.pathname.includes('receiver')) {
        return window.idiomaReceiver;
    } else {
        return window.idiomaCaller;
    }
}

// ✅ FUNÇÕES ESPECÍFICAS PARA TRADUÇÃO FUTURA
export function obterIdiomaReceiver() {
    return window.idiomaReceiver || 'pt-BR';
}

export function obterIdiomaCaller() {
    return window.idiomaCaller || 'en-US';
}

// ✅ FUNÇÃO PARA TRADUÇÃO BIDIRECIONAL (futuro)
export function obterParIdiomasTraducao() {
    return {
        origem: obterIdiomaReceiver(),  // De: Receiver
        destino: obterIdiomaCaller()    // Para: Caller
    };
}

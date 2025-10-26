// 📁 js/commons/language-utils.js - ARQUIVO HÍBRIDO COMPLETO

// ✅ VARIÁVEL GLOBAL DINÂMICA (SEM VALOR FIXO)
window.idiomaUsuario = ''; // Será definido dinamicamente pela bandeira

// ✅ API DE TRADUÇÃO CENTRALIZADA
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
        console.error('Erro na tradução:', error);
        return text;
    }
}

// ✅ FUNÇÕES ESSENCIAIS DE IDIOMA
export function obterIdiomaLocal() {
    return window.idiomaUsuario || 'pt-BR'; // Fallback apenas se estiver vazio
}

export function definirIdiomaLocal(langCode) {
    window.idiomaUsuario = langCode; // Define dinamicamente
    aplicarBandeiraLocal(langCode);  // Atualiza a bandeira
}

export async function obterIdiomaCompleto(lang) {
    if (!lang) return 'pt-BR';
    if (lang.includes('-')) return lang;

    try {
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();
        const codigoCompleto = Object.keys(flags).find(key => key.startsWith(lang + '-'));
        return codigoCompleto || `${lang}-${lang.toUpperCase()}`;
    } catch (error) {
        return `${lang}-${lang.toUpperCase()}`;
    }
}

export async function aplicarBandeiraLocal(langCode) {
    try {      
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();
        const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🏴';

        // ✅ ATUALIZA O IDIOMA DINAMICAMENTE (SINCRONIZADO COM BANDEIRA)
        window.idiomaUsuario = langCode;

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

// ✅ FUNÇÕES DE UI
export function setupInstructionToggle() {
    const instructionBox = document.getElementById('instructionBox');
    const toggleButton = document.getElementById('instructionToggle');
    
    if (!instructionBox || !toggleButton) return;
    
    let isExpanded = true;
    
    toggleButton.addEventListener('click', function(e) {
        e.stopPropagation();
        isExpanded = !isExpanded;
        
        if (isExpanded) {
            instructionBox.classList.remove('recolhido');
            instructionBox.classList.add('expandido');
        } else {
            instructionBox.classList.remove('expandido');
            instructionBox.classList.add('recolhido');
        }
    });
    
    document.addEventListener('click', function(e) {
        if (!instructionBox.contains(e.target) && isExpanded) {
            instructionBox.classList.remove('expandido');
            instructionBox.classList.add('recolhido');
            isExpanded = false;
        }
    });
}

export async function traduzirFrasesFixas() {
    try {
        const lang = obterIdiomaLocal();
        console.log(`🌐 Traduzindo interface para: ${lang}`);

        // ✅ LISTA ÚNICA COM TODAS AS FRASES POSSÍVEIS
        const todasFrases = {
            // ========================
            // FRASES COMUNS A AMBOS
            // ========================
            "translator-label": "Real-time translation.",
            "translator-label-2": "Real-time translation.",
            "welcome-text": "Welcome! Let's begin.",
            "wait-connection": "Waiting for connection.",
            "both-connected": "Both online.",
            "check-replies": "Read the message.",
            "drop-voice": "Speak clearly.",
            "flip-cam": "Flip the camera. Share!",
            
            // ========================
            // FRASES EXCLUSIVAS DO RECEIVER
            // ========================
            "tap-qr": "Tap the QR code to start.",
            "quick-scan": "Ask to scan the QR.",
            "qr-modal-title": "This is your online key",
            "qr-modal-description": "You can ask to scan, share or print on your business card."
        };

        // ✅ TRADUZ APENAS AS FRASES QUE EXISTEM NA PÁGINA ATUAL
        for (const [id, texto] of Object.entries(todasFrases)) {
            const el = document.getElementById(id);
            if (el) {
                const traduzido = await translateText(texto, lang);
                el.textContent = traduzido;
            }
        }

        aplicarBandeiraLocal(lang);
    } catch (error) {
        console.error("Erro ao traduzir frases fixas:", error);
    }
}

export async function solicitarPermissoes() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        stream.getTracks().forEach(track => track.stop());
        return true;
        
    } catch (error) {
        throw error;
    }
}

export function esconderElementoQuandoConectar(elementoId, videoId) {
    const elemento = document.getElementById(elementoId);
    const video = document.getElementById(videoId);
    
    if (!elemento || !video) return;
    
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'srcObject') {
                if (video.srcObject) {
                    elemento.style.display = 'none';
                    elemento.classList.remove('piscar-suave');
                    observer.disconnect();
                }
            }
        });
    });
    
    observer.observe(video, {
        attributes: true,
        attributeFilter: ['srcObject']
    });
}

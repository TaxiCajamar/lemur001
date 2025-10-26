// 📁 js/commons/language-utils.js - VERSÃO CORRIGIDA

// ✅ APENAS IDIOMA LOCAL
window.idiomaLocal = 'pt-BR';  // Idioma padrão inicial

// ✅ CONFIGURAÇÃO AUTOMÁTICA DO IDIOMA
export async function configurarIdiomaAutomatico() {
    // Define idioma automaticamente (detecta navegador)
    const idiomaNavegador = navigator.language || 'pt-BR';
    window.idiomaLocal = idiomaNavegador;
    
    // Aplica bandeira e traduz AUTOMATICAMENTE
    await aplicarBandeira(window.idiomaLocal);
    await traduzirFrasesFixas();
}

// ✅ API DE TRADUÇÃO
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

// ✅ APENAS UMA FUNÇÃO PARA BANDEIRA
export async function aplicarBandeira(langCode) {
    try {      
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();
        const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🏴';

        // Aplica em todos os elementos de bandeira
        document.querySelectorAll('.language-flag, .local-Lang').forEach(el => {
            el.textContent = bandeira;
        });
        
        // Atualiza o idioma local
        window.idiomaLocal = langCode;

    } catch (error) {
        document.querySelectorAll('.language-flag, .local-Lang').forEach(el => {
            el.textContent = '🏴';
        });
    }
}

// ✅ FUNÇÕES SIMPLIFICADAS
export function definirIdioma(langCode) {
    window.idiomaLocal = langCode;
    aplicarBandeira(langCode);
    traduzirFrasesFixas(); // ← AGORA TRADUZ TAMBÉM AO MUDAR IDIOMA
}

export function obterIdioma() {
    return window.idiomaLocal || 'pt-BR';
}

// ✅ TRADUÇÃO DE FRASES FIXAS - CORRIGIDAS COM AS FRASES REAIS DO HTML
export async function traduzirFrasesFixas() {
    try {
        const lang = obterIdioma();
        console.log(`🌐 Traduzindo interface para: ${lang}`);

        // 🎯 FRASES EXATAS DO SEU HTML
        const frases = {
            "translator-label": "Real-time translation.",
            "translator-label-2": "Real-time translation.", 
            "welcome-text": "Welcome! Let's begin.",
            "tap-qr": "Tap the QR code to start.",
            "quick-scan": "Ask to scan the QR.",
            "drop-voice": "Speak clearly.",
            "check-replies": "Read the message.",
            "flip-cam": "Flip the camera. Share!",
            "wait-connection": "Waiting for connection.",
            "both-connected": "Both online.",
            "qr-modal-title": "This is your online key",
            "qr-modal-description": "You can ask to scan, share or print on your business card."
        };

        for (const [id, texto] of Object.entries(frases)) {
            const el = document.getElementById(id);
            if (el) {
                const traduzido = await translateText(texto, lang);
                el.textContent = traduzido;
            }
        }

        console.log(`✅ Interface traduzida para: ${lang}`);
    } catch (error) {
        console.error("Erro ao traduzir frases fixas:", error);
    }
}

// ✅ OUTRAS FUNÇÕES UTILITÁRIAS (MANTIDAS)
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

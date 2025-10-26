// 📁 ui-commons.js
import { obterIdiomaCompleto, aplicarBandeiraLocal, translateText } from './language-utils.js';

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

export async function traduzirFrasesFixas(lang, tipo = 'caller') {
    try {
        // Frases comuns a ambos
        const frasesComuns = {
            "translator-label": "Real-time translation.",
            "welcome-text": "Hi, welcome!",
            "tap-qr": "Tap that QR Code", 
            "quick-scan": "Quick scan",
            "drop-voice": "Drop your voice",
            "check-replies": "Check the replies",
            "flip-cam": "Flip the cam and show the vibes"
        };

        // Frases específicas do receiver
        const frasesReceiver = {
            "qr-modal-title": "This is your online key",
            "qr-modal-description": "You can ask to scan, share or print on your business card."
        };

        const frasesParaTraduzir = tipo === 'receiver' 
            ? { ...frasesComuns, ...frasesReceiver } 
            : frasesComuns;

        for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
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

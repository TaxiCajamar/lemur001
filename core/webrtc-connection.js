import { WebRTCCore } from '../../core/webrtc-core.js';

export function setupWebRTC(role = 'receiver', callbacks = {}) {
    window.rtcCore = new WebRTCCore();

    // 🆔 Geração de ID baseada no role
    let myId;
    
    if (role === 'receiver') {
        // Extrair últimos 8 dígitos do token
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token') || '';
        
        if (token && token.length >= 8) {
            // Pega últimos 8 caracteres do token
            myId = token.slice(-8);
        } else {
            // Fallback: gera ID aleatório se token muito curto ou não existir
            myId = crypto.randomUUID().substr(0, 8);
        }
    } else {
        // Caller: sempre gera ID aleatório
        myId = crypto.randomUUID().substr(0, 8);
    }

    // ⚙️ Inicialização comum
    window.rtcCore.initialize(myId);
    window.rtcCore.setupSocketHandlers();

    // 🔄 Configuração específica para receiver
    if (role === 'receiver') {
        window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
            if (!window.localStream) return;

            window.rtcCore.handleIncomingCall(offer, window.localStream, (remoteStream) => {
                remoteStream.getAudioTracks().forEach(track => track.enabled = false);

                const overlay = document.querySelector('.info-overlay');
                if (overlay) overlay.classList.add('hidden');

                const remoteVideo = document.getElementById('remoteVideo');
                if (remoteVideo) {
                    remoteVideo.srcObject = remoteStream;
                    
                    const elementoClick = document.getElementById('click');
                    if (elementoClick) {
                        elementoClick.style.display = 'none';
                        elementoClick.classList.remove('piscar-suave');
                    }
                }

                // ✅ CHAMADA VIA CALLBACK EXTERNO
                if (idiomaDoCaller && callbacks.onBandeiraRemota) {
                    callbacks.onBandeiraRemota(idiomaDoCaller);
                }
            });
        };
    }

    return { myId, rtcCore: window.rtcCore };
}

// ❌ REMOVER função aplicarBandeiraRemota duplicada daqui

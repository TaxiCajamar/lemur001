import { WebRTCCore } from '../../core/webrtc-core.js';

export function setupWebRTC(role = 'receiver') {
    window.rtcCore = new WebRTCCore();

    // 🆔 Geração de ID baseada no role
    let myId;
    if (role === 'receiver') {
        const url = window.location.href;
        const fixedId = url.split('?')[1] || crypto.randomUUID().substr(0, 8);
        myId = fixedId.substr(0, 8);
    } else {
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

                if (idiomaDoCaller) {
                    aplicarBandeiraRemota(idiomaDoCaller);
                }
            });
        };
    }

    return { myId, rtcCore: window.rtcCore };
}

// 🏳️ Função auxiliar (já existe no seu UI)
async function aplicarBandeiraRemota(langCode) {
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

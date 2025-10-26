import { WebRTCCore } from '../../core/webrtc-core.js';

// ✅ URL DO SERVIDOR SINALIZADOR (centralizado)
const SERVIDOR_SINALIZADOR = 'https://lemur-signal.onrender.com';

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

// ✅ FUNÇÕES CENTRALIZADAS PARA SERVIDOR SINALIZADOR

// Para RECEIVER: Cadastrar e verificar conexões
export async function cadastrarNoServidorSinalizador(myId, token) {
    try {
        const response = await fetch(`${SERVIDOR_SINALIZADOR}/registrar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: myId,
                token: token,
                status: 'online',
                timestamp: Date.now()
            })
        });
        
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Erro ao cadastrar no servidor:', error);
        return false;
    }
}

export async function verificarSeEstaSendoProcurado(myId, token) {
    try {
        const response = await fetch(`${SERVIDOR_SINALIZADOR}/verificar/${myId}?token=${token}`);
        const result = await response.json();
        
        if (result.procurado && result.callerId) {
            return result.callerId;
        }
        return null;
    } catch (error) {
        console.error('Erro ao verificar servidor:', error);
        return null;
    }
}

export async function atualizarStatusOnline(myId, token) {
    try {
        await fetch(`${SERVIDOR_SINALIZADOR}/atualizar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: myId,
                token: token,
                status: 'online',
                timestamp: Date.now()
            })
        });
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
    }
}

// Para CALLER: Procurar e conectar com receiver
export async function procurarReceiver(targetId, token, callerId, callerLang, receiverLang) {
    try {
        const response = await fetch(`${SERVIDOR_SINALIZADOR}/procurar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                callerId: callerId,
                targetId: targetId,
                token: token,
                callerLang: callerLang,
                receiverLang: receiverLang,
                timestamp: Date.now()
            })
        });
        
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Erro ao procurar receiver:', error);
        return false;
    }
}

// ✅ FUNÇÃO PARA DESREGISTRAR (ambos)
export async function desregistrarDoServidor(myId, token) {
    try {
        await fetch(`${SERVIDOR_SINALIZADOR}/desregistrar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: myId,
                token: token
            })
        });
    } catch (error) {
        console.error('Erro ao desregistrar:', error);
    }
}

// ✅ IMPORTS CORRETOS E COMPLETOS
import { 
    setupWebRTC, 
    procurarReceiver
} from '../../core/webrtc-connection.js';
import { 
    aplicarBandeiraLocal, 
    aplicarBandeiraRemota, 
    definirIdiomaLocal,
    obterIdiomaLocal,
    setupInstructionToggle, 
    traduzirFrasesFixas, 
    solicitarPermissoes 
} from '../commons/language-utils.js';

let permissaoConcedida = false;

function setupCameraToggle() {
    const toggleButton = document.getElementById('toggleCamera');
    let currentCamera = 'user';
    let isSwitching = false;

    if (!toggleButton) return;

    toggleButton.addEventListener('click', async () => {
        if (isSwitching) return;

        isSwitching = true;
        toggleButton.style.opacity = '0.5';

        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
                window.localStream = null;
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            currentCamera = currentCamera === 'user' ? 'environment' : 'user';
            
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: currentCamera,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.srcObject = newStream;
            }

            window.localStream = newStream;

            if (window.rtcCore && window.rtcCore.peer) {
                const connectionState = window.rtcCore.peer.connectionState;
                
                if (connectionState === 'connected') {
                    const newVideoTrack = newStream.getVideoTracks()[0];
                    const senders = window.rtcCore.peer.getSenders();
                    
                    for (const sender of senders) {
                        if (sender.track && sender.track.kind === 'video') {
                            await sender.replaceTrack(newVideoTrack);
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Erro ao alternar câmera:', error);
        } finally {
            isSwitching = false;
            toggleButton.style.opacity = '1';
        }
    });
}

// ✅ FUNÇÃO: Conectar com receiver (CORRIGIDA)
async function conectarComReceiver(targetId, localStream, meuIdioma) {
    if (!window.rtcCore) return;
    
    try {
        console.log(`🔄 Conectando com receiver: ${targetId}`);
        
        window.rtcCore.startCall(targetId, localStream, meuIdioma);
        
    } catch (error) {
        console.error('Erro ao conectar com receiver:', error);
    }
}

// ✅ FUNÇÃO PRINCIPAL DE CONEXÃO SIMPLIFICADA
async function iniciarConexaoAutomatica(targetId, token, receiverLang, localStream, meuIdioma) {
    const aguardarWebRTCPronto = () => {
        return new Promise((resolve) => {
            const verificar = () => {
                if (window.rtcCore && window.rtcCore.socket && window.rtcCore.socket.connected) {
                    resolve(true);
                } else {
                    setTimeout(verificar, 500);
                }
            };
            verificar();
        });
    };

    try {
        await aguardarWebRTCPronto();

        const callerId = crypto.randomUUID().substr(0, 8);
        console.log(`🎯 Caller ID gerado: ${callerId}`);

        console.log(`🔍 Procurando receiver: ${targetId}`);
        const receiverOnline = await procurarReceiver(targetId, token, callerId, meuIdioma, receiverLang);
        
        if (receiverOnline) {
            console.log('✅ Receiver online! Conectando...');
            conectarComReceiver(targetId, localStream, meuIdioma);
        } else {
            console.log('❌ Receiver offline. Tentando novamente...');
            
            const tentarConexaoContinuamente = async () => {
                const online = await procurarReceiver(targetId, token, callerId, meuIdioma, receiverLang);
                
                if (online) {
                    console.log('✅ Agora está online! Conectando...');
                    conectarComReceiver(targetId, localStream, meuIdioma);
                } else {
                    setTimeout(tentarConexaoContinuamente, 3000);
                }
            };
            
            tentarConexaoContinuamente();
        }

    } catch (error) {
        console.error('Erro no fluxo de conexão:', error);
    }
}

async function iniciarCameraAposPermissoes() {
    try {
        if (!permissaoConcedida) {
            throw new Error('Permissões não concedidas');
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: false 
        });
        
        window.localStream = stream;
        document.getElementById('localVideo').srcObject = stream;

        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) mobileLoading.style.display = 'none';

        setupCameraToggle();

        await new Promise(resolve => setTimeout(resolve, 500));

        const { myId } = setupWebRTC('caller');

        const urlParams = new URLSearchParams(window.location.search);
        const receiverId = urlParams.get('targetId') || '';
        const token = urlParams.get('token') || '';
        const receiverLang = urlParams.get('lang') || 'pt-BR';

        // ✅ DEFINIR IDIOMA LOCAL DO CALLER DINAMICAMENTE
        const meuIdioma = navigator.language || 'en-US';
        definirIdiomaLocal(meuIdioma);
        console.log('🌐 Idioma caller definido:', meuIdioma);

        // ✅ TRADUZIR FRASES APÓS DEFINIR IDIOMA
        await traduzirFrasesFixas();

        if (receiverId) {
            if (stream) {
                setTimeout(() => {
                    iniciarConexaoAutomatica(receiverId, token, receiverLang, stream, meuIdioma);
                }, 2000);
            }
        }

        // ✅ APLICAR BANDEIRAS
        aplicarBandeiraLocal(meuIdioma);
        aplicarBandeiraRemota(receiverLang);

    } catch (error) {
        console.error("Erro ao iniciar câmera:", error);
        throw error;
    }
}

window.onload = async () => {
    try {
        const params = new URLSearchParams(window.location.search);
        
        // ✅ APENAS SOLICITA PERMISSÕES - A TRADUÇÃO SERÁ FEITA DEPOIS
        permissaoConcedida = await solicitarPermissoes();
        setupInstructionToggle();
        
        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) mobileLoading.style.display = 'none';
        
        // ✅ A TRADUÇÃO SERÁ FEITA DENTRO DE iniciarCameraAposPermissoes()
        // DEPOIS QUE O IDIOMA FOR DEFINIDO DINAMICAMENTE
        await iniciarCameraAposPermissoes();
        
    } catch (error) {
        console.error('Erro ao inicializar caller:', error);
        alert('Erro ao inicializar: ' + error.message);
    }
};

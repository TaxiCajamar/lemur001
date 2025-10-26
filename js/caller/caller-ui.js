// ✅ IMPORTS CORRETOS E COMPLETOS
import { setupWebRTC } from '../../core/webrtc-connection.js';
import { aplicarBandeiraLocal, aplicarBandeiraRemota } from '../commons/language-utils.js';
import { setupInstructionToggle, traduzirFrasesFixas, solicitarPermissoes } from '../commons/ui-commons.js';

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

async function iniciarConexaoVisual(receiverId, localStream, meuIdioma) {
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

        const tentarConexaoContinuamente = async () => {
            window.rtcCore.startCall(receiverId, localStream, meuIdioma);
            setTimeout(tentarConexaoContinuamente, 3000);
        };

        tentarConexaoContinuamente();

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
        const receiverLang = urlParams.get('lang') || 'pt-BR';

        if (receiverId) {
            document.getElementById('callActionBtn').style.display = 'none';
            
            if (stream) {
                // ✅ A função traduzirFrasesFixas já aplica a bandeira local automaticamente
                // através do ui-commons.js, então não precisa chamar aplicarBandeiraLocal aqui
                
                setTimeout(() => {
                    iniciarConexaoVisual(receiverId, stream, window.meuIdiomaLocal);
                }, 2000);
            }
        }

        aplicarBandeiraRemota(receiverLang);

    } catch (error) {
        console.error("Erro ao iniciar câmera:", error);
        throw error;
    }
}

window.onload = async () => {
    try {
        const params = new URLSearchParams(window.location.search);
        const lang = params.get('lang') || navigator.language || 'pt-BR';
        
        await traduzirFrasesFixas(lang, 'caller');
        permissaoConcedida = await solicitarPermissoes();
        setupInstructionToggle();
        
        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) mobileLoading.style.display = 'none';
        
        await iniciarCameraAposPermissoes();
        
    } catch (error) {
        console.error('Erro ao inicializar caller:', error);
        alert('Erro ao inicializar: ' + error.message);
    }
};

// ✅ IMPORTS ATUALIZADOS - AGORA SÓ PRECISA DE UMA FUNÇÃO!
import { setupWebRTC } from '../../core/webrtc-connection.js';
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
let webrtcConnection;

// ✅ FUNÇÃO: Configurar callbacks WebRTC
function configurarCallbacksWebRTC() {
    return {
        onLocalStream: (localStream) => {
            console.log('📹 Stream LOCAL recebido - vai para PIP');
            
            // ✅ ATRIBUI AO LOCALVIDEO (PIP)
            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.srcObject = localStream;
            }
        },
        
        onRemoteStream: (remoteStream) => {
            console.log('📹 Stream REMOTA recebida - vai para box principal');
            
            // Desativa áudio remoto
            remoteStream.getAudioTracks().forEach(track => track.enabled = false);

            // ✅ ATRIBUI AO REMOTEVIDEO (BOX PRINCIPAL)
            const remoteVideo = document.getElementById('remoteVideo');
            if (remoteVideo) {
                remoteVideo.srcObject = remoteStream;
                
                // Esconde elementos de loading/aguardando
                const elementoAguardando = document.querySelector('.aguardando-conexao');
                if (elementoAguardando) {
                    elementoAguardando.style.display = 'none';
                }
            }
        },
        
        onError: (error) => {
            console.error('❌ Erro WebRTC:', error);
            
            const elementoAguardando = document.querySelector('.aguardando-conexao');
            if (elementoAguardando) {
                elementoAguardando.textContent = 'Erro de conexão - Tente novamente';
            }
        }
    };
}

// ✅ FUNÇÃO: Alternar câmera (MANTIDA IGUAL)
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

            // ✅ ATUALIZADO: Usar a nova conexão WebRTC
            if (webrtcConnection && webrtcConnection.rtcCore) {
                const connectionState = webrtcConnection.rtcCore.peer?.connectionState;
                
                if (connectionState === 'connected') {
                    // Usa o novo método seguro para atualizar stream
                    await webrtcConnection.rtcCore.updateVideoStream(newStream);
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

// ✅ FUNÇÃO PRINCIPAL SIMPLIFICADA
async function iniciarCameraAposPermissoes() {
    try {
        if (!permissaoConcedida) {
            throw new Error('Permissões não concedidas');
        }

        // 1. 📹 INICIA CÂMERA LOCAL
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: false 
        });
        
        window.localStream = stream;
        document.getElementById('localVideo').srcObject = stream;

        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) mobileLoading.style.display = 'none';

        setupCameraToggle();

        // 2. 🌐 CONFIGURA IDIOMA
        const urlParams = new URLSearchParams(window.location.search);
        const receiverId = urlParams.get('targetId') || '';
        const token = urlParams.get('token') || '';
        const receiverLang = urlParams.get('lang') || 'pt-BR';

        const meuIdioma = navigator.language || 'en-US';
        definirIdiomaLocal(meuIdioma);
        console.log('🌐 Idioma caller definido:', meuIdioma);
        await traduzirFrasesFixas();

        // ✅ APLICAR BANDEIRAS
        aplicarBandeiraLocal(meuIdioma);
        aplicarBandeiraRemota(receiverLang);

        // 3. 🚀 INICIA FLUXO WEBRTC COMPLETO (APENAS 1 LINHA!)
        if (receiverId && token) {
    webrtcConnection = setupWebRTC();
    
    const qrData = {
        token: token,
        receiverId: receiverId,
        idioma: meuIdioma  // ✅ Correção aplicada corretamente
    };

    const resultado = await webrtcConnection.startCallerFlow(
        qrData, 
        configurarCallbacksWebRTC()
    );

            if (resultado.success) {
                console.log('✅ Caller iniciado com ID:', resultado.id);
                
                // Atualiza UI para mostrar status
                const elementoAguardando = document.querySelector('.aguardando-conexao');
                if (elementoAguardando) {
                    elementoAguardando.textContent = 'Conectando...';
                }
            } else {
                throw new Error(resultado.error);
            }
        } else {
            console.error('❌ Dados do QR Code incompletos');
            throw new Error('Link de conexão inválido');
        }

    } catch (error) {
        console.error("Erro ao iniciar caller:", error);
        
        // Mostra erro na UI
        const elementoAguardando = document.querySelector('.aguardando-conexao');
        if (elementoAguardando) {
            elementoAguardando.textContent = 'Erro - ' + error.message;
        }
        
        throw error;
    }
}

// ✅ LIMPEZA SIMPLIFICADA
window.addEventListener('beforeunload', function() {
    if (webrtcConnection) {
        webrtcConnection.cleanup();
    }
});

window.onload = async () => {
    try {
        // ✅ SOLICITA PERMISSÕES
        permissaoConcedida = await solicitarPermissoes();
        setupInstructionToggle();
        
        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) mobileLoading.style.display = 'none';
        
        // ✅ INICIA FLUXO COMPLETO
        await iniciarCameraAposPermissoes();
        
    } catch (error) {
        console.error('Erro ao inicializar caller:', error);
        
        // Mostra erro para o usuário
        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) {
            mobileLoading.textContent = 'Erro: ' + error.message;
        }
    }
};

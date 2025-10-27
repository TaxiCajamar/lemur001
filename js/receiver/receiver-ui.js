// ✅ IMPORTS ATUALIZADOS - AGORA SÓ PRECISA DE UMA FUNÇÃO!
import { setupWebRTC } from '../../core/webrtc-connection.js';
import { QRCodeGenerator } from '../qrcode/qr-code-utils.js';
import { 
    aplicarBandeiraRemota, 
    definirIdiomaLocal, 
    obterIdiomaLocal,
    setupInstructionToggle, 
    traduzirFrasesFixas, 
    solicitarPermissoes, 
    esconderElementoQuandoConectar 
} from '../commons/language-utils.js';

let permissaoConcedida = false;
let webrtcConnection;

// ✅ FUNÇÃO SIMPLIFICADA: Configurar callbacks quando receber chamada
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
                
                const elementoClick = document.getElementById('click');
                if (elementoClick) {
                    elementoClick.style.display = 'none';
                    elementoClick.classList.remove('piscar-suave');
                }
            }
        },
        
        onCallerLanguage: (idiomaCaller) => {
  aplicarBandeiraRemota(idiomaCaller);

  // ✅ Oculta o QR Code após conexão
  const overlay = document.querySelector('.info-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
    console.log('🧼 QR Code ocultado após conexão');
  }
}
        },
        
        onDataChannelMessage: (message) => {
            console.log('💬 Mensagem recebida:', message);
            // Aqui você pode tratar mensagens de texto se quiser
        },
        
        onError: (error) => {
            console.error('❌ Erro WebRTC:', error);
            
            const elementoClick = document.getElementById('click');
            if (elementoClick) {
                elementoClick.textContent = 'Erro de conexão';
                elementoClick.classList.remove('piscar-suave');
            }
        }
    };
}

// ✅ CORREÇÃO: Evitar duplicidade de streams
async function iniciarCameraAposPermissoes() {
    try {
        if (!permissaoConcedida) {
            throw new Error('Permissões não concedidas');
        }

        // ✅ CORREÇÃO: Verificar se já existe stream antes de criar novo
        if (!window.localStream) {
            // 1. 📹 INICIA CÂMERA LOCAL
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });
            window.localStream = stream;
        }

        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = window.localStream;
            
            const mobileLoading = document.getElementById('mobileLoading');
            if (mobileLoading) {
                mobileLoading.style.display = 'none';
            }

            setTimeout(() => {
                const elementoClick = document.getElementById('click');
                if (elementoClick) {
                    elementoClick.style.display = 'block';
                    elementoClick.classList.add('piscar-suave');
                    elementoClick.textContent = 'Online - Aguardando conexão';
                }
            }, 500);
        }

        // 2. 🌐 CONFIGURA IDIOMA
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token') || '';
        const lang = navigator.language || 'pt-BR';

        definirIdiomaLocal(lang);
        console.log('🌐 Idioma definido:', lang);
        await traduzirFrasesFixas();
        window.targetTranslationLang = lang;

        // 3. 🚀 INICIA FLUXO WEBRTC COMPLETO (APENAS 1 LINHA!)
        webrtcConnection = setupWebRTC();
        
        // ✅ CORREÇÃO: Garantir que o stream está disponível
        webrtcConnection.setLocalStream(window.localStream);

        const resultado = await webrtcConnection.startReceiverFlow(
            token, 
            configurarCallbacksWebRTC()
        );

        if (resultado.success) {
            console.log('✅ Receiver iniciado com ID:', resultado.id);
            
            window.qrCodeData = {
                myId: resultado.id,
                token: token,
                lang: lang
            };

            // 4. 📱 CONFIGURA QR CODE (mantido igual)
            document.getElementById('logo-traduz').addEventListener('click', function() {
                const overlay = document.querySelector('.info-overlay');
                const qrcodeContainer = document.getElementById('qrcode');
                
                if (overlay && !overlay.classList.contains('hidden')) {
                    overlay.classList.add('hidden');
                    return;
                }
                
                const remoteVideo = document.getElementById('remoteVideo');
                const isConnected = remoteVideo && remoteVideo.srcObject;
                
                if (isConnected) return;
                
                if (qrcodeContainer) qrcodeContainer.innerHTML = '';
                
                const callerUrl = `${window.location.origin}/caller.html?targetId=${window.qrCodeData.myId}&token=${encodeURIComponent(window.qrCodeData.token)}&lang=${encodeURIComponent(window.qrCodeData.lang)}`;
                
                QRCodeGenerator.generate("qrcode", callerUrl);
                
                if (overlay) overlay.classList.remove('hidden');
            });

            document.querySelector('.info-overlay').addEventListener('click', function(e) {
                if (e.target === this) this.classList.add('hidden');
            });

            esconderElementoQuandoConectar('click', 'remoteVideo');

        } else {
            throw new Error(resultado.error);
        }

    } catch (error) {
        console.error("Erro ao iniciar receiver:", error);
        
        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) mobileLoading.style.display = 'none';
        
        const elementoClick = document.getElementById('click');
        if (elementoClick) {
            elementoClick.textContent = 'Erro - Recarregue a página';
            elementoClick.classList.remove('piscar-suave');
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

// ✅ MANTIDO IGUAL
document.addEventListener('DOMContentLoaded', function() {
    setupInstructionToggle();
});

window.onload = async () => {
    try {
        const params = new URLSearchParams(window.location.search);
        
        permissaoConcedida = await solicitarPermissoes();
        
        if (typeof window.liberarInterface === 'function') {
            window.liberarInterface();
        }
        
        await iniciarCameraAposPermissoes();
        
    } catch (error) {
        console.error('Erro ao inicializar receiver:', error);
        
        if (typeof window.mostrarErroCarregamento === 'function') {
            window.mostrarErroCarregamento('Erro ao solicitar permissões de câmera e microfone');
        }
    }
};

// ✅ IMPORTS CORRETOS E SIMPLIFICADOS
import { 
    setupWebRTC, 
    cadastrarNoServidorSinalizador, 
    verificarSeEstaSendoProcurado, 
    atualizarStatusOnline,
    desregistrarDoServidor 
} from '../../core/webrtc-connection.js';
import { QRCodeGenerator } from '../qrcode/qr-code-utils.js';
import { aplicarBandeiraRemota, definirIdiomaLocal, obterIdiomaLocal } from '../commons/language-utils.js'; // ✅ IMPORT ADICIONADO
import { setupInstructionToggle, traduzirFrasesFixas, solicitarPermissoes, esconderElementoQuandoConectar } from '../commons/ui-commons.js';

let permissaoConcedida = false;
let verificarConexaoInterval;

// ❌ REMOVER: URL duplicada (já está no webrtc-connection.js)
// ❌ REMOVER: Funções duplicadas do servidor (já importadas)

// ✅ FUNÇÃO: Conectar com caller específico
async function conectarComCaller(callerId, localStream) {
    if (!window.rtcCore) return;
    
    try {
        console.log(`🔄 Conectando com caller: ${callerId}`);
        
        // Para a verificação contínua
        if (verificarConexaoInterval) {
            clearInterval(verificarConexaoInterval);
        }
        
        // ✅ CORREÇÃO: Usar obterIdiomaLocal() em vez de window.idiomaReceiver
        const meuIdioma = obterIdiomaLocal();
        window.rtcCore.startCall(callerId, localStream, meuIdioma);
        
        // Atualiza UI para mostrar que está conectando
        const elementoClick = document.getElementById('click');
        if (elementoClick) {
            elementoClick.textContent = 'Conectando...';
            elementoClick.classList.remove('piscar-suave');
        }
        
    } catch (error) {
        console.error('Erro ao conectar com caller:', error);
    }
}

// ✅ FUNÇÃO: Verificação contínua
function iniciarVerificacaoConexao(myId, token, localStream) {
    verificarConexaoInterval = setInterval(async () => {
        const callerId = await verificarSeEstaSendoProcurado(myId, token);
        
        if (callerId) {
            // ✅ Está sendo procurado - conectar imediatamente
            console.log(`🎯 Encontrado! Conectando com caller: ${callerId}`);
            conectarComCaller(callerId, localStream);
        } else {
            // ❌ Não está sendo procurado - permanecer online
            console.log('⏳ Aguardando conexão... Status: Online');
            
            // Atualiza status online no servidor
            await atualizarStatusOnline(myId, token);
            
            // Atualiza UI para mostrar status online
            const elementoClick = document.getElementById('click');
            if (elementoClick && !elementoClick.classList.contains('piscar-suave')) {
                elementoClick.textContent = 'Online - Aguardando conexão';
                elementoClick.classList.add('piscar-suave');
            }
        }
    }, 3000); // Verifica a cada 3 segundos
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

        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = stream;
            
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

        const { myId } = setupWebRTC('receiver', {
            onBandeiraRemota: aplicarBandeiraRemota
        });

        const params = new URLSearchParams(window.location.search);
        const token = params.get('token') || '';
        const lang = navigator.language || 'pt-BR';

        // ✅ DEFINIR IDIOMA LOCAL
        definirIdiomaLocal(lang);

        window.targetTranslationLang = lang;

        window.qrCodeData = {
            myId: myId,
            token: token,
            lang: lang
        };

        // ✅ 1. CADASTRAR NO SERVIDOR SINALIZADOR (usando função importada)
        console.log(`📝 Cadastrando no servidor: ${myId}`);
        const cadastrado = await cadastrarNoServidorSinalizador(myId, token);
        
        if (cadastrado) {
            console.log('✅ Registrado no servidor sinalizador');
            
            // ✅ 2. VERIFICAR SE JÁ ESTÁ SENDO PROCURADO (usando função importada)
            console.log('🔍 Verificando se está sendo procurado...');
            const callerId = await verificarSeEstaSendoProcurado(myId, token);
            
            if (callerId) {
                // ✅ 3. CONECTAR IMEDIATAMENTE
                console.log('🎯 Conectando imediatamente...');
                conectarComCaller(callerId, stream);
            } else {
                // ✅ 4. AGUARDAR ONLINE
                console.log('⏳ Aguardando conexão...');
                iniciarVerificacaoConexao(myId, token, stream);
            }
        } else {
            console.error('❌ Falha ao registrar no servidor');
        }

        // Resto do código do QR Code permanece...
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

    } catch (error) {
        console.error("Erro ao iniciar câmera:", error);
        
        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) mobileLoading.style.display = 'none';
        
        throw error;
    }
}

// Limpar intervalo quando a página fechar
window.addEventListener('beforeunload', function() {
    if (verificarConexaoInterval) {
        clearInterval(verificarConexaoInterval);
    }
    
    // ✅ CORREÇÃO: Usar função importada desregistrarDoServidor
    if (window.qrCodeData && window.qrCodeData.myId) {
        desregistrarDoServidor(window.qrCodeData.myId, window.qrCodeData.token)
            .catch(err => console.error('Erro ao desregistrar:', err));
    }
});

document.addEventListener('DOMContentLoaded', function() {
    setupInstructionToggle();
});

window.onload = async () => {
    try {
        const params = new URLSearchParams(window.location.search);
        const lang = params.get('lang') || navigator.language || 'pt-BR';
        
       await traduzirFrasesFixas('receiver');
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

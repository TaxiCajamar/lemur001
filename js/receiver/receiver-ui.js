// ✅ IMPORTS CORRETOS E COMPLETOS
import { setupWebRTC } from '../../core/webrtc-connection.js';
import { QRCodeGenerator } from '../qrcode/qr-code-utils.js';
import { aplicarBandeiraRemota } from '../commons/language-utils.js'; // ✅ IMPORT ADICIONADO
import { setupInstructionToggle, traduzirFrasesFixas, solicitarPermissoes, esconderElementoQuandoConectar } from '../commons/ui-commons.js';

let permissaoConcedida = false;

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
                }
            }, 500);
        }

        // ✅ PASSAR CALLBACK PARA setupWebRTC
        const { myId } = setupWebRTC('receiver', {
            onBandeiraRemota: aplicarBandeiraRemota
        });

        const params = new URLSearchParams(window.location.search);
        const token = params.get('token') || '';
        const lang = params.get('lang') || navigator.language || 'pt-BR';

        window.targetTranslationLang = lang;

        window.qrCodeData = {
            myId: myId,
            token: token,
            lang: lang
        };

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

// Resto do código permanece igual...
document.addEventListener('DOMContentLoaded', function() {
    setupInstructionToggle();
});

window.onload = async () => {
    try {
        const params = new URLSearchParams(window.location.search);
        const lang = params.get('lang') || navigator.language || 'pt-BR';
        
        await traduzirFrasesFixas(lang, 'receiver');
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

import { initializeWebRTC, createCall, answerCall, endCall } from '../../core/webrtc-core.js';

// Configurações de inicialização
let socket;
let isInitialized = false;

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🚀 Inicializando caller UI...');
        
        // Conectar ao servidor de sinalização
        socket = io('https://lemur-signal.onrender.com');
        
        // Aguardar inicialização completa do WebRTC
        await initializeWebRTC(socket);
        isInitialized = true;
        console.log('✅ WebRTC inicializado com sucesso');
        
        setupEventListeners();
        liberarInterface();
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        mostrarErroCarregamento('Falha na conexão WebRTC');
    }
});

function setupEventListeners() {
    // Botão de gerar QR Code/chamada
    document.getElementById('logo-traduz').addEventListener('click', async () => {
        if (!isInitialized) {
            console.log('⚠️ WebRTC não inicializado, aguardando...');
            return;
        }
        
        try {
            console.log('📞 Iniciando chamada...');
            await createCall(socket);
        } catch (error) {
            console.error('❌ Erro ao criar chamada:', error);
        }
    });

    // Botão de alternar câmera
    document.getElementById('toggleCamera').addEventListener('click', () => {
        if (window.currentStream) {
            toggleCamera();
        }
    });

    // Botão de gravar áudio
    const recordButton = document.getElementById('recordButton');
    if (recordButton) {
        recordButton.addEventListener('click', () => {
            if (isInitialized) {
                toggleRecording();
            }
        });
    }
}

// Funções de controle de câmera
function toggleCamera() {
    if (window.currentStream) {
        const videoTrack = window.currentStream.getVideoTracks()[0];
        if (videoTrack) {
            const constraints = videoTrack.getConstraints();
            constraints.facingMode = constraints.facingMode === 'user' ? 'environment' : 'user';
            videoTrack.applyConstraints(constraints);
        }
    }
}

// Controle de gravação de áudio
function toggleRecording() {
    if (!window.isRecording) {
        iniciarGravacao();
    } else {
        pararGravacao();
    }
}

function iniciarGravacao() {
    window.isRecording = true;
    document.getElementById('recordButton').style.background = '#ff4444';
    console.log('🎤 Gravação iniciada');
}

function pararGravacao() {
    window.isRecording = false;
    document.getElementById('recordButton').style.background = '';
    console.log('⏹️ Gravação parada');
}

// Interface e utilitários
function liberarInterface() {
    console.log('🎛️ Interface liberada');
    const recordBtn = document.getElementById('recordButton');
    if (recordBtn) {
        recordBtn.disabled = false;
    }
}

function mostrarErroCarregamento(mensagem) {
    console.error('❌ Erro:', mensagem);
    alert('Erro: ' + mensagem);
}

// Export para uso global
window.liberarInterface = liberarInterface;
window.mostrarErroCarregamento = mostrarErroCarregamento;

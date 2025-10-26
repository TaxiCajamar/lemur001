// 🎯 ORQUESTRADOR PRINCIPAL - Coordena todos os módulos existentes
import { WebRTCCore } from './webrtc-core.js';

export class ConnectionOrchestrator {
    constructor() {
        this.webrtcCore = null;
        this.socket = null;
        this.userId = null;
        this.isReady = false;
        this.remoteStreamCallback = null;
        this.dataChannelCallback = null;
    }

    // 🚀 Inicializar sistema completo
    async initialize(userId, localStream = null) {
        try {
            console.log('🎯 Inicializando orquestrador WebRTC...');
            this.userId = userId;

            // 1. ✅ INICIALIZAR WEBRTC CORE (seu código existente)
            this.webrtcCore = new WebRTCCore();
            
            // 2. ✅ CONFIGURAR CALLBACKS DO WEBRTC
            if (this.remoteStreamCallback) {
                this.webrtcCore.setRemoteStreamCallback(this.remoteStreamCallback);
            }
            
            if (this.dataChannelCallback) {
                this.webrtcCore.setDataChannelCallback(this.dataChannelCallback);
            }

            // 3. ✅ INICIALIZAR PEER CONNECTION
            await this.webrtcCore.initialize(userId);
            
            // 4. ✅ CONFIGURAR SOCKET HANDLERS (seu código existente)
            this.webrtcCore.setupSocketHandlers();
            
            // 5. ✅ CONFIGURAR STREAM LOCAL
            if (localStream) {
                this.webrtcCore.setLocalStream(localStream);
            }

            this.isReady = true;
            console.log('🎉 Orquestrador WebRTC totalmente inicializado! ID:', userId);

            return this.webrtcCore;

        } catch (error) {
            console.error('❌ Erro na inicialização do orquestrador:', error);
            throw error;
        }
    }

    // 📞 INICIAR CHAMADA (Sincronizada e segura)
    async startCall(targetId, localStream = null, callerLang = 'pt-BR') {
        // 🚨 VERIFICAÇÃO CRÍTICA DE PRONTIDÃO
        if (!this.isReady) {
            throw new Error('Orquestrador não está pronto. Aguarde initialize() completar.');
        }

        if (!this.webrtcCore.peer || this.webrtcCore.peer.signalingState !== 'stable') {
            throw new Error('PeerConnection não está estável');
        }

        console.log('🎯 Iniciando chamada orquestrada para:', targetId);

        try {
            // ✅ USAR MÉTODO EXISTENTE do webrtc-core.js
            await this.webrtcCore.startCall(targetId, localStream, callerLang);
            
            console.log('✅ Chamada iniciada com sucesso via orquestrador');
            return true;

        } catch (error) {
            console.error('❌ Erro ao iniciar chamada:', error);
            throw error;
        }
    }

    // 🎯 CONFIGURAR CALLBACKS
    setRemoteStreamCallback(callback) {
        this.remoteStreamCallback = callback;
        if (this.webrtcCore) {
            this.webrtcCore.setRemoteStreamCallback(callback);
        }
    }

    setDataChannelCallback(callback) {
        this.dataChannelCallback = callback;
        if (this.webrtcCore) {
            this.webrtcCore.setDataChannelCallback(callback);
        }
    }

    // 🔄 VERIFICAR ESTADO
    isWebRTCReady() {
        return this.isReady && 
               this.webrtcCore && 
               this.webrtcCore.peer && 
               this.webrtcCore.peer.signalingState === 'stable';
    }

    // 🛑 FINALIZAR CONEXÃO
    disconnect() {
        if (this.webrtcCore) {
            this.webrtcCore.close();
        }
        this.isReady = false;
        console.log('🔴 Orquestrador desconectado');
    }

    // 📊 OBTER ESTADO ATUAL (para debug)
    getStatus() {
        return {
            isReady: this.isReady,
            webrtcReady: this.isWebRTCReady(),
            signalingState: this.webrtcCore?.peer?.signalingState,
            iceState: this.webrtcCore?.peer?.iceConnectionState,
            userId: this.userId
        };
    }
}

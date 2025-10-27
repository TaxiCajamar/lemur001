import { WebRTCCore } from './webrtc-core.js';

const SERVIDOR_SINALIZADOR = 'https://lemur-signal.onrender.com';

export class WebRTCConnection {
    constructor() {
        this.rtcCore = null;
        this.myId = null;
        this.role = null;
        this.localStream = null;
    }

    // ✅ FLUXO CORRETO DO RECEIVER
    async startReceiverFlow(token, callbacks = {}) {
        this.role = 'receiver';
        
        try {
            // 1️⃣ 🆔 GERA ID DE 8 DÍGITOS DO TOKEN
            this.myId = this.generateReceiverId(token);
            console.log('🆔 Receiver ID:', this.myId);

            // 2️⃣ 📹 PEDE PERMISSÃO DA CÂMERA (AGORA É PASSO 2!)
            this.localStream = await this.requestCameraPermission();
            console.log('📹 Câmera autorizada');

            // 3️⃣ 🔌 INICIALIZA WEBRTC (AGORA É PASSO 3!)
            this.rtcCore = new WebRTCCore();
            this.rtcCore.initialize(this.myId);
            this.setupCallbacks(callbacks);

            // 4️⃣ 📝 CADASTRA NO SERVIDOR
            const cadastrado = await this.cadastrarReceiver(this.myId, token);
            if (!cadastrado) throw new Error('Falha ao cadastrar');

            // 5️⃣ 🔍 VERIFICA SE JÁ ESTÁ SENDO PROCURADO
            const callerId = await this.verificarSeEstaSendoProcurado(this.myId, token);
            
            if (callerId) {
                // 6️⃣ 🎯 SE ESTÁ SENDO PROCURADO → CONECTA IMEDIATAMENTE
                console.log('🎯 Conectando com caller:', callerId);
                await this.waitForIncomingCall();
            } else {
                // 7️⃣ ⏳ SE NÃO → FICA AGUARDANDO
                console.log('⏳ Aguardando conexão...');
                this.setupConnectionHandlers();
            }

            return { success: true, id: this.myId };

        } catch (error) {
            console.error('❌ Erro no fluxo receiver:', error);
            if (callbacks.onError) callbacks.onError(error);
            return { success: false, error: error.message };
        }
    }

    // ✅ FLUXO CORRETO DO CALLER (SEQUÊNCIA CORRIGIDA!)
    async startCallerFlow(qrData, callbacks = {}) {
        this.role = 'caller';
        const { token, receiverId, idioma } = qrData;
        
        try {
            // 1️⃣ 🆔 GERA ID DINÂMICO
            this.myId = this.generateCallerId();
            console.log('🆔 Caller ID:', this.myId);

            // 2️⃣ 📹 PEDE PERMISSÃO DA CÂMERA (AGORA É PASSO 2!)
            this.localStream = await this.requestCameraPermission();
            console.log('📹 Câmera autorizada');

            // 3️⃣ 🔌 INICIALIZA WEBRTC (AGORA É PASSO 3!)
            this.rtcCore = new WebRTCCore();
            this.rtcCore.initialize(this.myId);
            this.setupCallbacks(callbacks);

            // 4️⃣ 🔍 VERIFICA SE RECEIVER ESTÁ ONLINE
            const receiverOnline = await this.verificarReceiverOnline(receiverId, token);
            
            if (receiverOnline) {
                // 5️⃣ 🎯 SE ONLINE → CONECTA IMEDIATAMENTE
                console.log('🎯 Receiver online, conectando...');
                await this.connectToReceiver(receiverId, token, idioma);
            } else {
                // 6️⃣ 📱 SE OFFLINE → MANDA AVISO FIREBASE E AGUARDA
                console.log('📱 Receiver offline, enviando notificação...');
                await this.sendFirebaseNotification(token, receiverId);
                await this.waitForReceiverOnline(receiverId, token, idioma);
            }

            return { success: true, id: this.myId };

        } catch (error) {
            console.error('❌ Erro no fluxo caller:', error);
            if (callbacks.onError) callbacks.onError(error);
            return { success: false, error: error.message };
        }
    }

    // ✅ MÉTODOS PRINCIPAIS (MANTIDOS)
    generateReceiverId(token) {
        if (!token || token.length < 8) {
            return crypto.randomUUID().substr(0, 8);
        }
        return token.slice(-8);
    }

    generateCallerId() {
        return crypto.randomUUID().substr(0, 8);
    }

    async requestCameraPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            return stream;
        } catch (error) {
            throw new Error('Permissão da câmera negada: ' + error.message);
        }
    }

    // ... (resto dos métodos permanece igual)
}

export function setupWebRTC() {
    return new WebRTCConnection();
}

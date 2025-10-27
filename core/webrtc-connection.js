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

    // ✅✅✅ MÉTODO CORRIGIDO: RESOLVE CONFLITO DE CÂMERAS
    async requestCameraPermission() {
        try {
            // ✅ PRIMEIRO TENTA USAR STREAM EXISTENTE (do UI)
            if (window.localStream) {
                console.log('✅ Usando stream de câmera existente do UI');
                return window.localStream;
            }
            
            // ✅ SE NÃO EXISTIR, CRIA NOVA (SEM ÁUDIO - igual ao UI)
            console.log('📹 Solicitando nova permissão de câmera (sem áudio)');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: false  // ← IMPORTANTE: false para não conflitar com UI
            });
            return stream;
        } catch (error) {
            throw new Error('Permissão da câmera negada: ' + error.message);
        }
    }

    // ... (resto dos métodos permanece igual)

    async cadastrarReceiver(myId, token) {
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
            console.error('Erro ao cadastrar receiver:', error);
            return false;
        }
    }

    async verificarSeEstaSendoProcurado(myId, token) {
        try {
            const response = await fetch(`${SERVIDOR_SINALIZADOR}/verificar/${myId}?token=${token}`);
            const result = await response.json();
            return result.procurado ? result.callerId : null;
        } catch (error) {
            console.error('Erro ao verificar:', error);
            return null;
        }
    }

    async verificarReceiverOnline(receiverId, token) {
        try {
            const response = await fetch(`${SERVIDOR_SINALIZADOR}/verificar-online/${receiverId}?token=${token}`);
            const result = await response.json();
            return result.online || false;
        } catch (error) {
            console.error('Erro ao verificar receiver:', error);
            return false;
        }
    }

    async connectToReceiver(receiverId, token, idioma) {
        try {
            const response = await fetch(`${SERVIDOR_SINALIZADOR}/procurar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    callerId: this.myId,
                    targetId: receiverId,
                    token: token,
                    callerLang: idioma,
                    timestamp: Date.now()
                })
            });
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Erro ao conectar com receiver:', error);
            throw error;
        }
    }

    async sendFirebaseNotification(token, receiverId) {
        // ✅ IMPLEMENTAÇÃO DO FIREBASE AQUI
        console.log('📲 Enviando notificação Firebase para:', receiverId);
        // await firebase.messaging().send(...)
        return true;
    }

    // ✅ CONFIGURAÇÃO DE CALLBACKS
    setupCallbacks(callbacks) {
        if (callbacks.onRemoteStream) {
            this.rtcCore.setRemoteStreamCallback(callbacks.onRemoteStream);
        }
        if (callbacks.onCallerLanguage) {
            this.rtcCore.onIncomingCall = (offer, callerLang) => {
                callbacks.onCallerLanguage(callerLang);
                this.rtcCore.handleIncomingCall(offer, this.localStream, callbacks.onRemoteStream);
            };
        }
        if (callbacks.onDataChannelMessage) {
            this.rtcCore.setDataChannelCallback(callbacks.onDataChannelMessage);
        }
    }

    // ✅ AGUARDAR CONEXÕES
    async waitForIncomingCall() {
        return new Promise((resolve) => {
            this.rtcCore.onIncomingCall = (offer, callerLang) => {
                console.log('📞 Chamada recebida de:', callerLang);
                this.rtcCore.handleIncomingCall(offer, this.localStream, (remoteStream) => {
                    if (this.onRemoteStream) this.onRemoteStream(remoteStream);
                    resolve(remoteStream);
                });
            };
        });
    }

    async waitForReceiverOnline(receiverId, token, idioma) {
        console.log('⏳ Aguardando receiver ficar online...');
        
        // Verifica a cada 3 segundos se o receiver está online
        const checkInterval = setInterval(async () => {
            const online = await this.verificarReceiverOnline(receiverId, token);
            if (online) {
                clearInterval(checkInterval);
                console.log('🎯 Receiver ficou online, conectando...');
                await this.connectToReceiver(receiverId, token, idioma);
            }
        }, 3000);
    }

    setupConnectionHandlers() {
        // Configura handlers para chamadas futuras
        this.rtcCore.setupSocketHandlers();
    }

    // ✅ LIMPEZA
    async cleanup() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        if (this.myId) {
            await this.desregistrarDoServidor(this.myId);
        }
    }

    async desregistrarDoServidor(myId) {
        try {
            await fetch(`${SERVIDOR_SINALIZADOR}/desregistrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: myId })
            });
        } catch (error) {
            console.error('Erro ao desregistrar:', error);
        }
    }
}

export function setupWebRTC() {
    return new WebRTCConnection();
}

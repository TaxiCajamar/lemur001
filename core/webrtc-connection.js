import { WebRTCCore } from './webrtc-core.js';

const SERVIDOR_SINALIZADOR = 'https://lemur-signal.onrender.com';
const SERVIDOR_APP = 'https://serve-app.onrender.com'; // ✅ SEU BACKEND FIREBASE

export class WebRTCConnection {
    constructor() {
        this.rtcCore = null;
        this.myId = null;
        this.role = null;
        this.localStream = null;
    }

    // ✅ NOVO MÉTODO: Sincronizar stream com UI
    setLocalStream(stream) {
        this.localStream = stream;
        console.log('✅ Stream sincronizado com WebRTCConnection');
    }

    // ✅ FLUXO CORRETO DO RECEIVER (SEPARANDO RESPONSABILIDADES)
    async startReceiverFlow(token, callbacks = {}) {
        this.role = 'receiver';
        
        try {
            // 1️⃣ 🆔 GERA ID DE 8 DÍGITOS DO TOKEN
            this.myId = this.generateReceiverId(token);
            console.log('🆔 Receiver ID:', this.myId);

            // ✅ CORREÇÃO: Configurar callbacks ANTES de tudo
            this.rtcCore = new WebRTCCore();
            this.rtcCore.initialize(this.myId);
            this.setupCallbacks(callbacks);

            // 2️⃣ 📹 PEDE PERMISSÃO DA CÂMERA (agora usa stream existente)
            this.localStream = await this.requestCameraPermission();
            console.log('📹 Câmera autorizada');

            // ✅✅✅ CORREÇÃO CRÍTICA: SEPARAR REGISTROS
            // 3️⃣ 📝 CADASTRA APENAS ID NO SERVIDOR DE SINALIZAÇÃO
            const cadastradoSinalizador = await this.cadastrarNoSinalizador(this.myId);
            if (!cadastradoSinalizador) throw new Error('Falha ao cadastrar no sinalizador');

            // 4️⃣ 📱 CADASTRA TOKEN FIREBASE NO SEU BACKEND
            const cadastradoFirebase = await this.cadastrarTokenFirebase(this.myId, token);
            if (!cadastradoFirebase) console.log('⚠️ Atenção: Token Firebase não registrado');

            // 5️⃣ 🔍 VERIFICA SE JÁ ESTÁ SENDO PROCURADO (APENAS ID)
            const callerId = await this.verificarSeEstaSendoProcurado(this.myId);
            
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

    // ✅ FLUXO CORRETO DO CALLER (COM NOTIFICAÇÃO FIREBASE REAL)
    async startCallerFlow(qrData, callbacks = {}) {
        this.role = 'caller';
        const { token, receiverId, idioma } = qrData;
        
        try {
            // 1️⃣ 🆔 GERA ID DINÂMICO
            this.myId = this.generateCallerId();
            console.log('🆔 Caller ID:', this.myId);

            // 2️⃣ 📹 PEDE PERMISSÃO DA CÂMERA
            this.localStream = await this.requestCameraPermission();
            console.log('📹 Câmera autorizada');

            // 3️⃣ 🔌 INICIALIZA WEBRTC
            this.rtcCore = new WebRTCCore();
            this.rtcCore.initialize(this.myId);
            this.setupCallbacks(callbacks);

            // ✅✅✅ CORREÇÃO: VERIFICAÇÃO APENAS COM ID
            // 4️⃣ 🔍 VERIFICA SE RECEIVER ESTÁ ONLINE (APENAS ID)
            const receiverOnline = await this.verificarReceiverOnline(receiverId);
            
            if (receiverOnline) {
                // 5️⃣ 🎯 SE ONLINE → CONECTA IMEDIATAMENTE
                console.log('🎯 Receiver online, conectando...');
                await this.connectToReceiver(receiverId, idioma);
            } else {
                // 6️⃣ 📱 SE OFFLINE → MANDA NOTIFICAÇÃO FIREBASE REAL
                console.log('📱 Receiver offline, enviando notificação Firebase...');
                
                const notificacaoEnviada = await this.enviarNotificacaoWakeUp(
                    token,           // Token Firebase do receiver
                    receiverId,      // ID do receiver
                    this.myId,       // ID do caller
                    idioma           // Idioma do caller
                );
                
                if (notificacaoEnviada) {
                    console.log('🔔 Notificação enviada, aguardando receiver ficar online...');
                    await this.waitForReceiverOnline(receiverId, idioma);
                } else {
                    throw new Error('Falha ao enviar notificação');
                }
            }

            return { success: true, id: this.myId };

        } catch (error) {
            console.error('❌ Erro no fluxo caller:', error);
            if (callbacks.onError) callbacks.onError(error);
            return { success: false, error: error.message };
        }
    }

    // ✅✅✅ CORREÇÃO 1: CADASTRO APENAS ID NO SINALIZADOR
    async cadastrarNoSinalizador(myId) {
        try {
            const response = await fetch(`${SERVIDOR_SINALIZADOR}/registrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: myId,           // ✅ APENAS O ID
                    status: 'online',
                    timestamp: Date.now()
                    // ❌ NÃO ENVIA TOKEN FIREBASE AQUI
                })
            });
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Erro ao cadastrar no sinalizador:', error);
            return false;
        }
    }

    // ✅✅✅ CORREÇÃO 2: CADASTRO TOKEN FIREBASE NO SEU BACKEND
    async cadastrarTokenFirebase(receiverId, token) {
        try {
            const response = await fetch(`${SERVIDOR_APP}/registrar-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiverId: receiverId,  // ID do receiver
                    fcmToken: token,         // Token Firebase
                    tipo: 'receiver',
                    timestamp: Date.now()
                })
            });
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Erro ao cadastrar token Firebase:', error);
            return false;
        }
    }

    // ✅✅✅ CORREÇÃO 3: NOTIFICAÇÃO FIREBASE REAL
    async enviarNotificacaoWakeUp(receiverToken, receiverId, meuId, meuIdioma) {
        try {
            console.log('🔔 Enviando notificação para acordar receiver...');
            
            const response = await fetch(`${SERVIDOR_APP}/send-notification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: receiverToken,
                    title: '📞 Nova Chamada de Vídeo',
                    body: `Toque para atender a chamada de vídeo`,
                    data: {
                        type: 'wake_up',
                        callerId: meuId,
                        callerLang: meuIdioma,
                        receiverId: receiverId
                    }
                })
            });

            const result = await response.json();
            console.log('✅ Notificação enviada:', result);
            return result.success;
        } catch (error) {
            console.error('❌ Erro ao enviar notificação:', error);
            return false;
        }
    }

    // ✅✅✅ CORREÇÃO 4: VERIFICAÇÃO APENAS COM ID (SEM TOKEN)
    async verificarReceiverOnline(receiverId) {
        try {
            const response = await fetch(`${SERVIDOR_SINALIZADOR}/verificar-online/${receiverId}`);
            const result = await response.json();
            return result.online || false;
        } catch (error) {
            console.error('Erro ao verificar receiver:', error);
            return false;
        }
    }

    // ✅✅✅ CORREÇÃO 5: CONEXÃO APENAS COM ID
    async connectToReceiver(receiverId, idioma) {
        try {
            console.log(`🎯 Iniciando conexão WebRTC com receiver: ${receiverId}`);
            
            // ✅ AVISA O SERVIDOR QUE QUER CONECTAR (APENAS IDs)
            const response = await fetch(`${SERVIDOR_SINALIZADOR}/procurar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    callerId: this.myId,        // ID do caller
                    targetId: receiverId,       // ID do receiver
                    callerLang: idioma,         // Idioma
                    timestamp: Date.now()
                    // ❌ NÃO ENVIA TOKEN FIREBASE AQUI
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Servidor autorizou conexão, iniciando WebRTC...');
                
                // ✅ INICIA A CHAMADA WEBRTC REAL
                if (this.rtcCore && this.localStream) {
                    setTimeout(() => {
                        this.rtcCore.startCall(receiverId, this.localStream, idioma);
                        console.log('🚀 Chamada WebRTC iniciada automaticamente!');
                    }, 1000);
                    
                    return true;
                } else {
                    throw new Error('WebRTC não inicializado ou stream não disponível');
                }
            } else {
                console.log('❌ Receiver offline, aguardando...');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Erro ao conectar com receiver:', error);
            throw error;
        }
    }

    // ✅ MÉTODOS AUXILIARES (MANTIDOS)
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
            if (this.localStream) {
                console.log('✅ Usando stream sincronizado do UI');
                return this.localStream;
            }
            
            if (window.localStream) {
                console.log('✅ Usando stream global do window');
                this.localStream = window.localStream;
                return window.localStream;
            }
            
            console.log('📹 Solicitando nova permissão de câmera (sem áudio)');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: false
            });
            this.localStream = stream;
            return stream;
        } catch (error) {
            throw new Error('Permissão da câmera negada: ' + error.message);
        }
    }

    // ✅✅✅ CORREÇÃO 6: VERIFICAÇÃO APENAS COM ID
    async verificarSeEstaSendoProcurado(myId) {
        try {
            const response = await fetch(`${SERVIDOR_SINALIZADOR}/verificar/${myId}`);
            const result = await response.json();
            return result.procurado ? result.callerId : null;
        } catch (error) {
            console.error('Erro ao verificar:', error);
            return null;
        }
    }

    // ✅✅✅ CORREÇÃO 7: AGUARDAR APENAS COM ID
    async waitForReceiverOnline(receiverId, idioma) {
        console.log('⏳ Aguardando receiver ficar online...');
        
        const checkInterval = setInterval(async () => {
            const online = await this.verificarReceiverOnline(receiverId);
            if (online) {
                clearInterval(checkInterval);
                console.log('🎯 Receiver ficou online, conectando...');
                await this.connectToReceiver(receiverId, idioma);
            }
        }, 3000);
    }

    // ✅ CONFIGURAÇÃO DE CALLBACKS (MANTIDA)
    setupCallbacks(callbacks) {
        if (callbacks.onRemoteStream) {
            this.rtcCore.setRemoteStreamCallback(callbacks.onRemoteStream);
        }
        
        this.rtcCore.onIncomingCall = (offer, callerLang) => {
            console.log('📞 Chamada recebida, aceitando automaticamente...');
            
            if (callbacks.onCallerLanguage) {
                callbacks.onCallerLanguage(callerLang);
            }
            
            this.rtcCore.handleIncomingCall(offer, this.localStream, (remoteStream) => {
                console.log('✅ Conexão WebRTC estabelecida!');
                
                if (callbacks.onRemoteStream) {
                    callbacks.onRemoteStream(remoteStream);
                }
            });
        };
        
        if (callbacks.onDataChannelMessage) {
            this.rtcCore.setDataChannelCallback(callbacks.onDataChannelMessage);
        }
        
        if (callbacks.onError) {
            // Configurar tratamento de erro se necessário
        }
    }

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

    setupConnectionHandlers() {
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

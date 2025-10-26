// core/webrtc-core.js
import { getIceServers, SIGNALING_SERVER_URL } from './internet-config.js';

class WebRTCCore {
  constructor(socketUrl = SIGNALING_SERVER_URL) {
    this.socket = io(socketUrl);
    this.peer = null;
    this.localStream = null;
    this.remoteStreamCallback = null;
    this.currentCaller = null;
    this.dataChannel = null;
    this.onDataChannelMessage = null;
    this.initialized = false;
    this.userId = null;

    // ✅ CORREÇÃO: Data Channel global mais robusto
    window.rtcDataChannel = {
        send: (message) => {
            if (this.dataChannel && this.dataChannel.readyState === 'open') {
                this.dataChannel.send(message);
                console.log('📤 Mensagem enviada via DataChannel:', message);
            } else {
                console.log('❌ DataChannel não está aberto');
            }
        },
        isOpen: () => {
            return this.dataChannel && this.dataChannel.readyState === 'open';
        }
    };

    this.iceServers = getIceServers();
    console.log('✅ WebRTCCore inicializado com servidores ICE:', this.iceServers);
  }

  // ✅ VERIFICAÇÃO DE PRONTIDÃO CORRIGIDA
  isReady() {
    return this.peer && 
           this.peer.signalingState === 'stable' && 
           this.initialized;
  }

  // ✅ CONFIGURAR SOCKET
  setSocket(socket) {
    this.socket = socket;
    console.log('✅ Socket configurado no WebRTC Core');
  }

  // ✅ INICIALIZAÇÃO COMPLETA
  async initialize(userId) {
    try {
      this.userId = userId;
      console.log('🎯 Inicializando WebRTC Core para usuário:', userId);
      
      // Registra no servidor de signaling
      this.socket.emit('register', { id: userId });
      
      this.initialized = true;
      console.log('✅ WebRTC Core inicializado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro na inicialização do WebRTC Core:', error);
      throw error;
    }
  }

  // ✅ SETUP DATA CHANNEL CORRIGIDO
  setupDataChannelHandlers() {
    if (!this.dataChannel) {
      console.log('❌ DataChannel não disponível para configurar handlers');
      return;
    }
    
    this.dataChannel.onopen = () => {
      console.log('✅ DataChannel conectado - pronto para enviar mensagens');
    };

    this.dataChannel.onmessage = (event) => {
      console.log('📩 Mensagem recebida via DataChannel:', event.data);
      if (this.onDataChannelMessage) {
        this.onDataChannelMessage(event.data);
      } else {
        console.log('⚠️ Nenhum callback configurado para DataChannel');
      }
    };

    this.dataChannel.onclose = () => {
      console.log('🔴 DataChannel fechado');
    };

    this.dataChannel.onerror = (error) => {
      console.error('❌ DataChannel error:', error);
    };
  }

  // ✅ START CALL CORRIGIDO - MUITO MAIS ROBUSTO
  async startCall(targetId, stream, callerLang) {
    try {
      console.log('📞 Iniciando chamada WebRTC para:', targetId);
      
      // ✅ VALIDAÇÕES CRÍTICAS
      if (!this.socket || !this.socket.connected) {
        throw new Error('Socket não conectado');
      }

      if (!targetId) {
        throw new Error('ID do target não fornecido');
      }

      this.localStream = stream;
      
      // ✅ CONFIGURAÇÃO DO PEER CONNECTION
      this.peer = new RTCPeerConnection({ 
        iceServers: this.iceServers,
        iceCandidatePoolSize: 10
      });

      console.log('✅ PeerConnection criado');

      // ✅ CONFIGURA DATA CHANNEL
      this.dataChannel = this.peer.createDataChannel('chat', {
        ordered: true
      });
      this.setupDataChannelHandlers();

      // ✅ ADICIONA TRACKS LOCAIS (se stream disponível)
      if (stream) {
        stream.getTracks().forEach(track => {
          this.peer.addTrack(track, stream);
          console.log(`✅ Track ${track.kind} adicionada`);
        });
      } else {
        console.log('ℹ️ Chamada sem stream local (modo áudio/texto)');
      }

      // ✅ CONFIGURA HANDLERS DE EVENTOS
      this.peer.ontrack = (event) => {
        console.log('🎥 Track remota recebida:', event.track.kind);
        if (this.remoteStreamCallback && event.streams[0]) {
          this.remoteStreamCallback(event.streams[0]);
        }
      };

      this.peer.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('❄️ Enviando ICE candidate para:', targetId);
          this.socket.emit('ice-candidate', {
            to: targetId,
            candidate: event.candidate
          });
        } else {
          console.log('✅ Todos os ICE candidates coletados');
        }
      };

      this.peer.oniceconnectionstatechange = () => {
        console.log('🔌 ICE connection state:', this.peer.iceConnectionState);
      };

      this.peer.onsignalingstatechange = () => {
        console.log('📡 Signaling state:', this.peer.signalingState);
      };

      // ✅ CRIA E ENVIA OFERTA
      console.log('🔄 Criando oferta...');
      const offer = await this.peer.createOffer();
      await this.peer.setLocalDescription(offer);
      
      console.log('✅ Oferta criada, enviando via signaling...');
      
      this.socket.emit('call', {
        to: targetId,
        offer: this.peer.localDescription,
        callerLang: callerLang,
        fromId: this.userId
      });

      console.log('✅ Chamada iniciada com sucesso');

    } catch (error) {
      console.error('❌ Erro crítico em startCall:', error);
      throw error;
    }
  }

  // ✅ HANDLE INCOMING CALL CORRIGIDO
  async handleIncomingCall(offer, localStream, callback) {
    try {
      console.log('📞 Processando chamada recebida...');
      
      this.localStream = localStream;
      
      // ✅ CRIA PEER CONNECTION
      this.peer = new RTCPeerConnection({ 
        iceServers: this.iceServers,
        iceCandidatePoolSize: 10
      });

      console.log('✅ PeerConnection criado para resposta');

      // ✅ CONFIGURA DATA CHANNEL
      this.peer.ondatachannel = (event) => {
        console.log('📨 DataChannel recebido');
        this.dataChannel = event.channel;
        this.setupDataChannelHandlers();
      };

      // ✅ ADICIONA TRACKS LOCAIS
      if (localStream) {
        localStream.getTracks().forEach(track => {
          this.peer.addTrack(track, localStream);
          console.log(`✅ Track ${track.kind} adicionada`);
        });
      }

      // ✅ CONFIGURA HANDLERS
      this.peer.ontrack = (event) => {
        console.log('🎥 Stream remota recebida na resposta');
        callback(event.streams[0]);
      };

      this.peer.onicecandidate = (event) => {
        if (event.candidate && this.currentCaller) {
          console.log('❄️ Enviando ICE candidate de resposta');
          this.socket.emit('ice-candidate', {
            to: this.currentCaller,
            candidate: event.candidate
          });
        }
      };

      // ✅ PROCESSA OFERTA E CRIA RESPOSTA
      console.log('🔄 Configurando oferta remota...');
      await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
      
      console.log('🔄 Criando resposta...');
      const answer = await this.peer.createAnswer();
      await this.peer.setLocalDescription(answer);
      
      console.log('✅ Enviando resposta...');
      this.socket.emit('answer', {
        to: this.currentCaller,
        answer: this.peer.localDescription
      });

      console.log('✅ Chamada recebida processada com sucesso');

    } catch (error) {
      console.error('❌ Erro ao processar chamada recebida:', error);
      throw error;
    }
  }

  // ✅ SETUP SOCKET HANDLERS CORRIGIDO
  setupSocketHandlers() {
    console.log('🔌 Configurando handlers do socket...');

    // ✅ RESPOSTA À OFERTA
    this.socket.on('answer', (data) => {
      console.log('✅ Resposta recebida:', data);
      if (this.peer && this.peer.signalingState === 'have-local-offer') {
        this.peer.setRemoteDescription(new RTCSessionDescription(data.answer))
          .then(() => {
            console.log('✅ Resposta configurada com sucesso');
          })
          .catch(error => {
            console.error('❌ Erro ao configurar resposta:', error);
          });
      }
    });

    // ✅ ICE CANDIDATES
    this.socket.on('ice-candidate', (data) => {
      console.log('❄️ ICE candidate recebido:', data);
      if (this.peer && this.peer.remoteDescription) {
        this.peer.addIceCandidate(new RTCIceCandidate(data.candidate))
          .then(() => {
            console.log('✅ ICE candidate adicionado');
          })
          .catch(error => {
            console.error('❌ Erro ao adicionar ICE candidate:', error);
          });
      } else {
        console.log('⚠️ Peer não pronto para ICE candidate');
      }
    });

    // ✅ CHAMADA RECEBIDA
    this.socket.on('incomingCall', (data) => {
      console.log('📞 Chamada recebida de:', data.from);
      this.currentCaller = data.from;
      if (this.onIncomingCall) {
        this.onIncomingCall(data.offer, data.callerLang);
      }
    });

    // ✅ CONFIRMAÇÃO DE REGISTRO
    this.socket.on('registered', (data) => {
      console.log('✅ Registrado no servidor com sucesso:', data);
    });

    console.log('✅ Handlers do socket configurados');
  }

  // ✅ HANDLE ANSWER SEPARADO
  async handleAnswer(answer) {
    try {
      if (!this.peer) {
        throw new Error('PeerConnection não existe');
      }

      console.log('🔄 Configurando resposta remota...');
      await this.peer.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('✅ Resposta configurada com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao configurar resposta:', error);
      throw error;
    }
  }

  // ✅ HANDLE ICE CANDIDATE SEPARADO
  async handleIceCandidate(candidate) {
    try {
      if (!this.peer || !this.peer.remoteDescription) {
        console.log('⚠️ Peer não pronto para ICE candidate');
        return;
      }

      await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('✅ ICE candidate adicionado');
      
    } catch (error) {
      console.error('❌ Erro ao adicionar ICE candidate:', error);
    }
  }

  // ✅ SET LOCAL STREAM
  setLocalStream(stream) {
    this.localStream = stream;
    console.log('✅ Stream local configurado no WebRTC Core');
  }

  // ✅ CALLBACKS
  setRemoteStreamCallback(callback) {
    this.remoteStreamCallback = callback;
    console.log('✅ Callback de stream remoto configurado');
  }

  setDataChannelCallback(callback) {
    this.onDataChannelMessage = callback;
    console.log('✅ Callback de DataChannel configurado');
  }

  setIncomingCallCallback(callback) {
    this.onIncomingCall = callback;
    console.log('✅ Callback de chamada recebida configurado');
  }

  // ✅ ENVIAR MENSAGEM
  sendMessage(message) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(message);
      console.log('✅ Mensagem enviada:', message);
      return true;
    } else {
      console.log('❌ DataChannel não está aberto para enviar mensagem');
      return false;
    }
  }

  // ✅ ATUALIZAR STREAM DE VÍDEO
  async updateVideoStream(newStream) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.peer || this.peer.connectionState !== 'connected') {
          console.log('❌ WebRTC não está conectado para atualizar stream');
          reject(new Error('WebRTC não conectado'));
          return;
        }

        console.log('🔄 Atualizando stream de vídeo no WebRTC Core...');
        
        this.localStream = newStream;
        const newVideoTrack = newStream.getVideoTracks()[0];
        
        if (!newVideoTrack) {
          reject(new Error('Nenhuma track de vídeo encontrada'));
          return;
        }

        const senders = this.peer.getSenders();
        let videoSendersUpdated = 0;
        
        for (const sender of senders) {
          if (sender.track && sender.track.kind === 'video') {
            try {
              await sender.replaceTrack(newVideoTrack);
              videoSendersUpdated++;
              console.log(`✅ Sender de vídeo ${videoSendersUpdated} atualizado`);
            } catch (error) {
              console.error('❌ Erro ao atualizar sender:', error);
            }
          }
        }

        if (videoSendersUpdated > 0) {
          console.log(`✅ ${videoSendersUpdated} senders de vídeo atualizados`);
          resolve(true);
        } else {
          console.log('⚠️ Nenhum sender de vídeo encontrado');
          resolve(false);
        }
        
      } catch (error) {
        console.error('❌ Erro crítico ao atualizar stream:', error);
        reject(error);
      }
    });
  }

  // ✅ FECHAR CONEXÃO
  close() {
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    if (this.peer) {
      this.peer.close();
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    console.log('🔴 WebRTC Core fechado');
  }
}

export { WebRTCCore };

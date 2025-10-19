// core/webrtc-core.js
import { getIceServers, SIGNALING_SERVER_URL, CONNECTION_CONFIG } from './internet-config.js';

class WebRTCCore {
  constructor(socketUrl = SIGNALING_SERVER_URL) {
    console.log('🎯 Inicializando WebRTCCore');
    
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });
    
    this.peer = null;
    this.localStream = null;
    this.remoteStreamCallback = null;
    this.currentCaller = null;
    this.dataChannel = null;
    this.onDataChannelMessage = null;
    this.onIncomingCall = null;
    this.isCallActive = false;
    this.myUserId = null;

    // Data Channel global
    window.rtcDataChannel = {
      send: (message) => {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
          this.dataChannel.send(message);
        }
      },
      isOpen: () => {
        return this.dataChannel && this.dataChannel.readyState === 'open';
      }
    };

    this.iceServers = getIceServers();
    this.setupSocketHandlers();
  }

  /**
   * 🔌 Configura handlers do Socket.IO
   */
  setupSocketHandlers() {
    console.log('🔧 Configurando handlers do Socket.IO...');
    
    this.socket.on('connect', () => {
      console.log('✅ Conectado ao servidor de signaling');
      // Se já tem userId, registra novamente
      if (this.myUserId) {
        this.socket.emit('register', this.myUserId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Desconectado do signaling');
      this.isCallActive = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão com signaling:', error);
    });

    // ✅ Resposta da chamada
    this.socket.on('acceptAnswer', (data) => {
      console.log('✅ Answer recebido de:', data.from);
      if (this.peer) {
        this.peer.setRemoteDescription(new RTCSessionDescription(data.answer))
          .catch(error => console.error('❌ Erro ao configurar answer:', error));
      }
    });

    // ✅ ICE Candidates
    this.socket.on('ice-candidate', (data) => {
      console.log('🧊 ICE candidate recebido de:', data.from);
      if (this.peer) {
        this.peer.addIceCandidate(new RTCIceCandidate(data.candidate))
          .catch(error => console.error('❌ Erro ao adicionar ICE candidate:', error));
      }
    });

    // ✅ Chamada recebida
    this.socket.on('incomingCall', (data) => {
      console.log('📞 Chamada recebida de:', data.from);
      this.currentCaller = data.from;
      this.isCallActive = true;
      
      if (this.onIncomingCall) {
        this.onIncomingCall(data.offer, data.callerLang);
      }
    });

    // ✅ Chamada finalizada
    this.socket.on('callEnded', (data) => {
      console.log('📞 Chamada finalizada por:', data.from);
      this.isCallActive = false;
    });
  }

  /**
   * 👤 Registra usuário no servidor de signaling
   */
  initialize(userId) {
    console.log('👤 Registrando usuário:', userId);
    this.myUserId = userId;
    
    // ✅✅✅ CORREÇÃO CRÍTICA: REGISTRA IMEDIATAMENTE (igual ao código antigo)
    this.socket.emit('register', userId);
    console.log('✅ Usuário registrado no servidor');
    
    // ✅ MANTÉM o comportamento de backup (sem prejudicar)
    this.socket.once('connect', () => {
      console.log('✅ Conexão estabelecida - registro confirmado');
    });
  }

  /**
   * 📞 Inicia uma chamada para outro usuário
   */
  startCall(targetId, stream, callerLang) {
    console.log('📞 Iniciando chamada para:', targetId);
    
    if (this.isCallActive) {
      console.warn('⚠️ Chamada já em andamento');
      return;
    }

    this.localStream = stream;
    this.isCallActive = true;
    
    // Cria nova conexão peer
    this.peer = new RTCPeerConnection({ 
      iceServers: this.iceServers 
    });

    // Data Channel para mensagens
    this.dataChannel = this.peer.createDataChannel('chat');
    this.setupDataChannelHandlers();

    // Adiciona tracks do stream local
    if (stream) {
      stream.getTracks().forEach(track => {
        this.peer.addTrack(track, stream);
      });
    }

    // Stream remoto
    this.peer.ontrack = (event) => {
      console.log('🎥 Stream remoto recebido');
      if (event.streams[0] && this.remoteStreamCallback) {
        this.remoteStreamCallback(event.streams[0]);
      }
    };

    // ICE Candidates
    this.peer.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', {
          to: targetId,
          candidate: event.candidate
        });
      }
    };

    // Cria e envia offer
    this.peer.createOffer()
      .then(offer => this.peer.setLocalDescription(offer))
      .then(() => {
        console.log('📤 Enviando offer para:', targetId);
        this.socket.emit('call', {
          to: targetId,
          offer: this.peer.localDescription,
          callerLang: callerLang
        });
      })
      .catch(error => {
        console.error('❌ Erro ao iniciar chamada:', error);
        this.isCallActive = false;
      });
  }

  /**
   * 📞 Processa uma chamada recebida
   */
  handleIncomingCall(offer, localStream, callback) {
    console.log('📞 Processando chamada recebida');
    
    this.localStream = localStream;
    this.isCallActive = true;
    
    // Cria nova conexão peer
    this.peer = new RTCPeerConnection({ 
      iceServers: this.iceServers 
    });

    // Adiciona tracks do stream local
    if (localStream) {
      localStream.getTracks().forEach(track => {
        this.peer.addTrack(track, localStream);
      });
    }

    // Data Channel
    this.peer.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannelHandlers();
    };

    // Stream remoto
    this.peer.ontrack = (event) => {
      if (event.streams[0]) {
        callback(event.streams[0]);
      }
    };

    // ICE Candidates
    this.peer.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', {
          to: this.currentCaller,
          candidate: event.candidate
        });
      }
    };

    // Processa a chamada recebida
    this.peer.setRemoteDescription(new RTCSessionDescription(offer))
      .then(() => this.peer.createAnswer())
      .then(answer => this.peer.setLocalDescription(answer))
      .then(() => {
        this.socket.emit('answer', {
          to: this.currentCaller,
          answer: this.peer.localDescription
        });
      })
      .catch(error => {
        console.error('❌ Erro ao processar chamada:', error);
        this.isCallActive = false;
      });
  }

  /**
   * 🔌 Configura handlers do Data Channel
   */
  setupDataChannelHandlers() {
    if (!this.dataChannel) return;
    
    this.dataChannel.onopen = () => {
      console.log('✅ DataChannel conectado');
    };

    this.dataChannel.onmessage = (event) => {
      console.log('📨 Mensagem recebida:', event.data);
      if (this.onDataChannelMessage) {
        this.onDataChannelMessage(event.data);
      }
    };

    this.dataChannel.onerror = (error) => {
      console.error('❌ Erro no DataChannel:', error);
    };
  }

  /**
   * 📤 Envia mensagem via Data Channel
   */
  sendMessage(message) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(message);
      return true;
    }
    return false;
  }

  /**
   * 🔌 Fecha conexão WebRTC
   */
  closeConnection() {
    console.log('🔌 Fechando conexão WebRTC');
    
    this.isCallActive = false;
    
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    
    if (this.peer) {
      this.peer.close();
      this.peer = null;
    }
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  // ===== CALLBACK SETTERS =====
  
  setRemoteStreamCallback(callback) {
    this.remoteStreamCallback = callback;
  }

  setDataChannelCallback(callback) {
    this.onDataChannelMessage = callback;
  }

  setIncomingCallCallback(callback) {
    this.onIncomingCall = callback;
  }
}

export { WebRTCCore };

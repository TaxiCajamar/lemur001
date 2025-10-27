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
    this.onIncomingCall = null;

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
  }

  startCall(targetId, stream, callerLang) {
    this.localStream = stream;
    this.peer = new RTCPeerConnection({ iceServers: this.iceServers });

    this.dataChannel = this.peer.createDataChannel('chat');
    this.setupDataChannelHandlers();

    if (!stream || stream.getVideoTracks().length === 0) {
      console.warn('⚠️ Nenhuma câmera disponível para envio no caller');
    } else {
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach(track => {
        this.peer.addTrack(track, stream);
        console.log('✅ Track de vídeo adicionada ao WebRTC');
      });
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length > 0) {
      console.log('🔇 Ignorando tracks de áudio (sistema sem áudio)');
    }

    this.peer.ontrack = event => {
      const remoteStream = event.streams[0];
      console.log('📹 Stream remota recebida no caller:', remoteStream);
      console.log('📹 Tracks da stream remota:', remoteStream?.getTracks());

      if (!remoteStream || remoteStream.getTracks().length === 0) {
        console.warn('⚠️ Stream remota está vazia ou inválida no caller');
      }

      if (this.remoteStreamCallback) {
        this.remoteStreamCallback(remoteStream);
      }
    };

    this.peer.onicecandidate = event => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', {
          to: targetId,
          candidate: event.candidate
        });
      }
    };

    this.peer.createOffer()
      .then(offer => this.peer.setLocalDescription(offer))
      .then(() => {
        this.socket.emit('call', {
          to: targetId,
          offer: this.peer.localDescription,
          callerLang: callerLang
        });
      });
  }

  handleIncomingCall(offer, localStream, callback) {
    this.peer = new RTCPeerConnection({ iceServers: this.iceServers });

    if (!localStream || localStream.getVideoTracks().length === 0) {
      console.warn('⚠️ Nenhuma câmera disponível para envio no receiver');
    } else {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        this.peer.addTrack(track, localStream);
        console.log('✅ Track de vídeo adicionada ao WebRTC (receiver)');
      });

      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        console.log('🔇 Ignorando tracks de áudio no receiver');
      }
    }

    this.peer.ontrack = (event) => {
      console.log('🎯 Evento ontrack disparado!', event.streams);
      const remoteStream = event.streams[0];
      console.log('📹 Stream remota recebida no receiver:', remoteStream);
      console.log('📹 Tracks da stream remota:', remoteStream?.getTracks());

      if (!remoteStream || remoteStream.getTracks().length === 0) {
        console.warn('⚠️ Stream remota está vazia ou inválida no receiver');
      }

      if (callback) {
        callback(remoteStream);
      }
    };

    this.peer.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannelHandlers();
    };

    this.peer.onicecandidate = event => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', {
          to: this.currentCaller,
          candidate: event.candidate
        });
      }
    };

    this.peer.setRemoteDescription(new RTCSessionDescription(offer))
      .then(() => this.peer.createAnswer())
      .then(answer => this.peer.setLocalDescription(answer))
      .then(() => {
        this.socket.emit('answer', {
          to: this.currentCaller,
          answer: this.peer.localDescription
        });
        console.log('✅ Answer enviado para o caller');
      })
      .catch(error => {
        console.error('❌ Erro ao processar incoming call:', error);
      });
  }

  setupSocketHandlers() {
    this.socket.on('acceptAnswer', data => {
      if (this.peer) {
        this.peer.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    this.socket.on('ice-candidate', candidate => {
      if (this.peer) {
        this.peer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    this.socket.on('incomingCall', data => {
      this.currentCaller = data.from;
      window.lastCallerId = data.from;
      if (this.onIncomingCall) {
        this.onIncomingCall(data.offer, data.callerLang);
      }
    });
  }

  setupDataChannelHandlers() {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      console.log('DataChannel connected');
    };

    this.dataChannel.onmessage = (event) => {
      console.log('Message received:', event.data);
      if (this.onDataChannelMessage) {
        this.onDataChannelMessage(event.data);
      }
    };

    this.dataChannel.onerror = (error) => {
      console.error('DataChannel error:', error);
    };
  }

  initialize(userId) {
    this.socket.emit('register', userId);
  }

  setRemoteStreamCallback(callback) {
    this.remoteStreamCallback = callback;
  }

  setDataChannelCallback(callback) {
    this.onDataChannelMessage = callback;
  }

  sendMessage(message) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(message);
    }
  }

  updateVideoStream(newStream) {
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
          console.log(`✅ ${videoSendersUpdated} senders de vídeo atualizados com sucesso`);
          resolve(true);
        } else {
          console.log('⚠️ Nenhum sender de vídeo encontrado para atualizar');
          resolve(false);
        }

      } catch (error) {
        console.error('❌ Erro crítico ao atualizar stream:', error);
        reject(error);
      }
    });
  }
}

export { WebRTCCore };

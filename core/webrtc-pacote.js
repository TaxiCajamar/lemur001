export async function iniciarWebRTCPacote(token) {
  // ✅ Injeta estilo exclusivo para o vídeo remoto
  const estiloVideoRemoto = document.createElement('style');
  estiloVideoRemoto.innerHTML = `
    #videoRemoto {
      position: relative;
      z-index: 10;
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      opacity: 1;
      background: black;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
      border: 0.3vw solid #4CAF50;
    }
  `;
  document.head.appendChild(estiloVideoRemoto);

  // 📹 Captura da câmera local
  const localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false
  });

  // 📦 Injeta no PiP
  const localVideo = document.getElementById('localVideo');
  if (localVideo) {
    localVideo.srcObject = localStream;
  }

  // 🌐 Cria conexão WebRTC
  const peer = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  // 📤 Envia câmera local para o peer
  localStream.getVideoTracks().forEach(track => {
    peer.addTrack(track, localStream);
  });

  // 📥 Recebe câmera remota
  const remoteVideo = document.getElementById('videoRemoto');
  peer.ontrack = event => {
    const remoteStream = event.streams[0];
    if (remoteVideo) {
      remoteVideo.srcObject = remoteStream;
      remoteVideo.play().catch(() => {});
    }
  };

  // 🔄 ICE negotiation
  peer.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('receiver-candidate', { token, candidate: event.candidate });
    }
  };

  // 📡 Recebe oferta do caller
  socket.on('caller-offer', async ({ offer }) => {
    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    socket.emit('receiver-answer', { token, answer });
  });

  // 📡 Recebe ICE do caller
  socket.on('caller-candidate', ({ candidate }) => {
    peer.addIceCandidate(new RTCIceCandidate(candidate));
  });

  return {
    encerrar: () => peer.close()
  };
}

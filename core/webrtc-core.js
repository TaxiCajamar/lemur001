import { getIceServers, SIGNALING_SERVER_URL } from './internet-config.js';

let peerConnection;
let localStream;
let remoteStream;
let socket;
let isCaller = false;
let targetSocketId = null;

// Inicialização do WebRTC
export const initializeWebRTC = (socketInstance) => {
    return new Promise(async (resolve, reject) => {
        try {
            socket = socketInstance;
            
            console.log('🔧 Inicializando WebRTC...');
            
            // Configurar handlers de eventos do socket
            setupSocketHandlers();
            
            // Inicializar streams de mídia
            await initializeMediaStream();
            
            console.log('✅ WebRTC inicializado');
            resolve();
            
        } catch (error) {
            console.error('❌ Erro na inicialização WebRTC:', error);
            reject(error);
        }
    });
};

// Configurar handlers de eventos do socket
function setupSocketHandlers() {
    // Evento quando recebe uma oferta de chamada
    socket.on('callMade', async (data) => {
        console.log('📞 Chamada recebida de:', data.from);
        targetSocketId = data.from;
        
        try {
            await createPeerConnection(false);
            await peerConnection.setRemoteDescription(data.signal);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            
            socket.emit('answerCall', {
                signal: answer,
                to: targetSocketId
            });
            
        } catch (error) {
            console.error('❌ Erro ao responder chamada:', error);
        }
    });
    
    // Evento quando chamada é aceita
    socket.on('callAccepted', async (data) => {
        console.log('✅ Chamada aceita');
        if (peerConnection) {
            await peerConnection.setRemoteDescription(data.signal);
        }
    });
    
    // Evento quando recebe ICE candidate
    socket.on('iceCandidate', async (data) => {
        console.log('🧊 ICE candidate recebido');
        if (peerConnection && data.candidate) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    });
    
    // Evento quando chamada é encerrada
    socket.on('callEnded', () => {
        console.log('🔌 Chamada encerrada remotamente');
        endCall();
    });
    
    // Eventos de conexão
    socket.on('connect', () => {
        console.log('✅ Conectado ao servidor de sinalização:', socket.id);
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Desconectado do servidor');
    });
}

// Inicializar stream de mídia
async function initializeMediaStream() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
        });
        
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = localStream;
        }
        
        window.currentStream = localStream;
        console.log('🎥 Stream de mídia inicializado');
        
    } catch (error) {
        console.error('❌ Erro ao acessar mídia:', error);
        throw error;
    }
}

// Criar peer connection
async function createPeerConnection(isCallerRole = true) {
    try {
        const configuration = {
            iceServers: await getIceServers()
        };
        
        peerConnection = new RTCPeerConnection(configuration);
        isCaller = isCallerRole;
        
        // Adicionar stream local
        if (localStream) {
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
            });
        }
        
        // Handler para stream remoto
        peerConnection.ontrack = (event) => {
            console.log('📹 Stream remoto recebido');
            remoteStream = event.streams[0];
            const remoteVideo = document.getElementById('remoteVideo');
            if (remoteVideo) {
                remoteVideo.srcObject = remoteStream;
            }
        };
        
        // Handler para ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate && targetSocketId) {
                socket.emit('iceCandidate', {
                    candidate: event.candidate,
                    target: targetSocketId
                });
            }
        };
        
        // Handler para mudanças de estado
        peerConnection.onconnectionstatechange = () => {
            console.log('🔄 Estado da conexão:', peerConnection.connectionState);
            
            if (peerConnection.connectionState === 'connected') {
                console.log('🎉 Conexão WebRTC estabelecida!');
                if (window.liberarInterface) {
                    window.liberarInterface();
                }
            }
        };
        
        console.log('🔗 Peer Connection criado');
        
    } catch (error) {
        console.error('❌ Erro ao criar Peer Connection:', error);
        throw error;
    }
}

// Criar chamada
export const createCall = async (socketInstance) => {
    try {
        socket = socketInstance;
        targetSocketId = prompt('ID do usuário para chamar:') || generateRandomId();
        
        if (!targetSocketId) {
            throw new Error('ID de destino não especificado');
        }
        
        console.log('📞 Criando chamada para:', targetSocketId);
        
        await createPeerConnection(true);
        
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        socket.emit('callUser', {
            userToCall: targetSocketId,
            signal: offer,
            from: socket.id
        });
        
        console.log('✅ Oferta de chamada enviada');
        
    } catch (error) {
        console.error('❌ Erro ao criar chamada:', error);
        throw error;
    }
};

// Responder chamada
export const answerCall = async (data) => {
    try {
        if (!peerConnection) {
            await createPeerConnection(false);
        }
        
        await peerConnection.setRemoteDescription(data.signal);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        socket.emit('answerCall', {
            signal: answer,
            to: data.callerId
        });
        
    } catch (error) {
        console.error('❌ Erro ao responder chamada:', error);
        throw error;
    }
};

// Encerrar chamada
export const endCall = () => {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    
    if (targetSocketId) {
        socket.emit('disconnectCall', { target: targetSocketId });
    }
    
    console.log('🔌 Chamada encerrada');
    
    // Resetar elementos de vídeo
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    
    if (localVideo) localVideo.srcObject = null;
    if (remoteVideo) remoteVideo.srcObject = null;
};

// Gerar ID aleatório
function generateRandomId() {
    return Math.random().toString(36).substring(2, 10);
}

// Export para debug
window.webrtcDebug = {
    getPC: () => peerConnection,
    getLocalStream: () => localStream,
    getRemoteStream: () => remoteStream,
    endCall: endCall
};

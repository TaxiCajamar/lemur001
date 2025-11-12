// 🎯 VIGILANTE DE CÂMERAS UNIVERSAL - CONTROLE ÚNICO
// 📍 Localização: core/camera-vigilante.js

class CameraVigilante {
    constructor() {
        // 👁️ MÓDULO VIGILANTE
        this.estaMonitorando = false;
        this.intervaloMonitoramento = null;
        this.ultimoFrameTime = null;
        this.tentativasRecuperacao = 0;
        this.maxTentativas = 3;
        
        // 🎥 CONTROLE DE CÂMERAS
        this.todasAsCameras = [];
        this.cameraAtual = null;
        this.camerasCache = null;
        this.ultimaAtualizacao = 0;
        this.cacheValidity = 30000;
        
        // 🔘 CONTROLE DE BOTÃO
        this.botaoToggle = null;
        this.isSwitching = false;
        
        console.log('🎯 CameraVigilante (Controle Único) inicializado');
    }

    // 🚀 INICIALIZAÇÃO COMPLETA DO SISTEMA
    async inicializarSistema() {
        try {
            console.log('🚀 Inicializando sistema completo de câmera...');
            
            // 1. 🗺️ MAPEAR CÂMERAS
            await this.mapearTodasCameras();
            
            // 2. 📹 INICIAR CÂMERA PRINCIPAL
            await this.iniciarCameraPadrao();
            
            // 3. 🔘 CONFIGURAR BOTÃO
            this.configurarBotaoToggle();
            
            // 4. 👁️ INICIAR VIGILÂNCIA
            this.iniciarMonitoramento();
            
            console.log('✅ Sistema de câmera inicializado com sucesso');
            
        } catch (error) {
            console.error('❌ Erro na inicialização do sistema de câmera:', error);
            // ⚠️ Continua sem câmera, mas sistema funciona
        }
    }

    // 📹 INICIAR CÂMERA PADRÃO (substitui a do receiver-ui.js)
    async iniciarCameraPadrao() {
        try {
            console.log('📹 Iniciando câmera padrão...');
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            await this.handleNewStream(stream);
            console.log('✅ Câmera padrão iniciada');
            
        } catch (error) {
            console.log('⚠️ Câmera indisponível, continuando sem vídeo...', error);
            // ⚠️ Não trava o sistema - continua em modo áudio/texto
        }
    }

    // 🗺️ MAPEAR TODAS AS CÂMERAS
    async mapearTodasCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.todasAsCameras = devices.filter(device => device.kind === 'videoinput');
            
            console.log(`📷 Câmeras encontradas: ${this.todasAsCameras.length}`);
            return this.todasAsCameras;
            
        } catch (error) {
            console.error('❌ Erro ao mapear câmeras:', error);
            return [];
        }
    }

    // 👁️ VIGILÂNCIA DA CÂMERA
    async iniciarMonitoramento() {
        if (this.estaMonitorando) return;

        console.log('👁️ Iniciando vigilância de câmera...');
        
        this.estaMonitorando = true;
        this.ultimoFrameTime = Date.now();

        this.observarVideo();
        
        this.intervaloMonitoramento = setInterval(() => {
            this.verificarSaudeCamera();
        }, 5000);

        console.log('✅ Vigilância ativada');
    }

    // 🔍 VERIFICAÇÃO DE SAÚDE
    async verificarSaudeCamera() {
        if (!this.estaMonitorando) return;

        const agora = Date.now();
        const tempoSemFrames = agora - this.ultimoFrameTime;
        
        if (tempoSemFrames > 10000) {
            console.log('🚨 Câmera possivelmente congelada');
            this.tentarRecuperarCamera('congelada');
            return;
        }

        if (window.localStream) {
            const videoTrack = window.localStream.getVideoTracks()[0];
            if (!videoTrack || videoTrack.readyState === 'ended') {
                console.log('🚨 Problema na track de vídeo');
                this.tentarRecuperarCamera('track_problema');
                return;
            }
        }

        console.log('✅ Câmera saudável');
    }

    // 📺 OBSERVAR ELEMENTO DE VÍDEO
    observarVideo() {
        const localVideo = document.getElementById('localVideo');
        if (!localVideo) return;

        localVideo.addEventListener('timeupdate', () => {
            this.ultimoFrameTime = Date.now();
        });

        localVideo.addEventListener('error', (error) => {
            console.log('❌ Erro no elemento de vídeo:', error);
            this.tentarRecuperarCamera('erro_video');
        });
    }

    // 🔄 RECUPERAÇÃO INTELIGENTE
    async tentarRecuperarCamera(motivo) {
        if (this.tentativasRecuperacao >= this.maxTentativas) {
            console.log('❌ Máximo de tentativas de recuperação');
            return;
        }

        this.tentativasRecuperacao++;
        console.log(`🔄 Tentativa ${this.tentativasRecuperacao}/${this.maxTentativas} - Motivo: ${motivo}`);

        try {
            this.pararMonitoramento();
            await this.executarRecuperacao();
            this.iniciarMonitoramento();
            this.tentativasRecuperacao = 0;
            console.log('✅ Câmera recuperada!');
        } catch (error) {
            console.log('❌ Falha na recuperação:', error);
        }
    }

    async executarRecuperacao() {
        console.log('🔧 Executando recuperação...');
        
        await this.mapearTodasCameras();
        
        if (this.todasAsCameras.length === 0) {
            throw new Error('Nenhuma câmera disponível');
        }

        let cameraParaTentar = null;
        
        if (this.cameraAtual && this.todasAsCameras.length > 1) {
            const indexAtual = this.todasAsCameras.findIndex(cam => 
                cam.deviceId === this.cameraAtual.deviceId
            );
            const proximaIndex = (indexAtual + 1) % this.todasAsCameras.length;
            cameraParaTentar = this.todasAsCameras[proximaIndex];
        } else {
            cameraParaTentar = this.todasAsCameras[0];
        }

        console.log(`🎯 Tentando câmera: ${cameraParaTentar.label || 'Camera alternativa'}`);

        const novaStream = await navigator.mediaDevices.getUserMedia({
            video: { 
                deviceId: { exact: cameraParaTentar.deviceId },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        await this.handleNewStream(novaStream);
    }

    // 🔘 SISTEMA DE BOTÃO (substitui setupCameraToggle do receiver-ui.js)
    configurarBotaoToggle(buttonId = 'toggleCamera') {
        this.botaoToggle = document.getElementById(buttonId);
        
        if (!this.botaoToggle) {
            console.log('❌ Botão de alternar câmera não encontrado');
            return false;
        }

        this.botaoToggle.addEventListener('click', () => this.handleToggleClick());
        console.log('✅ Botão de câmera configurado');
        return true;
    }

    async handleToggleClick() {
        if (this.isSwitching) {
            console.log('⏳ Troca já em andamento...');
            return;
        }

        this.isSwitching = true;
        this.botaoToggle.style.opacity = '0.5';
        this.botaoToggle.style.cursor = 'wait';

        try {
            console.log('🔄 Iniciando troca de câmera...');
            
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
                window.localStream = null;
            }

            await new Promise(resolve => setTimeout(resolve, 250));

            const newStream = await this.alternarCameraInteligente();
            await this.handleNewStream(newStream);
            
            console.log('✅ Câmera alternada com sucesso');

        } catch (error) {
            console.error('❌ Erro na alternância:', error);
            
            if (error.message.includes('Apenas uma câmera')) {
                this.botaoToggle.style.display = 'none';
            }
        } finally {
            this.isSwitching = false;
            this.botaoToggle.style.opacity = '1';
            this.botaoToggle.style.cursor = 'pointer';
        }
    }

    async alternarCameraInteligente() {
        const camerasOrdenadas = await this.obterCamerasOrdenadas();
        
        if (camerasOrdenadas.length <= 1) {
            throw new Error('Apenas uma câmera disponível');
        }
        
        const deviceIdAtual = window.localStream?.getVideoTracks()[0]?.getSettings()?.deviceId;
        const indexAtual = deviceIdAtual ? 
            camerasOrdenadas.findIndex(cam => cam.deviceId === deviceIdAtual) : -1;
        
        const proximaIndex = (indexAtual + 1) % camerasOrdenadas.length;
        const proximaCamera = camerasOrdenadas[proximaIndex];
        
        console.log(`🔄 Alternando para: ${proximaCamera.label || 'Camera ' + proximaIndex}`);
        
        const newStream = await navigator.mediaDevices.getUserMedia({
            video: { 
                deviceId: { exact: proximaCamera.deviceId },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });
        
        return newStream;
    }

    async obterCamerasOrdenadas() {
        if (this.camerasCache && Date.now() - this.ultimaAtualizacao < this.cacheValidity) {
            return this.camerasCache;
        }
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        const camerasOrdenadas = this.ordenarCamerasPorPrioridade(videoDevices);
        
        this.camerasCache = camerasOrdenadas;
        this.ultimaAtualizacao = Date.now();
        
        return camerasOrdenadas;
    }

    ordenarCamerasPorPrioridade(cameras) {
        const camerasComInfo = [];
        
        for (const camera of cameras) {
            const pontuacao = this.calcularPontuacaoRapida(camera);
            camerasComInfo.push({ camera, pontuacao });
        }
        
        return camerasComInfo
            .sort((a, b) => b.pontuacao - a.pontuacao)
            .map(item => item.camera);
    }

    calcularPontuacaoRapida(camera) {
        let pontuacao = 50;
        const label = camera.label.toLowerCase();
        
        if (label.includes('back') && !label.includes('ultra') && !label.includes('wide')) {
            pontuacao += 40;
        } else if (label.includes('front') || label.includes('selfie')) {
            pontuacao += 30;
        } else if (label.includes('wide') || label.includes('ultra')) {
            pontuacao += 10;
        }
        
        return pontuacao;
    }

    // ✅ MANIPULAÇÃO DE STREAM (substitui handleNewStream do receiver-ui.js)
    async handleNewStream(newStream) {
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = newStream;
        }

        window.localStream = newStream;

        const videoTrack = newStream.getVideoTracks()[0];
        if (videoTrack) {
            const settings = videoTrack.getSettings();
            this.cameraAtual = this.todasAsCameras.find(cam => 
                cam.deviceId === settings.deviceId
            );
            console.log(`🔄 Câmera atual: ${this.cameraAtual?.label || 'Nova câmera'}`);
        }

        this.atualizarWebRTC(newStream);
        this.reiniciarMonitoramento();
    }

    // 🌐 ATUALIZAR WEBRTC (substitui atualização duplicada do receiver-ui.js)
    atualizarWebRTC(novaStream) {
        if (window.rtcCore && window.rtcCore.peer) {
            const connectionState = window.rtcCore.peer.connectionState;
            
            if (connectionState === 'connected') {
                try {
                    window.rtcCore.localStream = novaStream;
                    const newVideoTrack = novaStream.getVideoTracks()[0];
                    const senders = window.rtcCore.peer.getSenders();
                    
                    for (const sender of senders) {
                        if (sender.track && sender.track.kind === 'video') {
                            sender.replaceTrack(newVideoTrack);
                        }
                    }
                } catch (webrtcError) {
                    console.error('❌ Erro ao atualizar WebRTC:', webrtcError);
                }
            }
        }
    }

    // 🔧 CONTROLE DO MONITORAMENTO
    pararMonitoramento() {
        if (this.intervaloMonitoramento) {
            clearInterval(this.intervaloMonitoramento);
            this.intervaloMonitoramento = null;
        }
        this.estaMonitorando = false;
    }

    reiniciarMonitoramento() {
        this.pararMonitoramento();
        this.tentativasRecuperacao = 0;
        this.ultimoFrameTime = Date.now();
        this.iniciarMonitoramento();
    }

    destruir() {
        this.pararMonitoramento();
        console.log('🧹 CameraVigilante finalizado');
    }
}

export { CameraVigilante };

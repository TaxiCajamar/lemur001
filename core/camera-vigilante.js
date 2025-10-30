// 🎯 VIGILANTE DE CÂMERAS UNIVERSAL + GERENCIADOR INTELIGENTE
// 📍 Localização: core/camera-vigilante.js

class CameraVigilante {
    constructor() {
        // 👁️ MÓDULO VIGILANTE EXPANDIDO
        this.estaMonitorando = false;
        this.intervaloMonitoramento = null;
        this.ultimoFrameTime = null;
        this.tentativasRecuperacao = 0;
        this.maxTentativas = 3;
        
        // 🎥 CONTROLE DE TODAS AS CÂMERAS (NOVO)
        this.todasAsCameras = []; // 🆕 LISTA DE TODAS AS CÂMERAS
        this.cameraAtual = null;  // 🆕 CÂMERA EM USO
        this.camerasCache = null;
        this.ultimaAtualizacao = 0;
        this.cacheValidity = 30000;
        
        // 🔘 CONTROLE DE BOTÃO
        this.botaoToggle = null;
        this.isSwitching = false;
        
        console.log('🎯 CameraVigilante (Vigilância Universal) inicializado');
    }

    // 🆕 MÉTODO PARA MAPEAR TODAS AS CÂMERAS DISPONÍVEIS
    async mapearTodasCameras() {
        try {
            console.log('🗺️ Mapeando todas as câmeras disponíveis...');
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.todasAsCameras = devices.filter(device => device.kind === 'videoinput');
            
            console.log(`📷 Câmeras mapeadas: ${this.todasAsCameras.length}`);
            this.todasAsCameras.forEach((cam, index) => {
                console.log(`   ${index + 1}. ${cam.label || 'Camera ' + index} (${cam.deviceId.substring(0, 10)}...)`);
            });
            
            return this.todasAsCameras;
        } catch (error) {
            console.error('❌ Erro ao mapear câmeras:', error);
            return [];
        }
    }

    // 🆕 VIGILÂNCIA DA CÂMERA ATUAL + PREPARAÇÃO DAS DEMAIS
    async iniciarMonitoramento() {
        if (this.estaMonitorando) return;

        console.log('👁️ Iniciando vigilância universal de câmeras...');
        
        // 🗺️ PRIMEIRO: MAPEA TODAS AS CÂMERAS
        await this.mapearTodasCameras();
        
        // 📹 MARCA CÂMERA ATUAL
        if (window.localStream) {
            const videoTrack = window.localStream.getVideoTracks()[0];
            if (videoTrack) {
                const settings = videoTrack.getSettings();
                this.cameraAtual = this.todasAsCameras.find(cam => 
                    cam.deviceId === settings.deviceId
                );
                console.log(`🎯 Câmera atual: ${this.cameraAtual?.label || 'Desconhecida'}`);
            }
        }

        this.estaMonitorando = true;
        this.ultimoFrameTime = Date.now();

        // 👁️ OBSERVA A CÂMERA ATUAL
        this.observarVideo();
        
        // ⚡ VERIFICAÇÃO PERIÓDICA DA SAÚDE
        this.intervaloMonitoramento = setInterval(() => {
            this.verificarSaudeCamera();
        }, 5000);

        console.log('✅ Vigilância universal ativada');
    }

    // 🆕 VERIFICAÇÃO EXPANDIDA - VIGIA SAÚDE GERAL
    async verificarSaudeCamera() {
        if (!this.estaMonitorando) return;

        console.log('🔍 Verificação universal de saúde das câmeras...');
        
        // 1. ✅ VERIFICA CÂMERA ATUAL
        const agora = Date.now();
        const tempoSemFrames = agora - this.ultimoFrameTime;
        
        if (tempoSemFrames > 10000) {
            console.log('🚨 Câmera atual possivelmente congelada');
            this.tentarRecuperarCamera('congelada');
            return;
        }

        // 2. ✅ VERIFICA SE A CÂMERA ATUAL AINDA EXISTE
        if (window.localStream) {
            const videoTrack = window.localStream.getVideoTracks()[0];
            if (!videoTrack) {
                console.log('🚨 Nenhuma track de vídeo encontrada');
                this.tentarRecuperarCamera('sem_track');
                return;
            }
            
            if (videoTrack.readyState === 'ended') {
                console.log('🚨 Track de vídeo terminou');
                this.tentarRecuperarCamera('track_terminada');
                return;
            }
        }

        // 3. 🆕 VERIFICA DISPONIBILIDADE DAS OUTRAS CÂMERAS
        await this.verificarDisponibilidadeCameras();

        console.log('✅ Todas as câmeras estão saudáveis');
    }

    // 🆕 VERIFICA SE AS OUTRAS CÂMERAS AINDA ESTÃO DISPONÍVEIS
    async verificarDisponibilidadeCameras() {
        try {
            const camerasAtuais = await this.mapearTodasCameras();
            
            // 🚨 DETECTA SE ALGUMA CÂMERA DESAPARECEU
            if (camerasAtuais.length < this.todasAsCameras.length) {
                console.log('⚠️ Número de câmeras disponíveis mudou');
                this.todasAsCameras = camerasAtuais;
            }
            
            // 🚨 VERIFICA SE A CÂMERA ATUAL AINDA EXISTE
            if (this.cameraAtual && !camerasAtuais.find(cam => cam.deviceId === this.cameraAtual.deviceId)) {
                console.log('🚨 Câmera atual não está mais disponível!');
                this.tentarRecuperarCamera('camera_removida');
            }
            
        } catch (error) {
            console.log('❌ Erro ao verificar disponibilidade:', error);
        }
    }

    observarVideo() {
        const localVideo = document.getElementById('localVideo');
        if (!localVideo) return;

        localVideo.addEventListener('timeupdate', () => {
            this.ultimoFrameTime = Date.now();
        });

        localVideo.addEventListener('error', (error) => {
            console.log('❌ Erro detectado no elemento de vídeo:', error);
            this.tentarRecuperarCamera('erro_no_video');
        });
    }

    async tentarRecuperarCamera(motivo) {
        if (this.tentativasRecuperacao >= this.maxTentativas) {
            console.log('❌ Máximo de tentativas de recuperação atingido');
            return;
        }

        this.tentativasRecuperacao++;
        console.log(`🔄 Tentativa ${this.tentativasRecuperacao}/${this.maxTentativas} - Motivo: ${motivo}`);

        try {
            this.pararMonitoramento();
            await this.executarRecuperacao();
            this.iniciarMonitoramento();
            this.tentativasRecuperacao = 0;
            console.log('✅ Câmera recuperada com sucesso!');
        } catch (error) {
            console.log('❌ Falha na recuperação:', error);
            if (this.tentativasRecuperacao < this.maxTentativas) {
                setTimeout(() => {
                    this.tentarRecuperarCamera(motivo);
                }, 2000);
            }
        }
    }

    // 🆕 RECUPERAÇÃO INTELIGENTE - TENTA CÂMERAS ALTERNATIVAS
    async executarRecuperacao() {
        console.log('🔧 Executando recuperação inteligente...');
        
        // 1. 🗺️ ATUALIZA MAPA DE CÂMERAS
        await this.mapearTodasCameras();
        
        if (this.todasAsCameras.length === 0) {
            throw new Error('Nenhuma câmera disponível');
        }

        // 2. 🎯 TENTA CÂMERA ALTERNATIVA (NÃO A QUE FALHOU)
        let cameraParaTentar = null;
        
        if (this.cameraAtual && this.todasAsCameras.length > 1) {
            // Tenta a próxima câmera na lista
            const indexAtual = this.todasAsCameras.findIndex(cam => 
                cam.deviceId === this.cameraAtual.deviceId
            );
            const proximaIndex = (indexAtual + 1) % this.todasAsCameras.length;
            cameraParaTentar = this.todasAsCameras[proximaIndex];
        } else {
            // Primeira tentativa ou só tem uma câmera
            cameraParaTentar = this.todasAsCameras[0];
        }

        console.log(`🎯 Tentando câmera alternativa: ${cameraParaTentar.label || 'Camera alternativa'}`);

        // 3. 📹 TENTA NOVA CÂMERA
        const novaStream = await navigator.mediaDevices.getUserMedia({
            video: { 
                deviceId: { exact: cameraParaTentar.deviceId },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        await this.handleNewStream(novaStream);
        console.log('✅ Recuperação inteligente concluída');
    }

    // ✅ ATUALIZADO: AGORA ATUALIZA O CONTROLE DA CÂMERA ATUAL
    async handleNewStream(newStream) {
        // Atualiza vídeo local
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = newStream;
        }

        // Atualiza stream global
        window.localStream = newStream;

        // 🆕 ATUALIZA CÂMERA ATUAL NO VIGILANTE
        const videoTrack = newStream.getVideoTracks()[0];
        if (videoTrack) {
            const settings = videoTrack.getSettings();
            this.cameraAtual = this.todasAsCameras.find(cam => 
                cam.deviceId === settings.deviceId
            );
            console.log(`🔄 Câmera atualizada no vigilante: ${this.cameraAtual?.label || 'Nova câmera'}`);
        }

        // Atualiza WebRTC se conectado
        this.atualizarWebRTC(newStream);

        // 🔄 REINICIA VIGILÂNCIA PARA A NOVA CÂMERA
        this.reiniciarMonitoramento();
    }

    // =============================================
    // 🔘 MÓDULO DE CONTROLE DO BOTÃO
    // =============================================

    configurarBotaoToggle(buttonId = 'toggleCamera') {
        this.botaoToggle = document.getElementById(buttonId);
        
        if (!this.botaoToggle) {
            console.log('❌ Botão de alternar câmera não encontrado:', buttonId);
            return false;
        }

        this.botaoToggle.addEventListener('click', () => this.handleToggleClick());
        console.log('✅ Botão de câmera configurado:', buttonId);
        return true;
    }

    async handleToggleClick() {
        if (this.isSwitching) {
            console.log('⏳ Troca de câmera já em andamento...');
            return;
        }

        this.isSwitching = true;
        this.botaoToggle.style.opacity = '0.5';
        this.botaoToggle.style.cursor = 'wait';

        try {
            console.log('🚀 Iniciando troca inteligente de câmera...');
            
            // 🛑 PARA STREAM ATUAL
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
                window.localStream = null;
            }

            // ⏳ AGUARDA LIBERAÇÃO
            await new Promise(resolve => setTimeout(resolve, 250));

            // 🔄 USA SISTEMA INTELIGENTE
            const newStream = await this.alternarCameraInteligente();
            await this.handleNewStream(newStream);
            
            console.log('✅ Câmera alternada com sucesso');

        } catch (error) {
            console.error('❌ Erro na alternância:', error);
            
            if (error.message.includes('Apenas uma câmera')) {
                this.botaoToggle.style.display = 'none';
            } else {
                await this.tryFallbackBasico();
            }
        } finally {
            this.isSwitching = false;
            this.botaoToggle.style.opacity = '1';
            this.botaoToggle.style.cursor = 'pointer';
        }
    }

    async alternarCameraInteligente() {
        try {
            const camerasOrdenadas = await this.obterCamerasOrdenadas();
            
            if (camerasOrdenadas.length <= 1) {
                throw new Error('Apenas uma câmera disponível');
            }
            
            const deviceIdAtual = window.localStream?.getVideoTracks()[0]?.getSettings()?.deviceId;
            const indexAtual = deviceIdAtual ? 
                camerasOrdenadas.findIndex(cam => cam.deviceId === deviceIdAtual) : -1;
            
            const proximaIndex = (indexAtual + 1) % camerasOrdenadas.length;
            const proximaCamera = camerasOrdenadas[proximaIndex];
            
            console.log(`🔄 [INTELIGENTE] Alternando para: ${proximaCamera.label || 'Camera ' + proximaIndex}`);
            
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    deviceId: { exact: proximaCamera.deviceId },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            
            return newStream;
            
        } catch (error) {
            console.error('❌ [INTELIGENTE] Falha:', error);
            throw error;
        }
    }

    async obterCamerasOrdenadas() {
        if (this.camerasCache && Date.now() - this.ultimaAtualizacao < this.cacheValidity) {
            return this.camerasCache;
        }
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        const camerasOrdenadas = await this.ordenarCamerasPorPrioridade(videoDevices);
        
        this.camerasCache = camerasOrdenadas;
        this.ultimaAtualizacao = Date.now();
        
        return camerasOrdenadas;
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
        } else if (label.includes('tele') || label.includes('zoom')) {
            pontuacao += 5;
        } else if (label.includes('macro')) {
            pontuacao += 2;
        }
        
        return pontuacao;
    }

    async ordenarCamerasPorPrioridade(cameras) {
        const camerasComInfo = [];
        
        for (const camera of cameras) {
            const pontuacao = this.calcularPontuacaoRapida(camera);
            camerasComInfo.push({ camera, pontuacao });
        }
        
        return camerasComInfo
            .sort((a, b) => b.pontuacao - a.pontuacao)
            .map(item => item.camera);
    }

    async tryFallbackBasico() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            if (videoDevices.length > 1) {
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });
                await this.handleNewStream(newStream);
            }
        } catch (fallbackError) {
            console.error('❌ Fallback também falhou:', fallbackError);
        }
    }

    // =============================================
    // 🔧 MÉTODOS DE CONTROLE (MANTIDOS)
    // =============================================

    // ✅ ESTA PARTE CONTINUA EXATAMENTE IGUAL (CRÍTICA)
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

// 🌐 EXPORTAÇÃO (MESMO NOME - NADA MUDA NOS IMPORTS)
export { CameraVigilante };

// 🎵 MESA DE MIXAGEM WEB AUDIO API
class AudioMixer {
    constructor() {
        this.audioContext = null;
        this.audioSource = null;
        this.gainNode = null;
        this.isPlaying = false;
        this.currentVolume = 0;
        
        this.initialize();
    }

    // 🎯 INICIALIZAR WEB AUDIO API
    initialize() {
        try {
            // Criar o contexto de áudio (nossa "mesa de som")
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Criar o nó de ganho (controle de volume)
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            
            console.log('✅ Web Audio API inicializada - Mesa de mixagem pronta!');
            this.setupEventListeners();
        } catch (error) {
            console.error('❌ Erro ao inicializar Web Audio API:', error);
        }
    }

    // 🎯 CONFIGURAR BOTÕES
    setupEventListeners() {
        document.getElementById('startAudio').addEventListener('click', () => this.startBackgroundAudio());
        document.getElementById('volumeUp').addEventListener('click', () => this.setVolume(0.8));
        document.getElementById('volumeDown').addEventListener('click', () => this.setVolume(0.1));
    }

    // 🎯 INICIAR ÁUDIO DE FUNDO
    async startBackgroundAudio() {
        if (this.isPlaying) {
            console.log('⚠️ Áudio já está tocando');
            return;
        }

        try {
            // Carregar o arquivo MP3
            const response = await fetch('assets/audio/keyboard2.mp3');
            const arrayBuffer = await response.arrayBuffer();
            
            // Decodificar o áudio
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            // Criar fonte de áudio
            this.audioSource = this.audioContext.createBufferSource();
            this.audioSource.buffer = audioBuffer;
            this.audioSource.loop = true; // Repetir continuamente
            
            // Conectar na cadeia de áudio:
            // Fonte → Controle de Volume → Saída
            this.audioSource.connect(this.gainNode);
            
            // Configurar volume inicial em 10%
            this.setVolume(0.1);
            
            // Iniciar reprodução
            this.audioSource.start();
            this.isPlaying = true;
            
            console.log('🎵 Áudio de fundo iniciado (10% volume)');
            
        } catch (error) {
            console.error('❌ Erro ao carregar áudio:', error);
        }
    }

    // 🎯 CONTROLAR VOLUME (como um fader de mesa de som)
    setVolume(volumeLevel) {
        if (!this.gainNode || !this.isPlaying) {
            console.log('⚠️ Inicie o áudio primeiro');
            return;
        }

        // Converter para porcentagem (0.1 = 10%, 0.8 = 80%)
        this.currentVolume = volumeLevel;
        
        // 🎛️ Aqui está a MAGIA do Web Audio API!
        // gainNode.gain controla o volume como um fader físico
        this.gainNode.gain.setValueAtTime(volumeLevel, this.audioContext.currentTime);
        
        this.updateVolumeDisplay();
        console.log(`🎚️ Volume ajustado para: ${Math.round(volumeLevel * 100)}%`);
    }

    // 🎯 ATUALIZAR DISPLAY DE VOLUME
    updateVolumeDisplay() {
        const display = document.getElementById('volumeDisplay');
        if (display) {
            display.textContent = `Volume: ${Math.round(this.currentVolume * 100)}%`;
            
            // Mudar cor baseada no volume
            if (this.currentVolume >= 0.8) {
                display.style.color = '#00FF00'; // Verde (alto)
            } else if (this.currentVolume >= 0.4) {
                display.style.color = '#FFFF00'; // Amarelo (médio)
            } else {
                display.style.color = '#FFFFFF'; // Branco (baixo)
            }
        }
    }

    // 🎯 PARAR ÁUDIO
    stopAudio() {
        if (this.audioSource && this.isPlaying) {
            this.audioSource.stop();
            this.isPlaying = false;
            this.currentVolume = 0;
            this.updateVolumeDisplay();
            console.log('⏹️ Áudio parado');
        }
    }
}

// 🎯 INICIALIZAR MESA DE MIXAGEM QUANDO A PÁGINA CARREGAR
let audioMixer;

document.addEventListener('DOMContentLoaded', function() {
    audioMixer = new AudioMixer();
    console.log('🎛️ Mesa de Mixagem Web Audio API Carregada!');
    
    // Explicação no console para estudos
    console.log(`
    🎵 WEB AUDIO API - MESA DE MIXAGEM
    ==================================
    🔊 AudioContext: Mesa de som digital
    🎛️ GainNode: Controle de volume (fader)
    🔄 BufferSource: Reprodutor de áudio
    📊 Conexões: Fonte → Volume → Saída
    
    Experimente os botões e veja o Web Audio API em ação!
    `);
});

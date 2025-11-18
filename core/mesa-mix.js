// core/mesa-mix.js - MESA QUE SE ADAPTA AO SEU TTS
class MesaMix {
    constructor() {
        this.audioContext = null;
        this.gainNode = null;
        this.source = null;
        this.audioPronto = false;
        this.ttsOriginal = null;
        
        // 🎵 OBSERVAR O TTS ORIGINAL
        this.observarTTS();
    }

    // 🔍 OBSERVAR O TTS ORIGINAL SEM MODIFICÁ-LO
    observarTTS() {
        // Aguarda o TTS original carregar e então conecta-se a ele
        const observer = setInterval(() => {
            if (window.ttsHibrido && !this.ttsOriginal) {
                this.ttsOriginal = window.ttsHibrido;
                this.conectarAoTTS();
                clearInterval(observer);
                console.log('✅ Mesa conectada ao TTS original');
            }
        }, 100);
    }

    // 🔗 CONECTAR-SE AO TTS ORIGINAL
    conectarAoTTS() {
        // Salva os métodos originais
        const originalIniciar = this.ttsOriginal.iniciarSomDigitacao;
        const originalParar = this.ttsOriginal.pararSomDigitacao;

        // 🎵 SOBREPÕE OS MÉTODOS APENAS SE MESA ESTIVER ATIVA
        this.ttsOriginal.iniciarSomDigitacao = () => {
            if (this.audioPronto) {
                this.somProcessando(); // 80%
            } else {
                originalIniciar.call(this.ttsOriginal); // Método original
            }
        };

        this.ttsOriginal.pararSomDigitacao = () => {
            if (this.audioPronto) {
                this.somFalando(); // 10%
            } else {
                originalParar.call(this.ttsOriginal); // Método original
            }
        };
    }

    async iniciarAudio() {
        try {
            this.audioContext = new AudioContext();
            
            const resposta = await fetch('assets/audio/keyboard.mp3');
            const buffer = await resposta.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(buffer);
            
            this.source = this.audioContext.createBufferSource();
            this.source.buffer = audioBuffer;
            this.source.loop = true;
            
            this.gainNode = this.audioContext.createGain();
            
            this.source.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);
            
            this.source.start();
            this.gainNode.gain.value = 0.1; // 10%
            
            this.audioPronto = true;
            console.log('✅ Mesa de som ativada (10%) - TTS será controlado automaticamente');
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao iniciar áudio:', error);
            return false;
        }
    }

    somProcessando() {
        if (this.gainNode && this.audioPronto) {
            this.gainNode.gain.value = 0.8; // 80%
            console.log('🔊 TTS processando: Volume 80%');
        }
    }

    somFalando() {
        if (this.gainNode && this.audioPronto) {
            this.gainNode.gain.value = 0.1; // 10%
            console.log('🔉 TTS falando: Volume 10%');
        }
    }
}

const mesaMix = new MesaMix();

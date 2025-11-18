// core/mesa-mix.js - MESA QUE FUNCIONA COM TTS ORIGINAL
class MesaMix {
    constructor() {
        this.audioContext = null;
        this.gainNode = null;
        this.source = null;
        this.audioPronto = false;
        
        console.log('🎵 Mesa de som carregada - Aguardando ativação');
    }

    async iniciarAudio() {
        try {
            // 1. Criar contexto de áudio
            this.audioContext = new AudioContext();
            
            // 2. Carregar o MP3 (mesmo arquivo do TTS)
            const resposta = await fetch('assets/audio/keyboard.mp3');
            const buffer = await resposta.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(buffer);
            
            // 3. Configurar fonte e controle de volume
            this.source = this.audioContext.createBufferSource();
            this.source.buffer = audioBuffer;
            this.source.loop = true;
            
            this.gainNode = this.audioContext.createGain();
            
            // 4. Conectar a cadeia de áudio
            this.source.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);
            
            // 5. Iniciar com volume 10%
            this.source.start();
            this.gainNode.gain.value = 0.1; // 10%
            
            this.audioPronto = true;
            
            console.log('✅ Som ambiente ativado (10%) - Pronto para controle automático');
            
            // 6. Conectar ao TTS original
            this.conectarAoTTS();
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao iniciar áudio:', error);
            return false;
        }
    }

    // 🔗 CONECTAR AO TTS ORIGINAL
    conectarAoTTS() {
        // Aguarda o TTS estar disponível
        const esperarTTS = setInterval(() => {
            if (window.ttsHibrido) {
                clearInterval(esperarTTS);
                this.configurarInterceptacao();
            }
        }, 100);
    }

    // ⚡ CONFIGURAR INTERCEPTAÇÃO DOS MÉTODOS DO TTS
    configurarInterceptacao() {
        const tts = window.ttsHibrido;
        
        // Salvar métodos originais
        const originalIniciar = tts.iniciarSomDigitacao;
        const originalParar = tts.pararSomDigitacao;
        
        // 🎵 SOBREPOR iniciarSomDigitacao
        tts.iniciarSomDigitacao = () => {
            console.log('🔊 TTS está processando...');
            if (this.audioPronto) {
                this.aumentarVolume(); // 80% - processando
            } else {
                // Fallback para método original se mesa não estiver pronta
                originalIniciar.call(tts);
            }
        };
        
        // 🎵 SOBREPOR pararSomDigitacao  
        tts.pararSomDigitacao = () => {
            console.log('🔉 TTS vai falar...');
            if (this.audioPronto) {
                this.diminuirVolume(); // 10% - falando
            } else {
                // Fallback para método original se mesa não estiver pronta
                originalParar.call(tts);
            }
        };
        
        console.log('✅ Mesa conectada ao TTS original - Controle automático ativo');
    }

    // 🔊 AUMENTAR VOLUME PARA 80% (TTS PROCESSANDO)
    aumentarVolume() {
        if (this.gainNode && this.audioPronto) {
            this.gainNode.gain.value = 0.8; // 80%
            console.log('🔊 Volume aumentado para 80% - TTS processando');
        }
    }

    // 🔉 DIMINUIR VOLUME PARA 10% (TTS FALANDO)
    diminuirVolume() {
        if (this.gainNode && this.audioPronto) {
            this.gainNode.gain.value = 0.1; // 10%
            console.log('🔉 Volume diminuído para 10% - TTS falando');
        }
    }
}

// 🎵 CRIAR INSTÂNCIA GLOBAL
const mesaMix = new MesaMix();

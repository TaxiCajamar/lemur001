// core/mesa-mix.js - Controle Simples de Áudio
class MesaMix {
    constructor() {
        this.audioContext = null;
        this.gainNode = null;
        this.source = null;
        this.audioPronto = false;
    }

    // 🎵 INICIAR ÁUDIO (usuário clica aqui)
    async iniciarAudio() {
        try {
            // 1. Criar contexto de áudio
            this.audioContext = new AudioContext();
            
            // 2. Carregar MP3
            const resposta = await fetch('assets/audio/keyboard.mp3');
            const buffer = await resposta.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(buffer);
            
            // 3. Criar fonte
            this.source = this.audioContext.createBufferSource();
            this.source.buffer = audioBuffer;
            this.source.loop = true;
            
            // 4. Criar controle de volume
            this.gainNode = this.audioContext.createGain();
            
            // 5. Conectar tudo
            this.source.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);
            
            // 6. Iniciar com 10%
            this.source.start();
            this.gainNode.gain.value = 0.1; // 10%
            
            this.audioPronto = true;
            console.log('✅ Áudio iniciado em 10%');
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao iniciar áudio:', error);
            return false;
        }
    }

    // 🔊 AUMENTAR PARA 80% (TTS usa automaticamente)
    aumentarVolume() {
        if (this.gainNode && this.audioPronto) {
            this.gainNode.gain.value = 0.8; // 80%
            console.log('🔊 Volume aumentado para 80%');
        }
    }

    // 🔉 VOLTAR PARA 10% (TTS usa automaticamente)
    diminuirVolume() {
        if (this.gainNode && this.audioPronto) {
            this.gainNode.gain.value = 0.1; // 10%
            console.log('🔉 Volume diminuído para 10%');
        }
    }
}

// Criar instância global para usar em outros arquivos
const mesaMix = new MesaMix();

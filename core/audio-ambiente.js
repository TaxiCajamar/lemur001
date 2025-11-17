// 🎵 CONTROLE SIMPLES DE ÁUDIO AMBIENTE
class AudioAmbiente {
    constructor() {
        this.som = null;
        this.ativo = false;
        this.volumeBaixo = 0.2;   // 20% - ambiente
        this.volumeAlto = 0.8;    // 80% - quando texto chega
    }

    // 🟢 INICIAR SISTEMA (botão verde)
    async iniciar() {
        if (this.ativo) return;
        
        this.som = new Audio('assets/audio/keyboard.mp3');
        this.som.loop = true;
        this.som.volume = this.volumeBaixo;
        
        // Toca o som (pode ser bloqueado pelo navegador)
        this.som.play().catch(e => {
            console.log('🔇 Aguardando interação do usuário');
        });
        
        this.ativo = true;
        console.log('🌿 Áudio ambiente ativado');
    }

    // 📈 AUMENTAR VOLUME (liga - quando texto chega)
    ligar() {
        if (!this.ativo || !this.som) return;
        this.som.volume = this.volumeAlto;
        console.log('🔊 Volume aumentado');
    }

    // 📉 BAIXAR VOLUME (desliga - quando TTS começa)
    desligar() {
        if (!this.ativo || !this.som) return;
        this.som.volume = this.volumeBaixo;
        console.log('🔉 Volume normalizado');
    }
}

// Instância global
window.audioAmbiente = new AudioAmbiente();

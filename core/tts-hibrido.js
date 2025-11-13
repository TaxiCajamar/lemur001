// 🎤 SISTEMA HÍBRIDO TTS AVANÇADO - CENTRALIZADO
export class TTSHibrido {
    constructor() {
        this.primeiraFraseTTS = true;
        this.navegadorTTSPreparado = false;
        this.ultimoIdiomaTTS = 'pt-BR';
        this.somDigitacao = null;
        this.audioCarregado = false;
    }

    // 🎵 CONFIGURAÇÃO DO SOM DE DIGITAÇÃO
    async carregarSomDigitacao() {
        return new Promise((resolve) => {
            try {
                this.somDigitacao = new Audio('assets/audio/keyboard.mp3');
                this.somDigitacao.volume = 0.3;
                this.somDigitacao.preload = 'auto';
                
                this.somDigitacao.addEventListener('canplaythrough', () => {
                    console.log('🎵 Áudio de digitação carregado');
                    this.audioCarregado = true;
                    resolve(true);
                });
                
                this.somDigitacao.addEventListener('error', () => {
                    console.log('❌ Erro ao carregar áudio');
                    resolve(false);
                });
                
                this.somDigitacao.load();
                
            } catch (error) {
                console.log('❌ Erro no áudio:', error);
                resolve(false);
            }
        });
    }

    iniciarSomDigitacao() {
        if (!this.audioCarregado || !this.somDigitacao) return;
        
        this.pararSomDigitacao();
        
        try {
            this.somDigitacao.loop = true;
            this.somDigitacao.currentTime = 0;
            this.somDigitacao.play().catch(error => {
                console.log('🔇 Navegador bloqueou áudio automático');
            });
            
            console.log('🎵 Som de digitação iniciado');
        } catch (error) {
            console.log('❌ Erro ao tocar áudio:', error);
        }
    }

    pararSomDigitacao() {
        if (this.somDigitacao) {
            try {
                this.somDigitacao.pause();
                this.somDigitacao.currentTime = 0;
                this.somDigitacao.loop = false;
                console.log('🎵 Som de digitação parado');
            } catch (error) {
                console.log('❌ Erro ao parar áudio:', error);
            }
        }
    }

    // 🎤 FUNÇÃO TTS DO NAVEGADOR (GRÁTIS) - OTIMIZADA
    falarComNavegadorTTS(mensagem, elemento, imagemImpaciente, idioma) {
        return new Promise((resolve) => {
            try {
                // Para qualquer fala anterior
                window.speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(mensagem);
                utterance.lang = idioma;
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                utterance.volume = 0.9;
                
                // EVENTO: FALA COMEÇOU
                utterance.onstart = () => {
                    this.pararSomDigitacao();
                    
                    if (elemento) {
                        elemento.style.animation = 'none';
                        elemento.style.backgroundColor = '';
                        elemento.style.border = '';
                        elemento.textContent = mensagem;
                    }
                    if (imagemImpaciente) {
                        imagemImpaciente.style.display = 'none';
                    }
                    
                    console.log(`🔊 Áudio Navegador TTS iniciado em ${idioma}`);
                };
                
                // EVENTO: FALA TERMINOU
                utterance.onend = () => {
                    console.log('🔚 Áudio Navegador TTS terminado');
                    if (imagemImpaciente) {
                        imagemImpaciente.style.display = 'none';
                    }
                    resolve(true);
                };
                
                // EVENTO: ERRO NA FALA
                utterance.onerror = (error) => {
                    this.pararSomDigitacao();
                    console.log('❌ Erro no áudio Navegador TTS:', error);
                    if (elemento) {
                        elemento.style.animation = 'none';
                        elemento.style.backgroundColor = '';
                        elemento.style.border = '';
                    }
                    if (imagemImpaciente) {
                        imagemImpaciente.style.display = 'none';
                    }
                    resolve(false);
                };
                
                window.speechSynthesis.speak(utterance);
                
            } catch (error) {
                console.error('❌ Erro no Navegador TTS:', error);
                resolve(false);
            }
        });
    }

    // 🔄 PREPARAR NAVEGADOR TTS EM SEGUNDO PLANO
    prepararNavegadorTTS(idioma) {
        if (this.navegadorTTSPreparado) return;
        
        try {
            // Fala silenciosa para carregar o motor de voz
            const utterance = new SpeechSynthesisUtterance('');
            utterance.lang = idioma;
            utterance.volume = 0; // Silencioso
            utterance.onend = () => {
                this.navegadorTTSPreparado = true;
                console.log(`✅ Navegador TTS preparado para ${idioma}`);
            };
            window.speechSynthesis.speak(utterance);
        } catch (error) {
            console.log('⚠️ Não foi possível preparar navegador TTS:', error);
        }
    }

    // 🎤 FUNÇÃO GOOGLE TTS (PAGO) - ATUALIZADA
    async falarComGoogleTTS(mensagem, elemento, imagemImpaciente, idioma) {
        try {
            console.log(`🎤 Iniciando Google TTS para ${idioma}:`, mensagem.substring(0, 50) + '...');
            
            const resposta = await fetch('https://chat-tradutor.onrender.com/speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: mensagem,
                    languageCode: idioma,
                    gender: 'FEMALE'
                })
            });

            if (!resposta.ok) {
                throw new Error('Erro na API de voz');
            }

            const blob = await resposta.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            
            // EVENTO: ÁUDIO COMEÇOU
            audio.onplay = () => {
                this.pararSomDigitacao();
                
                if (elemento) {
                    elemento.style.animation = 'none';
                    elemento.style.backgroundColor = '';
                    elemento.style.border = '';
                    elemento.textContent = mensagem;
                }
                if (imagemImpaciente) {
                    imagemImpaciente.style.display = 'none';
                }
                
                console.log(`🔊 Áudio Google TTS iniciado em ${idioma}`);
            };
            
            // EVENTO: ÁUDIO TERMINOU
            audio.onended = () => {
                console.log('🔚 Áudio Google TTS terminado');
                if (imagemImpaciente) {
                    imagemImpaciente.style.display = 'none';
                }
            };
            
            // EVENTO: ERRO NO ÁUDIO
            audio.onerror = () => {
                this.pararSomDigitacao();
                console.log('❌ Erro no áudio Google TTS');
                if (elemento) {
                    elemento.style.animation = 'none';
                    elemento.style.backgroundColor = '';
                    elemento.style.border = '';
                }
                if (imagemImpaciente) {
                    imagemImpaciente.style.display = 'none';
                }
            };

            await audio.play();
            
        } catch (error) {
            console.error('❌ Erro no Google TTS:', error);
            throw error; // Repassa o erro para o fallback
        }
    }

    // 🎯 FUNÇÃO HÍBRIDA PRINCIPAL - SISTEMA AVANÇADO
    async falarTextoSistemaHibrido(mensagem, elemento, imagemImpaciente, idioma) {
        try {
            console.log(`🎯 TTS Híbrido: "${mensagem.substring(0, 50)}..." em ${idioma}`);
            
            // Atualiza último idioma usado
            this.ultimoIdiomaTTS = idioma;
            
            if (this.primeiraFraseTTS) {
                console.log('🚀 PRIMEIRA FRASE: Usando Google TTS (rápido)');
                
                // ✅ 1. PRIMEIRA FRASE: Google TTS (rápido)
                await this.falarComGoogleTTS(mensagem, elemento, imagemImpaciente, idioma);
                
                // ✅ 2. PREPARA NAVEGADOR EM SEGUNDO PLANO
                console.log(`🔄 Preparando navegador TTS para ${idioma}...`);
                this.prepararNavegadorTTS(idioma);
                
                this.primeiraFraseTTS = false;
                
            } else {
                console.log('💰 PRÓXIMAS FRASES: Usando Navegador TTS (grátis)');
                
                // ✅ 3. PRÓXIMAS FRASES: Navegador TTS (grátis)
                const sucesso = await this.falarComNavegadorTTS(mensagem, elemento, imagemImpaciente, idioma);
                
                // ✅ 4. FALLBACK: Se navegador falhar, volta para Google
                if (!sucesso) {
                    console.log('🔄 Fallback: Navegador falhou, usando Google TTS');
                    await this.falarComGoogleTTS(mensagem, elemento, imagemImpaciente, idioma);
                }
            }
            
            console.log('✅ TTS concluído com sucesso');
            
        } catch (error) {
            console.error('❌ Erro no sistema híbrido TTS:', error);
            
            // ✅ FALLBACK FINAL: Tenta navegador como última opção
            console.log('🔄 Tentando fallback final com navegador TTS...');
            await this.falarComNavegadorTTS(mensagem, elemento, imagemImpaciente, idioma);
        }
    }

    // 🔄 REINICIAR SISTEMA (para novas sessões)
    reiniciar() {
        this.primeiraFraseTTS = true;
        this.navegadorTTSPreparado = false;
        console.log('🔄 Sistema TTS híbrido reiniciado');
    }
}

// Instância global para uso fácil
export const ttsHibrido = new TTSHibrido();

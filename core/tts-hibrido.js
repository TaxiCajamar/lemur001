// 🎤 SISTEMA HÍBRIDO TTS AVANÇADO - CENTRALIZADO
class TTSHibrido {
    constructor() {
        this.primeiraFraseTTS = true;
        this.navegadorTTSPreparado = false;
        this.ultimoIdiomaTTS = 'pt-BR';
        // REMOVIDO: this.somDigitacao e this.audioCarregado
    }

    // 🎵 INICIAR SOM DE DIGITAÇÃO (AGORA CONTROLA MESA DE SOM)
    iniciarSomDigitacao() {
        if (window.mesaMix && window.mesaMix.audioPronto) {
            window.mesaMix.aumentarVolume(); // 80% - processando
            console.log('🎵 Som digitação: Volume 80% (processando)');
        }
    }

    // 🎵 PARAR SOM DE DIGITAÇÃO (AGORA CONTROLA MESA DE SOM)
    pararSomDigitacao() {
        if (window.mesaMix && window.mesaMix.audioPronto) {
            window.mesaMix.diminuirVolume(); // 10% - falando/concluído
            console.log('🎵 Som digitação: Volume 10% (falando)');
        }
    }

    // 🎤 FUNÇÃO TTS DO NAVEGADOR (GRÁTIS) - OTIMIZADA
    falarComNavegadorTTS(mensagem, elemento, imagemImpaciente, idioma) {
        return new Promise((resolve) => {
            try {
                window.speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(mensagem);
                utterance.lang = idioma;
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                utterance.volume = 0.9;
                
                // EVENTO: FALA COMEÇOU
                utterance.onstart = () => {
                    this.pararSomDigitacao(); // ✅ Muda para 10%
                    
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
            const utterance = new SpeechSynthesisUtterance('');
            utterance.lang = idioma;
            utterance.volume = 0;
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
            
            audio.onended = () => {
                console.log('🔚 Áudio Google TTS terminado');
                if (imagemImpaciente) {
                    imagemImpaciente.style.display = 'none';
                }
            };
            
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
            throw error;
        }
    }

    // 🎯 FUNÇÃO HÍBRIDA PRINCIPAL - SISTEMA AVANÇADO
    async falarTextoSistemaHibrido(mensagem, elemento, imagemImpaciente, idioma) {
        try {
            console.log(`🎯 TTS Híbrido: "${mensagem.substring(0, 50)}..." em ${idioma}`);
            
            // ✅ ANTES DE FALAR: Aumenta volume para 80% (processando)
            this.iniciarSomDigitacao();
            
            this.ultimoIdiomaTTS = idioma;
            
            if (this.primeiraFraseTTS) {
                console.log('🚀 PRIMEIRA FRASE: Usando Google TTS (rápido)');
                
                await this.falarComGoogleTTS(mensagem, elemento, imagemImpaciente, idioma);
                
                console.log(`🔄 Preparando navegador TTS para ${idioma}...`);
                this.prepararNavegadorTTS(idioma);
                
                this.primeiraFraseTTS = false;
                
            } else {
                console.log('💰 PRÓXIMAS FRASES: Usando Navegador TTS (grátis)');
                
                const sucesso = await this.falarComNavegadorTTS(mensagem, elemento, imagemImpaciente, idioma);
                
                if (!sucesso) {
                    console.log('🔄 Fallback: Navegador falhou, usando Google TTS');
                    await this.falarComGoogleTTS(mensagem, elemento, imagemImpaciente, idioma);
                }
            }
            
            console.log('✅ TTS concluído com sucesso');
            
        } catch (error) {
            console.error('❌ Erro no sistema híbrido TTS:', error);
            
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

// ✅ INSTÂNCIA GLOBAL (sem export)
const ttsHibrido = new TTSHibrido();

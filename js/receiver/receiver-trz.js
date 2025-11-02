// ===== TRADUTOR OTIMIZADO COM TECLADO NATIVO - RECEIVER =====

// ===== FUNÇÃO DE TRADUÇÃO ATUALIZADA =====
async function translateText(text) {
    try {
        const response = await fetch('https://chat-tradutor-7umw.onrender.com/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                text: text,
                sourceLang: window.meuIdiomaLocal,
                targetLang: window.meuIdiomaRemoto || 'en'
            })
        });

        const result = await response.json();
        const translatedText = result.translatedText || text;
        return translatedText;
        
    } catch (error) {
        console.error('❌ Erro na tradução:', error);
        return text;
    }
}

// ===== INICIALIZAÇÃO DO TRADUTOR COM TECLADO NATIVO =====
function initializeTranslator() {
    console.log('🎯 Iniciando tradutor receiver com teclado nativo...');

    // ===== VERIFICAÇÃO DE DEPENDÊNCIAS CRÍTICAS =====
    console.log('🔍 Verificando dependências do receiver-ui.js...');
    
    // ✅ VERIFICA SE RECEIVER-UI.JS JÁ CONFIGUROU TUDO
    if (!window.meuIdiomaLocal || !window.meuIdiomaRemoto) {
        console.log('⏳ Aguardando receiver-ui.js configurar idiomas...');
        setTimeout(initializeTranslator, 500);
        return;
    }
    
    // ✅ VERIFICA SE WEBRTC ESTÁ PRONTO
    if (!window.rtcCore) {
        console.log('⏳ Aguardando WebRTC inicializar...');
        setTimeout(initializeTranslator, 500);
        return;
    }

    // 🎯 CONFIGURAÇÃO DE IDIOMAS SINCRONIZADA
    const IDIOMA_DESTINO = window.meuIdiomaRemoto || 'en';
    const IDIOMA_FALA = window.meuIdiomaRemoto || 'en-US';
    
    console.log('🔤 Idiomas configurados:', { 
        destino: IDIOMA_DESTINO,
        fala: IDIOMA_FALA 
    });

    // 🎤 ELEMENTOS VISUAIS
    const recordButton = document.getElementById('recordButton');
    const speakerButton = document.getElementById('speakerButton');
    const textoRecebido = document.getElementById('texto-recebido');
    
    if (!recordButton || !textoRecebido) {
        console.log('⏳ Aguardando elementos do tradutor...');
        setTimeout(initializeTranslator, 300);
        return;
    }

    // 🔊 CONFIGURAÇÃO DE SÍNTESE DE VOZ (APENAS PARA FALAR)
    const SpeechSynthesis = window.speechSynthesis;
    
    if (!SpeechSynthesis && speakerButton) {
        console.log('❌ SpeechSynthesis não suportado');
        speakerButton.style.display = 'none';
    }

    // ⏱️ VARIÁVEIS DE ESTADO (APENAS AS NECESSÁRIAS)
    let isTranslating = false;
    let isSpeechPlaying = false;
    let lastTranslationTime = 0;

    // 🔊 SISTEMA DE VOZ PARA FALAR TEXTOS RECEBIDOS
    function speakText(text) {
        if (!SpeechSynthesis || !text) {
            console.log('❌ SpeechSynthesis não disponível ou texto vazio');
            return;
        }
        
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        utterance.lang = window.meuIdiomaRemoto || 'en-US';
        utterance.rate = 0.9;
        utterance.volume = 0.8;
        
        utterance.onstart = function() {
            isSpeechPlaying = true;
            if (speakerButton) speakerButton.textContent = '⏹';
            console.log('🔊 Iniciando fala do texto');
        };
        
        utterance.onend = function() {
            isSpeechPlaying = false;
            if (speakerButton) speakerButton.textContent = '🔊';
            console.log('🔊 Fala terminada');
        };
        
        utterance.onerror = function(event) {
            isSpeechPlaying = false;
            if (speakerButton) speakerButton.textContent = '🔊';
            console.error('❌ Erro na fala:', event.error);
        };
        
        window.speechSynthesis.speak(utterance);
    }

    function toggleSpeech() {
        if (!SpeechSynthesis) {
            console.log('❌ SpeechSynthesis não suportado');
            return;
        }
        
        if (isSpeechPlaying) {
            window.speechSynthesis.cancel();
            isSpeechPlaying = false;
            if (speakerButton) speakerButton.textContent = '🔊';
            console.log('⏹ Fala cancelada');
        } else {
            if (textoRecebido && textoRecebido.textContent) {
                const textToSpeak = textoRecebido.textContent.trim();
                if (textToSpeak !== "") {
                    console.log(`🔊 Falando texto: "${textToSpeak.substring(0, 50)}..."`);
                    speakText(textToSpeak);
                } else {
                    console.log('⚠️ Nenhum texto para falar');
                }
            } else {
                console.log('⚠️ Elemento texto-recebido não encontrado');
            }
        }
    }

    // ===== FUNÇÃO PARA ENVIAR TEXTO =====
    function enviarParaOutroCelular(texto) {
        if (window.rtcCore && window.rtcCore.dataChannel && 
            window.rtcCore.dataChannel.readyState === 'open') {
            window.rtcCore.dataChannel.send(texto);
            console.log('✅ Texto enviado via WebRTC Core:', texto);
            return true;
        } else {
            console.log('⏳ Canal WebRTC não disponível');
            setTimeout(() => enviarParaOutroCelular(texto), 1000);
            return false;
        }
    }

    // 🎮 EVENTOS DE BOTÃO - TECLADO NATIVO
    if (recordButton) {
        recordButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔵 Botão azul - Abrindo teclado nativo');
            
            // Cria/mostra o container do chat se não existir
            let chatContainer = document.getElementById('chatInputContainer');
            if (!chatContainer) {
                chatContainer = document.createElement('div');
                chatContainer.id = 'chatInputContainer';
                chatContainer.className = 'chat-input-container';
                chatContainer.innerHTML = `
                    <input type="text" id="textInput" placeholder="Digite ou fale..." x-webkit-speech />
                    <button id="sendMessageButton">📤</button>
                `;
                document.body.appendChild(chatContainer);
                
                // Adiciona evento de envio
                document.getElementById('sendMessageButton').addEventListener('click', function() {
                    const textInput = document.getElementById('textInput');
                    const texto = textInput.value.trim();
                    
                    if (texto) {
                        console.log('💬 Texto para tradução:', texto);
                        
                        // USA O SISTEMA DE TRADUÇÃO
                        if (typeof window.translateText === 'function') {
                            window.translateText(texto).then(traduzido => {
                                if (traduzido && traduzido.trim() !== "") {
                                    console.log(`🌐 Traduzido: "${texto}" → "${traduzido}"`);
                                    
                                    // ENVIA VIA WEBRTC
                                    if (window.rtcCore && window.rtcCore.dataChannel && 
                                        window.rtcCore.dataChannel.readyState === 'open') {
                                        window.rtcCore.dataChannel.send(traduzido);
                                        console.log('✅ Texto traduzido enviado via WebRTC');
                                    }
                                }
                            }).catch(error => {
                                console.error('❌ Erro na tradução:', error);
                            });
                        }
                        
                        // Limpa e esconde
                        textInput.value = '';
                        chatContainer.classList.remove('visible');
                        textInput.blur();
                    }
                });
                
                // Tecla Enter também envia
                document.getElementById('textInput').addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        document.getElementById('sendMessageButton').click();
                    }
                });
            }
            
            // Mostra e foca no input (abre teclado)
            chatContainer.classList.add('visible');
            setTimeout(() => {
                const textInput = document.getElementById('textInput');
                if (textInput) textInput.focus();
            }, 100);
        });
    }
    
    if (speakerButton) {
        speakerButton.addEventListener('click', function() {
            console.log('🔊 Botão speaker - alternando fala');
            toggleSpeech();
        });
    }

    // ✅ CONFIGURAÇÃO FINAL
    console.log(`🎯 Tradutor receiver com teclado nativo pronto: ${window.meuIdiomaLocal} → ${window.meuIdiomaRemoto}`);
    console.log('🔍 Estado final:', {
        recordButton: !!recordButton,
        speakerButton: !!speakerButton,
        textoRecebido: !!textoRecebido,
        rtcCore: !!window.rtcCore
    });
    
    recordButton.disabled = false;
}

// ✅ INICIALIZAÇÃO SEGURA
function startTranslatorSafely() {
    console.log('🚀 Iniciando tradutor receiver...');
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initializeTranslator, 1000);
        });
    } else {
        setTimeout(initializeTranslator, 1000);
    }
}

// Inicia o tradutor
startTranslatorSafely();

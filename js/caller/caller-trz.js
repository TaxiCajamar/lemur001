// ✅ SOLUÇÃO OTIMIZADA E SINCRONIZADA - COM TECLADO NATIVO
function initializeTranslator() {
    // ===== VERIFICAÇÃO DE DEPENDÊNCIAS CRÍTICAS =====
    console.log('🔍 Verificando dependências do caller-ui.js...');
    
    // ✅ VERIFICA SE CALLER-UI.JS JÁ CONFIGUROU TUDO
    if (!window.meuIdiomaLocal || !window.meuIdiomaRemoto) {
        console.log('⏳ Aguardando caller-ui.js configurar idiomas...', {
            meuIdiomaLocal: window.meuIdiomaLocal,
            meuIdiomaRemoto: window.meuIdiomaRemoto
        });
        setTimeout(initializeTranslator, 500);
        return;
    }
    
    // ✅ VERIFICA SE WEBRTC ESTÁ PRONTO
    if (!window.rtcCore) {
        console.log('⏳ Aguardando WebRTC inicializar...');
        setTimeout(initializeTranslator, 500);
        return;
    }
    
    // ===== CONFIGURAÇÃO SIMPLIFICADA =====
    let IDIOMA_ORIGEM = window.meuIdiomaLocal || 'pt-BR';
    let IDIOMA_DESTINO = window.meuIdiomaRemoto || 'en';
    let IDIOMA_FALA = window.meuIdiomaRemoto || 'en-US';
    
    console.log(`🎯 Tradutor sincronizado: ${IDIOMA_ORIGEM} → ${IDIOMA_DESTINO}`);
    console.log('✅ Todas as dependências carregadas!');
    
    // ===== ELEMENTOS DOM =====
    const recordButton = document.getElementById('recordButton');
    const speakerButton = document.getElementById('speakerButton');
    const textoRecebido = document.getElementById('texto-recebido');
    
    // ⭐ VERIFICA SE ELEMENTOS CRÍTICOS EXISTEM
    if (!recordButton || !textoRecebido) {
        console.log('Aguardando elementos do DOM...');
        setTimeout(initializeTranslator, 300);
        return;
    }
    
    // ===== FUNÇÃO MELHORADA PARA ENVIAR TEXTO =====
    function enviarParaOutroCelular(texto) {
        // ✅ USA O CANAL DO WEBRTCCORE CORRETAMENTE
        if (window.rtcCore && window.rtcCore.dataChannel && 
            window.rtcCore.dataChannel.readyState === 'open') {
            window.rtcCore.dataChannel.send(texto);
            console.log('✅ Texto enviado via WebRTC Core:', texto);
            return true;
        } else {
            console.log('⏳ Canal WebRTC não disponível. Estado:', 
                window.rtcCore ? window.rtcCore.dataChannel?.readyState : 'rtcCore não existe');
            setTimeout(() => enviarParaOutroCelular(texto), 1000);
            return false;
        }
    }

    // ===== VERIFICAÇÃO DE SUPORTE =====
    const SpeechSynthesis = window.speechSynthesis;
    
    if (!SpeechSynthesis && speakerButton) {
        console.log('❌ SpeechSynthesis não suportado');
        speakerButton.style.display = 'none';
    }
    
    // ===== VARIÁVEIS DE ESTADO =====
    let isTranslating = false;
    let isSpeechPlaying = false;
    let lastTranslationTime = 0;
    
    // ===== FUNÇÕES PRINCIPAIS =====

    // ✅ FUNÇÃO DE TRADUÇÃO SIMPLIFICADA (MANTIDA DO PRIMEIRO CÓDIGO)
    async function translateText(text) {
        try {
            const trimmedText = text.trim().slice(0, 500);
            if (!trimmedText) {
                console.log('⚠️ Texto vazio para traduzir');
                return "";
            }
            
            console.log(`🌐 Enviando para tradução: "${trimmedText.substring(0, 50)}..."`);
            
            const response = await fetch('https://chat-tradutor-7umw.onrender.com/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: trimmedText, 
                    targetLang: window.meuIdiomaRemoto // ✅ USA O GUARDADO
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (speakerButton) {
                speakerButton.disabled = false;
            }
            
            console.log(`✅ Tradução recebida: ${result.translatedText || "VAZIO"}`);
            return result.translatedText || "";
            
        } catch (error) {
            console.error('❌ Erro na tradução:', error);
            return "";
        }
    }
    
    function speakText(text) {
        if (!SpeechSynthesis || !text) {
            console.log('❌ SpeechSynthesis não disponível ou texto vazio');
            return;
        }
        
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        // ✅ SEMPRE USA O IDIOMA REMOTO CORRETO
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
            // ✅ CORREÇÃO: Lê apenas o texto recebido
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

    // ===== SISTEMA DE TECLADO NATIVO (SUBSTITUIÇÃO DO MICROFONE) =====
    if (recordButton) {
        let typingTimer; // ⏰ Timer para detectar parada
        
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
                    <input type="text" id="textInput" placeholder="Digite sua mensagem..." />
                    <button id="sendMessageButton">📤</button>
                `;
                document.body.appendChild(chatContainer);
                
                // ✅ BOTÃO MANUAL DE ENVIO
                document.getElementById('sendMessageButton').addEventListener('click', enviarMensagem);
                
                // ✅ TECLA ENTER
                document.getElementById('textInput').addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') enviarMensagem();
                });

                // ✅ DETECTOR DE PARADA DE DIGITAÇÃO (2 SEGUNDOS)
                document.getElementById('textInput').addEventListener('input', function() {
                    clearTimeout(typingTimer);
                    typingTimer = setTimeout(() => {
                        const texto = this.value.trim();
                        if (texto) {
                            console.log('⏰ Usuário parou de digitar - enviando...');
                            enviarMensagem();
                        }
                    }, 2000);
                });
            }
            
            // ✅ FUNÇÃO DE ENVIO (USADA PELO BOTÃO, ENTER E TIMER)
            function enviarMensagem() {
                const textInput = document.getElementById('textInput');
                const texto = textInput.value.trim();
                
                if (texto && !isTranslating) {
                    console.log('💬 Texto para tradução:', texto);
                    
                    isTranslating = true;
                    const now = Date.now();
                    if (now - lastTranslationTime > 1000) {
                        lastTranslationTime = now;
                        
                        translateText(texto).then(translation => {
                            if (translation && translation.trim() !== "") {
                                console.log(`🌐 Traduzido: "${texto}" → "${translation}"`);
                                enviarParaOutroCelular(translation);
                            } else {
                                console.log('❌ Tradução vazia ou falhou');
                            }
                            isTranslating = false;
                        }).catch(error => {
                            console.error('Erro na tradução:', error);
                            isTranslating = false;
                        });
                    } else {
                        isTranslating = false;
                    }
                }
                
                // ✅ CANCELA TIMER E FECHA TUDO
                clearTimeout(typingTimer);
                textInput.value = '';
                chatContainer.classList.remove('visible');
                textInput.blur();
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
    
    // ✅ CONFIGURAÇÃO INICIAL SIMPLIFICADA
    console.log(`🎯 Tradutor completamente inicializado: ${window.meuIdiomaLocal} → ${window.meuIdiomaRemoto}`);
    console.log('🔍 Estado final:', {
        recordButton: !!recordButton,
        speakerButton: !!speakerButton,
        textoRecebido: !!textoRecebido,
        rtcCore: !!window.rtcCore,
        dataChannel: window.rtcCore ? window.rtcCore.dataChannel?.readyState : 'não disponível'
    });
    
    recordButton.disabled = false;
}

// ✅ INICIALIZAÇÃO ROBUSTA COM VERIFICAÇÃO (MANTIDA)
function startTranslatorSafely() {
    console.log('🚀 Iniciando tradutor com verificação de segurança...');
    
    // Verifica se o DOM está pronto
    if (document.readyState === 'loading') {
        console.log('⏳ DOM ainda carregando...');
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initializeTranslator, 1000);
        });
    } else {
        console.log('✅ DOM já carregado, iniciando tradutor...');
        setTimeout(initializeTranslator, 1000);
    }
}

// Inicia o tradutor de forma segura
startTranslatorSafely();

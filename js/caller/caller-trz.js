// ===== TRADUTOR COM TECLADO NATIVO - CALLER =====

// ===== FUNÇÃO DE TRADUÇÃO =====
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
        return result.translatedText || text;
        
    } catch (error) {
        console.error('❌ Erro na tradução:', error);
        return text;
    }
}

// ===== INICIALIZAÇÃO DO TRADUTOR COM TECLADO NATIVO =====
function initializeTranslator() {
    console.log('🎯 Iniciando tradutor caller com teclado nativo...');

    // ===== VERIFICAÇÃO DE DEPENDÊNCIAS =====
    if (!window.meuIdiomaLocal || !window.meuIdiomaRemoto) {
        setTimeout(initializeTranslator, 500);
        return;
    }
    
    if (!window.rtcCore) {
        setTimeout(initializeTranslator, 500);
        return;
    }

    // 🎤 ELEMENTOS VISUAIS
    const recordButton = document.getElementById('recordButton');
    const speakerButton = document.getElementById('speakerButton');
    const textoRecebido = document.getElementById('texto-recebido');
    
    if (!recordButton || !textoRecebido) {
        setTimeout(initializeTranslator, 300);
        return;
    }

    // 🔊 CONFIGURAÇÃO DE SÍNTESE DE VOZ
    const SpeechSynthesis = window.speechSynthesis;
    
    if (!SpeechSynthesis && speakerButton) {
        speakerButton.style.display = 'none';
    }

    // ⏱️ VARIÁVEIS DE ESTADO
    let isSpeechPlaying = false;

    // 🔊 SISTEMA DE VOZ PARA FALAR TEXTOS RECEBIDOS
    function speakText(text) {
        if (!SpeechSynthesis || !text) return;
        
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = window.meuIdiomaRemoto || 'en-US';
        utterance.rate = 0.9;
        utterance.volume = 0.8;
        
        utterance.onstart = function() {
            isSpeechPlaying = true;
            if (speakerButton) speakerButton.textContent = '⏹';
        };
        
        utterance.onend = function() {
            isSpeechPlaying = false;
            if (speakerButton) speakerButton.textContent = '🔊';
        };
        
        window.speechSynthesis.speak(utterance);
    }

    function toggleSpeech() {
        if (!SpeechSynthesis) return;
        
        if (isSpeechPlaying) {
            window.speechSynthesis.cancel();
            isSpeechPlaying = false;
            if (speakerButton) speakerButton.textContent = '🔊';
        } else {
            if (textoRecebido && textoRecebido.textContent.trim() !== "") {
                speakText(textoRecebido.textContent.trim());
            }
        }
    }

    // ===== FUNÇÃO PARA ENVIAR TEXTO =====
    function enviarParaOutroCelular(texto) {
        if (window.rtcCore && window.rtcCore.dataChannel && 
            window.rtcCore.dataChannel.readyState === 'open') {
            window.rtcCore.dataChannel.send(texto);
            console.log('✅ Texto enviado via WebRTC:', texto);
            return true;
        } else {
            setTimeout(() => enviarParaOutroCelular(texto), 1000);
            return false;
        }
    }

    // 🎮 EVENTOS DE BOTÃO - TECLADO NATIVO COM DETECTOR DE DIGITAÇÃO
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
                    <input type="text" id="textInput" placeholder="Digite ou fale..." x-webkit-speech />
                    <button id="sendMessageButton">📤</button>
                `;
                document.body.appendChild(chatContainer);
                
                // ✅ BOTÃO MANUAL DE ENVIO
                document.getElementById('sendMessageButton').addEventListener('click', enviarMensagem);
                
                // ✅ TECLA ENTER
                document.getElementById('textInput').addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') enviarMensagem();
                });

                // ✅ DETECTOR DE PARADA DE DIGITAÇÃO (7 SEGUNDOS)
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
                
                if (texto) {
                    console.log('💬 Texto para tradução:', texto);
                    
                    translateText(texto).then(traduzido => {
                        if (traduzido && traduzido.trim() !== "") {
                            console.log(`🌐 Traduzido: "${texto}" → "${traduzido}"`);
                            enviarParaOutroCelular(traduzido);
                        }
                    });
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

    // ✅ CONFIGURAÇÃO FINAL
    console.log(`🎯 Tradutor caller com teclado nativo pronto!`);
    recordButton.disabled = false;
}

// ✅ INICIALIZAÇÃO
function startTranslatorSafely() {
    console.log('🚀 Iniciando tradutor caller...');
    
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

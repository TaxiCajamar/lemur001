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

                // ✅ DETECTOR DE PARADA DE DIGITAÇÃO (2 SEGUNDOS)
                document.getElementById('textInput').addEventListener('input', function() {
                    clearTimeout(typingTimer); // Cancela timer anterior
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

// 🎯 CONTROLE DO TOGGLE DAS INSTRUÇÕES
function setupInstructionToggle() {
    const instructionBox = document.getElementById('instructionBox');
    const toggleButton = document.getElementById('instructionToggle');
    
    if (!instructionBox || !toggleButton) return;
    
    // Estado inicial: expandido
    let isExpanded = true;
    
    toggleButton.addEventListener('click', function(e) {
        e.stopPropagation(); // Impede que o clique propague para o box
        
        isExpanded = !isExpanded;
        
        if (isExpanded) {
            instructionBox.classList.remove('recolhido');
            instructionBox.classList.add('expandido');
            console.log('📖 Instruções expandidas');
        } else {
            instructionBox.classList.remove('expandido');
            instructionBox.classList.add('recolhido');
            console.log('📖 Instruções recolhidas');
        }
    });
    
    // Opcional: fechar ao clicar fora (se quiser)
    document.addEventListener('click', function(e) {
        if (!instructionBox.contains(e.target) && isExpanded) {
            instructionBox.classList.remove('expandido');
            instructionBox.classList.add('recolhido');
            isExpanded = false;
            console.log('📖 Instruções fechadas (clique fora)');
        }
    });
}

// Inicializa o toggle quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    setupInstructionToggle();
});

import { WebRTCCore } from '../../core/webrtc-core.js';
import { QRCodeGenerator } from '../qrcode/qr-code-utils.js';
import { CameraVigilante } from '../../core/camera-vigilante.js';

// 🎵 VARIÁVEIS DE ÁUDIO
let audioContext = null;
let somDigitacao = null;
let audioCarregado = false;
let permissaoConcedida = false;
window.lastCallerId = null;

// 🎵 CARREGAR SOM DE DIGITAÇÃO
function carregarSomDigitacao() {
    return new Promise((resolve) => {
        try {
            somDigitacao = new Audio('assets/audio/keyboard.mp3');
            somDigitacao.volume = 0.3;
            somDigitacao.preload = 'auto';
            
            somDigitacao.addEventListener('canplaythrough', () => {
                console.log('🎵 Áudio de digitação carregado');
                audioCarregado = true;
                resolve(true);
            });
            
            somDigitacao.addEventListener('error', () => {
                console.log('❌ Erro ao carregar áudio');
                resolve(false);
            });
            
            somDigitacao.load();
            
        } catch (error) {
            console.log('❌ Erro no áudio:', error);
            resolve(false);
        }
    });
}

// 🎵 INICIAR LOOP DE DIGITAÇÃO
function iniciarSomDigitacao() {
    if (!audioCarregado || !somDigitacao) return;
    
    pararSomDigitacao();
    
    try {
        somDigitacao.loop = true;
        somDigitacao.currentTime = 0;
        somDigitacao.play().catch(error => {
            console.log('🔇 Navegador bloqueou áudio automático');
        });
        
        console.log('🎵 Som de digitação iniciado');
    } catch (error) {
        console.log('❌ Erro ao tocar áudio:', error);
    }
}

// 🎵 PARAR SOM DE DIGITAÇÃO
function pararSomDigitacao() {
    if (somDigitacao) {
        try {
            somDigitacao.pause();
            somDigitacao.currentTime = 0;
            somDigitacao.loop = false;
            console.log('🎵 Som de digitação parado');
        } catch (error) {
            console.log('❌ Erro ao parar áudio:', error);
        }
    }
}

// 🎵 INICIAR ÁUDIO APÓS INTERAÇÃO DO USUÁRIO
function iniciarAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    gainNode.gain.value = 0.001;
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
    
    console.log('🎵 Áudio desbloqueado!');
}

// 🎤 SOLICITAR TODAS AS PERMISSÕES DE UMA VEZ
async function solicitarTodasPermissoes() {
    try {
        console.log('🎯 Solicitando todas as permissões...');
        
        // ✅ Solicita apenas VÍDEO (sem áudio)
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false  // ÁUDIO DESATIVADO
        });
        
        console.log('✅ Permissões de VÍDEO concedidas!');
        
        stream.getTracks().forEach(track => track.stop());
        
        permissaoConcedida = true;
        window.permissoesConcedidas = true;
        window.audioContext = audioContext;
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro nas permissões:', error);
        permissaoConcedida = false;
        window.permissoesConcedidas = false;
        throw error;
    }
}

// 🎯 FUNÇÃO PARA OBTER IDIOMA COMPLETO
async function obterIdiomaCompleto(lang) {
    if (!lang) return 'pt-BR';
    if (lang.includes('-')) return lang;

    try {
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();
        const codigoCompleto = Object.keys(flags).find(key => key.startsWith(lang + '-'));
        return codigoCompleto || `${lang}-${lang.toUpperCase()}`;
    } catch (error) {
        console.error('Erro ao carregar JSON de bandeiras:', error);
        const fallback = {
            'pt': 'pt-BR', 'es': 'es-ES', 'en': 'en-US',
            'fr': 'fr-FR', 'de': 'de-DE', 'it': 'it-IT',
            'ja': 'ja-JP', 'zh': 'zh-CN', 'ru': 'ru-RU'
        };
        return fallback[lang] || 'en-US';
    }
}

// 🌐 Tradução apenas para texto
async function translateText(text, targetLang) {
    try {
        const response = await fetch('https://chat-tradutor.onrender.com/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, targetLang })
        });

        const result = await response.json();
        return result.translatedText || text;
    } catch (error) {
        console.error('Erro na tradução:', error);
        return text;
    }
}

// 🏳️ Aplica bandeira do idioma local
async function aplicarBandeiraLocal(langCode) {
    try {
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();

        const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';

        // ✅ Guardar o idioma original
        window.meuIdiomaLocal = langCode;
        console.log('💾 Idioma local guardado:', window.meuIdiomaLocal);

        // ✅ MESMA BANDEIRA NAS DUAS POSIÇÕES
        const languageFlagElement = document.querySelector('.language-flag');
        if (languageFlagElement) languageFlagElement.textContent = bandeira;

        const localLangDisplay = document.querySelector('.local-Lang');
        if (localLangDisplay) localLangDisplay.textContent = bandeira;

        console.log('🏳️ Bandeira local aplicada:', bandeira, 'em duas posições');

    } catch (error) {
        console.error('Erro ao carregar bandeira local:', error);
    }
}

// 🏳️ Aplica bandeira do idioma remota
async function aplicarBandeiraRemota(langCode) {
    try {
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();

        const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';

        // ✅ Guardar o idioma REMOTO também!
        window.meuIdiomaRemoto = langCode;
        console.log('💾 Idioma REMOTO guardado:', window.meuIdiomaRemoto);

        const remoteLangElement = document.querySelector('.remoter-Lang');
        if (remoteLangElement) remoteLangElement.textContent = bandeira;

    } catch (error) {
        console.error('Erro ao carregar bandeira remota:', error);
        const remoteLangElement = document.querySelector('.remoter-Lang');
        if (remoteLangElement) remoteLangElement.textContent = '🔴';
    }
}

// ✅ FUNÇÃO PARA LIBERAR INTERFACE (FALLBACK)
function liberarInterfaceFallback() {
    console.log('🔓 Usando fallback para liberar interface...');
    
    // Remove tela de loading
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
        console.log('✅ Tela de loading removida');
    }
    
    // Mostra conteúdo principal
    const elementosEscondidos = document.querySelectorAll('.hidden-until-ready');
    elementosEscondidos.forEach(elemento => {
        elemento.style.display = '';
    });
    
    console.log(`✅ ${elementosEscondidos.length} elementos liberados`);
}

// 🌐 TRADUÇÃO DAS FRASES FIXAS
async function traduzirFrasesFixas() {
    try {
        // ✅ USA O IDIOMA GUARDADO!
        const idiomaExato = window.meuIdiomaLocal || 'pt-BR';
        
        console.log(`🌐 Traduzindo frases fixas para: ${idiomaExato}`);

        const frasesParaTraduzir = {
            "qr-modal-title": "This is your online key",
            "qr-modal-description": "You can ask to scan, share or print on your business card.",
            "translator-label": "Real-time translation.",
            "translator-label-2": "Real-time translation.",
            "welcome-text": "Welcome! Let's begin.",
            "tap-qr": "Tap the QR code to start.",
            "quick-scan": "Ask to scan the QR.",
            "wait-connection": "Waiting for connection.",
            "both-connected": "Both online.",
            "drop-voice": "Speak clearly.",
            "check-replies": "Read the message.",
            "flip-cam": "Flip the camera. Share!"
        };

        for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
            const el = document.getElementById(id);
            if (el) {
                const traduzido = await translateText(texto, idiomaExato);
                el.textContent = traduzido;
                console.log(`✅ Traduzido: ${texto} → ${traduzido}`);
            }
        }

        console.log('✅ Frases fixas traduzidas com sucesso');

    } catch (error) {
        console.error("❌ Erro ao traduzir frases fixas:", error);
    }
}

// 🎥 FUNÇÃO PARA ALTERNAR ENTRE CÂMERAS
function setupCameraToggle() {
    const toggleButton = document.getElementById('toggleCamera');
    let currentCamera = 'user'; // 'user' = frontal, 'environment' = traseira
    let isSwitching = false; // Evita múltiplos cliques

    if (!toggleButton) {
        console.log('❌ Botão de alternar câmera não encontrado');
        return;
    }

    toggleButton.addEventListener('click', async () => {
        // ✅ PARAR VIGILANTE DURANTE TROCA
        if (window.cameraVigilante) {
            window.cameraVigilante.pararMonitoramento();
        }

        // Evita múltiplos cliques durante a troca
        if (isSwitching) {
            console.log('⏳ Troca de câmera já em andamento...');
            return;
        }

        isSwitching = true;
        toggleButton.style.opacity = '0.5'; // Feedback visual
        toggleButton.style.cursor = 'wait';

        try {
            console.log('🔄 Iniciando troca de câmera...');
            
            // ✅ 1. PARA COMPLETAMENTE a stream atual
            if (window.localStream) {
                console.log('⏹️ Parando stream atual...');
                window.localStream.getTracks().forEach(track => {
                    track.stop(); // Para completamente cada track
                });
                window.localStream = null;
            }

            // ✅ 2. PEQUENA PAUSA para o navegador liberar a câmera
            await new Promise(resolve => setTimeout(resolve, 500));

            // ✅ 3. Alterna entre frontal e traseira
            currentCamera = currentCamera === 'user' ? 'environment' : 'user';
            console.log(`🎯 Solicitando câmera: ${currentCamera === 'user' ? 'Frontal' : 'Traseira'}`);
            
            // ✅ 4. TENTATIVA PRINCIPAL com facingMode
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        facingMode: currentCamera,
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false  // SEM ÁUDIO
                });

                await handleNewStream(newStream, currentCamera);
                
            } catch (facingModeError) {
                console.log('❌ facingMode falhou, tentando fallback...');
                await tryFallbackCameras(currentCamera);
            }

        } catch (error) {
            console.error('❌ Erro crítico ao alternar câmera:', error);
            alert('Não foi possível alternar a câmera. Tente novamente.');
        } finally {
            // ✅ SEMPRE restaura o botão
            isSwitching = false;
            toggleButton.style.opacity = '1';
            toggleButton.style.cursor = 'pointer';
            
            // ✅ REINICIAR VIGILANTE APÓS TROCA
            setTimeout(() => {
                if (window.cameraVigilante && window.localStream) {
                    window.cameraVigilante.reiniciarMonitoramento();
                    console.log('✅ Vigilante reiniciado com nova câmera no receiver');
                }
            }, 1500);
        }
    });

    console.log('✅ Botão de alternar câmera configurado com tratamento robusto');
}

// ✅ FUNÇÃO PARA LIDAR COM NOVA STREAM
async function handleNewStream(newStream, cameraType) {
    // Atualiza o vídeo local
    const localVideo = document.getElementById('localVideo');
    if (localVideo) {
        localVideo.srcObject = newStream;
    }

    // ✅ ATUALIZAÇÃO CRÍTICA: Atualiza stream global
    window.localStream = newStream;

    // ✅ ATUALIZAÇÃO CRÍTICA: WebRTC
    if (window.rtcCore && window.rtcCore.peer) {
        const connectionState = window.rtcCore.peer.connectionState;
        console.log(`📡 Estado da conexão WebRTC: ${connectionState}`);
        
        if (connectionState === 'connected') {
            console.log('🔄 Atualizando WebRTC com nova câmera...');
            
            try {
                // Atualiza o stream local no core
                window.rtcCore.localStream = newStream;
                
                // Usa replaceTrack para atualizar a transmissão
                const newVideoTrack = newStream.getVideoTracks()[0];
                const senders = window.rtcCore.peer.getSenders();
                
                let videoUpdated = false;
                for (const sender of senders) {
                    if (sender.track && sender.track.kind === 'video') {
                        await sender.replaceTrack(newVideoTrack);
                        videoUpdated = true;
                        console.log('✅ Sender de vídeo atualizado no WebRTC');
                    }
                }
                
                if (!videoUpdated) {
                    console.log('⚠️ Nenhum sender de vídeo encontrado');
                }
            } catch (webrtcError) {
                console.error('❌ Erro ao atualizar WebRTC:', webrtcError);
            }
        } else {
            console.log(`ℹ️ WebRTC não conectado (${connectionState}), apenas atualização local`);
        }
    }

    console.log(`✅ Câmera alterada para: ${cameraType === 'user' ? 'Frontal' : 'Traseira'}`);
}

// ✅ FALLBACK PARA DISPOSITIVOS MÚLTIPLOS
async function tryFallbackCameras(requestedCamera) {
    try {
        console.log('🔄 Buscando dispositivos de câmera...');
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        console.log(`📷 Câmeras encontradas: ${videoDevices.length}`);
        
        if (videoDevices.length > 1) {
            // ✅ Estratégia: Pega a próxima câmera disponível
            const currentDeviceId = window.localStream ? 
                window.localStream.getVideoTracks()[0]?.getSettings()?.deviceId : null;
            
            let newDeviceId;
            if (currentDeviceId && videoDevices.length > 1) {
                // Encontra a próxima câmera na lista
                const currentIndex = videoDevices.findIndex(device => device.deviceId === currentDeviceId);
                newDeviceId = videoDevices[(currentIndex + 1) % videoDevices.length].deviceId;
            } else {
                // Primeira vez ou não conseguiu identificar, pega a primeira disponível
                newDeviceId = videoDevices[0].deviceId;
            }
            
            console.log(`🎯 Tentando câmera com deviceId: ${newDeviceId.substring(0, 10)}...`);
            
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    deviceId: { exact: newDeviceId },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false  // SEM ÁUDIO
            });

            await handleNewStream(newStream, 'fallback');
            console.log('✅ Câmera alternada via fallback de dispositivos');
            
        } else {
            console.warn('⚠️ Apenas uma câmera disponível');
            alert('Apenas uma câmera foi detectada neste dispositivo.');
        }
    } catch (fallbackError) {
        console.error('❌ Fallback também falhou:', fallbackError);
        alert('Não foi possível acessar outra câmera. Verifique as permissões.');
    }
}

// ✅ FUNÇÃO PARA ESCONDER O BOTÃO CLICK QUANDO WEBRTC CONECTAR
function esconderClickQuandoConectar() {
    const elementoClick = document.getElementById('click');
    const remoteVideo = document.getElementById('remoteVideo');
    
    if (!elementoClick || !remoteVideo) return;
    
    // Observa mudanças no remoteVideo para detectar conexão
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'srcObject') {
                if (remoteVideo.srcObject) {
                    // WebRTC conectou - esconde o botão click DEFINITIVAMENTE
                    elementoClick.style.display = 'none';
                    elementoClick.classList.remove('piscar-suave');
                    console.log('🔗 WebRTC conectado - botão Click removido');
                    observer.disconnect(); // Para de observar
                }
            }
        });
    });
    
    // Começa a observar o remoteVideo
    observer.observe(remoteVideo, {
        attributes: true,
        attributeFilter: ['srcObject']
    });
    
    console.log('👀 Observando conexão WebRTC para esconder botão Click');
}

// ✅ FUNÇÃO AUXILIAR PARA UUID
function fakeRandomUUID(fixedValue) {
    return {
        substr: function(start, length) {
            return fixedValue.substr(start, length);
        }
    };
}

// 📞 FUNÇÃO: Criar tela de chamada visual COM IMAGEM DO LEMUR
function criarTelaChamando() {
    const lemurWaiting = document.getElementById('lemurWaiting');
    if (lemurWaiting) {
        lemurWaiting.style.display = 'block';
    }

    const telaChamada = document.createElement('div');
    telaChamada.id = 'tela-chamando';
    telaChamada.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(102, 126, 234, 0.3);
        z-index: 9997;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    `;

    telaChamada.innerHTML = `
        <div id="botao-cancelar" style="
            position: absolute;
            bottom: 60px;
            background: #ff4444;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: transform 0.2s;
            z-index: 9999;
        ">
            ✕
        </div>
    `;

    document.body.appendChild(telaChamada);

    document.getElementById('botao-cancelar').addEventListener('click', function() {
        if (lemurWaiting) {
            lemurWaiting.style.display = 'none';
        }
        telaChamada.remove();
        window.conexaoCancelada = true;
        console.log('❌ Chamada cancelada pelo usuário');
    });

    return telaChamada;
}

// 🔔 FUNÇÃO: Notificação SIMPLES para acordar receiver
async function enviarNotificacaoWakeUp(receiverToken, receiverId, meuId, meuIdioma) {
    try {
        console.log('🔔 Enviando notificação para acordar receiver...');
        
        const response = await fetch('https://serve-app.onrender.com/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: receiverToken,
                title: '📞 Nova Chamada de Vídeo',
                body: `Toque para atender a chamada de vídeo`,
                data: {
                    type: 'wake_up',
                    callerId: meuId,
                    callerLang: meuIdioma
                }
            })
        });

        const result = await response.json();
        console.log('✅ Notificação enviada:', result);
        return result.success;
    } catch (error) {
        console.error('❌ Erro ao enviar notificação:', error);
        return false;
    }
}

// 🔄 FUNÇÃO UNIFICADA: Tentar conexão visual (COM ESPERA INTELIGENTE)
async function iniciarConexaoVisual(receiverId, receiverToken, meuId, localStream, meuIdioma) {
    console.log('🚀 Iniciando fluxo visual de conexão...');
    
    let conexaoEstabelecida = false;
    let notificacaoEnviada = false;
    window.conexaoCancelada = false;
    
    // ✅ AGUARDA O WEBRTC ESTAR COMPLETAMENTE INICIALIZADO
    console.log('⏳ Aguardando inicialização completa do WebRTC...');
    
    // Função para verificar se o WebRTC está pronto
    const aguardarWebRTCPronto = () => {
        return new Promise((resolve) => {
            const verificar = () => {
                if (window.rtcCore && window.rtcCore.isInitialized && typeof window.rtcCore.startCall === 'function') {
                    console.log('✅ WebRTC completamente inicializado');
                    resolve(true);
                } else {
                    console.log('⏳ Aguardando WebRTC...');
                    setTimeout(verificar, 500);
                }
            };
            verificar();
        });
    };

    try {
        // Aguarda o WebRTC estar pronto antes de qualquer tentativa
        await aguardarWebRTCPronto();

        console.log('🔇 Fase 1: Tentativas silenciosas (6s)');
        
        let tentativasFase1 = 3;
        const tentarConexaoSilenciosa = async () => {
            if (conexaoEstabelecida || window.conexaoCancelada) return;
            
            if (tentativasFase1 > 0) {
                console.log(`🔄 Tentativa silenciosa ${4 - tentativasFase1}`);
                
                // ✅ VERIFICAÇÃO EXTRA ANTES DE CHAMAR
                if (window.rtcCore && typeof window.rtcCore.startCall === 'function') {
                    window.rtcCore.startCall(receiverId, localStream, meuIdioma);
                } else {
                    console.log('⚠️ WebRTC não está pronto, aguardando...');
                }
                
                tentativasFase1--;
                setTimeout(tentarConexaoSilenciosa, 2000);
            } else {
                console.log('📞 Fase 2: Mostrando tela de chamada');
                const telaChamada = criarTelaChamando();
                
                if (!notificacaoEnviada) {
                    console.log('📨 Enviando notificação wake-up...');
                    notificacaoEnviada = await enviarNotificacaoWakeUp(receiverToken, receiverId, meuId, meuIdioma);
                }
                
                const tentarConexaoContinuamente = async () => {
                    if (conexaoEstabelecida || window.conexaoCancelada) return;
                    
                    console.log('🔄 Tentando conexão...');
                    
                    // ✅ VERIFICAÇÃO SEMPRE ANTES DE TENTAR
                    if (window.rtcCore && typeof window.rtcCore.startCall === 'function') {
                        window.rtcCore.startCall(receiverId, localStream, meuIdioma);
                    }
                    
                    setTimeout(tentarConexaoContinuamente, 3000);
                };
                
                tentarConexaoContinuamente();
            }
        };
        
        // ✅ PEQUENO ATRASO PARA GARANTIR ESTABILIDADE
        setTimeout(() => {
            tentarConexaoSilenciosa();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erro no fluxo de conexão:', error);
    }
    
    window.rtcCore.setRemoteStreamCallback(stream => {
        conexaoEstabelecida = true;
        console.log('✅ Conexão estabelecida com sucesso!');
        
        // ✅ ESCONDE A IMAGEM DO LEMUR AO CONECTAR
        const lemurWaiting = document.getElementById('lemurWaiting');
        if (lemurWaiting) {
            lemurWaiting.style.display = 'none';
        }
        
        // ✅ FECHA A CAIXA DE INSTRUÇÕES QUANDO CONECTAR
        const instructionBox = document.getElementById('instructionBox');
        if (instructionBox) {
            instructionBox.classList.remove('expandido');
            instructionBox.classList.add('recolhido');
            console.log('📖 Instruções fechadas (WebRTC conectado)');
        }
        
        const telaChamada = document.getElementById('tela-chamando');
        if (telaChamada) telaChamada.remove();
        
        // ✅✅✅ DESABILITA ÁUDIO DO STREAM REMOTO (participantes só se veem)
        stream.getAudioTracks().forEach(track => {
            track.enabled = false;
            track.stop(); // Para completamente o áudio
        });
        
        const remoteVideo = document.getElementById('remoteVideo');
        if (remoteVideo) remoteVideo.srcObject = stream;
    });
}

// ✅ NOVO BLOCO - CÂMERA RESILIENTE
async function iniciarCameraAposPermissoes() {
    try {
        console.log('🎥 Tentando iniciar câmera (modo resiliente)...');
        
        // ✅ TENTA a câmera, mas NÃO TRAVA se falhar
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false  // SEM ÁUDIO
        }).catch(error => {
            console.log('⚠️ Câmera indisponível, continuando sem vídeo...', error);
            return null; // RETORNA NULL EM VEZ DE THROW ERROR
        });

        // ✅ SE CÂMERA FUNCIONOU: Configura normalmente
        if (stream) {
            window.localStream = stream;

            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.srcObject = stream;
            }

            // 🎥 CONFIGURA BOTÃO DE ALTERNAR CÂMERA (só se câmera funcionou)
            setupCameraToggle();
            
            console.log('✅ Câmera iniciada com sucesso');

            // ✅ INICIAR VIGILANTE QUANDO CÂMERA ESTIVER PRONTA
            setTimeout(() => {
                if (window.cameraVigilante) {
                    window.cameraVigilante.iniciarMonitoramento();
                    console.log('👁️ Vigilante ativado para câmera do receiver');
                }
            }, 1000);
            
        } else {
            // ✅ SE CÂMERA FALHOU: Apenas avisa, mas continua
            console.log('ℹ️ Sistema operando em modo sem câmera');
            window.localStream = null;
        }

        // ✅✅✅ REMOVE LOADING INDEPENDENTE DA CÂMERA
        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) {
            mobileLoading.style.display = 'none';
        }

        // ✅✅✅ MOSTRA BOTÃO CLICK INDEPENDENTE DA CÂMERA
        setTimeout(() => {
            const elementoClick = document.getElementById('click');
            if (elementoClick) {
                elementoClick.style.display = 'block';
                elementoClick.classList.add('piscar-suave');
                console.log('🟡 Botão click ativado (com/sem câmera)');
            }
        }, 500);
        
        window.rtcCore = new WebRTCCore();

        const url = window.location.href;
        const fixedId = url.split('?')[1] || crypto.randomUUID().substr(0, 8);

        const myId = fakeRandomUUID(fixedId).substr(0, 8);

        const params = new URLSearchParams(window.location.search);
        const token = params.get('token') || '';
        const lang = params.get('lang') || navigator.language || 'pt-BR';

        // ✅ DEBUG: Verifica se tem receiverId para conexão automática
        const receiverId = params.get('targetId') || '';
        console.log('🎯 ReceiverId na URL:', receiverId);

        if (receiverId) {
            console.log('🎯 MODO AUTOMÁTICO: Iniciando conexão com receiverId:', receiverId);
            document.getElementById('callActionBtn').style.display = 'none';
            
            // ✅✅✅ REMOVEMOS a verificação "if (localStream)" - AGORA SEMPRE INICIA!
            const meuIdioma = window.meuIdiomaLocal || 'pt-BR';
            
            // ✅ PEQUENO ATRASO PARA GARANTIR QUE TUDO ESTÁ ESTÁVEL
            setTimeout(() => {
                // ✅✅✅ ENVIA null se câmera falhou - WebRTC deve aceitar!
                const streamParaEnviar = window.localStream || null;
                iniciarConexaoVisual(receiverId, token, myId, streamParaEnviar, meuIdioma);
            }, 1000);
        } else {
            console.log('📱 MODO QR CODE: Aguardando conexão manual');
            // Botão callActionBtn fica visível para uso manual
        }

        window.targetTranslationLang = lang;

        // ✅ GUARDA as informações para gerar QR Code depois (QUANDO O USUÁRIO CLICAR)
        window.qrCodeData = {
            myId: myId,
            token: token,
            lang: lang
        };

        // ✅ CONFIGURA o botão para gerar QR Code quando clicado (VERSÃO COM LINK)
        document.getElementById('logo-traduz').addEventListener('click', function() {
            // 🔄 VERIFICA SE JÁ EXISTE UM QR CODE ATIVO
            const overlay = document.querySelector('.info-overlay');
            const qrcodeContainer = document.getElementById('qrcode');
            
            // Se o overlay já está visível, apenas oculta (toggle)
            if (overlay && !overlay.classList.contains('hidden')) {
                overlay.classList.add('hidden');
                console.log('📱 QR Code fechado pelo usuário');
                return;
            }
            
            // 🔄 VERIFICA CONEXÃO WEBRTC DE FORMA MAIS INTELIGENTE
            const remoteVideo = document.getElementById('remoteVideo');
            const isConnected = remoteVideo && remoteVideo.srcObject;
            
            if (isConnected) {
                console.log('❌ WebRTC já conectado - QR Code não pode ser reaberto');
                return; // Apenas retorna silenciosamente
            }
            
            console.log('🗝️ Gerando/Reabrindo QR Code e Link...');
                   
            // 🔄 LIMPA QR CODE ANTERIOR SE EXISTIR
            if (qrcodeContainer) {
                qrcodeContainer.innerHTML = '';
            }
            
            const callerUrl = `${window.location.origin}/caller.html?targetId=${window.qrCodeData.myId}&token=${encodeURIComponent(window.qrCodeData.token)}&lang=${encodeURIComponent(window.qrCodeData.lang)}`;
            
            // Gera o QR Code
            QRCodeGenerator.generate("qrcode", callerUrl);
            
            // 🆕 🆕 🆕 CONFIGURA BOTÃO COPIAR SIMPLES
            const btnCopiar = document.getElementById('copiarLink');
            if (btnCopiar) {
                btnCopiar.onclick = function() {
                    navigator.clipboard.writeText(callerUrl).then(() => {
                        btnCopiar.textContent = '✅';
                        btnCopiar.classList.add('copiado');
                        console.log('🔗 Link copiado para área de transferência');
                        
                        setTimeout(() => {
                            btnCopiar.textContent = '🔗';
                            btnCopiar.classList.remove('copiado');
                        }, 2000);
                    }).catch(err => {
                        console.log('❌ Erro ao copiar link:', err);
                        // Fallback para dispositivos sem clipboard API
                        const textArea = document.createElement('textarea');
                        textArea.value = callerUrl;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        
                        btnCopiar.textContent = '✅';
                        setTimeout(() => {
                            btnCopiar.textContent = '🔗';
                        }, 2000);
                    });
                };
            }
            
            // Mostra o overlay do QR Code
            if (overlay) {
                overlay.classList.remove('hidden');
            }
            
            console.log('✅ QR Code e Link gerados/reativados!');
        });

        // Fechar QR Code ao clicar fora
        document.querySelector('.info-overlay').addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.add('hidden');
                console.log('📱 QR Code fechado (clique fora)');
            }
        });

        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();

        // ✅✅✅ SIMPLIFICADO: Data channel apenas para controle WebRTC (SEM TRADUÇÃO)
        window.rtcCore.setDataChannelCallback(async (mensagem) => {
            console.log('📩 Mensagem recebida no RECEIVER (WebRTC controle):', mensagem);
            // ❌ REMOVIDO: Todo o sistema de TTS e tradução dinâmica
        });

        window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
    window.rtcCore.currentCaller = window.lastCallerId; //
            console.log('📞 Chamada recebida - Com/Sem câmera');

            console.log('🎯 Caller fala:', idiomaDoCaller);
            
            // [Sistema de espera removido - conexão estabelecida]

            console.log('🎯 Eu (receiver) entendo:', lang);

            window.sourceTranslationLang = idiomaDoCaller;
            window.targetTranslationLang = lang;

            console.log('🎯 Vou traduzir:', idiomaDoCaller, '→', lang);

            window.rtcCore.handleIncomingCall(offer, window.localStream, (remoteStream) => {
                // ✅✅✅ DESABILITA ÁUDIO DO STREAM REMOTO (participantes só se veem)
                remoteStream.getAudioTracks().forEach(track => {
                    track.enabled = false;
                    track.stop(); // Para completamente o áudio
                });

                const overlay = document.querySelector('.info-overlay');
                if (overlay) overlay.classList.add('hidden');

                const remoteVideo = document.getElementById('remoteVideo');
                if (remoteVideo) {
                    remoteVideo.srcObject = remoteStream;
                    
                    // ✅ AGORA SIM: Esconde o botão Click quando WebRTC conectar
                    const elementoClick = document.getElementById('click');
                    if (elementoClick) {
                        elementoClick.style.display = 'none';
                        elementoClick.classList.remove('piscar-suave');
                        console.log('🔗 WebRTC conectado - botão Click removido permanentemente');
                    }
                }

                window.targetTranslationLang = idiomaDoCaller || lang;
                console.log('🎯 Idioma definido para tradução:', window.targetTranslationLang);

                if (idiomaDoCaller) {
                    aplicarBandeiraRemota(idiomaDoCaller);
                } else {
                    const remoteLangElement = document.querySelector('.remoter-Lang');
                    if (remoteLangElement) remoteLangElement.textContent = '🔴';
                }
            });
        };

        const frasesParaTraduzir = {
            "translator-label": "Real-time translation.",
            "qr-modal-title": "This is your online key",
            "qr-modal-description": "You can ask to scan, share or print on your business card."
        };

        (async () => {
            for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
                const el = document.getElementById(id);
                if (el) {
                    const traduzido = await translateText(texto, lang);
                    el.textContent = traduzido;
                }
            }
        })();

        aplicarBandeiraLocal(lang);

        setTimeout(() => {
            if (typeof initializeTranslator === 'function') {
                initializeTranslator();
            }
        }, 1000);

        // ✅ INICIA O OBSERVADOR PARA ESCONDER O CLICK QUANDO CONECTAR
        esconderClickQuandoConectar();

    } catch (error) {
        // ✅✅✅ EM CASO DE ERRO: Remove loading E continua
        console.error("❌ Erro não crítico na câmera:", error);
        
        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) {
            mobileLoading.style.display = 'none';
        }
        
        // ✅ NÃO FAZ throw error! Apenas retorna normalmente
        console.log('🟡 Sistema continua funcionando (áudio/texto)');
    }
}

// 🚀 INICIALIZAÇÃO AUTOMÁTICA (SEM BOTÃO DE PERMISSÕES)
window.onload = async () => {
    try {
        console.log('🚀 Iniciando aplicação receiver automaticamente...');
        
        // 1. Obtém o idioma para tradução
        const params = new URLSearchParams(window.location.search);
        const lang = params.get('lang') || navigator.language || 'pt-BR';
        
        // ✅✅✅ PRIMEIRO: Aplica bandeira e GUARDA o idioma
        await aplicarBandeiraLocal(lang);

        // ✅✅✅ DEPOIS: Traduz frases com o idioma JÁ GUARDADO  
        await traduzirFrasesFixas();
        
        // 3. Inicia áudio
        iniciarAudio();
        
        // 4. Carrega sons da máquina de escrever
        await carregarSomDigitacao();
        
        // 5. Solicita permissões (apenas vídeo)
        await solicitarTodasPermissoes();
        
        // 6. Libera interface
        if (typeof window.liberarInterface === 'function') {
            window.liberarInterface();
            console.log('✅ Interface liberada via função global');
        } else {
            liberarInterfaceFallback();
            console.log('✅ Interface liberada via fallback');
        }
        
        // 7. Inicia câmera e WebRTC
        await iniciarCameraAposPermissoes();
        
        console.log('✅ Receiver iniciado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar receiver:', error);
        
        if (typeof window.mostrarErroCarregamento === 'function') {
            window.mostrarErroCarregamento('Erro ao solicitar permissões de câmera e microfone');
        } else {
            console.error('❌ Erro no carregamento:', error);
            alert('Erro ao inicializar: ' + error.message);
        }
    }
};

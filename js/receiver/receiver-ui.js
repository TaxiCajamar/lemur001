// 📦 IMPORTAÇÕES ÚNICAS
import { ConnectionOrchestrator } from '../../core/connection-orchestrator.js';
import { QRCodeGenerator } from '../qrcode/qr-code-utils.js';
import { CameraVigilante } from '../../core/camera-vigilante.js';

// 🎵 VARIÁVEIS DE ÁUDIO
let audioContext = null;
let somDigitacao = null;
let audioCarregado = false;
let permissaoConcedida = false;

// 🎤 SISTEMA HÍBRIDO TTS AVANÇADO
let primeiraFraseTTS = true;
let navegadorTTSPreparado = false;
let ultimoIdiomaTTS = 'pt-BR';

// 🌐 VARIÁVEIS DE CONEXÃO
let connectionOrchestrator = null;
let qrCodeData = null;

// 🎯 CONTROLE DO TOGGLE DAS INSTRUÇÕES
function setupInstructionToggle() {
    const instructionBox = document.getElementById('instructionBox');
    const toggleButton = document.getElementById('instructionToggle');
    
    if (!instructionBox || !toggleButton) return;
    
    let isExpanded = true;
    
    toggleButton.addEventListener('click', function(e) {
        e.stopPropagation();
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
    
    document.addEventListener('click', function(e) {
        if (!instructionBox.contains(e.target) && isExpanded) {
            instructionBox.classList.remove('expandido');
            instructionBox.classList.add('recolhido');
            isExpanded = false;
            console.log('📖 Instruções fechadas (clique fora)');
        }
    });
}

// 🌐 TRADUÇÃO DAS FRASES FIXAS
async function traduzirFrasesFixas() {
    try {
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

// 🎵 SISTEMA DE ÁUDIO
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

// 🎤 SISTEMA DE PERMISSÕES
async function solicitarTodasPermissoes() {
    try {
        console.log('🎯 Solicitando todas as permissões...');
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        console.log('✅ Todas as permissões concedidas!');
        
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

// 🎯 FUNÇÕES AUXILIARES
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

// 🏳️ SISTEMA DE BANDEIRAS
async function aplicarBandeiraLocal(langCode) {
    try {
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();

        const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';

        window.meuIdiomaLocal = langCode;
        console.log('💾 Idioma local guardado:', window.meuIdiomaLocal);

        const languageFlagElement = document.querySelector('.language-flag');
        if (languageFlagElement) languageFlagElement.textContent = bandeira;

        const localLangDisplay = document.querySelector('.local-Lang');
        if (localLangDisplay) localLangDisplay.textContent = bandeira;

        console.log('🏳️ Bandeira local aplicada:', bandeira, 'em duas posições');

    } catch (error) {
        console.error('Erro ao carregar bandeira local:', error);
    }
}

async function aplicarBandeiraRemota(langCode) {
    try {
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();

        const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';

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

// 🎥 SISTEMA DE CÂMERA
function setupCameraToggle() {
    const toggleButton = document.getElementById('toggleCamera');
    let currentCamera = 'user';
    let isSwitching = false;

    if (!toggleButton) {
        console.log('❌ Botão de alternar câmera não encontrado');
        return;
    }

    toggleButton.addEventListener('click', async () => {
        if (isSwitching) {
            console.log('⏳ Troca de câmera já em andamento...');
            return;
        }

        isSwitching = true;
        toggleButton.style.opacity = '0.5';
        toggleButton.style.cursor = 'wait';

        try {
            console.log('🔄 Iniciando troca de câmera...');
            
            if (window.localStream) {
                console.log('⏹️ Parando stream atual...');
                window.localStream.getTracks().forEach(track => {
                    track.stop();
                });
                window.localStream = null;
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            currentCamera = currentCamera === 'user' ? 'environment' : 'user';
            console.log(`🎯 Solicitando câmera: ${currentCamera === 'user' ? 'Frontal' : 'Traseira'}`);
            
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        facingMode: currentCamera,
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
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
            isSwitching = false;
            toggleButton.style.opacity = '1';
            toggleButton.style.cursor = 'pointer';
        }
    });

    async function handleNewStream(newStream, cameraType) {
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = newStream;
        }

        window.localStream = newStream;

        if (connectionOrchestrator && connectionOrchestrator.webrtcCore && connectionOrchestrator.webrtcCore.peer) {
            const connectionState = connectionOrchestrator.webrtcCore.peer.connectionState;
            console.log(`📡 Estado da conexão WebRTC: ${connectionState}`);
            
            if (connectionState === 'connected') {
                console.log('🔄 Atualizando WebRTC com nova câmera...');
                
                try {
                    connectionOrchestrator.webrtcCore.localStream = newStream;
                    const newVideoTrack = newStream.getVideoTracks()[0];
                    const senders = connectionOrchestrator.webrtcCore.peer.getSenders();
                    
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

    async function tryFallbackCameras(requestedCamera) {
        try {
            console.log('🔄 Buscando dispositivos de câmera...');
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            console.log(`📷 Câmeras encontradas: ${videoDevices.length}`);
            
            if (videoDevices.length > 1) {
                const currentDeviceId = window.localStream ? 
                    window.localStream.getVideoTracks()[0]?.getSettings()?.deviceId : null;
                
                let newDeviceId;
                if (currentDeviceId && videoDevices.length > 1) {
                    const currentIndex = videoDevices.findIndex(device => device.deviceId === currentDeviceId);
                    newDeviceId = videoDevices[(currentIndex + 1) % videoDevices.length].deviceId;
                } else {
                    newDeviceId = videoDevices[0].deviceId;
                }
                
                console.log(`🎯 Tentando câmera com deviceId: ${newDeviceId.substring(0, 10)}...`);
                
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        deviceId: { exact: newDeviceId },
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
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

    console.log('✅ Botão de alternar câmera configurado com tratamento robusto');
}

// 🎤 SISTEMA TTS HÍBRIDO
function falarComNavegadorTTS(mensagem, elemento, imagemImpaciente, idioma) {
    return new Promise((resolve) => {
        try {
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(mensagem);
            utterance.lang = idioma;
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 0.9;
            
            utterance.onstart = () => {
                pararSomDigitacao();
                
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
            
            utterance.onend = () => {
                console.log('🔚 Áudio Navegador TTS terminado');
                if (imagemImpaciente) {
                    imagemImpaciente.style.display = 'none';
                }
                resolve(true);
            };
            
            utterance.onerror = (error) => {
                pararSomDigitacao();
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

function prepararNavegadorTTS(idioma) {
    if (navegadorTTSPreparado) return;
    
    try {
        const utterance = new SpeechSynthesisUtterance('');
        utterance.lang = idioma;
        utterance.volume = 0;
        utterance.onend = () => {
            navegadorTTSPreparado = true;
            console.log(`✅ Navegador TTS preparado para ${idioma}`);
        };
        window.speechSynthesis.speak(utterance);
    } catch (error) {
        console.log('⚠️ Não foi possível preparar navegador TTS:', error);
    }
}

async function falarComGoogleTTS(mensagem, elemento, imagemImpaciente, idioma) {
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
        
        audio.onplay = () => {
            pararSomDigitacao();
            
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
            pararSomDigitacao();
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

async function falarTextoSistemaHibrido(mensagem, elemento, imagemImpaciente, idioma) {
    try {
        console.log(`🎯 TTS Híbrido: "${mensagem.substring(0, 50)}..." em ${idioma}`);
        
        ultimoIdiomaTTS = idioma;
        
        if (primeiraFraseTTS) {
            console.log('🚀 PRIMEIRA FRASE: Usando Google TTS (rápido)');
            
            await falarComGoogleTTS(mensagem, elemento, imagemImpaciente, idioma);
            
            console.log(`🔄 Preparando navegador TTS para ${idioma}...`);
            prepararNavegadorTTS(idioma);
            
            primeiraFraseTTS = false;
            
        } else {
            console.log('💰 PRÓXIMAS FRASES: Usando Navegador TTS (grátis)');
            
            const sucesso = await falarComNavegadorTTS(mensagem, elemento, imagemImpaciente, idioma);
            
            if (!sucesso) {
                console.log('🔄 Fallback: Navegador falhou, usando Google TTS');
                await falarComGoogleTTS(mensagem, elemento, imagemImpaciente, idioma);
            }
        }
        
        console.log('✅ TTS concluído com sucesso');
        
    } catch (error) {
        console.error('❌ Erro no sistema híbrido TTS:', error);
        
        console.log('🔄 Tentando fallback final com navegador TTS...');
        await falarComNavegadorTTS(mensagem, elemento, imagemImpaciente, idioma);
    }
}

// 🔄 SISTEMA PRINCIPAL DE CONEXÃO
async function iniciarCameraSimplificada() {
    try {
        console.log('🎥 Iniciando câmera simplificada...');
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        }).catch(error => {
            console.log('⚠️ Câmera indisponível, continuando sem vídeo...', error);
            return null;
        });

        if (stream) {
            window.localStream = stream;
            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.srcObject = stream;
            }
            
            setupCameraToggle();
            
            window.cameraVigilante = new CameraVigilante();
            window.cameraVigilante.iniciarMonitoramento();
            
            console.log('✅ Câmera iniciada com sucesso');
        } else {
            console.log('ℹ️ Operando em modo áudio/texto (sem câmera)');
            window.localStream = null;
        }

        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) {
            mobileLoading.style.display = 'none';
        }

        // ✅ MOSTRA BOTÃO CLICK INDEPENDENTE DA CÂMERA
        setTimeout(() => {
            const elementoClick = document.getElementById('click');
            if (elementoClick) {
                elementoClick.style.display = 'block';
                elementoClick.classList.add('piscar-suave');
                console.log('🟡 Botão click ativado (com/sem câmera)');
            }
        }, 500);

    } catch (error) {
        console.error('❌ Erro não crítico na câmera:', error);
        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) {
            mobileLoading.style.display = 'none';
        }
    }
}

function liberarInterfaceFallback() {
    console.log('🔓 Usando fallback para liberar interface...');
    
    const mobileLoading = document.getElementById('mobileLoading');
    if (mobileLoading) {
        mobileLoading.style.display = 'none';
        console.log('✅ Loader mobileLoading removido');
    }
    
    console.log('✅ Interface liberada via fallback');
}

// ✅ SISTEMA DE QR CODE
function setupQRCodeSystem() {
    const logoTraduz = document.getElementById('logo-traduz');
    if (!logoTraduz) return;

    logoTraduz.addEventListener('click', function() {
        const overlay = document.querySelector('.info-overlay');
        const qrcodeContainer = document.getElementById('qrcode');
        
        // Se o overlay já está visível, apenas oculta (toggle)
        if (overlay && !overlay.classList.contains('hidden')) {
            overlay.classList.add('hidden');
            console.log('📱 QR Code fechado pelo usuário');
            return;
        }
        
        // 🔄 VERIFICA CONEXÃO WEBRTC
        const remoteVideo = document.getElementById('remoteVideo');
        const isConnected = remoteVideo && remoteVideo.srcObject;
        
        if (isConnected) {
            console.log('❌ WebRTC já conectado - QR Code não pode ser reaberto');
            return;
        }
        
        console.log('🗝️ Gerando/Reabrindo QR Code e Link...');
        
        // 🔄 LIMPA QR CODE ANTERIOR SE EXISTIR
        if (qrcodeContainer) {
            qrcodeContainer.innerHTML = '';
        }
        
        const callerUrl = `${window.location.origin}/caller.html?targetId=${qrCodeData.myId}&token=${encodeURIComponent(qrCodeData.token)}&lang=${encodeURIComponent(qrCodeData.lang)}`;
        
        // Gera o QR Code
        QRCodeGenerator.generate("qrcode", callerUrl);
        
        // CONFIGURA BOTÃO COPIAR
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
    const overlay = document.querySelector('.info-overlay');
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.add('hidden');
                console.log('📱 QR Code fechado (clique fora)');
            }
        });
    }
}

// ✅ ESCONDER BOTÃO CLICK QUANDO CONECTAR
function esconderClickQuandoConectar() {
    const elementoClick = document.getElementById('click');
    const remoteVideo = document.getElementById('remoteVideo');
    
    if (!elementoClick || !remoteVideo) return;
    
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'srcObject') {
                if (remoteVideo.srcObject) {
                    elementoClick.style.display = 'none';
                    elementoClick.classList.remove('piscar-suave');
                    console.log('🔗 WebRTC conectado - botão Click removido');
                    observer.disconnect();
                }
            }
        });
    });
    
    observer.observe(remoteVideo, {
        attributes: true,
        attributeFilter: ['srcObject']
    });
    
    console.log('👀 Observando conexão WebRTC para esconder botão Click');
}

// 🎯 HANDLERS DE CONEXÃO
function handleRemoteStream(stream) {
    console.log('✅ Conexão estabelecida! Stream remota recebida');
    
    const lemurWaiting = document.getElementById('lemurWaiting');
    if (lemurWaiting) lemurWaiting.style.display = 'none';
    
    const instructionBox = document.getElementById('instructionBox');
    if (instructionBox) {
        instructionBox.classList.remove('expandido');
        instructionBox.classList.add('recolhido');
    }
    
    const overlay = document.querySelector('.info-overlay');
    if (overlay) overlay.classList.add('hidden');
    
    stream.getAudioTracks().forEach(track => track.enabled = false);
    const remoteVideo = document.getElementById('remoteVideo');
    if (remoteVideo) remoteVideo.srcObject = stream;
    
    // ✅ ESCONDE BOTÃO CLICK IMEDIATAMENTE
    const elementoClick = document.getElementById('click');
    if (elementoClick) {
        elementoClick.style.display = 'none';
        elementoClick.classList.remove('piscar-suave');
        console.log('🔗 WebRTC conectado - botão Click removido permanentemente');
    }
}

function handleDataChannelMessage(mensagem) {
    console.log('📩 Mensagem recebida via orquestrador:', mensagem);
    
    iniciarSomDigitacao();
    
    const elemento = document.getElementById('texto-recebido');
    const imagemImpaciente = document.getElementById('lemurFixed');
    
    if (elemento) {
        elemento.textContent = "";
        elemento.style.animation = 'pulsar-flutuar-intenso 0.8s infinite ease-in-out';
        elemento.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
        elemento.style.border = '2px solid #ff0000';
    }

    if (imagemImpaciente) {
        imagemImpaciente.style.display = 'block';
    }

    const idiomaExato = window.meuIdiomaLocal || 'pt-BR';
    falarTextoSistemaHibrido(mensagem, elemento, imagemImpaciente, idiomaExato);
}

// 🚀 INICIALIZAÇÃO PRINCIPAL
async function inicializarReceiverModerno() {
    try {
        console.log('🚀 Iniciando receiver com orquestrador...');
        
        await carregarSomDigitacao();
        await solicitarTodasPermissoes();
        setupInstructionToggle();
        
        await iniciarCameraSimplificada();
        
        // ✅ CONFIGURA DADOS DO QR CODE
        const url = window.location.href;
        const fixedId = url.split('?')[1] || crypto.randomUUID().substr(0, 8);

        function fakeRandomUUID(fixedValue) {
            return {
                substr: function(start, length) {
                    return fixedValue.substr(start, length);
                }
            };
        }

        const myId = fakeRandomUUID(fixedId).substr(0, 8);
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token') || '';
        const lang = params.get('lang') || navigator.language || 'pt-BR';

        qrCodeData = {
            myId: myId,
            token: token,
            lang: lang
        };

        // ✅ CONFIGURA ORQUESTRADOR
        connectionOrchestrator = new ConnectionOrchestrator();
        
        connectionOrchestrator.setRemoteStreamCallback(handleRemoteStream);
        connectionOrchestrator.setDataChannelCallback(handleDataChannelMessage);
        
        await connectionOrchestrator.initialize(myId, window.localStream);
        
        // ✅ CONFIGURA HANDLER DE CHAMADAS RECEBIDAS
        connectionOrchestrator.webrtcCore.setIncomingCallCallback(async (offer, idiomaDoCaller) => {
            console.log('📞 Chamada recebida - Com/Sem câmera');
            console.log('🎯 Caller fala:', idiomaDoCaller);
            console.log('🎯 Eu (receiver) entendo:', lang);

            window.sourceTranslationLang = idiomaDoCaller;
            window.targetTranslationLang = lang;

            console.log('🎯 Vou traduzir:', idiomaDoCaller, '→', lang);

            await connectionOrchestrator.webrtcCore.handleIncomingCall(offer, window.localStream, (remoteStream) => {
                handleRemoteStream(remoteStream);
                
                window.targetTranslationLang = idiomaDoCaller || lang;
                console.log('🎯 Idioma definido para tradução:', window.targetTranslationLang);

                if (idiomaDoCaller) {
                    aplicarBandeiraRemota(idiomaDoCaller);
                }
            });
        });

        // ✅ CONFIGURA SISTEMA DE QR CODE
        setupQRCodeSystem();
        
        // ✅ INICIA OBSERVADOR PARA ESCONDER CLICK
        esconderClickQuandoConectar();

        console.log('✅ Receiver moderno inicializado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro na inicialização moderna:', error);
    }
}

// 🎯 INICIALIZAÇÃO FINAL
window.onload = async () => {
    try {
        console.log('🚀 Iniciando aplicação receiver (versão moderna)...');
        
        const params = new URLSearchParams(window.location.search);
        const lang = params.get('lang') || navigator.language || 'pt-BR';
        
        await aplicarBandeiraLocal(lang);
        await traduzirFrasesFixas();
        iniciarAudio();
        await carregarSomDigitacao();
        await solicitarTodasPermissoes();
        setupInstructionToggle();
        
        liberarInterfaceFallback();
        
        await inicializarReceiverModerno();
        
        console.log('✅ Receiver moderno iniciado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar receiver moderno:', error);
    }
};

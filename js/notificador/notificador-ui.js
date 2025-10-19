// 📦 Importa o núcleo WebRTC
import { WebRTCCore } from '../../core/webrtc-core.js';
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
            console.log('📖 Instruções expandidas - Notificador');
        } else {
            instructionBox.classList.remove('expandido');
            instructionBox.classList.add('recolhido');
            console.log('📖 Instruções recolhidas - Notificador');
        }
    });
    
    document.addEventListener('click', function(e) {
        if (!instructionBox.contains(e.target) && isExpanded) {
            instructionBox.classList.remove('expandido');
            instructionBox.classList.add('recolhido');
            isExpanded = false;
            console.log('📖 Instruções fechadas (clique fora) - Notificador');
        }
    });
}

// 🌐 TRADUÇÃO DAS FRASES FIXAS
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

async function traduzirFrasesFixas() {
  try {
    const idiomaExato = window.meuIdiomaLocal || 'pt-BR';
    
    console.log(`🌐 Traduzindo frases fixas para: ${idiomaExato}`);

    const frasesParaTraduzir = {
      "translator-label": "Real-time translation.",
      "translator-label-2": "Real-time translation.",
      "welcome-text": "Welcome! Let's begin.",
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

    console.log('✅ Frases fixas traduzidas com sucesso - Notificador');

  } catch (error) {
    console.error("❌ Erro ao traduzir frases fixas:", error);
  }
}

// 🎵 CARREGAR SOM DE DIGITAÇÃO
function carregarSomDigitacao() {
    return new Promise((resolve) => {
        try {
            somDigitacao = new Audio('assets/audio/keyboard.mp3');
            somDigitacao.volume = 0.3;
            somDigitacao.preload = 'auto';
            
            somDigitacao.addEventListener('canplaythrough', () => {
                console.log('🎵 Áudio de digitação carregado - Notificador');
                audioCarregado = true;
                resolve(true);
            });
            
            somDigitacao.addEventListener('error', () => {
                console.log('❌ Erro ao carregar áudio - Notificador');
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
            console.log('🔇 Navegador bloqueou áudio automático - Notificador');
        });
        
        console.log('🎵 Som de digitação iniciado - Notificador');
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
            console.log('🎵 Som de digitação parado - Notificador');
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
    
    console.log('🎵 Áudio desbloqueado! - Notificador');
}

// 🎤 SOLICITAR TODAS AS PERMISSÕES DE UMA VEZ
async function solicitarTodasPermissoes() {
    try {
        console.log('🎯 Solicitando todas as permissões... - Notificador');
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        console.log('✅ Todas as permissões concedidas! - Notificador');
        
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

// ===== FUNÇÃO SIMPLES PARA ENVIAR TEXTO =====
function enviarParaOutroCelular(texto) {
  if (window.rtcDataChannel && window.rtcDataChannel.isOpen()) {
    window.rtcDataChannel.send(texto);
    console.log('✅ Texto enviado:', texto);
  } else {
    console.log('⏳ Canal não disponível ainda. Tentando novamente...');
    setTimeout(() => enviarParaOutroCelular(texto), 1000);
  }
}

// 🎥 FUNÇÃO PARA ALTERNAR ENTRE CÂMERAS
function setupCameraToggle() {
    const toggleButton = document.getElementById('toggleCamera');
    let currentCamera = 'user';
    let isSwitching = false;

    if (!toggleButton) {
        console.log('❌ Botão de alternar câmera não encontrado - Notificador');
        return;
    }

    toggleButton.addEventListener('click', async () => {
        if (isSwitching) {
            console.log('⏳ Troca de câmera já em andamento... - Notificador');
            return;
        }

        isSwitching = true;
        toggleButton.style.opacity = '0.5';
        toggleButton.style.cursor = 'wait';

        try {
            console.log('🔄 Iniciando troca de câmera... - Notificador');
            
            if (window.localStream) {
                console.log('⏹️ Parando stream atual... - Notificador');
                window.localStream.getTracks().forEach(track => {
                    track.stop();
                });
                window.localStream = null;
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            currentCamera = currentCamera === 'user' ? 'environment' : 'user';
            console.log(`🎯 Solicitando câmera: ${currentCamera === 'user' ? 'Frontal' : 'Traseira'} - Notificador`);
            
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
                console.log('❌ facingMode falhou, tentando fallback... - Notificador');
                await tryFallbackCameras(currentCamera);
            }

        } catch (error) {
            console.error('❌ Erro crítico ao alternar câmera:', error);
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

        if (window.rtcCore && window.rtcCore.peer) {
            const connectionState = window.rtcCore.peer.connectionState;
            console.log(`📡 Estado da conexão WebRTC: ${connectionState} - Notificador`);
            
            if (connectionState === 'connected') {
                console.log('🔄 Atualizando WebRTC com nova câmera... - Notificador');
                
                try {
                    window.rtcCore.localStream = newStream;
                    
                    const newVideoTrack = newStream.getVideoTracks()[0];
                    const senders = window.rtcCore.peer.getSenders();
                    
                    let videoUpdated = false;
                    for (const sender of senders) {
                        if (sender.track && sender.track.kind === 'video') {
                            await sender.replaceTrack(newVideoTrack);
                            videoUpdated = true;
                            console.log('✅ Sender de vídeo atualizado no WebRTC - Notificador');
                        }
                    }
                    
                    if (!videoUpdated) {
                        console.log('⚠️ Nenhum sender de vídeo encontrado - Notificador');
                    }
                } catch (webrtcError) {
                    console.error('❌ Erro ao atualizar WebRTC:', webrtcError);
                }
            } else {
                console.log(`ℹ️ WebRTC não conectado (${connectionState}), apenas atualização local - Notificador`);
            }
        }

        console.log(`✅ Câmera alterada para: ${cameraType === 'user' ? 'Frontal' : 'Traseira'} - Notificador`);
    }

    async function tryFallbackCameras(requestedCamera) {
        try {
            console.log('🔄 Buscando dispositivos de câmera... - Notificador');
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            console.log(`📷 Câmeras encontradas: ${videoDevices.length} - Notificador`);
            
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
                
                console.log(`🎯 Tentando câmera com deviceId: ${newDeviceId.substring(0, 10)}... - Notificador`);
                
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        deviceId: { exact: newDeviceId },
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
                });

                await handleNewStream(newStream, 'fallback');
                console.log('✅ Câmera alternada via fallback de dispositivos - Notificador');
                
            } else {
                console.warn('⚠️ Apenas uma câmera disponível - Notificador');
            }
        } catch (fallbackError) {
            console.error('❌ Fallback também falhou:', fallbackError);
        }
    }

    console.log('✅ Botão de alternar câmera configurado - Notificador');
}

// ✅ FUNÇÃO PARA LIBERAR INTERFACE (FALLBACK)
function liberarInterfaceFallback() {
    console.log('🔓 Usando fallback para liberar interface... - Notificador');
    
    const mobileLoading = document.getElementById('mobileLoading');
    if (mobileLoading) {
        mobileLoading.style.display = 'none';
        console.log('✅ Loader mobileLoading removido - Notificador');
    }
    
    console.log('✅ Interface liberada via fallback - Notificador');
}

// 🏳️ Aplica bandeira do idioma local
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

        console.log('🏳️ Bandeira local aplicada no NOTIFICADOR:', bandeira, 'em duas posições');

    } catch (error) {
        console.error('Erro ao carregar bandeira local no notificador:', error);
    }
}

// 🏳️ Aplica bandeira do idioma remota
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

// 🎤 SISTEMA HÍBRIDO TTS AVANÇADO
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
                
                console.log(`🔊 Áudio Navegador TTS iniciado em ${idioma} - Notificador`);
            };
            
            utterance.onend = () => {
                console.log('🔚 Áudio Navegador TTS terminado - Notificador');
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
            console.log(`✅ Navegador TTS preparado para ${idioma} - Notificador`);
        };
        window.speechSynthesis.speak(utterance);
    } catch (error) {
        console.log('⚠️ Não foi possível preparar navegador TTS:', error);
    }
}

async function falarComGoogleTTS(mensagem, elemento, imagemImpaciente, idioma) {
    try {
        console.log(`🎤 Iniciando Google TTS para ${idioma}:`, mensagem.substring(0, 50) + '... - Notificador');
        
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
            
            console.log(`🔊 Áudio Google TTS iniciado em ${idioma} - Notificador`);
        };
        
        audio.onended = () => {
            console.log('🔚 Áudio Google TTS terminado - Notificador');
            if (imagemImpaciente) {
                imagemImpaciente.style.display = 'none';
            }
        };
        
        audio.onerror = () => {
            pararSomDigitacao();
            console.log('❌ Erro no áudio Google TTS - Notificador');
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
        console.log(`🎯 TTS Híbrido: "${mensagem.substring(0, 50)}..." em ${idioma} - Notificador`);
        
        ultimoIdiomaTTS = idioma;
        
        if (primeiraFraseTTS) {
            console.log('🚀 PRIMEIRA FRASE: Usando Google TTS (rápido) - Notificador');
            
            await falarComGoogleTTS(mensagem, elemento, imagemImpaciente, idioma);
            
            console.log(`🔄 Preparando navegador TTS para ${idioma}... - Notificador`);
            prepararNavegadorTTS(idioma);
            
            primeiraFraseTTS = false;
            
        } else {
            console.log('💰 PRÓXIMAS FRASES: Usando Navegador TTS (grátis) - Notificador');
            
            const sucesso = await falarComNavegadorTTS(mensagem, elemento, imagemImpaciente, idioma);
            
            if (!sucesso) {
                console.log('🔄 Fallback: Navegador falhou, usando Google TTS - Notificador');
                await falarComGoogleTTS(mensagem, elemento, imagemImpaciente, idioma);
            }
        }
        
        console.log('✅ TTS concluído com sucesso - Notificador');
        
    } catch (error) {
        console.error('❌ Erro no sistema híbrido TTS:', error);
        
        console.log('🔄 Tentando fallback final com navegador TTS... - Notificador');
        await falarComNavegadorTTS(mensagem, elemento, imagemImpaciente, idioma);
    }
}

// ✅✅✅ CORREÇÃO CRÍTICA: NOTIFICADOR COMO RECEIVER
async function iniciarCameraAposPermissoes() {
    try {
        console.log('🎥 Iniciando câmera NOTIFICADOR (modo RECEIVER)...');
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        }).catch(error => {
            console.log('⚠️ Câmera NOTIFICADOR indisponível, continuando sem vídeo...', error);
            return null;
        });

        if (stream) {
            window.localStream = stream;
            
            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.srcObject = stream;
            }

            setupCameraToggle();
            
            console.log('✅ Câmera NOTIFICADOR iniciada com sucesso');

            if (typeof CameraVigilante !== 'undefined') {
                window.cameraVigilante = new CameraVigilante();
                window.cameraVigilante.iniciarMonitoramento();
            }
        } else {
            console.log('ℹ️ NOTIFICADOR operando em modo áudio/texto (sem câmera)');
            window.localStream = null;
        }

        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) {
            mobileLoading.style.display = 'none';
        }

        console.log('🌐 Inicializando WebRTC NOTIFICADOR como RECEIVER...');
        window.rtcCore = new WebRTCCore();

        // ✅✅✅ CORREÇÃO: BUSCAR TODOS OS PARÂMETROS POSSÍVEIS
        const urlParams = new URLSearchParams(window.location.search);
        const myId = urlParams.get('last8') || urlParams.get('targetId') || ''; // ✅✅✅ CORREÇÃO AQUI!
        const myLang = urlParams.get('lang') || 'pt-BR';

        console.log('🎯 NOTIFICADOR - DEBUG COMPLETO:', {
            last8: urlParams.get('last8'),
            targetId: urlParams.get('targetId'), 
            lang: urlParams.get('lang'),
            myIdFinal: myId,
            todosParametros: Object.fromEntries(urlParams)
        });

        console.log('🔍 URL COMPLETA:', window.location.href);

        // ✅ VERIFICAR SE TEM O ID NECESSÁRIO
        if (!myId) {
            console.error('❌ NOTIFICADOR: NENHUM ID RECEBIDO - Parâmetros disponíveis:', Object.fromEntries(urlParams));
            alert('Erro: ID não recebido. Recarregue o app.\nDebug: ' + JSON.stringify(Object.fromEntries(urlParams)));
            return;
        }

        document.getElementById('myId').textContent = myId;

        console.log('🆔 IDs da Conexão - Notificador:', {
            notificadorId: myId, // ✅ MESMO ID do Receiver original
            conexaoPossivel: myId.length >= 8 // Deve ter pelo menos 8 caracteres
        });

        // ✅ GUARDAR INFO (sem token - não é necessário)
        window.receiverInfo = {
            id: myId,    // ✅ targetId do receiver original
            lang: myLang   // ✅ idioma
        };

        console.log('💾 Notificador Info guardada:', window.receiverInfo);

        // ✅ CONFIGURAR HANDLERS ANTES DE INICIALIZAR
        window.rtcCore.setDataChannelCallback(async (mensagem) => {
            iniciarSomDigitacao();

            console.log('📩 Mensagem recebida no NOTIFICADOR:', mensagem);

            const elemento = document.getElementById('texto-recebido');
            const imagemImpaciente = document.getElementById('lemurFixed');
            
            if (elemento) {
                elemento.textContent = "";
                elemento.style.opacity = '1';
                elemento.style.transition = 'opacity 0.5s ease';
                
                elemento.style.animation = 'pulsar-flutuar-intenso 0.8s infinite ease-in-out';
                elemento.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                elemento.style.border = '2px solid #ff0000';
            }

            if (imagemImpaciente) {
                imagemImpaciente.style.display = 'block';
            }

            const idiomaExato = window.meuIdiomaLocal || 'pt-BR';
            
            console.log(`🎯 TTS Notificador: Idioma guardado = ${idiomaExato}`);
            
            await falarTextoSistemaHibrido(mensagem, elemento, imagemImpaciente, idiomaExato);
        });

        console.log('🔌 Inicializando socket handlers NOTIFICADOR...');
        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();

        // ✅✅✅ CORREÇÃO CRÍTICA: NOTIFICADOR DEVE SE REGISTRAR COMO RECEIVER
        window.rtcCore.connect();
        console.log('🔗 NOTIFICADOR registrado no servidor sinalizador com ID:', myId);

        // ✅ MARCA QUE O WEBRTC ESTÁ INICIALIZADO
        window.rtcCore.isInitialized = true;
        console.log('✅ WebRTC NOTIFICADOR inicializado com ID:', myId);

        // ✅ NOTIFICADOR = RECEIVER (ESPERA conexão - não inicia)
        console.log('🎯 NOTIFICADOR: Esperando Caller conectar...');

        // ✅ CONFIGURAR HANDLER PARA CHAMADAS RECEBIDAS
        window.rtcCore.setIncomingCallCallback((offer, idiomaDoCaller) => {
            console.log('📞 Chamada recebida no NOTIFICADOR de:', idiomaDoCaller);
            
            if (window.rtcCore && window.localStream) {
                window.rtcCore.handleIncomingCall(offer, window.localStream, (remoteStream) => {
                    console.log('✅ Conexão estabelecida com Caller! - Notificador');
                    
                    if (remoteStream) {
                        remoteStream.getAudioTracks().forEach(track => track.enabled = false);
                        
                        const remoteVideo = document.getElementById('remoteVideo');
                        if (remoteVideo) {
                            remoteVideo.srcObject = remoteStream;
                        }
                        
                        // ✅ FECHA INSTRUÇÕES AO CONECTAR
                        const instructionBox = document.getElementById('instructionBox');
                        if (instructionBox) {
                            instructionBox.classList.remove('expandido');
                            instructionBox.classList.add('recolhido');
                            console.log('📖 Instruções fechadas (WebRTC conectado) - Notificador');
                        }
                    }
                    
                    // ✅ CONFIGURA IDIOMA PARA TRADUÇÃO
                    if (idiomaDoCaller) {
                        window.sourceTranslationLang = idiomaDoCaller;
                        window.targetTranslationLang = myLang;
                        aplicarBandeiraRemota(idiomaDoCaller);
                        console.log(`🎯 Tradução: ${idiomaDoCaller} → ${myLang}`);
                    }
                });
            }
        });

        // ✅ CONFIGURAÇÕES DE IDIOMA
        const navegadorLang = await obterIdiomaCompleto(navigator.language);
        aplicarBandeiraLocal(navegadorLang);

        console.log('✅✅✅ WebRTC Notificador completamente inicializado e PRONTO para receber conexões!');

    } catch (error) {
        console.error("❌ Erro não crítico na câmera NOTIFICADOR:", error);
        
        // ✅ CORREÇÃO: SE A CÂMERA FALHAR, INICIAR SEM ELA
        console.log('🔄 Iniciando WebRTC sem câmera...');
        window.localStream = null;
        
        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) {
            mobileLoading.style.display = 'none';
        }
        
        console.log('🟡 NOTIFICADOR continua funcionando (áudio/texto)');
        
        // ✅ INICIAR WEBRTC MESMO SEM CÂMERA
        window.rtcCore = new WebRTCCore();
        
        const urlParams = new URLSearchParams(window.location.search);
        const myId = urlParams.get('last8') || '';
        const myLang = urlParams.get('lang') || 'pt-BR';
        
        if (myId) {
            window.rtcCore.initialize(myId);
            window.rtcCore.setupSocketHandlers();
            window.rtcCore.isInitialized = true;
            window.rtcCore.connect();
            
            console.log('✅ NOTIFICADOR WebRTC inicializado sem câmera, aguardando conexões...');
        }
    }
}

// 🚀 INICIALIZAÇÃO AUTOMÁTICA
window.onload = async () => {
    try {
        console.log('🚀 Iniciando aplicação notificador automaticamente...');
        
        const lang = navigator.language || 'pt-BR';
        
        await aplicarBandeiraLocal(lang);
        await traduzirFrasesFixas();
        
        iniciarAudio();
        await carregarSomDigitacao();
        await solicitarTodasPermissoes();
        
        setupInstructionToggle();
        
        if (typeof window.liberarInterface === 'function') {
            window.liberarInterface();
            console.log('✅ Interface liberada via função global');
        } else {
            liberarInterfaceFallback();
            console.log('✅ Interface liberada via fallback');
        }
        
        await iniciarCameraAposPermissoes();
        
        console.log('✅ Notificador iniciado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar notificador:', error);
        
        if (typeof window.mostrarErroCarregamento === 'function') {
            window.mostrarErroCarregamento('Erro ao solicitar permissões de câmera e microfone');
        } else {
            console.error('❌ Erro no carregamento:', error);
            alert('Erro ao inicializar: ' + error.message);
        }
    }
};

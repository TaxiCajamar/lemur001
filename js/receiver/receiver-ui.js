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

// 🎤 SISTEMA HÍBRIDO TTS AVANÇADO
let primeiraFraseTTS = true;
let navegadorTTSPreparado = false;
let ultimoIdiomaTTS = 'pt-BR';

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

// ✅ FUNÇÃO PARA LIBERAR INTERFACE (FALLBACK)
function liberarInterfaceFallback() {
    console.log('🔓 Usando fallback para liberar interface...');
    
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
        console.log('✅ Tela de loading removida');
    }
    
    const elementosEscondidos = document.querySelectorAll('.hidden-until-ready');
    elementosEscondidos.forEach(elemento => {
        elemento.style.display = '';
    });
    
    console.log(`✅ ${elementosEscondidos.length} elementos liberados`);
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

// 🎥 FUNÇÃO PARA ALTERNAR ENTRE CÂMERAS (CORRIGIDA)
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
            console.log(`📡 Estado da conexão WebRTC: ${connectionState}`);
            
            if (connectionState === 'connected') {
                console.log('🔄 Atualizando WebRTC com nova câmera...');
                
                try {
                    window.rtcCore.localStream = newStream;
                    
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
            }
        } catch (fallbackError) {
            console.error('❌ Fallback também falhou:', fallbackError);
        }
    }

    console.log('✅ Botão de alternar câmera configurado');
}

// ✅ FUNÇÃO PARA ESCONDER O BOTÃO CLICK QUANDO WEBRTC CONECTAR
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

// ✅✅✅ CORREÇÃO NO RECEIVER-UI.JS - MANTER PREFIXO U-
async function iniciarCameraAposPermissoes() {
    try {
        // ✅ INICIAR CÂMERA
        console.log('🎥 Iniciando câmera...');
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = stream;
            console.log('✅ Câmera iniciada com sucesso');
        }

        window.localStream = stream;

        // ✅ CONFIGURAR BOTÃO DE ALTERNAR CÂMERA
        setupCameraToggle();
        esconderClickQuandoConectar();

        // ✅ EXTRAIR PARÂMETROS
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token') || '';
        const last8 = params.get('last8') || ''; // ✅ JÁ VEM COM U- DO DART
        const lang = params.get('lang') || navigator.language || 'pt-BR';

        console.log('🎯 Dados recebidos do Dart:', {
            last8, // ✅ EX: "U-xyz123ab"
            token: token ? `PRESENTE (${token.length} chars)` : 'AUSENTE',
            lang
        });

        // ✅ USA O LAST8 COM PREFIXO COMO ID FIXO
        const myId = last8; // ✅ "U-xyz123ab"

        console.log('🆔 ID FIXO do Receiver:', myId);
        console.log('🔢 Last8 recebido:', last8);
        console.log('🔑 Token:', token.substring(0, 20) + '...');
        console.log('🌐 Idioma:', lang);

        // ✅ DADOS PARA O QR CODE
        window.qrCodeData = {
            myId: myId,      // ✅ "U-xyz123ab"
            token: token,    
            lang: lang       
        };

        // ✅ CONFIGURAR QR CODE COM URL ABSOLUTA
        document.getElementById('logo-traduz').addEventListener('click', function() {
            const modal = document.getElementById('qrModal');
            if (modal) {
                modal.style.display = 'block';
                console.log('🔲 Modal do QR Code aberto');
            }
            
            // ✅ URL ABSOLUTA COM BASE URL FIXA
            const baseUrl = 'https://lemur-interface-traducao.pages.dev';
            const callerUrl = `${baseUrl}/caller.html?targetId=${window.qrCodeData.myId}&token=${encodeURIComponent(window.qrCodeData.token)}&lang=${encodeURIComponent(window.qrCodeData.lang)}`;
            
            console.log('🔗 URL do QR Code:', callerUrl);
            
            QRCodeGenerator.generate("qrcode", callerUrl);
        });

    } catch (error) {
        console.error('❌ Erro em iniciarCameraAposPermissoes:', error);
    }
}

// 🚀 INICIALIZAÇÃO AUTOMÁTICA
window.onload = async () => {
    try {
        console.log('🚀 Iniciando aplicação receiver automaticamente...');
        
        const params = new URLSearchParams(window.location.search);
        const lang = params.get('lang') || navigator.language || 'pt-BR';
        
        await aplicarBandeiraLocal(lang);
        await traduzirFrasesFixas();
        
      // iniciarAudio();
        // await carregarSomDigitacao();
        
        await solicitarTodasPermissoes();
        
        if (typeof window.liberarInterface === 'function') {
            window.liberarInterface();
            console.log('✅ Interface liberada via função global');
        } else {
            liberarInterfaceFallback();
            console.log('✅ Interface liberada via fallback');
        }
        
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
    
    // 🎵 INICIAR ÁUDIO APÓS CLIQUE DO USUÁRIO
document.addEventListener('click', function iniciarAudioAposInteracao() {
    iniciarAudio();
    carregarSomDigitacao();
    document.removeEventListener('click', iniciarAudioAposInteracao);
    console.log('🎵 Áudio iniciado após interação do usuário');
}, { once: true });
    }

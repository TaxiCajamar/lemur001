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
        } else {
            instructionBox.classList.remove('expandido');
            instructionBox.classList.add('recolhido');
        }
    });
    
    document.addEventListener('click', function(e) {
        if (!instructionBox.contains(e.target) && isExpanded) {
            instructionBox.classList.remove('expandido');
            instructionBox.classList.add('recolhido');
            isExpanded = false;
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

// 🆕 VARIÁVEL PARA TECLADO NATIVO
let typingTimer;

// 🎵 CARREGAR SOM DE DIGITAÇÃO
function carregarSomDigitacao() {
    return new Promise((resolve) => {
        try {
            somDigitacao = new Audio('assets/audio/keyboard.mp3');
            somDigitacao.volume = 0.3;
            somDigitacao.preload = 'auto';
            
            somDigitacao.addEventListener('canplaythrough', () => {
                audioCarregado = true;
                resolve(true);
            });
            
            somDigitacao.addEventListener('error', () => {
                resolve(false);
            });
            
            somDigitacao.load();
            
        } catch (error) {
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
        somDigitacao.play().catch(error => {});
    } catch (error) {}
}

function pararSomDigitacao() {
    if (somDigitacao) {
        try {
            somDigitacao.pause();
            somDigitacao.currentTime = 0;
            somDigitacao.loop = false;
        } catch (error) {}
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
}

async function solicitarTodasPermissoes() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        stream.getTracks().forEach(track => track.stop());
        
        permissaoConcedida = true;
        window.permissoesConcedidas = true;
        window.audioContext = audioContext;
        
        return true;
        
    } catch (error) {
        permissaoConcedida = false;
        window.permissoesConcedidas = false;
        throw error;
    }
}

async function obterIdiomaCompleto(lang) {
    if (!lang) return 'pt-BR';
    if (lang.includes('-')) return lang;

    try {
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();
        const codigoCompleto = Object.keys(flags).find(key => key.startsWith(lang + '-'));
        return codigoCompleto || `${lang}-${lang.toUpperCase()}`;
    } catch (error) {
        const fallback = {
            'pt': 'pt-BR', 'es': 'es-ES', 'en': 'en-US',
            'fr': 'fr-FR', 'de': 'de-DE', 'it': 'it-IT'
        };
        return fallback[lang] || 'en-US';
    }
}

async function translateText(text, targetLang) {
    try {
        const response = await fetch('https://chat-tradutor-7umw.onrender.com/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, targetLang })
        });

        const result = await response.json();
        return result.translatedText || text;
    } catch (error) {
        return text;
    }
}

async function aplicarBandeiraLocal(langCode) {
    try {
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();

        const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';

        window.meuIdiomaLocal = langCode;

        const languageFlagElement = document.querySelector('.language-flag');
        if (languageFlagElement) languageFlagElement.textContent = bandeira;

        const localLangDisplay = document.querySelector('.local-Lang');
        if (localLangDisplay) localLangDisplay.textContent = bandeira;

    } catch (error) {}
}

async function aplicarBandeiraRemota(langCode) {
    try {
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();

        const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';

        window.meuIdiomaRemoto = langCode;

        const remoteLangElement = document.querySelector('.remoter-Lang');
        if (remoteLangElement) remoteLangElement.textContent = bandeira;

    } catch (error) {
        const remoteLangElement = document.querySelector('.remoter-Lang');
        if (remoteLangElement) remoteLangElement.textContent = '🔴';
    }
}

function liberarInterfaceFallback() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
    
    const elementosEscondidos = document.querySelectorAll('.hidden-until-ready');
    elementosEscondidos.forEach(elemento => {
        elemento.style.display = '';
    });
}

async function traduzirFrasesFixas() {
  try {
    const idiomaExato = window.meuIdiomaLocal || 'pt-BR';

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
      }
    }

  } catch (error) {}
}

function setupCameraToggle() {
    const toggleButton = document.getElementById('toggleCamera');
    let currentCamera = 'user';
    let isSwitching = false;

    if (!toggleButton) return;

    toggleButton.addEventListener('click', async () => {
        if (isSwitching) return;

        isSwitching = true;
        toggleButton.style.opacity = '0.5';
        toggleButton.style.cursor = 'wait';

        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => {
                    track.stop();
                });
                window.localStream = null;
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            currentCamera = currentCamera === 'user' ? 'environment' : 'user';
            
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
                await tryFallbackCameras(currentCamera);
            }

        } catch (error) {
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

        if (window.rtcCore && window.rtcCore.peer) {
            const connectionState = window.rtcCore.peer.connectionState;
            
            if (connectionState === 'connected') {
                try {
                    window.rtcCore.localStream = newStream;
                    
                    const newVideoTrack = newStream.getVideoTracks()[0];
                    const senders = window.rtcCore.peer.getSenders();
                    
                    let videoUpdated = false;
                    for (const sender of senders) {
                        if (sender.track && sender.track.kind === 'video') {
                            await sender.replaceTrack(newVideoTrack);
                            videoUpdated = true;
                        }
                    }
                    
                } catch (webrtcError) {}
            }
        }
    }

    async function tryFallbackCameras(requestedCamera) {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
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
                
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        deviceId: { exact: newDeviceId },
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
                });

                await handleNewStream(newStream, 'fallback');
                
            } else {
                alert('Apenas uma câmera foi detectada neste dispositivo.');
            }
        } catch (fallbackError) {
            alert('Não foi possível acessar outra câmera. Verifique as permissões.');
        }
    }
}

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
                    observer.disconnect();
                }
            }
        });
    });
    
    observer.observe(remoteVideo, {
        attributes: true,
        attributeFilter: ['srcObject']
    });
}

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
            };
            
            utterance.onend = () => {
                if (imagemImpaciente) {
                    imagemImpaciente.style.display = 'none';
                }
                resolve(true);
            };
            
            utterance.onerror = (error) => {
                pararSomDigitacao();
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
        };
        window.speechSynthesis.speak(utterance);
    } catch (error) {}
}

async function falarComGoogleTTS(mensagem, elemento, imagemImpaciente, idioma) {
    try {
        const resposta = await fetch('https://chat-tradutor-7umw.onrender.com/speak', {
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
        };
        
        audio.onended = () => {
            if (imagemImpaciente) {
                imagemImpaciente.style.display = 'none';
            }
        };
        
        audio.onerror = () => {
            pararSomDigitacao();
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
        throw error;
    }
}

async function falarTextoSistemaHibrido(mensagem, elemento, imagemImpaciente, idioma) {
    try {
        ultimoIdiomaTTS = idioma;
        
        if (primeiraFraseTTS) {
            await falarComGoogleTTS(mensagem, elemento, imagemImpaciente, idioma);
            prepararNavegadorTTS(idioma);
            primeiraFraseTTS = false;
            
        } else {
            const sucesso = await falarComNavegadorTTS(mensagem, elemento, imagemImpaciente, idioma);
            
            if (!sucesso) {
                await falarComGoogleTTS(mensagem, elemento, imagemImpaciente, idioma);
            }
        }
        
    } catch (error) {
        await falarComNavegadorTTS(mensagem, elemento, imagemImpaciente, idioma);
    }
}

// 🆕 🆕 🆕 SISTEMA TECLADO NATIVO (APENAS ISSO) 🆕 🆕 🆕
function abrirTecladoNativo() {
    const chatContainer = document.getElementById('chatInputContainer');
    const textInput = document.getElementById('textInput');
    
    chatContainer.classList.add('visible');
    setTimeout(() => textInput.focus(), 100);
    
    textInput.addEventListener('input', function() {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            const texto = textInput.value.trim();
            if (texto && window.rtcCore?.dataChannel) {
                window.rtcCore.dataChannel.send(texto);
                textInput.value = '';
                chatContainer.classList.remove('visible');
                textInput.blur();
            }
        }, 3000);
    });
}

async function iniciarCameraAposPermissoes() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        }).catch(error => {
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
            
        } else {
            window.localStream = null;
        }

        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) {
            mobileLoading.style.display = 'none';
        }

        setTimeout(() => {
            const elementoClick = document.getElementById('click');
            if (elementoClick) {
                elementoClick.style.display = 'block';
                elementoClick.classList.add('piscar-suave');
            }
        }, 500);

        window.rtcCore = new WebRTCCore();

        const params = new URLSearchParams(window.location.search);
        const token = params.get('token') || '';
        const targetIdFromUrl = params.get('targetId') || '';

        const myId = targetIdFromUrl || crypto.randomUUID().substr(0, 8);

        const lang = params.get('lang') || navigator.language || 'pt-BR';

        window.targetTranslationLang = lang;

        window.qrCodeData = {
            myId: myId,
            token: token,
            lang: lang
        };

        document.getElementById('logo-traduz').addEventListener('click', function() {
            const overlay = document.querySelector('.info-overlay');
            const qrcodeContainer = document.getElementById('qrcode');
            
            if (overlay && !overlay.classList.contains('hidden')) {
                overlay.classList.add('hidden');
                return;
            }
            
            const remoteVideo = document.getElementById('remoteVideo');
            const isConnected = remoteVideo && remoteVideo.srcObject;
            
            if (isConnected) {
                return;
            }
            
            if (qrcodeContainer) {
                qrcodeContainer.innerHTML = '';
            }
            
            const callerUrl = `${window.location.origin}/caller-selector.html?targetId=${window.qrCodeData.myId}&token=${encodeURIComponent(window.qrCodeData.token)}&lang=${encodeURIComponent(window.qrCodeData.lang)}`;
            
            QRCodeGenerator.generate("qrcode", callerUrl);

            const btnCopiar = document.getElementById('copiarLink');
            if (btnCopiar) {
                btnCopiar.onclick = function() {
                    navigator.clipboard.writeText(callerUrl).then(() => {
                        btnCopiar.textContent = '✅';
                        btnCopiar.classList.add('copiado');
                        
                        setTimeout(() => {
                            btnCopiar.textContent = '🔗';
                            btnCopiar.classList.remove('copiado');
                        }, 2000);
                    }).catch(err => {
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
            
            if (overlay) {
                overlay.classList.remove('hidden');
            }
        });

        document.querySelector('.info-overlay').addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.add('hidden');
            }
        });

        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();

        window.rtcCore.setDataChannelCallback(async (mensagem) => {
            iniciarSomDigitacao();

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
            
            await falarTextoSistemaHibrido(mensagem, elemento, imagemImpaciente, idiomaExato);
        });

        window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
            console.log('🎯 Caller fala:', idiomaDoCaller);

            console.log('🎯 Eu (receiver) entendo:', lang);

            window.sourceTranslationLang = idiomaDoCaller;
            window.targetTranslationLang = lang;

            window.rtcCore.handleIncomingCall(offer, window.localStream, (remoteStream) => {
                remoteStream.getAudioTracks().forEach(track => track.enabled = false);

                const overlay = document.querySelector('.info-overlay');
                if (overlay) overlay.classList.add('hidden');

                const remoteVideo = document.getElementById('remoteVideo');
                if (remoteVideo) {
                    remoteVideo.srcObject = remoteStream;
                    
                    const elementoClick = document.getElementById('click');
                    if (elementoClick) {
                        elementoClick.style.display = 'none';
                        elementoClick.classList.remove('piscar-suave');
                    }
                }

                window.targetTranslationLang = idiomaDoCaller || lang;

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

        esconderClickQuandoConectar();

        // 🆕 🆕 🆕 CONFIGURA BOTÃO PARA TECLADO NATIVO 🆕 🆕 🆕
        const recordButton = document.getElementById('recordButton');
        if (recordButton) {
            recordButton.addEventListener('click', abrirTecladoNativo);
        }

    } catch (error) {
        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) {
            mobileLoading.style.display = 'none';
        }
    }
}

window.onload = async () => {
    try {
        const params = new URLSearchParams(window.location.search);
        const lang = params.get('lang') || navigator.language || 'pt-BR';
        
        await aplicarBandeiraLocal(lang);
        await traduzirFrasesFixas();
        
        iniciarAudio();
        await carregarSomDigitacao();
        await solicitarTodasPermissoes();
        
        if (typeof window.liberarInterface === 'function') {
            window.liberarInterface();
        } else {
            liberarInterfaceFallback();
        }
        
        await iniciarCameraAposPermissoes();
        
    } catch (error) {
        if (typeof window.mostrarErroCarregamento === 'function') {
            window.mostrarErroCarregamento('Erro ao solicitar permissões de câmera e microfone');
        } else {
            alert('Erro ao inicializar: ' + error.message);
        }
    }
};

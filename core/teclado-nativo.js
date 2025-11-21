// 🎯 FUNÇÕES GLOBAIS PARA TECLADO NATIVO - COMPARTILHADAS ENTRE CALLER E RECEIVER

// 🎯 PONTE GLOBAL PARA PROCESSAMENTO DE TEXTO
window.processarTextoTeclado = async function(texto) {
  console.log('🎹 Processando texto do teclado:', texto);
  
  try {
    // 🎯 SOLUÇÃO DIRETA: Simula o mesmo fluxo do microfone
    if (window.rtcCore && window.rtcCore.dataChannel && 
        window.rtcCore.dataChannel.readyState === 'open') {
      
      // 1. Traduz o texto (usando a mesma API)
      const response = await fetch('https://chat-tradutor-7umw.onrender.com/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: texto,
          targetLang: window.meuIdiomaRemoto || 'en'
        })
      });

      const result = await response.json();
      const translatedText = result.translatedText || texto;
      
      console.log('🌐 Texto traduzido:', translatedText);
      
      // 2. Envia via WebRTC (igual ao microfone)
      window.rtcCore.dataChannel.send(translatedText);
      console.log('✅ Texto enviado para outro celular via WebRTC');
      
    } else {
      console.log('❌ WebRTC não está pronto. Tentando novamente...');
      setTimeout(() => window.processarTextoTeclado(texto), 500);
    }
  } catch (error) {
    console.error('❌ Erro ao processar texto do teclado:', error);
  }
};

// 🆕 FUNÇÕES PARA CONTROLE DO BOTÃO TECLADO
window.habilitarTeclado = function() {
  const tecladoTrigger = document.getElementById('tecladoTrigger');
  if (tecladoTrigger) {
    tecladoTrigger.disabled = false;
    tecladoTrigger.style.opacity = '1';
    tecladoTrigger.style.cursor = 'pointer';
    tecladoTrigger.classList.add('ativo');
    console.log('✅ Botão teclado habilitado - WebRTC conectado');
  }
};

window.desabilitarTeclado = function() {
  const tecladoTrigger = document.getElementById('tecladoTrigger');
  if (tecladoTrigger) {
    tecladoTrigger.disabled = true;
    tecladoTrigger.style.opacity = '0.5';
    tecladoTrigger.style.cursor = 'not-allowed';
    tecladoTrigger.classList.remove('ativo');
    console.log('❌ Botão teclado desabilitado');
  }
};

// 🆕 INICIALIZAÇÃO DO TECLADO
window.inicializarTeclado = function() {
  // 🆕 INICIALIZAR BOTÃO TECLADO COMO DESABILITADO
  window.desabilitarTeclado();
  
  // 🆕 POSICIONAR O BOTÃO INVISÍVEL SOBRE O MICROFONE
  function posicionarBotaoTeclado() {
    const recordButton = document.getElementById('recordButton');
    const tecladoTrigger = document.getElementById('tecladoTrigger');
    
    if (recordButton && tecladoTrigger) {
      const rect = recordButton.getBoundingClientRect();
      
      tecladoTrigger.style.position = 'fixed';
      tecladoTrigger.style.left = rect.left + 'px';
      tecladoTrigger.style.top = rect.top + 'px';
      tecladoTrigger.style.width = rect.width + 'px';
      tecladoTrigger.style.height = rect.height + 'px';
      
      console.log('✅ Botão teclado posicionado sobre o microfone');
    }
  }
  
  // Aguarda um pouco para garantir que o DOM esteja pronto
  setTimeout(() => {
    posicionarBotaoTeclado();
    window.addEventListener('resize', posicionarBotaoTeclado);
  }, 1000);
  
 // 🆕 CONFIGURAR CLIQUE NO BOTÃO INVISÍVEL
const tecladoTrigger = document.getElementById('tecladoTrigger');
const caixaTexto = document.getElementById('caixaTexto');
const areaTexto = document.getElementById('areaTexto');

// 🆕 VARIÁVEL DO TIMER
let timerEnvio = null;

if (tecladoTrigger && caixaTexto) {
  tecladoTrigger.addEventListener('click', function() {
    if (tecladoTrigger.disabled) {
      console.log('❌ Botão teclado desabilitado - WebRTC não conectado');
      return;
    }
    
    console.log('🎹 Abrindo teclado nativo...');
    
    // 🆕 SEMPRE MOSTRAR A CAIXA QUANDO ABRIR TECLADO
    caixaTexto.style.display = 'flex';
    areaTexto.focus();
  });

  // 🆕 DETECTAR QUANDO TECLADO É MINIMIZADO (FOCUS OUT)
  areaTexto.addEventListener('blur', function() {
    console.log('🎹 Teclado minimizado - fechando caixa');
    caixaTexto.style.display = 'none';
    areaTexto.value = '';
  });

  // 🆕 DETECTAR QUANDO USUÁRIO CANCELA (TOUCH FORA)
  document.addEventListener('click', function(event) {
    if (caixaTexto.style.display === 'flex' && 
        !caixaTexto.contains(event.target) && 
        event.target !== tecladoTrigger) {
      console.log('🎹 Clique fora - fechando teclado e caixa');
      caixaTexto.style.display = 'none';
      areaTexto.value = '';
      areaTexto.blur();
    }
  });
    
    // 🆕 ENVIO AUTOMÁTICO - SIMPLES
    areaTexto.addEventListener('input', function() {
      // Cancelar timer anterior
      if (timerEnvio) clearTimeout(timerEnvio);
      
      // Iniciar novo timer
      timerEnvio = setTimeout(function() {
        const texto = areaTexto.value.trim();
        if (texto !== '') {
          console.log('⏰ Envio automático');
          window.processarTextoTeclado(texto);
          caixaTexto.style.display = 'none';
          areaTexto.value = '';
        }
      }, 3000); // 3 segundos
    });

    // 🆕 ENVIAR COM ENTER
    areaTexto.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        const texto = areaTexto.value.trim();
        if (texto !== '') {
          console.log('📝 Texto do teclado (Enter):', texto);
          window.processarTextoTeclado(texto);
          caixaTexto.style.display = 'none';
          areaTexto.value = '';
        }
      }
    });
  }
};

// 🆕 INICIALIZAR QUANDO O DOCUMENTO ESTIVER PRONTO
document.addEventListener('DOMContentLoaded', function() {
  window.inicializarTeclado();
});

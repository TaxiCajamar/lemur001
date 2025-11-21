// 🎯 TECLADO NATIVO - SOLUÇÃO CORRETA
window.processarTextoTeclado = async function(texto) {
  console.log('🎹 Processando texto do teclado:', texto);
  
  try {
    if (window.rtcCore && window.rtcCore.dataChannel && 
        window.rtcCore.dataChannel.readyState === 'open') {
      
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
      window.rtcCore.dataChannel.send(translatedText);
      console.log('✅ Texto enviado via WebRTC');
      
    } else {
      console.log('❌ WebRTC não está pronto');
      setTimeout(() => window.processarTextoTeclado(texto), 500);
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  }
};

// 🎯 CONTROLE DO BOTÃO
window.habilitarTeclado = function() {
  const tecladoTrigger = document.getElementById('tecladoTrigger');
  if (tecladoTrigger) {
    tecladoTrigger.disabled = false;
    tecladoTrigger.style.opacity = '1';
    tecladoTrigger.style.cursor = 'pointer';
  }
};

window.desabilitarTeclado = function() {
  const tecladoTrigger = document.getElementById('tecladoTrigger');
  if (tecladoTrigger) {
    tecladoTrigger.disabled = true;
    tecladoTrigger.style.opacity = '0.5';
    tecladoTrigger.style.cursor = 'not-allowed';
  }
};

// 🎯 INICIALIZAÇÃO CORRETA
window.inicializarTeclado = function() {
  window.desabilitarTeclado();
  
  // Posicionar botão sobre o microfone
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
    }
  }
  
  setTimeout(() => {
    posicionarBotaoTeclado();
    window.addEventListener('resize', posicionarBotaoTeclado);
  }, 1000);
  
  // 🎯 CONFIGURAÇÃO PRINCIPAL - SOLUÇÃO CORRETA
  const tecladoTrigger = document.getElementById('tecladoTrigger');
  const inputTeclado = document.getElementById('inputTecladoNativo');
  
  if (tecladoTrigger && inputTeclado) {
    tecladoTrigger.addEventListener('click', function() {
      if (tecladoTrigger.disabled) return;
      
      console.log('🎹 Abrindo teclado nativo...');
      
      // 🎯 FOCO NO INPUT INVISÍVEL - ISSO ABRE O TECLADO NATIVO COMPLETO
      inputTeclado.focus();
      inputTeclado.value = ''; // Limpa texto anterior
    });
    
    // 🎯 CAPTURAR TEXTO DIGITADO (QUANDO USUÁRIO PRESSIONA ENTER)
    inputTeclado.addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        const texto = inputTeclado.value.trim();
        
        if (texto !== '') {
          console.log('📝 Texto digitado:', texto);
          window.processarTextoTeclado(texto);
          inputTeclado.value = ''; // Limpa o campo
          inputTeclado.blur(); // Fecha teclado
        }
      }
    });
    
    // 🎯 QUANDO TECLADO FECHA (BLUR), LIMPA O CAMPO
    inputTeclado.addEventListener('blur', function() {
      console.log('🎹 Teclado fechado');
      inputTeclado.value = '';
    });
  }
};

// 🎯 INICIAR QUANDO PÁGINA CARREGAR
document.addEventListener('DOMContentLoaded', function() {
  window.inicializarTeclado();
});

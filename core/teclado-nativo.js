// 🎯 FUNÇÕES GLOBAIS PARA TECLADO NATIVO - COMPARTILHADAS ENTRE CALLER E RECEIVER

// 🎯 PONTE GLOBAL PARA PROCESSAMENTO DE TEXTO
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
    console.log('✅ Botão teclado habilitado - WebRTC conectado');
  }
};

window.desabilitarTeclado = function() {
  const tecladoTrigger = document.getElementById('tecladoTrigger');
  if (tecladoTrigger) {
    tecladoTrigger.disabled = true;
    tecladoTrigger.style.opacity = '0.5';
    tecladoTrigger.style.cursor = 'not-allowed';
    console.log('❌ Botão teclado desabilitado');
  }
};

// 🆕 BOTÃO SIMPLES PARA FECHAR O BOX
window.criarBotaoFechar = function() {
  const caixaTexto = document.getElementById('caixaTexto');
  if (!caixaTexto) return;
  
  // Criar botão fechar
  const botaoFechar = document.createElement('button');
  botaoFechar.innerHTML = '×';
  botaoFechar.className = 'botao-fechar-simples';
  botaoFechar.onclick = function() {
    caixaTexto.style.display = 'none';
    document.getElementById('areaTexto').value = '';
  };
  
  caixaTexto.appendChild(botaoFechar);
};

// 🆕 INICIALIZAÇÃO SIMPLIFICADA
window.inicializarTeclado = function() {
  window.desabilitarTeclado();
  
  // Posicionar botão invisível sobre o microfone
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
    window.criarBotaoFechar(); // 🆕 CRIAR BOTÃO FECHAR
    window.addEventListener('resize', posicionarBotaoTeclado);
  }, 1000);
  
  // Configurar clique no botão invisível
  const tecladoTrigger = document.getElementById('tecladoTrigger');
  const caixaTexto = document.getElementById('caixaTexto');
  const areaTexto = document.getElementById('areaTexto');
  
  let timerEnvio = null;
  
  if (tecladoTrigger && caixaTexto) {
    tecladoTrigger.addEventListener('click', function() {
      if (tecladoTrigger.disabled) {
        console.log('❌ Botão teclado desabilitado - WebRTC não conectado');
        return;
      }
      
      console.log('🎹 Abrindo caixa de texto...');
      caixaTexto.style.display = 'flex';
      areaTexto.focus();
    });
    
    // Envio automático após 3 segundos
    areaTexto.addEventListener('input', function() {
      if (timerEnvio) clearTimeout(timerEnvio);
      
      timerEnvio = setTimeout(function() {
        const texto = areaTexto.value.trim();
        if (texto !== '') {
          window.processarTextoTeclado(texto);
          caixaTexto.style.display = 'none';
          areaTexto.value = '';
        }
      }, 2000);
    });

    // Enviar com Enter
    areaTexto.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        const texto = areaTexto.value.trim();
        if (texto !== '') {
          window.processarTextoTeclado(texto);
          caixaTexto.style.display = 'none';
          areaTexto.value = '';
        }
      }
    });
  }
};

// 🆕 INICIALIZAR
document.addEventListener('DOMContentLoaded', function() {
  window.inicializarTeclado();
});

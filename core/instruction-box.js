// core/instruction-box.js (VERSÃO ALTERNATIVA - MAIS SEGURA)

// 🎯 DADOS DAS INSTRUÇÕES - CENTRALIZADO
const INSTRUCOES = {
  caller: [
    {
      icon: "assets/images/hello.png",
      alt: "Hello icon",
      textId: "welcome-text",
      text: "Welcome! Let's begin."
    },
    {
      icon: "assets/images/realtime.png", 
      alt: "Realtime icon",
      textId: "translator-label-2",
      text: "Real-time translation."
    },
    {
      icon: "assets/images/Ancioso.png",
      alt: "Loading icon", 
      textId: "wait-connection",
      text: "Waiting for connection."
    },
    {
      icon: "assets/images/juntos.png",
      alt: "Connected icon",
      textId: "both-connected", 
      text: "Both online."
    },
    {
      icon: "assets/images/trduz.png",
      alt: "Message icon",
      textId: "check-replies",
      text: "Read the message."
    },
    {
      icon: "assets/images/mic.png",
      alt: "Mic icon",
      textId: "drop-voice",
      text: "Speak clearly."
    },
    {
      icon: "assets/images/cam.png",
      alt: "Camera icon",
      textId: "flip-cam", 
      text: "Flip the camera. Share!"
    }
  ],
  receiver: [
    {
      icon: "assets/images/hello.png",
      alt: "Hello icon",
      textId: "welcome-text", 
      text: "Welcome! Let's begin."
    },
    {
      icon: "assets/images/realtime.png",
      alt: "Realtime icon",
      textId: "translator-label-2",
      text: "Real-time translation."
    },
    {
      icon: "assets/images/QRcode.png",
      alt: "QR icon", 
      textId: "tap-qr",
      text: "Tap the QR code to start."
    },
    {
      icon: "assets/images/mobil.png",
      alt: "Mobile icon",
      textId: "quick-scan",
      text: "Ask to scan the QR."
    },
    {
      icon: "assets/images/Ancioso.png",
      alt: "Loading icon",
      textId: "wait-connection",
      text: "Waiting for connection."
    },
    {
      icon: "assets/images/juntos.png",
      alt: "Connected icon", 
      textId: "both-connected",
      text: "Both online."
    },
    {
      icon: "assets/images/trduz.png",
      alt: "Message icon",
      textId: "check-replies",
      text: "Read the message."
    },
    {
      icon: "assets/images/mic.png",
      alt: "Mic icon",
      textId: "drop-voice",
      text: "Speak clearly."
    },
    {
      icon: "assets/images/cam.png",
      alt: "Camera icon",
      textId: "flip-cam",
      text: "Flip the camera. Share!"
    }
  ]
};

// 🎯 FUNÇÃO PARA CRIAR INSTRUCTION BOX (VERSÃO SIMPLIFICADA)
function criarInstructionBox(tipo) {
  const instrucoes = INSTRUCOES[tipo] || [];
  
  const instructionBox = document.createElement('div');
  instructionBox.className = 'instruction-box expandido';
  instructionBox.id = 'instructionBox';
  
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'instruction-toggle';
  toggleBtn.id = 'instructionToggle';
  toggleBtn.textContent = '×';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'instruction-content';
  
  // Adiciona os itens de instrução
  instrucoes.forEach(item => {
    const instructionItem = document.createElement('div');
    instructionItem.className = 'instruction-item';
    
    const img = document.createElement('img');
    img.src = item.icon;
    img.alt = item.alt;
    
    const span = document.createElement('span');
    span.id = item.textId;
    span.textContent = item.text;
    
    instructionItem.appendChild(img);
    instructionItem.appendChild(span);
    contentDiv.appendChild(instructionItem);
  });
  
  instructionBox.appendChild(toggleBtn);
  instructionBox.appendChild(contentDiv);
  
  return instructionBox;
}

// 🎯 INICIALIZAÇÃO AUTOMÁTICA (VERSÃO SIMPLIFICADA)
document.addEventListener('DOMContentLoaded', function() {
  const instructionBoxContainer = document.getElementById('instructionBox');
  
  if (instructionBoxContainer) {
    // Detecta automaticamente o tipo pela URL
    const isReceiver = window.location.pathname.includes('receiver');
    const tipo = isReceiver ? 'receiver' : 'caller';
    
    // Remove o container vazio
    instructionBoxContainer.remove();
    
    // Cria e adiciona o instruction box completo
    const newInstructionBox = criarInstructionBox(tipo);
    document.querySelector('.box-principal').appendChild(newInstructionBox);
    
    // Configura os eventos de toggle
    const toggleBtn = document.getElementById('instructionToggle');
    const box = document.getElementById('instructionBox');
    
    if (toggleBtn && box) {
      // 🔥 EVENTO ORIGINAL (JÁ FUNCIONA) - MANTIDO
      toggleBtn.addEventListener('click', function() {
        const estaExpandido = box.classList.contains('expandido');
        box.classList.toggle('expandido');
        toggleBtn.textContent = estaExpandido ? '?' : '×';
      });
      
      // 🔥 NOVO EVENTO ACRESCENTADO - CLIQUE EM QUALQUER LUGAR DO BOX
      box.addEventListener('click', function(e) {
        // Só processa se não foi clique direto no botão X/?
        if (e.target !== toggleBtn) {
          const estaExpandido = box.classList.contains('expandido');
          box.classList.toggle('expandido');
          toggleBtn.textContent = estaExpandido ? '?' : '×';
        }
      });
    }
  }
});

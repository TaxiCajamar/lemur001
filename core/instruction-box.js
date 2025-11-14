// core/instruction-box.js

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

// 🎯 FUNÇÃO PARA CRIAR INSTRUCTION BOX
function criarInstructionBox(tipo) {
  const instrucoes = INSTRUCOES[tipo] || [];
  
  return `
    <div class="instruction-box expandido" id="instructionBox">
      <button class="instruction-toggle" id="instructionToggle">×</button>
      <div class="instruction-content">
        ${instrucoes.map(item => `
          <div class="instruction-item">
            <img src="${item.icon}" alt="${item.alt}" />
            <span id="${item.textId}">${item.text}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// 🎯 FUNÇÃO PARA ATUALIZAR O BOTÃO TOGGLE
function atualizarBotaoToggle() {
  const toggleBtn = document.getElementById('instructionToggle');
  const box = document.getElementById('instructionBox');
  
  if (toggleBtn && box) {
    if (box.classList.contains('expandido')) {
      toggleBtn.textContent = '×'; // X quando expandido
    } else {
      toggleBtn.textContent = '?'; // ? quando recolhido
    }
  }
}

// 🎯 FUNÇÃO PARA CONFIGURAR O TOGGLE
function configurarToggleInstructionBox() {
  const toggleBtn = document.getElementById('instructionToggle');
  const box = document.getElementById('instructionBox');
  
  if (toggleBtn && box) {
    toggleBtn.addEventListener('click', function() {
      box.classList.toggle('expandido');
      atualizarBotaoToggle(); // Atualiza o símbolo do botão
    });
    
    // Configura o símbolo inicial
    atualizarBotaoToggle();
  }
}

// 🎯 INICIALIZAÇÃO AUTOMÁTICA
document.addEventListener('DOMContentLoaded', function() {
  const instructionBoxElement = document.getElementById('instructionBox');
  
  if (instructionBoxElement) {
    // Detecta automaticamente o tipo pela URL
    const isReceiver = window.location.pathname.includes('receiver');
    const tipo = isReceiver ? 'receiver' : 'caller';
    
    // Substitui o container vazio pelo HTML completo
    instructionBoxElement.outerHTML = criarInstructionBox(tipo);
    
    // Configura o evento de toggle
    configurarToggleInstructionBox();
  }
});

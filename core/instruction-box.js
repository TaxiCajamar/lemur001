// core/instruction-box.js (VERSÃO ALTERNATIVA - MAIS SEGURA)

// 🎯 DADOS DAS INSTRUÇÕES - CENTRALIZADO
const INSTRUCOES = {
  // ... (mantém o mesmo objeto INSTRUCOES acima)
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
    
    // Configura o evento de toggle
    const toggleBtn = document.getElementById('instructionToggle');
    const box = document.getElementById('instructionBox');
    
    if (toggleBtn && box) {
      toggleBtn.addEventListener('click', function() {
        const estaExpandido = box.classList.contains('expandido');
        box.classList.toggle('expandido');
        toggleBtn.textContent = estaExpandido ? ' ' : ' ';
      });
    }
  }
});

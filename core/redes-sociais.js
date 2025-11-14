// core/redes-sociais.js

// 🎯 DADOS DAS REDES SOCIAIS - CENTRALIZADO
const REDES_SOCIAIS = [
  {
    url: "https://www.linkedin.com/company/lemurinnovation",
    icon: "assets/images/linke.png",
    alt: "LinkedIn"
  },
  {
    url: "https://www.instagram.com/lemurinnovation", 
    icon: "assets/images/insta.png",
    alt: "Instagram"
  },
  {
    url: "https://www.facebook.com/people/Lemur-Innovation/100063853285249/",
    icon: "assets/images/face.png", 
    alt: "Facebook"
  },
  {
    url: "https://lemurinnovation.com/",
    icon: "assets/images/redeX.png",
    alt: "Website"
  },
  {
    url: "https://wa.me/5511999999999",
    icon: "assets/images/wattsap.png",
    alt: "WhatsApp"
  },
  {
    url: "https://t.me/lemurinnovation",
    icon: "assets/images/telegran.png",
    alt: "Telegram"
  }
];

// 🎯 FUNÇÃO PARA CRIAR HTML DAS REDES SOCIAIS FIXAS
function criarRedesSociaisFixas() {
  return `
    <div class="social-links-fixed">
      ${REDES_SOCIAIS.map(rede => `
        <a href="${rede.url}" target="_blank" class="social-btn-fixed">
          <img src="${rede.icon}" alt="${rede.alt}">
        </a>
      `).join('')}
    </div>
  `;
}

// 🎯 FUNÇÃO PARA CRIAR BOTÕES DE COMPARTILHAMENTO (QR CODE)
function criarBotoesCompartilhamento() {
  return `
    <div class="social-buttons">
      ${REDES_SOCIAIS.map(rede => `
        <button class="social-btn" onclick="compartilharSocial('${rede.alt.toLowerCase()}')">
          <img src="${rede.icon}" alt="${rede.alt}">
        </button>
      `).join('')}
    </div>
  `;
}

// 🎯 FUNÇÃO DE COMPARTILHAMENTO UNIFICADA
function compartilharSocial(rede) {
  const myId = window.qrCodeData?.myId || '';
  const token = window.qrCodeData?.token || '';
  const lang = window.qrCodeData?.lang || 'pt-BR';
  
  const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}&token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang)}`;
  
  const texto = "Conecte-se comigo via tradução em tempo real!";
  const urlEncoded = encodeURIComponent(callerUrl);
  const textoEncoded = encodeURIComponent(texto);
  
  const urls = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${urlEncoded}`,
    instagram: `https://www.instagram.com/lemurinnovation`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${urlEncoded}`,
    website: `https://lemurinnovation.com/`,
    whatsapp: `https://api.whatsapp.com/send?text=${textoEncoded}%20${urlEncoded}`,
    telegram: `https://t.me/share/url?url=${urlEncoded}&text=${textoEncoded}`
  };
  
  if (urls[rede]) {
    window.open(urls[rede], '_blank', 'width=600,height=400');
  }
}

// 🎯 INICIALIZAÇÃO AUTOMÁTICA
document.addEventListener('DOMContentLoaded', function() {
  // Verifica se existe elemento para redes sociais fixas e injeta o HTML
  const redesFixasElement = document.querySelector('.social-links-fixed');
  if (redesFixasElement) {
    redesFixasElement.outerHTML = criarRedesSociaisFixas();
  }
  
  // Verifica se existe elemento para botões de compartilhamento e injeta o HTML
  const botoesShareElement = document.querySelector('.social-buttons');
  if (botoesShareElement) {
    botoesShareElement.outerHTML = criarBotoesCompartilhamento();
  }
});

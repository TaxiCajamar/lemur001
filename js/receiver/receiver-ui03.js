export class QRCodeGenerator {
    static generate(containerId, text) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Usar a biblioteca QRCode já carregada no HTML
        if (window.QRCode) {
            new QRCode(container, {
                text: text,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }
}

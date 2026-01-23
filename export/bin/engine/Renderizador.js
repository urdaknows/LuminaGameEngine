/**
 * Renderizador - Sistema de renderização 2D
 * Gerencia o canvas e desenho de entidades
 */
class Renderizador {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.camera = { x: 0, y: 0 };
        this.corFundo = '#1a1a2e';
    }

    /**
     * Limpa o canvas
     */
    limpar() {
        this.ctx.fillStyle = this.corFundo;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Desenha um retângulo
     */
    desenharRetangulo(x, y, largura, altura, cor = '#ffffff') {
        this.ctx.fillStyle = cor;
        this.ctx.fillRect(
            x - this.camera.x,
            y - this.camera.y,
            largura,
            altura
        );
    }

    /**
     * Desenha um círculo
     */
    desenharCirculo(x, y, raio, cor = '#ffffff') {
        this.ctx.fillStyle = cor;
        this.ctx.beginPath();
        this.ctx.arc(
            x - this.camera.x,
            y - this.camera.y,
            raio,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    /**
     * Desenha texto
     */
    desenharTexto(texto, x, y, cor = '#ffffff', tamanho = 16, alinhamento = 'left') {
        this.ctx.fillStyle = cor;
        this.ctx.font = `${tamanho}px Arial`;
        this.ctx.textAlign = alinhamento;
        this.ctx.fillText(texto, x - this.camera.x, y - this.camera.y);
    }

    /**
     * Desenha uma linha
     */
    desenharLinha(x1, y1, x2, y2, cor = '#ffffff', espessura = 1) {
        this.ctx.strokeStyle = cor;
        this.ctx.lineWidth = espessura;
        this.ctx.beginPath();
        this.ctx.moveTo(x1 - this.camera.x, y1 - this.camera.y);
        this.ctx.lineTo(x2 - this.camera.x, y2 - this.camera.y);
        this.ctx.stroke();
    }

    /**
     * Desenha um retângulo vazio (apenas borda)
     */
    desenharRetanguloVazio(x, y, largura, altura, cor = '#ffffff', espessura = 1) {
        this.ctx.strokeStyle = cor;
        this.ctx.lineWidth = espessura;
        this.ctx.strokeRect(
            x - this.camera.x,
            y - this.camera.y,
            largura,
            altura
        );
    }


    /**
     * Define a posição da câmera
     */
    definirCamera(x, y) {
        this.camera.x = x;
        this.camera.y = y;
    }

    /**
     * Centraliza a câmera em um ponto
     */
    centralizarCamera(x, y) {
        this.camera.x = x - this.canvas.width / 2;
        this.camera.y = y - this.canvas.height / 2;
    }

    /**
     * Define a cor de fundo
     */
    definirCorFundo(cor) {
        this.corFundo = cor;
    }

    /**
     * Redimensiona o canvas
     */
    redimensionar(largura, altura) {
        this.canvas.width = largura;
        this.canvas.height = altura;
    }
}

export default Renderizador;
